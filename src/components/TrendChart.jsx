import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/**
 * TrendChart
 * @param {Array}  chartData  - Array of { date: string, rate: number }
 * @param {number} average    - 30-day average rate (used to draw reference feel)
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-lg text-sm">
        <p className="text-stone-500 mb-1">{label}</p>
        <p className="font-semibold text-stone-800">
          1 USD ={" "}
          <span className="text-orange-600">
            KES {payload[0].value.toFixed(2)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ chartData, average }) {
  // Compute Y-axis domain with a bit of padding
  const rates = chartData.map((d) => d.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const padding = (maxRate - minRate) * 0.2 || 1;
  const yMin = Math.floor(minRate - padding);
  const yMax = Math.ceil(maxRate + padding);

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e7e5e4" /* stone-200 */
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#78716c" /* stone-500 */ }}
            tickLine={false}
            axisLine={false}
            // Show only every ~5th label to avoid crowding
            interval={Math.floor(chartData.length / 5)}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 11, fill: "#78716c" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Average reference line rendered as a second Line with no dots */}
          <Line
            dataKey={() => average}
            stroke="#fdba74" /* orange-300 */
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            legendType="none"
            name="30d avg"
          />
          {/* Main rate line */}
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#ea580c" /* orange-600 */
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              fill: "#ea580c",
              stroke: "#fff",
              strokeWidth: 2,
            }}
            name="USD/KES"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}