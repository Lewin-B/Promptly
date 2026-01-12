"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { categoryEnum } from "~/server/db/schema";
import { Filter } from "lucide-react";
import { FaReact, FaPython } from "react-icons/fa";
import { SiCplusplus } from "react-icons/si";
import { useRouter } from "next/navigation";

const categoryIcons = {
  react: FaReact,
  python: FaPython,
  "c++": SiCplusplus,
};

export default function Problems() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.08),rgba(15,23,42,0)_60%)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">
              Browse
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Select a Category
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Pick a focus area to tailor your practice session.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3.5 w-3.5" />
              {categoryEnum.enumValues.length} total
            </Badge>
            <div className="hidden h-10 w-px bg-slate-200 md:block" />
            <div className="hidden text-right text-xs text-slate-500 md:block">
              <div className="text-sm font-semibold text-slate-900">
                Ready to practice?
              </div>
              Choose a track and jump in.
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryEnum.enumValues.map((category) => {
            const iconKey =
              category.toLowerCase() as keyof typeof categoryIcons;
            const Icon = categoryIcons[iconKey];

            return (
              <Card
                key={category}
                className="group cursor-pointer border-slate-200/70 bg-white/90 transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]"
                onClick={() =>
                  router.push(`problems/${category.toLowerCase()}`)
                }
              >
                <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-50 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-white/60 via-transparent to-slate-200/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <Icon className="relative h-6 w-6 text-slate-700" />
                  </div>
                  <span className="text-center text-sm font-semibold text-slate-900">
                    {category}
                  </span>
                  <span className="text-xs text-slate-500">
                    Explore {category} challenges
                  </span>
                  <div className="mt-2 h-1 w-8 rounded-full bg-slate-200/70 transition-colors duration-200 group-hover:bg-slate-300" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
