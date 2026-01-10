"use client";

import { useState } from "react";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";

import { Button } from "~/components/ui/button";
import { authClient } from "~/server/better-auth/client";

export default function Navbar() {
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-black tracking-tight text-slate-900"
        >
          Promptly
        </Link>
        <Button
          onClick={handleGithubSignIn}
          disabled={isLoading}
          className="gap-2"
        >
          <FaGithub className="h-4 w-4" />
          {isLoading ? "Connecting..." : "Sign in with GitHub"}
        </Button>
      </div>
    </header>
  );
}
