"use client";

import { ExternalLink } from "@/components/external-link";
import {
  SimulationConfigEditor,
  loadSimulationConfig,
} from "@/components/simulation-config-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import equivalencesData from "@/lib/data/equivalences.json";
import llmImpact from "@/lib/llmImpact";
import { SlidersVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

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

function UsageSection({ title, items, stat, isLoading }) {
  const sortedItems = [...items].sort((a, b) => b.tokens - a.tokens);
  const topItems = getTopItems(items);

  return (
    <Card className="pt-0">
      <CardHeader className="gap-0 border-b [.border-b]:py-4">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <ChartContainer
              config={{}}
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
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableBody>
                  {sortedItems.map((item, index) => (
                    <TableRow
                      key={`${item.name}-${index}`}
                      className="border-0"
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          {item.url ? (
                            <ExternalLink href={item.url}>
                              {item.name}
                            </ExternalLink>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TotalSection({ title, items, isLoading }) {
  return (
    <Card className="pt-0">
      <CardHeader className="gap-0 border-b [.border-b]:py-4">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {items.map((item) => (
              <div key={item.name} className="flex items-center space-x-3">
                <div className="text-xl sm:text-2xl">{item.emoji}</div>
                <div>
                  <p className="text-sm sm:text-base font-bold">{item.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {item.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
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
  const [simulationConfig, setSimulationConfig] = useState(() =>
    loadSimulationConfig()
  );
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
          const impact = llmImpact(
            simulationConfig.activeParameters,
            simulationConfig.totalParameters,
            m.completionTokens,
            m.requestCount * simulationConfig.requestLatency,
            simulationConfig.energyMix
          );

          return {
            ...m,
            energy: ((impact.energy.min + impact.energy.max) / 2) * 1000, // kWh -> Wh
            emissions: ((impact.gwp.min + impact.gwp.max) / 2) * 1000, // kgCO2eq -> gCO2eq
            description: (
              <span>
                by <ExternalLink href={m.authorUrl}>{m.author}</ExternalLink>
              </span>
            ),
          };
        })
      : [];

  const apps =
    data && !isLoading
      ? data.appUsage[period].map((a) => {
          const impact = llmImpact(
            simulationConfig.activeParameters,
            simulationConfig.totalParameters,
            Number(a.total_tokens),
            0, // we are missing information to estimate latency
            simulationConfig.energyMix
          );

          return {
            ...a,
            energy: Number((impact.energy.min + impact.energy.max) / 2) * 1000, // kWh -> Wh
            emissions: Number((impact.gwp.min + impact.gwp.max) / 2) * 1000, // kgCO2eq -> gCO2eq
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
          emoji: "⚡",
          value: formatNumber(totalEnergy, "energy"),
        },
        {
          name: "Projected emissions",
          emoji: "🌱",
          value: formatNumber(totalEmissions, "emissions"),
        },
        {
          name: "Prompt tokens",
          emoji: "📝",
          value: formatNumber(totalPromptTokens),
        },
        {
          name: "Completion tokens",
          emoji: "✅",
          value: formatNumber(totalCompletionTokens),
        },
        {
          name: "Total tokens",
          emoji: "🔤",
          value: formatNumber(totalTokens),
        },
        {
          name: "Requests count",
          emoji: "📊  ",
          value: formatNumber(totalRequests),
        },
      ]
    : [];

  const equivalences = !isLoading
    ? equivalencesData
        .filter((item) => item.enabled)
        .map((item) => {
          const div =
            item?.type === "source"
              ? period === "day"
                ? 1
                : period === "week"
                ? 7
                : 30
              : 1;
          const value = item.gCO2eq
            ? totalEmissions / item.gCO2eq
            : totalEnergy / div / item.wh;
          return {
            name: item.label,
            emoji: item.emoji,
            value: formatNumber(value, null, value < 10 ? 2 : 1),
          };
        })
    : [];

  return (
    <>
      <div className="mb-4 flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3">
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
        </div>
        <SimulationConfigEditor
          config={simulationConfig}
          onConfigChange={setSimulationConfig}
        >
          <Button variant="outline" size="icon">
            <SlidersVertical />
          </Button>
        </SimulationConfigEditor>
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
        <TotalSection title="Totals" items={totals} isLoading={isLoading} />
        <TotalSection
          title="Equivalences"
          items={equivalences}
          isLoading={isLoading}
        />
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
