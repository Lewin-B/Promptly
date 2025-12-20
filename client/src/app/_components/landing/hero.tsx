import Link from "next/link";

import { Button } from "~/components/ui/button";

export default function Hero() {
  return (
    <section className="text-foreground relative flex min-h-screen w-full items-center justify-center px-6 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-slate-50 via-white to-slate-50" />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-black tracking-tight text-balance text-slate-900 sm:text-6xl lg:text-7xl">
          Promptly
        </h1>
        <p className="text-foreground/70 text-lg font-medium text-balance sm:text-xl">
          Master the art of vibe coding and 10x your building speeds
        </p>
        <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/problems">Start free</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="#demo">See the flow</a>
          </Button>
        </div>
        <p className="text-foreground/50 text-xs font-medium">
          No credit card. Keep your current stack. Ship smarter in minutes.
        </p>
      </div>
    </section>
  );
}
