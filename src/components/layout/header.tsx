"use client";

import { signOut, useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h2 className="text-lg font-semibold text-gray-800">
        Translation Workflow
      </h2>
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            <span className="text-sm text-gray-600">{session.user.name}</span>
            <Badge variant="info">{session.user.role}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
