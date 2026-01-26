import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Activity, Pause } from 'lucide-react';
import { getDashboardStats } from '../services/dashboardService';

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const CARD_BASE = 'bg-white shadow-md rounded-lg p-6 border border-pwc-gray/30';
const TITLE_BASE = 'text-4xl font-serif font-bold text-pwc-black mb-10';

const pwcPalette = [
  '#fd5108', // pwc orange
  '#2D2D2D', // pwc black
  '#E0E0E0', // pwc gray
  '#ff8547',
  '#4a4a4a',
  '#c9c9c9',
  '#ff6b2e',
];

const Dashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 60_000,
  });

  const serviceLines = useMemo(() => {
    const set = new Set<string>();
    data?.annual_trends.forEach((entry) => {
      Object.keys(entry).forEach((k) => {
        if (k !== 'month') set.add(k);
      });
    });
    return Array.from(set);
  }, [data]);

  if (isLoading) {
    return (
      <div className="px-12 py-12">
        <h1 className={TITLE_BASE}>Global Sales Insights</h1>
        <div className="grid grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${CARD_BASE} animate-pulse`}>
              <div className="h-6 w-32 bg-pwc-gray/60 mb-4 rounded" />
              <div className="h-10 w-48 bg-pwc-gray/60 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className={`${CARD_BASE} h-80 animate-pulse`} />
          <div className={`${CARD_BASE} h-80 animate-pulse`} />
        </div>
        <div className={`${CARD_BASE} h-96 animate-pulse`} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-12 py-12">
        <h1 className={TITLE_BASE}>Global Sales Insights</h1>
        <div className={`${CARD_BASE} text-red-600 font-semibold`}>
          Failed to load dashboard analytics. Please check the backend connection.
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 py-12">
      {/* Title */}
      <h1 className={TITLE_BASE}>Global Sales Insights</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={CARD_BASE}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm uppercase tracking-wide text-pwc-black/70 font-semibold">
              Total Contract Value
            </span>
            <TrendingUp className="text-pwc-orange" size={24} />
          </div>
          <div className="text-3xl font-bold text-pwc-black">
            {currencyFmt.format(data.kpi_cards.total_contract_value || 0)}
          </div>
        </div>

        <div className={CARD_BASE}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm uppercase tracking-wide text-pwc-black/70 font-semibold">
              Active Engagements
            </span>
            <Activity className="text-green-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-pwc-black">
            {data.kpi_cards.active_engagements || 0}
          </div>
          <div className="text-xs text-pwc-black/50 mt-1">Confirmed + Completed</div>
        </div>

        <div className={CARD_BASE}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm uppercase tracking-wide text-pwc-black/70 font-semibold">
              Inactive Engagements
            </span>
            <Pause className="text-amber-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-pwc-black">
            {data.kpi_cards.inactive_engagements || 0}
          </div>
          <div className="text-xs text-pwc-black/50 mt-1">Draft Orders</div>
        </div>
      </div>

      {/* Industry Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Industry */}
        <div className={CARD_BASE}>
          <h2 className="text-xl font-bold text-pwc-black mb-4">Revenue by Industry</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={data.revenue_by_industry} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fill: '#2D2D2D', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#2D2D2D', fontSize: 12 }}
                  tickFormatter={(v) => currencyFmt.format(Number(v) || 0)}
                />
                <ReTooltip formatter={(value: any, name: any) => [currencyFmt.format(Number(value) || 0), name]} />
                <Legend />
                <Bar dataKey="value" name="Revenue" fill="#fd5108" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share by Industry (Pie) */}
        <div className={CARD_BASE}>
          <h2 className="text-xl font-bold text-pwc-black mb-4">Order Share by Industry</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.share_by_industry}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {data.share_by_industry.map((_, index) => (
                    <Cell key={`industry-${index}`} fill={pwcPalette[index % pwcPalette.length]} />
                  ))}
                </Pie>
                <Legend />
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Service Line Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Service Line */}
        <div className={CARD_BASE}>
          <h2 className="text-xl font-bold text-pwc-black mb-4">Revenue by Service Line</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={data.revenue_by_service_line} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fill: '#2D2D2D', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#2D2D2D', fontSize: 12 }}
                  tickFormatter={(v) => currencyFmt.format(Number(v) || 0)}
                />
                <ReTooltip formatter={(value: any, name: any) => [currencyFmt.format(Number(value) || 0), name]} />
                <Legend />
                <Bar dataKey="value" name="Revenue" fill="#2D2D2D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share by Service Line (Pie) */}
        <div className={CARD_BASE}>
          <h2 className="text-xl font-bold text-pwc-black mb-4">Item Share by Service Line</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.share_by_service_line}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {data.share_by_service_line.map((_, index) => (
                    <Cell key={`service-${index}`} fill={pwcPalette[index % pwcPalette.length]} />
                  ))}
                </Pie>
                <Legend />
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Annual Trends (Always 12 Months) */}
      <div className={CARD_BASE}>
        <h2 className="text-xl font-bold text-pwc-black mb-4">
          Annual Demand Trends ({new Date().getFullYear()})
        </h2>
        <div className="h-96">
          <ResponsiveContainer>
            <AreaChart data={data.annual_trends} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                {serviceLines.map((sl, idx) => (
                  <linearGradient id={`gradient-${sl}`} key={sl} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pwcPalette[idx % pwcPalette.length]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={pwcPalette[idx % pwcPalette.length]} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tick={{ fill: '#2D2D2D', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#2D2D2D', fontSize: 12 }}
                tickFormatter={(v) => currencyFmt.format(Number(v) || 0)}
              />
              <ReTooltip formatter={(value: any, name: any) => [currencyFmt.format(Number(value) || 0), name]} />
              <Legend />
              {serviceLines.map((sl, idx) => (
                <Area
                  key={sl}
                  type="monotone"
                  dataKey={sl}
                  stroke={pwcPalette[idx % pwcPalette.length]}
                  fill={`url(#gradient-${sl})`}
                  name={sl}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
