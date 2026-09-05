"use client";

import { useRouter } from "next/navigation";
import { Wrench, User, Settings, LogOut, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { NotificationBell, NotificationItem } from "@/components/shared/NotificationBell";

interface TopBarProps {
  fullName?: string;
  email?: string;
  organisationName?: string;
  notifications?: NotificationItem[];
  unreadCount?: number;
}

export function TopBar({
  fullName = "Admin",
  email,
  organisationName = "AutoSkills AU",
  notifications = [],
  unreadCount = 0,
}: TopBarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-xs sm:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="size-4" />
        </div>
        <div>
          <span className="block text-sm font-bold tracking-tight text-foreground">AutoSkills AU</span>
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Admin Portal</span>
        </div>
      </div>

      <div className="hidden md:flex md:items-center md:gap-2">
        <Shield className="size-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {organisationName} &bull; Administration
        </span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-full p-1 transition hover:bg-muted focus:outline-hidden">
            <Avatar size="sm" className="bg-primary/10 text-primary font-bold">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <span className="block text-xs font-semibold text-foreground">{fullName}</span>
              <span className="block text-[10px] text-muted-foreground truncate max-w-[120px]">{organisationName}</span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground truncate">{fullName}</p>
              {email && <p className="text-[11px] truncate">{email}</p>}
              <p className="text-[10px] font-medium text-primary mt-0.5">{organisationName}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/profile")} className="cursor-pointer gap-2 text-xs">
              <User className="size-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/settings")} className="cursor-pointer gap-2 text-xs">
              <Settings className="size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
