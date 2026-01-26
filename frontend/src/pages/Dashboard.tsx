import { useMemo, useState } from 'react';
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

// ============== COLOR PALETTE ==============
// Service Line Colors (Fixed mapping)
const SERVICE_LINE_COLORS: Record<string, string> = {
  'Audit': '#0047AB',           // Deep Corporate Blue
  'Tax': '#16A34A',             // Financial Green
  'Consulting': '#EAB308',      // Consulting Gold/Yellow
};

// Industry Colors (Consistent across charts)
const INDUSTRY_COLORS: Record<string, string> = {
  'Technology': '#8B5CF6',      // Violet
  'Finance': '#0EA5E9',         // Cyan
  'Energy': '#F97316',          // Orange
  'Retail': '#EC4899',          // Magenta/Pink
  'Manufacturing': '#64748B',   // Slate Gray
  'Automotive': '#14B8A6',      // Teal
};

const getServiceLineColor = (serviceLine: string): string => {
  return SERVICE_LINE_COLORS[serviceLine] || '#D04A02'; // PwC Orange fallback
};

const getIndustryColor = (industry: string): string => {
  return INDUSTRY_COLORS[industry] || '#94A3B8'; // Light gray fallback
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-pwc-gray/20">
        <p className="text-sm font-semibold text-pwc-black">{label || payload[0].name}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-sm" style={{ color: entry.color || entry.stroke }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 100 ? currencyFmt.format(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CARD_BASE = 'bg-white shadow-md rounded-lg p-6 border border-pwc-gray/30';
const TITLE_BASE = 'text-4xl font-serif font-bold text-pwc-black mb-10';
const AXIS_LABEL_COLOR = '#4B5563';
const GRID_COLOR = '#E5E7EB';

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'stats', selectedMonth],
    queryFn: () => getDashboardStats(selectedMonth === 0 ? undefined : selectedMonth),
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
      {/* Header with Title and Month Selector */}
      <div className="flex items-center justify-between mb-10">
        <h1 className={TITLE_BASE}>Global Sales Insights</h1>
        
        <div className="flex items-center gap-3">
          <label htmlFor="month-select" className="text-sm font-semibold text-pwc-black">
            Filter by Month:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 border border-pwc-gray rounded-lg bg-white text-pwc-black font-medium shadow-sm hover:border-pwc-orange focus:outline-none focus:ring-2 focus:ring-pwc-orange focus:border-transparent transition-colors"
          >
            <option value={0}>All Year</option>
            <option value={1}>January</option>
            <option value={2}>February</option>
            <option value={3}>March</option>
            <option value={4}>April</option>
            <option value={5}>May</option>
            <option value={6}>June</option>
            <option value={7}>July</option>
            <option value={8}>August</option>
            <option value={9}>September</option>
            <option value={10}>October</option>
            <option value={11}>November</option>
            <option value={12}>December</option>
          </select>
        </div>
      </div>

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
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="name" tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }} />
                <YAxis
                  tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }}
                  tickFormatter={(v) => currencyFmt.format(Number(v) || 0)}
                />
                <ReTooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {data.revenue_by_industry.map((entry, index) => (
                    <Cell key={`industry-bar-${index}`} fill={getIndustryColor(entry.name)} />
                  ))}
                </Bar>
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
                    <Cell key={`industry-pie-${index}`} fill={getIndustryColor(data.share_by_industry[index].name)} />
                  ))}
                </Pie>
                <Legend />
                <ReTooltip content={<CustomTooltip />} />
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
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="name" tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }} />
                <YAxis
                  tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }}
                  tickFormatter={(v) => currencyFmt.format(Number(v) || 0)}
                />
                <ReTooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {data.revenue_by_service_line.map((entry, index) => (
                    <Cell key={`service-bar-${index}`} fill={getServiceLineColor(entry.name)} />
                  ))}
                </Bar>
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
                    <Cell key={`service-pie-${index}`} fill={getServiceLineColor(data.share_by_service_line[index].name)} />
                  ))}
                </Pie>
                <Legend />
                <ReTooltip content={<CustomTooltip />} />
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
                {serviceLines.map((sl) => {
                  const color = getServiceLineColor(sl);
                  return (
                    <linearGradient id={`gradient-${sl}`} key={sl} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="month" tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }} />
              <YAxis
                tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }}
                tickFormatter={(v) => currencyFmt.format(Number(v) || 0)}
              />
              <ReTooltip content={<CustomTooltip />} />
              <Legend />
              {serviceLines.map((sl) => (
                <Area
                  key={sl}
                  type="monotone"
                  dataKey={sl}
                  stroke={getServiceLineColor(sl)}
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
