"use client";

import { signOut, useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { data: session } = useSession();

  const roleBadgeVariant: Record<string, "info" | "success" | "warning"> = {
    ADMIN: "info",
    TRANSLATOR: "success",
    REVIEWER: "warning",
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-stone-200/80 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 lg:hidden transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {session?.user && (
          <>
            <span className="hidden sm:inline text-sm text-stone-500">
              {session.user.name}
            </span>
            <Badge variant={roleBadgeVariant[session.user.role] || "default"}>
              {session.user.role}
            </Badge>
            <div className="w-px h-5 bg-stone-200 hidden sm:block" />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
