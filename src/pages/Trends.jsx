import { useMemo, useState } from "react";
import useHistoricalRates from "../hooks/useHistoricalRates";
// currency pairs
const PAIRS = [
  { from: "USD", to: "KES", label: "USD / KES", flag: "🇺🇸" },
  { from: "GBP", to: "KES", label: "GBP / KES", flag: "🇬🇧" },
  { from: "EUR", to: "KES", label: "EUR / KES", flag: "🇪🇺" },
];
import TrendChart from "../components/TrendChart";
// These shared components are built by Person 5
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorMessage from "../components/ErrorMessage";

// ── Verdict config ────────────────────────────────────────────────────────────
const VERDICT = {
  cheap: {
    emoji: "🟢",
    label: "Cheap to buy",
    sub: "Good time to convert or top up your balance.",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  expensive: {
    emoji: "🔴",
    label: "Expensive — wait if you can",
    sub: "Dollar is above the 30-day average. Hold off if possible.",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  average: {
    emoji: "⚪",
    label: "Around average",
    sub: "Today's rate is close to the 30-day average.",
    bg: "bg-stone-50",
    border: "border-stone-200",
    text: "text-stone-600",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts the raw Frankfurter rates object into a sorted chart-friendly array.
 * Frankfurter shape: { rates: { "2024-04-01": { KES: 129.5 }, ... } }
 */
function buildChartData(rates, toCurrency = "KES") {
  return Object.entries(rates)
    .map(([date, currencies]) => ({
      date: formatChartDate(date),
      rawDate: date,
      rate: currencies[toCurrency],
    }))
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
}

/** "2024-04-15" → "Apr 15" */
function formatChartDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

/** Compute verdict: cheap / expensive / average (±0.5% threshold) */
function getVerdict(today, average) {
  const diff = ((today - average) / average) * 100;
  if (diff < -0.5) return "cheap";
  if (diff > 0.5) return "expensive";
  return "average";
}

// ── Page component ────────────────────────────────────────────────────────────

export default function Trends() {

  const [selectedPair, setSelectedPair] = useState(PAIRS[0]); // tracks which currency pair is active, defaults to USD/KES

// useHistoricalRates built by Person 2 — returns { data, loading, error }
  const { data, loading, error } = useHistoricalRates(
    selectedPair.from,
    selectedPair.to,  
    30
  );

  // Derive chart data + stats from raw API response
  const { chartData, average, todayRate, verdictKey } = useMemo(() => {
    if (!data?.rates) {
      return { chartData: [], average: 0, todayRate: 0, verdictKey: "average" };
    }

    const points = buildChartData(data.rates, selectedPair.to);
    if (points.length === 0) {
      return { chartData: [], average: 0, todayRate: 0, verdictKey: "average" };
    }

    const avg = points.reduce((sum, p) => sum + p.rate, 0) / points.length;
    const latest = points[points.length - 1].rate;
    const key = getVerdict(latest, avg);

    return { chartData: points, average: avg, todayRate: latest, verdictKey: key };
  }, [data, selectedPair]);

  const verdict = VERDICT[verdictKey];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        <LoadingSkeleton lines={1} height="h-8" className="w-48" />
        <LoadingSkeleton lines={1} height="h-64" />
        <LoadingSkeleton lines={2} />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <ErrorMessage
          message="Could not load historical rates. Check your connection and try again."
        />
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">
          30-Day {selectedPair.label} Trend {}
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Historical exchange rates — last 30 days
        </p>
      </div>

      {/* Verdict badge */}
      <div
        className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${verdict.bg} ${verdict.border}`}
      >
        <span className="text-2xl leading-none mt-0.5">{verdict.emoji}</span>
        <div>
          <p className={`font-semibold text-base ${verdict.text}`}>
            {verdict.label}
          </p>
          <p className="text-stone-500 text-sm mt-0.5">{verdict.sub}</p>
        </div>
      </div>

      {/* Chart card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-4 pt-5 pb-4">
      
              {}
              <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-3">
      
                {}
                <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
                  {PAIRS.map((pair) => (
                    <button
                      key={pair.label}
                      onClick={() => setSelectedPair(pair)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedPair.label === pair.label
                          ? "bg-white text-orange-600 shadow-sm"
                          : "text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      {pair.flag} {pair.label}
                    </button>
                  ))}
                </div>
      
                {/* Legend */}
                <div className="flex items-center gap-5">
                  <LegendItem color="bg-orange-600" label={selectedPair.label} />{/* //$ CHANGED: label is now dynamic */}
                  <LegendItem color="bg-orange-300" label="30-day avg" dashed />
                </div>
              </div>
      
              <TrendChart chartData={chartData} average={average} />
            </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Today's Rate"
          value={`KES ${todayRate.toFixed(2)}`}
          sub={`per 1 ${selectedPair.from}`}
        />
        <StatCard
          label="30-Day Average"
          value={`KES ${average.toFixed(2)}`}
          sub={`per 1 ${selectedPair.from}`}
        />
      </div>

      {/* Difference callout */}
      <DifferenceCallout todayRate={todayRate} average={average} />
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LegendItem({ color, label, dashed = false }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-500">
      <span
        className={`inline-block w-6 h-0.5 ${color} ${dashed ? "opacity-70" : ""}`}
        style={dashed ? { borderTop: "2px dashed currentColor", background: "none" } : {}}
      />
      {label}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-4">
      <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-stone-800">{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
    </div>
  );
}

function DifferenceCallout({ todayRate, average }) {
  const diff = todayRate - average;
  const pct = ((diff / average) * 100).toFixed(1);
  const isAbove = diff > 0;

  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
      Today's rate is{" "}
      <span className="font-semibold">
        {isAbove ? "+" : ""}
        {diff.toFixed(2)} KES ({isAbove ? "+" : ""}
        {pct}%)
      </span>{" "}
      {isAbove ? "above" : "below"} the 30-day average.
    </div>
  );
}