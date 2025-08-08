'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './globals.css';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#8dd1e1', '#a4de6c',
  '#d0ed57', '#ffc658', '#a28ef4', '#ff7f50', '#87ceeb', '#da70d6', '#32cd32',
  '#6495ed', '#ff69b4', '#cd5c5c', '#ffa07a', '#20b2aa', '#778899'
];

const PERIOD_LABELS = {
  day: 'Today',
  week: 'This Week',
  month: 'This Month'
};

function getPieData(list) {
  const top = [...list].slice(0, 19);
  if (list.length > 19) {
    const other = list.slice(19).reduce((sum, item) => sum + item.tokens, 0);
    top.push({ name: 'Other', tokens: other });
  }
  return top;
}

function TokenTable({ data }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Tokens</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.name}>
              <td>{index + 1}</td>
              <td>{item.name}</td>
              <td>{item.tokens.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageSection({ title, items }) {
  const pieData = getPieData(items);
  return (
    <section>
      <h2>{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieData} dataKey="tokens" nameKey="name" label outerRadius={120}>
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value.toLocaleString()} />
        </PieChart>
      </ResponsiveContainer>
      <TokenTable data={items} />
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('day');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/rankings')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>Loading...</p>;

  const models = data.modelUsage[period]
    .map((m) => ({
      name: m.model_permaslug,
      tokens: m.total_completion_tokens + m.total_prompt_tokens
    }))
    .sort((a, b) => b.tokens - a.tokens);

  const apps = data.appUsage[period]
    .map((a) => ({
      name: a.app?.title || String(a.app_id),
      tokens: Number(a.total_tokens)
    }))
    .sort((a, b) => b.tokens - a.tokens);

  return (
    <main>
      <div className="period-selector">
        <label>Period: </label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="day">{PERIOD_LABELS.day}</option>
          <option value="week">{PERIOD_LABELS.week}</option>
          <option value="month">{PERIOD_LABELS.month}</option>
        </select>
      </div>
      <UsageSection title="Model Token Usage" items={models} />
      <UsageSection title="App Token Usage" items={apps} />
    </main>
  );
}
