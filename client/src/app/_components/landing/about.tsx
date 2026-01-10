import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FaReact, FaPython } from "react-icons/fa";
import { SiCplusplus } from "react-icons/si";

const languageCards = [
  {
    title: "React",
    description:
      "Design interfaces through structured, goal-oriented challenges.",
    Icon: FaReact,
    accent: "from-cyan-200/80 via-white to-slate-50",
  },
  {
    title: "Python",
    description:
      "Develop practical fluency with guided exercises and clear outcomes.",
    Icon: FaPython,
    accent: "from-amber-200/70 via-white to-slate-50",
  },
  {
    title: "C++",
    description:
      "Strengthen core concepts with concise, competency-based tasks.",
    Icon: SiCplusplus,
    accent: "from-indigo-200/70 via-white to-slate-50",
  },
];

export default function About() {
  return (
    <section className="text-foreground relative w-full px-6 py-16 sm:py-20">
      <div className="to-primary/30 from-primary/20 pointer-events-none absolute inset-0 -z-10 bg-linear-to-br via-white" />
      <div className="pointer-events-none absolute top-16 -left-10 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-36 w-36 rounded-full bg-cyan-200/40 blur-2xl motion-safe:animate-pulse" />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 text-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.3em] text-slate-500 uppercase">
            The playground
          </p>
          <h1 className="text-4xl font-black tracking-tight text-balance text-slate-900 sm:text-5xl lg:text-6xl">
            A new way to learn
          </h1>
          <p className="mx-auto max-w-2xl text-base text-pretty text-slate-600 sm:text-lg">
            Promptly turns practice into a cartoony adventure. Pick a language,
            jump into a micro-challenge, and watch your skills level up fast.
          </p>
        </div>

        <div className="grid w-full gap-6 md:grid-cols-3">
          {languageCards.map(({ title, description, Icon, accent }) => (
            <Card
              key={title}
              className="group bg-card/90 relative overflow-hidden border-slate-200/80 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:rotate-1 hover:shadow-xl"
            >
              <div
                className={`pointer-events-none absolute inset-0 -z-10 bg-linear-to-br ${accent}`}
              />
              <CardHeader className="items-center text-center">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-white/70 blur-md" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200/70 bg-white shadow-md transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6">
                    <Icon className="h-7 w-7 text-slate-700 motion-safe:animate-bounce" />
                  </div>
                </div>
                <CardTitle className="text-lg text-slate-900">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {["Pick a problem", "Solve with AI", "Ship your solution"].map(
            (step, index) => (
              <Card
                key={step}
                className="bg-card/90 border-slate-200/80 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="flex items-center justify-center gap-3 py-5 text-sm font-semibold text-slate-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 bg-slate-50 text-xs font-black text-slate-700 shadow-sm">
                    {index + 1}
                  </span>
                  {step}
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
