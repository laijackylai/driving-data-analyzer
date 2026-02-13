import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col gap-8 items-center max-w-4xl">
        <h1 className="text-4xl sm:text-6xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Driving Data Analyzer
        </h1>

        <p className="text-lg sm:text-xl text-center text-gray-600 dark:text-gray-300 max-w-2xl">
          Analyze and visualize driving behavior data with a privacy-first approach.
          Upload your driving data to get insights on patterns, safety metrics, and performance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Data Collection</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upload CSV or JSON files containing your driving data
            </p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Pattern Analysis</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Identify driving patterns and behaviors automatically
            </p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Visualization</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View insights through interactive charts and graphs
            </p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Behavior Insights</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Get actionable insights to improve driving safety
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <a
            href="#features"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:border-gray-400 transition-colors"
          >
            Learn More
          </a>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-500 dark:text-gray-400">
        Built with Next.js, TypeScript, and Tailwind CSS
      </footer>
    </div>
  );
}
