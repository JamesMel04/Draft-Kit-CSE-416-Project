import Link from "next/link";

const quickLinks = [
  {
    href: "/players",
    title: "Players",
    description: "Browse and search the full player pool.",
  },
  {
    href: "/draft",
    title: "Draft Board",
    description: "Manage rosters and draft-day movement.",
  },
  {
    href: "/evaluation",
    title: "Evaluation",
    description: "Review ratings and compare player value.",
  },
  {
    href: "/feed",
    title: "Sports Feed",
    description: "Catch up on the latest league headlines.",
  },
];

const snapshot = [
  { label: "Tracked Players", value: "320" },
  { label: "Open Roster Slots", value: "11" },
  { label: "Saved Evaluations", value: "48" },
  { label: "Watchlist Alerts", value: "6" },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Welcome to Draft Kit</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Build your edge with player research, real-time draft planning, and quick access to the tools you use most.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/draft"
            className="rounded-md bg-[#0f1c36] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#14264b]"
          >
            Continue Draft Prep
          </Link>
          <Link
            href="/players"
            className="rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Explore Players
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">League Snapshot</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Quick Access</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow"
            >
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0f1c36]">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
