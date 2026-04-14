'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type EmissionRow = {
  categoryCode: string;
  scope: string;
  totalCo2eKg: number;
};

const SCOPE_COLORS: Record<string, string> = {
  'Scope 1': '#16a34a',
  'Scope 2': '#2563eb',
  'Scope 3': '#9333ea',
};

export function EmissionsCharts({ data }: { data: EmissionRow[] }) {
  const byScope = Object.entries(
    data.reduce<Record<string, number>>((acc, row) => {
      acc[row.scope] = (acc[row.scope] ?? 0) + row.totalCo2eKg;
      return acc;
    }, {})
  ).map(([scope, value]) => ({ scope, value: Math.round(value) }));

  const top10 = [...data]
    .sort((a, b) => b.totalCo2eKg - a.totalCo2eKg)
    .slice(0, 10)
    .map((r) => ({
      name: r.categoryCode.replace('scope3_cat', 'S3-').replace('scope', 'S').slice(0, 20),
      value: Math.round(r.totalCo2eKg),
    }));

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-lg border bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Podzial Scope 1/2/3 (kg CO2e)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byScope} dataKey="value" nameKey="scope" cx="50%" cy="50%" outerRadius={80} label>
              {byScope.map((entry) => (
                <Cell key={entry.scope} fill={SCOPE_COLORS[entry.scope] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${Number(v ?? 0)} kg CO2e`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Top 10 kategorii emisji (kg CO2e)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top10} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${Number(v ?? 0)} kg CO2e`]} />
            <Bar dataKey="value" fill="#16a34a" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
