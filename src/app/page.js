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
import { Select, SelectOption } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    <Card>
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

  const models = data.modelUsage[period].map((m) => {
    const model = data.models.find(
      (model) => model.permaslug === m.model_permaslug
    );
    return {
      id: model.permaslug,
      name: model.short_name,
      tokens: m.total_completion_tokens + m.total_prompt_tokens,
      promptTokens: m.total_prompt_tokens,
      completionTokens: m.total_completion_tokens,
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

  const apps = data.appUsage[period].map((a) => ({
    name: a.app?.title || String(a.app_id),
    tokens: Number(a.total_tokens),
    url: a.app?.origin_url,
    description: a.app?.description,
  }));

  const promptTokens = models.reduce((sum, m) => sum + m.promptTokens, 0);
  const completionTokens = models.reduce(
    (sum, m) => sum + m.completionTokens,
    0
  );
  const totalTokens = models.reduce((sum, m) => sum + m.tokens, 0);

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Label htmlFor="period-select" className="text-sm font-medium">
          Period:
        </Label>
        <Select
          id="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="!w-auto min-w-[140px]"
        >
          <SelectOption value="day">Today</SelectOption>
          <SelectOption value="week">This week</SelectOption>
          <SelectOption value="month">This month</SelectOption>
        </Select>
      </div>

      <main className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Global usage {PERIOD_LABELS[period]}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {formatNumber(promptTokens)}
                </p>
                <p className="text-muted-foreground mt-2">Prompt tokens</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {formatNumber(completionTokens)}
                </p>
                <p className="text-muted-foreground mt-2">Completion tokens</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {formatNumber(totalTokens)}
                </p>
                <p className="text-muted-foreground mt-2">Total tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <UsageSection title="Usage by model" items={models} />
        <UsageSection title="Usage by app" items={apps} />
      </main>
    </>
  );
}
