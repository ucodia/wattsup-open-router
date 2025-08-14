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
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import llmImpact from "@/lib/llmImpact";

const COLORS = [
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f87171", // red-400
  "#a78bfa", // violet-400
  "#22d3ee", // cyan-400
  "#a3e635", // lime-400
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#818cf8", // indigo-400
  "#2dd4bf", // teal-400
  "#c084fc", // purple-400
];

const PERIOD_LABELS = {
  day: "today",
  week: "this week",
  month: "this month",
};

const STAT_LABELS = {
  energy: "Energy usage",
  emissions: "CO2 emissions",
  tokens: "Tokens",
};

function formatNumber(num, stat) {
  if (stat === "energy") {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " PWh";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + " TWh";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + " GWh";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + " MWh";
    return num.toFixed(2) + " kWh";
  } else if (stat === "emissions") {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " PgCO2eq";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + " TgCO2eq";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + " GgCO2eq";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + " MgCO2eq";
    return num.toFixed(2) + " kgCO2eq";
  }
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
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

function ExternalLink({ href, children, className = "" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:underline inline-flex items-center gap-1 ${className}`}
    >
      {children}
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}

function UsageTable({ data, stat }) {
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
              <TableCell>
                <div>
                  {item.url ? (
                    <ExternalLink href={item.url}>{item.name}</ExternalLink>
                  ) : (
                    item.name
                  )}
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(item.tokens, stat)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UsageSection({ title, items, stat }) {
  const sortedItems = [...items].sort((a, b) => b.tokens - a.tokens);
  const topItems = getTopItems(items);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2">
          <ResponsiveContainer width="100%" minHeight={300}>
            <PieChart>
              <Pie
                data={topItems}
                dataKey={stat}
                nameKey="name"
                label={(entry) => formatNumber(entry.value, stat)}
              >
                {topItems.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(value)} />
            </PieChart>
          </ResponsiveContainer>
          <UsageTable data={sortedItems} stat={stat} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("month");
  const [stat, setStat] = useState("tokens");
  const [error, setError] = useState(null);
  const periodLabel = PERIOD_LABELS[period];
  const statLabel = STAT_LABELS[stat];

  useEffect(() => {
    fetch("/api/rankings")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!data) return <p>Loading...</p>;

  const models = data.modelUsage[period].map((m) => {
    const model = data.models.find(
      (model) => model.permaslug === m.model_permaslug
    );
    const impact = llmImpact(20, 120, m.total_completion_tokens, 0, "WOR");

    return {
      id: model.permaslug,
      name: model.short_name,
      tokens: m.total_completion_tokens + m.total_prompt_tokens,
      promptTokens: m.total_prompt_tokens,
      completionTokens: m.total_completion_tokens,
      energy: Number((impact.energy.min + impact.energy.max) / 2),
      emissions: Number((impact.gwp.min + impact.gwp.max) / 2),
      url: `https://openrouter.ai/${model.slug}`,
      description: (
        <span>
          by{" "}
          <ExternalLink href={`https://openrouter.ai/${model.author}`}>
            {model.author}
          </ExternalLink>
        </span>
      ),
    };
  });

  const apps = data.appUsage[period].map((a) => {
    const impact = llmImpact(20, 120, Number(a.total_tokens), 0, "WOR");

    return {
      name: a.app?.title,
      tokens: Number(a.total_tokens),
      energy: Number((impact.energy.min + impact.energy.max) / 2),
      emissions: Number((impact.gwp.min + impact.gwp.max) / 2),
      url: a.app?.origin_url,
      description: a.app?.description,
    };
  });

  const stats = [
    {
      name: "Prompt tokens",
      stat: "tokens",
      emoji: "📝",
      value: models.reduce((sum, m) => sum + m.promptTokens, 0),
    },
    {
      name: "Completion tokens",
      stat: "tokens",
      emoji: "✅",
      value: models.reduce((sum, m) => sum + m.completionTokens, 0),
    },
    {
      name: "Total tokens",
      stat: "tokens",
      emoji: "🔤",
      value: models.reduce((sum, m) => sum + m.tokens, 0),
    },
    {
      name: "Projected energy",
      stat: "energy",
      emoji: "⚡",
      value: models.reduce((sum, m) => sum + m.energy, 0),
    },
    {
      name: "Projected emissions",
      stat: "emissions",
      emoji: "🌱",
      value: models.reduce((sum, m) => sum + m.emissions, 0),
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Label htmlFor="period-select" className="text-sm font-medium">
          Period:
        </Label>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger>
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
        {/* <Label htmlFor="stat-select" className="text-sm font-medium">
          Stat:
        </Label>
        <Select value={stat} onValueChange={setStat}>
          <SelectTrigger>
            <SelectValue placeholder="Select stat" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STAT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> */}
      </div>

      <main className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Totals for {periodLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {stats.map((data) => (
                <div key={data.name} className="flex items-center space-x-3">
                  <div className="text-xl sm:text-2xl">{data.emoji}</div>
                  <div>
                    <p className="text-l sm:text-xl font-bold">
                      {formatNumber(data.value, data.stat)}
                    </p>
                    <p className="text-sm text-muted-foreground">{data.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <UsageSection
          title={`${statLabel} by model`}
          items={models}
          stat={stat}
        />
        <UsageSection title={`${statLabel} by app`} items={apps} stat={stat} />
      </main>
    </>
  );
}
