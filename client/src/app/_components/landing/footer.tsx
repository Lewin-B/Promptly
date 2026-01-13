import Link from "next/link";

const footerLinks = [
  { label: "Problems", href: "/problems" },
  { label: "GitHub", href: "https://github.com/Lewin-B/Promptly" },
];

export default function Footer() {
  return (
    <footer className="text-foreground relative w-full border-t border-slate-200/80 bg-white px-6 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-slate-50 via-white to-slate-100" />
      <div className="pointer-events-none absolute -top-16 right-10 h-32 w-32 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 text-slate-700">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-3">
            <Link
              href="/"
              className="text-2xl font-black tracking-tight text-slate-900"
            >
              Promptly
            </Link>
            <p className="text-sm text-slate-600">
              AI-assisted engineering practice with guardrails built in.
            </p>
            <p className="max-w-md text-sm text-slate-500">
              Our mission is to build the future of AI-assisted engineering by
              making speed, accountability, and learning accessible to every
              developer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase transition hover:border-cyan-200/70 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2025 Promptly. Built for ColorStack Winter Hack.</span>
          <span>Ship faster. Learn responsibly.</span>
        </div>
      </div>
    </footer>
  );
}
