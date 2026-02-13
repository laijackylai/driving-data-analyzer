import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 sm:p-20">
      <main className="flex flex-col gap-8 items-center max-w-4xl w-full">
        {/* ── Hero ── */}
        <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-sapphire-800/40 border border-sapphire-700/25 mb-2">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-sapphire-400"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v2" />
            <path d="M16.24 7.76l-1.42 1.42" />
            <path d="M18 12h-2" />
            <path d="M12 12l-3.5 3.5" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-bold text-center text-sapphire-100 tracking-tight">
          Driving Data Analyzer
        </h1>

        <p className="text-base sm:text-lg text-center text-sapphire-400 max-w-xl leading-relaxed">
          Analyze and visualize driving behavior data with a privacy-first approach.
          Upload your OBD2 data for detailed insights across 9 categories.
        </p>

        {/* ── Feature grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
          <FeatureCard
            title="Data Collection"
            description="Upload OBD2 CSV files with 90+ supported PIDs"
          />
          <FeatureCard
            title="Pattern Analysis"
            description="Identify driving patterns and behaviors automatically"
          />
          <FeatureCard
            title="Safety Scoring"
            description="Get a composite safety score with actionable insights"
          />
          <FeatureCard
            title="9 Categories"
            description="Engine, fuel, motion, power, transmission, and more"
          />
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center min-h-[48px] px-7 bg-sapphire-600 text-sapphire-50 rounded-xl font-semibold font-body text-sm hover:bg-sapphire-500 transition-all duration-200 shadow-[0_1px_3px_rgba(10,22,40,0.4),inset_0_1px_0_rgba(184,212,240,0.1)] hover:shadow-[0_4px_12px_rgba(54,112,198,0.3),inset_0_1px_0_rgba(184,212,240,0.15)]"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-xs text-sapphire-600">
        Built with Next.js, TypeScript, and Tailwind CSS
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl p-5 bg-[rgba(15,34,64,0.4)] backdrop-blur-sm border border-[rgba(54,112,198,0.12)] transition-all duration-200 hover:border-[rgba(54,112,198,0.22)] hover:bg-[rgba(15,34,64,0.55)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(184,212,240,0.06)] to-transparent"
        aria-hidden="true"
      />
      <h2 className="font-display text-sm font-semibold text-sapphire-100 mb-1.5">
        {title}
      </h2>
      <p className="text-xs text-sapphire-400 leading-relaxed">{description}</p>
    </div>
  );
}
