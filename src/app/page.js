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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
import Autoplay from "embla-carousel-autoplay";
import { SlidersVertical } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import useSWR from "swr";

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

const STAT_LABELS = {
  energy: "Energy usage",
  emissions: "CO2 emissions",
  promptTokens: "Prompt tokens",
  completionTokens: "Completion tokens",
  tokens: "Total tokens",
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

function getTopItems(item, stat, limit = 10) {
  const top = item.slice(0, limit);
  if (item.length > limit) {
    const other = item.slice(limit).reduce((sum, item) => sum + item[stat], 0);
    top.push({ id: "other", name: "Other", [stat]: other });
  }
  return top;
}

function UsageSection({ title, items, isLoading }) {
  const [stat, setStat] = useState("energy");
  const sortedItems = [...items].sort((a, b) => b[stat] - a[stat]);
  const topItems = getTopItems(sortedItems, stat);
  // only enable stats defined on the first item
  const availableStats =
    items.length > 0
      ? Object.entries(STAT_LABELS).filter(
          ([key]) => items[0].hasOwnProperty(key) && items[0][key] !== undefined
        )
      : [];

  return (
    <Card className="pt-0">
      <CardHeader className="gap-0 border-b [.border-b]:py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
          {availableStats.length > 1 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="stat-select" className="text-sm font-medium">
                Stat:
              </Label>
              <Select value={stat} onValueChange={setStat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stat" />
                </SelectTrigger>
                <SelectContent>
                  {availableStats.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
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
                  {topItems.map((item, index) => (
                    <Cell key={item.id} fill={COLORS[index % COLORS.length]} />
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
                    <TableRow key={item.id} className="border-0">
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
                        {formatNumber(item[stat], stat)}
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
  const itemChunks = [];
  for (let i = 0; i < items.length; i += 6) {
    itemChunks.push(items.slice(i, i + 6));
  }

  return (
    <Card className="pt-0">
      <CardHeader className="gap-0 border-b [.border-b]:py-4">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <Carousel
            className="w-full"
            plugins={[
              Autoplay({
                delay: 10000,
              }),
            ]}
          >
            <CarouselContent>
              {itemChunks.map((chunk, chunkIndex) => (
                <CarouselItem key={chunkIndex}>
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                    {chunk.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center space-x-3"
                      >
                        <div className="text-xl sm:text-2xl">{item.emoji}</div>
                        <div>
                          <p className="text-sm sm:text-base font-bold">
                            {item.value}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {itemChunks.length > 1 && (
              <>
                <CarouselPrevious className="-left-10 disabled:hidden" />
                <CarouselNext className="-right-10 disabled:hidden" />
              </>
            )}
          </Carousel>
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [period, setPeriod] = useState("month");
  const [simulationConfig, setSimulationConfig] = useState(() =>
    loadSimulationConfig()
  );

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data, error, isLoading } = useSWR("/api/rankings", fetcher, {
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: false,
  });

  if (error)
    return (
      <Alert>
        <AlertTitle>Failed to fetch data</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
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
            ioTokenRatio: m.tokens / m.completionTokens,
            description: (
              <span>
                by <ExternalLink href={m.authorUrl}>{m.author}</ExternalLink>
              </span>
            ),
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

  const ioTokenRatio = totalTokens / totalCompletionTokens;

  const apps =
    data && !isLoading
      ? data.appUsage[period].map((a) => {
          const impact = llmImpact(
            simulationConfig.activeParameters,
            simulationConfig.totalParameters,
            a.tokens / ioTokenRatio, // use models IO token ratio to estimate completion
            0, // we are missing information to estimate latency
            simulationConfig.energyMix
          );

          return {
            ...a,
            energy: ((impact.energy.min + impact.energy.max) / 2) * 1000, // kWh -> Wh
            emissions: ((impact.gwp.min + impact.gwp.max) / 2) * 1000, // kgCO2eq -> gCO2eq
          };
        })
      : [];

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
          let value;

          if (item.unit === "gCO2eq") {
            value = totalEmissions / item.value;
          } else if (item.unit === "wh") {
            value = totalEnergy / item.value;
          } else if (item.unit === "w") {
            const div = period === "day" ? 1 : period === "week" ? 7 : 30;
            value = totalEnergy / div / (item.value * 24);
          }

          return {
            name: item.label,
            emoji: item.emoji,
            value: formatNumber(
              value,
              null,
              value < 1 ? 3 : value < 10 ? 2 : 1
            ),
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
      </div>

      <main className="space-y-8">
        <TotalSection title="Totals" items={totals} isLoading={isLoading} />
        <TotalSection
          title="Equivalences"
          items={equivalences}
          isLoading={isLoading}
        />
        <UsageSection
          title="Stats by model"
          items={models}
          isLoading={isLoading}
        />
        <UsageSection title="Stats by app" items={apps} isLoading={isLoading} />
      </main>
    </>
  );
}
