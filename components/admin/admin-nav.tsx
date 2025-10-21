"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Bot,
  MessageSquare,
  Settings,
  Webhook,
} from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/agents",
    label: "agents",
    icon: Bot,
  },
  {
    href: "/admin/users",
    label: "users",
    icon: Users,
  },
  {
    href: "/admin/sessions",
    label: "sessions",
    icon: MessageSquare,
  },
  {
    href: "/admin/settings",
    label: "settings",
    icon: Settings,
  },
  {
    href: "/admin/webhooks",
    label: "webhooks",
    icon: Webhook,
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  // Extract locale-neutral pathname
  const currentPath = pathname.replace(/^\/(pl|en)/, "");

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
