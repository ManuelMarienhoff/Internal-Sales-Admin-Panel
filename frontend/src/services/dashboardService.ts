import axiosInstance from '../api/axios';

export interface KPICards {
  active_engagements: number;
  total_contract_value: number;
  inactive_engagements: number;
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface AnnualTrendEntry {
  month: string; // e.g., "Jan", "Feb"
  [serviceLine: string]: number | string; // Dynamic service line keys
}

export interface DashboardStats {
  kpi_cards: KPICards;
  revenue_by_industry: NamedValue[];
  share_by_industry: NamedValue[];
  revenue_by_service_line: NamedValue[];
  share_by_service_line: NamedValue[];
  annual_trends: AnnualTrendEntry[];
}

export async function getDashboardStats(month?: number): Promise<DashboardStats> {
  const params = month ? { month } : {};
  const { data } = await axiosInstance.get<DashboardStats>('/dashboard/stats', { params });
  return data;
}
