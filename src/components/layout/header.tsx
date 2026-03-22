"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordModal } from "@/components/users/change-password-modal";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const roleBadgeVariant: Record<string, "info" | "success" | "warning"> = {
  ADMIN: "info",
  TRANSLATOR: "success",
  REVIEWER: "warning",
};

const roleLabel: Record<string, string> = {
  ADMIN: "Administrator",
  TRANSLATOR: "Translator",
  REVIEWER: "Reviewer",
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/dashboard/users") return "Users";
  if (pathname === "/dashboard/projects/new") return "New Project";
  if (pathname.includes("/tasks/")) return "Task Detail";
  if (pathname.match(/\/dashboard\/projects\/[^/]+$/)) return "Project";
  if (pathname === "/dashboard/projects") return "Projects";
  if (pathname === "/glossary") return "Glossary";
  return "Dashboard";
}

interface SearchResult {
  id: string;
  title: string;
  description?: string | null;
  sourceLang: string;
  targetLang: string;
  _count: { tasks: number };
}

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const pageTitle = getPageTitle(pathname);
  const showResults = searchFocused && searchQuery.trim().length > 0;

  // Debounced search
  const fetchResults = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    fetch(`/api/projects?search=${encodeURIComponent(query.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSearchResults(data);
        setSearching(false);
      })
      .catch(() => {
        setSearchResults([]);
        setSearching(false);
      });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchResults(searchQuery), 250);
    return () => clearTimeout(timeout);
  }, [searchQuery, fetchResults]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile search on route change
  useEffect(() => {
    setMobileSearchOpen(false);
    setSearchQuery("");
    setSearchFocused(false);
  }, [pathname]);

  function handleResultClick(projectId: string) {
    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
    router.push(`/dashboard/projects/${projectId}`);
  }

  function SearchResultsDropdown({ results, loading }: { results: SearchResult[]; loading: boolean }) {
    if (loading) {
      return (
        <div className="px-4 py-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-stone-400">
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching...
          </div>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-stone-400">No projects found</p>
        </div>
      );
    }

    return (
      <ul className="py-1.5">
        {results.map((project) => (
          <li key={project.id}>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleResultClick(project.id);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100">
                <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-800 truncate">{project.title}</p>
                <p className="text-[11px] text-stone-400 truncate">
                  {project.sourceLang} → {project.targetLang}
                  <span className="mx-1.5 text-stone-200">·</span>
                  {project._count.tasks} task{project._count.tasks !== 1 ? "s" : ""}
                </p>
              </div>
              <svg className="h-3.5 w-3.5 text-stone-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <header className="relative z-10 flex h-[60px] items-center justify-between gap-4 bg-white/80 backdrop-blur-xl px-4 sm:px-6 shadow-[0_1px_3px_rgba(28,25,23,0.04),0_1px_2px_rgba(28,25,23,0.02)]">
        {/* Left section — hamburger + page context */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 lg:hidden transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="hidden sm:flex items-center gap-2.5">
            <span className="text-[13px] font-semibold text-stone-800 tracking-tight">
              {pageTitle}
            </span>
          </div>
        </div>

        {/* Center — search input (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto" ref={searchRef}>
          <div className="relative w-full">
            <div className={`flex w-full items-center gap-3 rounded-xl border bg-stone-50/60 px-4 py-2 transition-all duration-200 ${searchFocused ? "border-amber-400/60 bg-white shadow-sm ring-2 ring-amber-500/10" : "border-stone-200/80 hover:border-stone-300"}`}>
              <svg className={`h-4 w-4 shrink-0 transition-colors ${searchFocused ? "text-amber-500" : "text-stone-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search projects..."
                className="w-full bg-transparent text-[13px] text-stone-800 placeholder:text-stone-400 outline-none"
              />
              {searchQuery && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="shrink-0 rounded p-0.5 text-stone-300 hover:text-stone-500 transition-colors cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Desktop search results */}
            {showResults && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-stone-200/80 bg-white shadow-lg shadow-stone-900/[0.08] animate-fade-up overflow-hidden max-h-80 overflow-y-auto">
                <SearchResultsDropdown results={searchResults} loading={searching} />
              </div>
            )}
          </div>
        </div>

        {/* Right section — actions + user */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile search toggle */}
          <button
            onClick={() => {
              setMobileSearchOpen(true);
              setTimeout(() => mobileInputRef.current?.focus(), 100);
            }}
            className="md:hidden rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all duration-150 cursor-pointer"
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          {/* Notification bell */}
          <NotificationBell />

          {/* Separator */}
          <div className="hidden sm:block w-px h-6 bg-stone-200/80 mx-1" />

          {/* User menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 hover:bg-stone-100/80 transition-all duration-150 cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-medium text-stone-700 leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-stone-400 leading-tight capitalize">
                    {user.role?.toLowerCase()}
                  </p>
                </div>
                <svg
                  className={`hidden sm:block h-3.5 w-3.5 text-stone-300 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-stone-200/80 bg-white shadow-lg shadow-stone-900/[0.08] animate-fade-up overflow-hidden">
                  <div className="px-4 py-4 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white shadow-sm shadow-amber-500/20">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {user.email || roleLabel[user.role] || user.role}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge variant={roleBadgeVariant[user.role] || "default"}>
                        {roleLabel[user.role] || user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setChangePasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors cursor-pointer"
                    >
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Change Password
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setShowSignOutConfirm(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors cursor-pointer"
                    >
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Change password modal */}
      {changePasswordOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      )}

      <ConfirmModal
        open={showSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        onConfirm={() => {
          setShowSignOutConfirm(false);
          signOut({ callbackUrl: "/login" });
        }}
        onCancel={() => setShowSignOutConfirm(false)}
      />

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileSearchOpen(false)} />
          <div className="relative bg-white shadow-xl animate-fade-up">
            <div className="flex items-center gap-3 px-4 h-[60px] border-b border-stone-100">
              <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none"
              />
              <button
                onClick={() => {
                  setSearchQuery("");
                  setMobileSearchOpen(false);
                }}
                className="rounded-lg p-2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {searchQuery.trim().length > 0 && (
              <div className="max-h-[60vh] overflow-y-auto">
                <SearchResultsDropdown results={searchResults} loading={searching} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
