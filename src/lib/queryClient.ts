import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Changed default generic type from 'any' to 'unknown'
export async function apiRequest<T = unknown>(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<T> {
  // Enhanced fetch options for better session handling
  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Accept": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    mode: 'cors',
    cache: 'no-cache',
    redirect: 'follow'
  };

  const res = await fetch(url, fetchOptions);
  await throwIfResNotOk(res);

  if (res.status === 204) {
    return {} as T;
  }

  const responseData = await res.json();
  return responseData as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>({ on401: unauthorizedBehavior }: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    // Handle array query keys properly
    let url = queryKey[0] as string;

    // If we have additional query parameters in the key, add them to the URL
    if (queryKey.length > 1 && queryKey[1]) {
      // Check if it's the settlements endpoint with month parameter
      if (url === '/api/settlements' && typeof queryKey[1] === 'string') {
        url += `?month=${queryKey[1]}`;
      }
      // For other endpoints, just append the month parameter
      else if (typeof queryKey[1] === 'string' && !url.includes(queryKey[1])) {
        url += url.includes('?') ? '&' : '?';
        url += `month=${queryKey[1]}`;
      }
    }

    // Enhanced query fetch options for better session handling
    const queryFetchOptions: RequestInit = {
      method: 'GET',
      credentials: "include",
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Accept": "application/json"
      }
    };

    // Add cookie debug information

    const res = await fetch(url, queryFetchOptions);

    // Log detailed response information for debugging
    // Removed leftover console.log arguments

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);

    // For 204 No Content responses, don't try to parse the response as JSON
    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
