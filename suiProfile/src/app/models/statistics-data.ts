export interface StatisticsData {
  id: string;
  profileId: string;
  owner: string;
  totalClicks: number;
  uniqueVisitors: number;
  linkClicks: Map<string, number>;
  sourceClicks: Map<string, number>;
  lastClickMs: number;
  createdAt: number;
}