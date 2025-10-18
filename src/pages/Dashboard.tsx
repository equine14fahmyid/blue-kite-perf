import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { Loader2, Users, BarChart3, Target, TrendingUp, AlertCircle } from "lucide-react";

// --- Tipe Data ---
type FilterType = 'all' | 'division' | 'team' | 'user';
type TimeRange = 'today' | 'last7' | 'last30' | 'this_month';

type KpiProgress = {
  target: number;
  progress: number;
  percentage: number;
  label: string;
};

type TrendData = {
  date: string;
  [key: string]: any;
};

type DashboardStats = {
  kpiGoals: Record<string, KpiProgress>;
  performanceTrend: TrendData[];
  comparisonData: { name: string; value: number }[];
  summary: {
    totalFollowers: number;
    activeAccounts: number;
    performanceScore: number;
    issues: number;
  };
};

// --- Fungsi Helper ---
const getDateRange = (range: TimeRange) => {
  const today = new Date();
  switch (range) {
    case 'today':
      return { from: startOfDay(today), to: endOfDay(today) };
    case 'last7':
      return { from: subDays(today, 6), to: endOfDay(today) };
    case 'last30':
      return { from: subDays(today, 29), to: endOfDay(today) };
    case 'this_month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
  }
};

const formatKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// --- Fungsi Fetching Utama (Dengan Perbaikan) ---
async function fetchDashboardData({ timeRange, filterType, filterId }: { timeRange: TimeRange; filterType: FilterType; filterId: string | null }): Promise<DashboardStats> {
  const { from, to } = getDateRange(timeRange);
  const fromISO = from.toISOString();
  const toISO = to.toISOString();

  // 1. Fetch KPI Targets based on filter
  let kpiQuery = supabase.from('kpi_targets').select('metric, target_value, period');
  if (filterType !== 'all' && filterId) {
    kpiQuery = kpiQuery.eq('target_for_type', filterType).eq('target_for_id', filterId);
  }
  const { data: targets, error: targetsError } = await kpiQuery;
  if (targetsError || !targets) throw new Error(`Could not fetch KPI targets: ${targetsError?.message || 'No data'}`);

  // 2. Fetch Performance Logs based on filter
  let perfQuery = supabase.from('performance_logs').select('metric, value, date, user_id');
  perfQuery = perfQuery.gte('date', fromISO).lte('date', toISO);
  
  if (filterType !== 'all' && filterId) {
    if (filterType === 'user') {
      perfQuery = perfQuery.eq('user_id', filterId);
    }
    if (filterType === 'division') {
      perfQuery = perfQuery.eq('division', filterId as "host_live" | "konten_kreator" | "manager" | "model");
    }
    if (filterType === 'team') {
      // Get user IDs for the selected team
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', filterId);
      
      if (teamError || !teamMembers) throw new Error(`Could not fetch team members: ${teamError?.message || 'No data'}`);
      const userIdsInTeam = teamMembers.map(m => m.user_id);
      perfQuery = perfQuery.in('user_id', userIdsInTeam);
    }
  }
  const { data: performanceLogs, error: logsError } = await perfQuery;
  if (logsError || !performanceLogs) throw new Error(`Could not fetch performance logs: ${logsError?.message || 'No data'}`);

  // 3. Ambil data user secara terpisah untuk perbandingan
  const userIds = [...new Set(performanceLogs.map(log => log.user_id).filter(Boolean))];
  let userNameMap = new Map<string, string>();
  if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
          .from('users_meta')
          .select('id, full_name')
          .in('id', userIds);
      if (usersError) console.error("Could not fetch user names for chart");
      else if (users) userNameMap = new Map(users.map(u => [u.id, u.full_name]));
  }

  // 4. Fetch General Summary Stats
  const { data: accounts, error: accountsError } = await supabase.from("accounts").select("followers, status");
  if (accountsError || !accounts) throw new Error(`Could not fetch account data: ${accountsError?.message || 'No data'}`);

  // --- Proses Data ---
  // A. Summary
  const totalFollowers = accounts.reduce((acc, account) => acc + (account.followers || 0), 0);
  const activeAccounts = accounts.filter(a => a.status === 'active').length;
  const issues = accounts.filter(a => a.status === 'pelanggaran' || a.status === 'banned').length;
  const performanceScore = accounts.length > 0 ? Math.round((activeAccounts / accounts.length) * 100) : 0;
  
  // B. KPI Progress
  const progressByMetric = performanceLogs.reduce((acc, log) => {
    acc[log.metric] = (acc[log.metric] || 0) + log.value;
    return acc;
  }, {} as Record<string, number>);

  const kpiGoals: Record<string, KpiProgress> = {};
  targets.forEach(target => {
    const isDaily = target.period === 'daily';
    const dayDiff = (to.getTime() - from.getTime()) / (1000 * 3600 * 24) + 1;
    const adjustedTarget = isDaily ? (target.target_value || 0) * dayDiff : (target.target_value || 0);
    
    const progress = progressByMetric[target.metric] || 0;
    kpiGoals[target.metric] = {
      target: adjustedTarget,
      progress: progress,
      percentage: adjustedTarget > 0 ? (progress / adjustedTarget) * 100 : 0,
      label: formatKey(target.metric)
    };
  });

  // C. Performance Trend
  const trendDataByDate = performanceLogs
    .filter(log => log.metric === 'total_sales' || log.metric === 'video_count')
    .reduce((acc, log) => {
      const date = format(new Date(log.date), "MMM d");
      if (!acc[date]) acc[date] = { date, total_sales: 0, video_count: 0 };
      acc[date][log.metric] = (acc[date][log.metric] || 0) + log.value;
      return acc;
    }, {} as Record<string, TrendData>);
  const performanceTrend = Object.values(trendDataByDate);

  // D. Comparison Data
  const comparisonDataByUser = performanceLogs
    .filter(log => log.metric === 'total_sales')
    .reduce((acc, log) => {
      const name = userNameMap.get(log.user_id!) || 'Unknown';
      if (!acc[name]) acc[name] = { name, value: 0 };
      acc[name].value += log.value;
      return acc;
    }, {} as Record<string, {name: string, value: number}>);
  const comparisonData = Object.values(comparisonDataByUser);

  return {
    summary: { totalFollowers, activeAccounts, performanceScore, issues },
    kpiGoals,
    performanceTrend,
    comparisonData,
  };
}

