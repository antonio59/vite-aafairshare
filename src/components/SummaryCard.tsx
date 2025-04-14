import { clsx } from "clsx";
import { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type SummaryCardVariant = 'total' | 'user1' | 'user2' | 'balance';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: SummaryCardVariant;
  isNegative?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  photoURL?: string;
  email?: string;
  tooltip?: string;
}

export default function SummaryCard({
  title,
  value,
  icon: Icon,
  variant = 'total',
  isNegative = false,
  isLoading = false,
  onClick,
  photoURL,
  email,
  tooltip
}: SummaryCardProps) {
  const { currentUser } = useAuth();
  const isCurrentUserCard = variant === 'user1';

  if (isLoading) {
    // Skeleton adjusted to match reduced sizes
    return (
      <div className="bg-card p-3 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex items-center">
        <div className="h-12 w-12 rounded-md bg-muted animate-pulse shrink-0 mr-3" />
        <div className="flex-1 grid grid-rows-2 gap-0 items-center min-w-0 overflow-hidden">
          <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const getBgColor = () => {
    switch (variant) {
      case 'total':
        return 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      case 'user1':
        return 'bg-green-50/80 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'user2':
        return 'bg-purple-50/80 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
      case 'balance':
        return isNegative
          ? 'bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          : 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400';
      default:
        return 'bg-muted';
    }
  };

  // Show avatar for user cards and balance/settlement card
  const showAvatar = variant === 'user1' || variant === 'user2' || variant === 'balance';
  const userAvatar = photoURL || (isCurrentUserCard && currentUser?.photoURL);

  return (
    <div className="bg-card p-3 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex items-center" onClick={onClick}>
      <div className="shrink-0 mr-3">
        {showAvatar && userAvatar ? (
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={userAvatar}
              alt={email || currentUser?.email || title}
            />
            <AvatarFallback className={clsx("text-foreground text-base", getBgColor())}>
              {(email || currentUser?.email || title)?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={clsx("p-3 rounded-md", getBgColor())}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 grid grid-rows-2 gap-0 items-center overflow-hidden">
        <p
          className="text-sm sm:text-base font-medium text-muted-foreground whitespace-normal break-words truncate"
          title={tooltip}
        >
          {title}
        </p>
        <p className={clsx(
          "text-sm sm:text-base font-semibold whitespace-normal break-words no-underline truncate",
          isNegative ? "text-red-500 dark:text-red-400" : "text-foreground"
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}

