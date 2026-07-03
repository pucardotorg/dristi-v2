"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Sun, Moon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/src/components/shell/theme-provider";
import { useSession } from "@/lib/auth-client";

export function AppHeader() {
  const { theme, toggle } = useTheme();
  const { data: sessionData } = useSession();
  const isLoggedIn = !!sessionData?.user;
  const pathname = usePathname();
  const showHamburger = pathname === "/cases/new";
  const [avatarOpen, setAvatarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!avatarOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [avatarOpen]);

  function handleHamburger() {
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  }

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-10 flex-shrink-0">
      <div className="flex items-center gap-2">
        {showHamburger && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden max-[767px]:inline-flex text-slate-600 dark:text-slate-400 w-9 h-9"
            aria-label="Toggle navigation"
            onClick={handleHamburger}
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <a href="/" className="flex items-center gap-3 no-underline">
          <div
            className="w-[23px] h-9 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/assets/govt-emblem.png')" }}
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
            District Courts of India
          </span>
        </a>
      </div>

      <div className="flex items-center gap-5">
        {isLoggedIn && (
          <Link
            href="/staff"
            className={`text-sm font-medium no-underline transition-colors ${
              pathname === "/staff"
                ? "text-teal"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Staff
          </Link>
        )}

        <Button variant="ghost" size="icon" onClick={toggle} className="w-8 h-8 text-slate-600 dark:text-slate-400" aria-label="Toggle dark mode">
          {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </Button>

        <Button variant="ghost" size="sm" className="gap-1.5 text-slate-800 dark:text-slate-100 px-1.5">
          <Globe className="w-[18px] h-[18px]" />
          EN
        </Button>

        <Button variant="ghost" size="sm" className="text-slate-800 dark:text-slate-100 px-1.5">
          Support
        </Button>

        <div className="relative" ref={menuRef}>
          <button
            className="w-8 h-8 rounded-full bg-teal text-white text-[13px] font-bold inline-flex items-center justify-center cursor-pointer border-0 hover:opacity-90 transition-opacity"
            aria-label="Account menu"
            onClick={() => setAvatarOpen((v) => !v)}
          >
            R
          </button>
          {avatarOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg min-w-[148px] shadow-lg z-60 overflow-hidden">
              <button className="block w-full px-4 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 bg-transparent border-0 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                Profile
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 mx-1" />
              <button className="block w-full px-4 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 bg-transparent border-0 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