// --- Komponen Filter ---
function DashboardFilters({
  onFilterChange,
  isManager,
}: {
  onFilterChange: (filters: { timeRange: TimeRange; filterType: FilterType; filterId: string | null }) => void;
  isManager: boolean;
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterId, setFilterId] = useState<string | null>(null);

  const { data: options } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      const [{ data: users }, { data: teams }] = await Promise.all([
        supabase.from('users_meta').select('id, full_name'),
        supabase.from('teams').select('id, name'),
      ]);
      const divisions = [
        { id: 'konten_kreator', name: 'Konten Kreator'}, { id: 'host_live', name: 'Host Live'},
        { id: 'model', name: 'Model'}, { id: 'manager', name: 'Manager'},
      ];
      return { users, teams, divisions };
    },
    enabled: isManager,
  });

  const handleApplyFilters = () => {
    onFilterChange({ timeRange, filterType, filterId });
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last7">Last 7 Days</SelectItem>
            <SelectItem value="last30">Last 30 Days</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
          </SelectContent>
        </Select>

        {isManager && (
          <>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v as FilterType); setFilterId(null); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="division">Division</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            {filterType !== 'all' && (
              <Select value={filterId || ''} onValueChange={setFilterId}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={`Select ${filterType}`} />
                </SelectTrigger>
                <SelectContent>
                  {filterType === 'division' && options?.divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  {filterType === 'team' && options?.teams?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  {filterType === 'user' && options?.users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </>
        )}

        <Button onClick={handleApplyFilters} className="w-full sm:w-auto">Apply Filters</Button>
      </CardContent>
    </Card>
  );
}

// --- Komponen Utama Dashboard ---
export default function Dashboard() {
  const { user, userMetadata, isManager } = useAuth();
  const [filters, setFilters] = useState<{ timeRange: TimeRange; filterType: FilterType; filterId: string | null }>({
    timeRange: 'this_month',
    filterType: 'all',
    filterId: null,
  });

  const queryFilters = useMemo(() => {
    if (!isManager && user) {
      return { ...filters, filterType: 'user', filterId: user.id };
    }
    return filters;
  }, [filters, isManager, user]);


  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardData', queryFilters],
    queryFn: () => fetchDashboardData({
      timeRange: queryFilters.timeRange,
      filterType: queryFilters.filterType as FilterType,
      filterId: queryFilters.filterId,
    }),
    enabled: !!user,
  });

  if (isError) {
      console.error("Dashboard fetch error:", error);
  }

  const kpiEntries = stats ? Object.values(stats.kpiGoals) : [];
  const chartConfig = {
    total_sales: { label: "Sales", color: "hsl(var(--teal))" },
    video_count: { label: "Videos", color: "hsl(var(--gold))" },
    value: { label: "Sales", color: "hsl(var(--teal))" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient-teal mb-2">Welcome back, {userMetadata?.full_name}</h1>
        <p className="text-muted-foreground text-lg">
          Here's your performance overview.
        </p>
      </div>

      <DashboardFilters onFilterChange={setFilters} isManager={isManager} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : isError ? (
        <div className="rounded-lg border bg-card p-8 text-center text-destructive"><p>Gagal memuat data dasbor. Silakan coba lagi nanti.</p></div>
      ) : !stats ? (
        <div className="text-center py-16 text-muted-foreground"><p>Tidak ada data yang tersedia untuk filter yang dipilih.</p></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                <Users className="h-4 w-4 text-[hsl(var(--teal))]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary.totalFollowers.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-[hsl(var(--teal))]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary.performanceScore || 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
                <BarChart3 className="h-4 w-4 text-[hsl(var(--gold))]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary.activeAccounts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary.issues || 0}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* KPI Progress */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Target Progress</CardTitle>
                <CardDescription>Progress tujuan Anda untuk periode yang dipilih.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {kpiEntries.length > 0 ? (
                  kpiEntries.map(kpi => (
                    <div key={kpi.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{kpi.label}</span>
                        <span className="font-medium">
                          {kpi.progress.toLocaleString()} / {kpi.target.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={kpi.percentage} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">Tidak ada target yang ditetapkan untuk pilihan ini.</p>
                )}
              </CardContent>
            </Card>
            
            {/* Performance Trend */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Penjualan dan Jumlah Video selama periode yang dipilih.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <LineChart data={stats.performanceTrend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line dataKey="total_sales" type="monotone" stroke="var(--color-total_sales)" strokeWidth={2} dot={false} />
                    <Line dataKey="video_count" type="monotone" stroke="var(--color-video_count)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Chart */}
          {isManager && filters.filterType !== 'user' && stats.comparisonData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Comparison</CardTitle>
                <CardDescription>Perbandingan total penjualan antar anggota tim.</CardDescription>
              </CardHeader>
              <CardContent>
                 <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={stats.comparisonData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid horizontal={false} />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
                      <XAxis type="number" hide />
                      <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                  </ChartContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
