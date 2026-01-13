import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function CppComingSoonPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-50 via-white to-slate-100 px-6 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700/70">
            C++ track
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            C++ challenges are coming soon
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            We are building a set of focused C++ challenges that emphasize core
            concepts, performance, and clean architecture in an isolated
            sandbox.
          </p>
        </header>

        <Card className="border-indigo-200/70 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              What to expect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Tasks that reinforce data structures, memory safety, and
              algorithmic thinking.
            </p>
            <p>
              Containerized builds with logs and AI analysis on correctness,
              clarity, and production readiness.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="default">
            <Link href="/problems/react">Try React challenges</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/problems">All categories</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
