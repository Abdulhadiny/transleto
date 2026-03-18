"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "TRANSLATOR", "REVIEWER"] },
  { href: "/dashboard/projects", label: "Projects", roles: ["ADMIN", "TRANSLATOR", "REVIEWER"] },
  { href: "/dashboard/users", label: "Users", roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const filteredItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600">
          Transleto
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
