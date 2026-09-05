"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, HelpCircle, UserCheck, Award, Zap,
  FileText, BarChart3, TrendingUp, Shield, Sparkles, History, Settings, LogOut, Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const ADMIN_NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Candidates", href: "/admin/candidates", icon: Users },
      { label: "Assessments", href: "/admin/assessments", icon: CheckSquare },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Question Bank", href: "/admin/question-bank", icon: HelpCircle },
      { label: "Examiners", href: "/admin/examiners", icon: UserCheck },
      { label: "Competency Framework", href: "/admin/competency-framework", icon: Award },
      { label: "EV Readiness", href: "/admin/ev-readiness", icon: Zap },
    ],
  },
  {
    title: "Compliance & Reporting",
    items: [
      { label: "Documents", href: "/admin/documents", icon: FileText },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
      { label: "Compliance", href: "/admin/compliance", icon: Shield },
      { label: "AI Governance", href: "/admin/ai-governance", icon: Sparkles },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
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
          <span className="block text-sm font-bold tracking-tight text-foreground">AutoSkills AU</span>
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Admin Portal</span>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
