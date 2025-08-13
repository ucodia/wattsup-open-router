"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { usePeriod } from "../components/PeriodContext";

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
  day: "today",
  week: "this week",
  month: "this month",
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

function UsageTable({ data }) {
  return (
    <div className="mt-6 max-h-96 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={`${item.name}-${index}`}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-right">
                {formatNumber(item.tokens)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UsageSection({ title, items }) {
  const sortedItems = [...items].sort((a, b) => b.tokens - a.tokens);
  const topItems = getTopItems(items);
  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
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
          <UsageTable data={sortedItems} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const { period } = usePeriod();
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
    <main className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              {formatNumber(totalModelTokens)} tokens
            </h1>
            <p className="text-muted-foreground mt-2">
              Total model token usage {PERIOD_LABELS[period]}
            </p>
          </div>
        </CardContent>
      </Card>
      <UsageSection title="Usage by model" items={models} />
      <UsageSection title="Usage by app" items={apps} />
    </main>
  );
}
