import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function PythonComingSoonPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50 via-white to-slate-100 px-6 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700/70">
            Python track
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Python challenges are coming soon
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            We are crafting guided Python exercises with the same isolated
            build-and-analysis workflow. Check back soon for real-world tasks
            and feedback-driven practice.
          </p>
        </header>

        <Card className="border-amber-200/70 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              What to expect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              New problems designed around practical data wrangling, scripting,
              and API workflows.
            </p>
            <p>
              Isolated container builds with build logs and AI feedback on
              quality, correctness, and production readiness.
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
