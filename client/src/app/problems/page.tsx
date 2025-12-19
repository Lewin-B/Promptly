"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { categoryEnum } from "~/server/db/schema";
import { Calculator, Cpu, FlaskConical, Filter } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const categoryIcons = {
  react: Cpu,
  python: FlaskConical,
  "c++": Calculator,
};

export default function Problems() {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">
              Browse
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Select a Category
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Pick a focus area to tailor your practice session.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Filter className="h-3.5 w-3.5" />
            {categoryEnum.enumValues.length} total
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categoryEnum.enumValues.map((category) => {
            const iconKey =
              category.toLowerCase() as keyof typeof categoryIcons;
            const Icon = categoryIcons[iconKey];
            const isSelected = selected === category;

            return (
              <Card
                key={category}
                className={`group cursor-pointer border-slate-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  isSelected ? "border-primary/60 ring-primary/40 ring-2" : ""
                }`}
                onClick={() =>
                  router.push(`problems/${category.toLowerCase()}`)
                }
              >
                <CardContent className="flex flex-col items-center justify-center gap-2 p-6">
                  <div
                    className={`rounded-full border border-slate-200/70 bg-white p-3 shadow-sm transition-colors ${
                      isSelected ? "border-primary/50" : ""
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isSelected ? "text-primary" : "text-slate-700"
                      }`}
                    />
                  </div>
                  <span className="text-center text-sm font-semibold text-slate-900">
                    {category}
                  </span>
                  <span className="text-xs text-slate-500">
                    Explore {category} problems
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
