"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, ListOrdered, TestTubes, Bell, Route, Radio, Shield, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Risk Map", href: "/risk-map", icon: Map },
  { name: "Priorities", href: "/priorities", icon: ListOrdered },
  { name: "Scenarios", href: "/scenarios", icon: TestTubes },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Evacuation", href: "/evacuation", icon: Route },
  { name: "Sensors", href: "/sensors", icon: Radio },
];

const bottomItems = [
  { name: "Data Sources", href: "/data-sources", icon: Shield },
  { name: "Admin", href: "/admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          FLASHGUARD AI
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-zinc-500 mb-2 px-3 tracking-wider">COMMAND CENTER</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-blue-400" : "")} />
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-zinc-800 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
