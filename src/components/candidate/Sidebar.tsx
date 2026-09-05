"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  CheckSquare,
  Zap,
  MessageSquareQuote,
  BarChart3,
  Settings,
  LogOut,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const CANDIDATE_NAV_ITEMS = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "My Documents", href: "/documents", icon: FileText },
  { label: "Assessments", href: "/assessments", icon: CheckSquare },
  { label: "EV Readiness", href: "/ev-readiness", icon: Zap },
  { label: "Feedback", href: "/feedback", icon: MessageSquareQuote },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r border-border bg-card">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="size-5" />
        </div>
        <div>
          <span className="block text-sm font-bold tracking-tight text-foreground">
            AutoSkills AU
          </span>
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            Candidate Portal
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {CANDIDATE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
