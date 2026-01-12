"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";

import { Button } from "~/components/ui/button";
import { authClient } from "~/server/better-auth/client";

const baseNavLinks = [{ label: "Problems", href: "/problems" }];

export default function Navbar() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session } = authClient.useSession();
  const user = session?.user ?? null;
  const navLinks = user
    ? [...baseNavLinks, { label: "Profile", href: "/profile" }]
    : baseNavLinks;

  const initials = useMemo(() => {
    const fallback = "P";
    if (!user?.name && !user?.email) return fallback;
    const source = (user?.name ?? user?.email ?? "").trim();
    if (!source) return fallback;
    const segments = source.split(" ").filter(Boolean);
    const letters = segments
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("");
    return letters || fallback;
  }, [user?.email, user?.name]);

  const handleGithubSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/problems",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-black tracking-tight text-slate-900"
          >
            Promptly
          </Link>
          <nav className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase sm:gap-4 sm:text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/90 px-2 py-1 shadow-sm">
              <div className="flex items-center gap-2">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ? `${user.name} profile` : "User profile"}
                    width={0}
                    height={0}
                    className="h-9 w-9 rounded-full border border-slate-200/70 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-slate-100 text-xs font-bold text-slate-600">
                    {initials}
                  </div>
                )}
                <div className="hidden flex-col text-left sm:flex">
                  <span className="text-xs font-semibold text-slate-900">
                    {user.name ?? "Signed in"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {user.email ?? "GitHub account"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-full px-3"
              >
                {isSigningOut ? "Logging out..." : "Log out"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleGithubSignIn}
            disabled={isLoading}
            className="gap-2 rounded-full shadow-sm"
          >
            <FaGithub className="h-4 w-4" />
            {isLoading ? "Connecting..." : "Sign in with GitHub"}
          </Button>
        )}
      </div>
    </header>
  );
}
