"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "../components/ui/button";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#ffc658",
  "#a28ef4",
  "#ff7f50",
  "#87ceeb",
  "#da70d6",
  "#32cd32",
  "#6495ed",
  "#ff69b4",
  "#cd5c5c",
  "#ffa07a",
  "#20b2aa",
  "#778899",
];

const PERIOD_LABELS = {
  day: "Today",
  week: "This Week",
  month: "This Month",
};

function formatNumber(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
}

function getTopItems(list, limit = 10) {
  const sorted = [...list].sort((a, b) => b.tokens - a.tokens);
  const top = sorted.slice(0, limit);
  if (sorted.length > limit) {
    const other = sorted
      .slice(limit)
      .reduce((sum, item) => sum + item.tokens, 0);
    top.push({ name: "Other", tokens: other });
  }
  return top;
}

function TokenTable({ data }) {
  return (
    <div className="mt-6 max-h-96 overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-700">#</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">
              Name
            </th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">
              Tokens
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={`${item.name}-${index}`}>
              <td className="px-4 py-2">{index + 1}</td>
              <td className="px-4 py-2">{item.name}</td>
              <td className="px-4 py-2">{formatNumber(item.tokens)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageSection({ title, items }) {
  const sortedItems = [...items].sort((a, b) => b.tokens - a.tokens);
  const topItems = getTopItems(items);
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid gap-8 md:grid-cols-2">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={topItems}
              dataKey="tokens"
              nameKey="name"
              label={(entry) => formatNumber(entry.value)}
              outerRadius={120}
            >
              {topItems.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatNumber(value)} />
          </PieChart>
        </ResponsiveContainer>
        <TokenTable data={sortedItems} />
      </div>
    </section>
  );
}

function PeriodSelector({ period, setPeriod }) {
  const options = ["day", "week", "month"];
  return (
    <div className="mb-6 flex items-center gap-2">
      {options.map((opt) => (
        <Button
          key={opt}
          onClick={() => setPeriod(opt)}
          className={
            period === opt
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }
        >
          {PERIOD_LABELS[opt]}
        </Button>
      ))}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("day");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/rankings")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!data) return <p>Loading...</p>;

  const models = data.modelUsage[period].map((m) => ({
    name: m.model_permaslug,
    tokens: m.total_completion_tokens + m.total_prompt_tokens,
  }));

  const apps = data.appUsage[period].map((a) => ({
    name: a.app?.title || String(a.app_id),
    tokens: Number(a.total_tokens),
  }));

  const totalModelTokens = models.reduce((sum, m) => sum + m.tokens, 0);

  return (
    <main className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          {formatNumber(totalModelTokens)} tokens
        </h1>
        <p className="text-gray-600">
          Total model token usage {PERIOD_LABELS[period]}
        </p>
      </div>
      <PeriodSelector period={period} setPeriod={setPeriod} />
      <UsageSection title="Model token usage" items={models} />
      <UsageSection title="App token usage" items={apps} />
    </main>
  );
}
