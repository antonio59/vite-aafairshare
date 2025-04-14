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
      // Add Cache-Control to prevent caching issues
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      // Accept header to ensure proper content negotiation
      "Accept": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Critical - include cookies
    mode: 'cors',
    cache: 'no-cache',
    redirect: 'follow'
  };


  // Add cookie debug information

  const res = await fetch(url, fetchOptions);

  // Log response headers for debugging purposes
  // Removed leftover console.log arguments

  await throwIfResNotOk(res);

  // For 204 No Content responses (commonly used in DELETE operations),
  // don't try to parse the response as JSON as there's no body
  if (res.status === 204) {
    // Returning {} as any here because the function promises T, but there's no content.
    // This assumes callers handle cases where T might be expected but an empty object is returned.
    // A more robust solution might involve changing the return type to Promise<T | null> or similar.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({} as any);
  }

  const responseData = await res.json();
  return responseData as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
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
      // Returning {} as any here because the function promises T, but there's no content.
      // This assumes callers handle cases where T might be expected but an empty object is returned.
      // A more robust solution might involve changing the return type to Promise<T | null> or similar.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ({} as any);
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
