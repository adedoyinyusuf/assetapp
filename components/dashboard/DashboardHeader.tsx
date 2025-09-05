import { Bell, BellOff, Search, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  className?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  onSearch?: (query: string) => void;
  onNotificationsToggle?: (enabled: boolean) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

export function DashboardHeader({
  title,
  description,
  className = '',
  showSearch = true,
  showNotifications = true,
  onSearch,
  onNotificationsToggle,
  user,
}: DashboardHeaderProps) {
  const notificationsEnabled = true; // This would come from a state in a real app
  const unreadCount = 3; // Example count

  return (
    <header className={cn("w-full", className)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-full md:w-64"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          )}
          
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => onNotificationsToggle?.(!notificationsEnabled)}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </>
              ) : (
                <BellOff className="h-5 w-5" />
              )}
              <span className="sr-only">
                {notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              </span>
            </Button>
          )}
          
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
          
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : (
                      <AvatarFallback>
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Notifications</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
