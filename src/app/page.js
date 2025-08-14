"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import llmImpact from "@/lib/llmImpact";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import equivalences from "@/lib/data/equivalences.json";

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

function formatNumber(num, stat, precision = 2, long = false) {
  if (stat === "energy") {
    if (num >= 1e12) return (num / 1e12).toFixed(precision) + " TWh";
    if (num >= 1e9) return (num / 1e9).toFixed(precision) + " GWh";
    if (num >= 1e6) return (num / 1e6).toFixed(precision) + " MWh";
    if (num >= 1e3) return (num / 1e3).toFixed(precision) + " kWh";
    return num.toFixed(precision) + " Wh";
  } else if (stat === "emissions") {
    if (num >= 1e12) return (num / 1e12).toFixed(precision) + " TgCO2eq";
    if (num >= 1e9) return (num / 1e9).toFixed(precision) + " GgCO2eq";
    if (num >= 1e6) return (num / 1e6).toFixed(precision) + " MgCO2eq";
    if (num >= 1e3) return (num / 1e3).toFixed(precision) + " kgCO2eq";
    return num.toFixed(precision) + " gCO2eq";
  }
  if (num >= 1e12) return (num / 1e12).toFixed(precision) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(precision) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(precision) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(precision) + "K";
  return num.toFixed(precision);
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
    <div className="max-h-96 overflow-y-auto">
      <Table>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={`${item.name}-${index}`} className="border-0">
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                <div>
                  {item.url ? (
                    <ExternalLink href={item.url}>{item.name}</ExternalLink>
                  ) : (
                    item.name
                  )}
                  {item.description && (
                    <div className="text-xs text-gray-500">
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

function UsageSection({ title, items, stat, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const sortedItems = [...items].sort((a, b) => b.tokens - a.tokens);
  const topItems = getTopItems(items);
  const chartConfig = {
    tokens: {
      label: "Token usage",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2">
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square min-h-[300px]"
          >
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(entry) => formatNumber(entry, stat)}
                  />
                }
              ></ChartTooltip>
            </PieChart>
          </ChartContainer>
          <UsageTable data={sortedItems} stat={stat} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [stat, setStat] = useState("tokens");
  const [error, setError] = useState(null);
  const periodLabel = PERIOD_LABELS[period];
  const statLabel = STAT_LABELS[stat];

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/rankings")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (error)
    return (
      <Alert>
        <AlertTitle>Failed to fetch data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  const models =
    data && !isLoading
      ? data.modelUsage[period].map((m) => {
          const model = data.models.find(
            (model) => model.permaslug === m.model_permaslug
          );
          const impact = llmImpact(
            20,
            120,
            m.total_completion_tokens,
            0,
            "WOR"
          );

          return {
            name: model.short_name,
            tokens: m.total_completion_tokens + m.total_prompt_tokens,
            promptTokens: m.total_prompt_tokens,
            completionTokens: m.total_completion_tokens,
            requestCount: m.count,
            energy: Number((impact.energy.min + impact.energy.max) / 2) * 1000, // kWh -> Wh
            emissions: Number((impact.gwp.min + impact.gwp.max) / 2) * 1000, // kgCO2eq -> gCO2eq
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
        })
      : [];

  const apps =
    data && !isLoading
      ? data.appUsage[period].map((a) => {
          const impact = llmImpact(20, 120, Number(a.total_tokens), 0, "WOR");

          return {
            name: a.app?.title,
            tokens: Number(a.total_tokens),
            energy: Number((impact.energy.min + impact.energy.max) / 2) * 1000, // kWh -> Wh
            emissions: Number((impact.gwp.min + impact.gwp.max) / 2) * 1000, // kgCO2eq -> gCO2eq
            url: a.app?.origin_url,
            description: a.app?.description,
          };
        })
      : [];

  const totalPromptTokens = models.reduce((sum, m) => sum + m.promptTokens, 0);
  const totalCompletionTokens = models.reduce(
    (sum, m) => sum + m.completionTokens,
    0
  );
  const totalTokens = models.reduce((sum, m) => sum + m.tokens, 0);
  const totalRequests = models.reduce((sum, m) => sum + m.requestCount, 0);
  const totalEnergy = models.reduce((sum, m) => sum + m.energy, 0);
  const totalEmissions = models.reduce((sum, m) => sum + m.emissions, 0);

  const totals = !isLoading
    ? [
        {
          name: "Projected energy",
          stat: "energy",
          emoji: "⚡",
          value: totalEnergy,
        },
        {
          name: "Projected emissions",
          stat: "emissions",
          emoji: "🌱",
          value: totalEmissions,
        },
        {
          name: "Prompt tokens",
          emoji: "📝",
          value: totalPromptTokens,
        },
        {
          name: "Completion tokens",
          emoji: "✅",
          value: totalCompletionTokens,
        },
        {
          name: "Total tokens",
          emoji: "🔤",
          value: totalTokens,
        },
        {
          name: "Requests count",
          emoji: "📊  ",
          value: totalRequests,
        },
      ]
    : [];

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
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
            <CardTitle className="text-xl">Totals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                {totals.map((item) => (
                  <div key={item.name} className="flex items-center space-x-3">
                    <div className="text-xl sm:text-2xl">{item.emoji}</div>
                    <div>
                      <p className="text-l sm:text-xl font-bold">
                        {formatNumber(item.value, item.stat)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Equivalences</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                {equivalences
                  .filter((item) => item.enabled)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center space-x-3"
                    >
                      <div className="text-xl sm:text-2xl">{item.emoji}</div>
                      <div>
                        <p className="text-l sm:text-xl font-bold">
                          {formatNumber(
                            totalEmissions / 1000 / item.kgCO2eq,
                            null,
                            0
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
        <UsageSection
          title={`${statLabel} by model`}
          items={models}
          stat={stat}
          isLoading={isLoading}
        />
        <UsageSection
          title={`${statLabel} by app`}
          items={apps}
          stat={stat}
          isLoading={isLoading}
        />
      </main>
    </>
  );
}
