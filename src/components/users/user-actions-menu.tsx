"use client";

import { useState, useRef, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export function UserActionsMenu({
  user,
  onChangeRole,
  onChangePassword,
  onToggleActive,
}: {
  user: User;
  onChangeRole: (user: User) => void;
  onChangePassword: (user: User) => void;
  onToggleActive: (user: User) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-stone-200/80 bg-white shadow-lg shadow-stone-900/[0.08] z-20 overflow-hidden animate-fade-up">
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); onChangeRole(user); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Change Role
            </button>
            <button
              onClick={() => { setOpen(false); onChangePassword(user); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Reset Password
            </button>
            <button
              onClick={() => { setOpen(false); onToggleActive(user); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                user.isActive
                  ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  : "text-teal-600 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              <svg className={`h-4 w-4 ${user.isActive ? "text-rose-400" : "text-teal-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {user.isActive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {user.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
