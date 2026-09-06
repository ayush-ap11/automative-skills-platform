"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, TrendingUp, MoreHorizontal,
  UserCheck, Award, Zap, FileText, BarChart3, Shield, Sparkles, History, X, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PRIMARY_NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Candidates", href: "/admin/candidates", icon: Users },
  { label: "Assessments", href: "/admin/assessments", icon: CheckSquare },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

const MORE_NAV = [
  { label: "Examiners", href: "/admin/examiners", icon: UserCheck },
  { label: "Competency Framework", href: "/admin/competency-framework", icon: Award },
  { label: "EV Readiness", href: "/admin/ev-readiness", icon: Zap },
  { label: "Documents", href: "/admin/documents", icon: FileText },
  { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { label: "Compliance", href: "/admin/compliance", icon: Shield },
  { label: "AI Governance", href: "/admin/ai-governance", icon: Sparkles },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-xs md:hidden" onClick={() => setOpen(false)}>
          <div
            className="fixed inset-x-0 bottom-16 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">More Management</span>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted cursor-pointer">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pt-3">
              {MORE_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg p-2 text-xs font-medium cursor-pointer ${
                      isActive ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="size-4 shrink-0 text-primary" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="size-4 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card px-2 md:hidden">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-1.5 py-1 text-[10px] font-medium transition cursor-pointer ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center gap-1 px-1.5 py-1 text-[10px] font-medium transition cursor-pointer ${
            open ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MoreHorizontal className="size-5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
