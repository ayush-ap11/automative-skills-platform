"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Zap,
  Menu,
  X,
  MessageSquareQuote,
  BarChart3,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PRIMARY_MOBILE_ITEMS = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Assessments", href: "/assessments", icon: CheckSquare },
  { label: "EV Readiness", href: "/ev-readiness", icon: Zap },
];

const MORE_MOBILE_ITEMS = [
  { label: "Feedback", href: "/feedback", icon: MessageSquareQuote },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="fixed inset-x-0 bottom-16 z-50 rounded-t-2xl border-t border-border bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">More Menu</span>
              <button onClick={() => setMoreOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted cursor-pointer">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3">
              {MORE_MOBILE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={`flex items-center gap-2.5 rounded-lg p-2.5 text-xs font-medium cursor-pointer ${isActive ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted"}`}>
                    <Icon className="size-4 shrink-0 text-primary" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <button onClick={handleSignOut} className="flex w-full items-center gap-2.5 rounded-lg p-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer">
                <LogOut className="size-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card px-2 md:hidden">
        {PRIMARY_MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium transition cursor-pointer ${isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button onClick={() => setMoreOpen((prev) => !prev)} className={`flex flex-col items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium transition cursor-pointer ${moreOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}>
          <Menu className="size-5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
