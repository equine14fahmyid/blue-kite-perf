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

// --- Fungsi Fetching Utama ---
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
  if (targetsError) throw new Error('Could not fetch KPI targets');

  // 2. Fetch Performance Logs based on filter
  let perfQuery = supabase.from('performance_logs').select('metric, value, date, user_id, users_meta(full_name)');
  perfQuery = perfQuery.gte('date', fromISO).lte('date', toISO);
  if (filterType !== 'all' && filterId) {
    if (filterType === 'user') perfQuery = perfQuery.eq('user_id', filterId);
    if (filterType === 'division') perfQuery = perfQuery.eq('division', filterId);
    // Note: team filtering would require a join or a different data structure
  }
  const { data: performanceLogs, error: logsError } = await perfQuery;
  if (logsError) throw new Error('Could not fetch performance logs');

  // 3. Fetch General Summary Stats (can be optimized)
  const { data: accounts, error: accountsError } = await supabase.from("accounts").select("followers, status");
  if (accountsError) throw new Error("Could not fetch account data");

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
    // Adjust target based on time range if it's a daily target
    const isDaily = target.period === 'daily';
    const dayDiff = (to.getTime() - from.getTime()) / (1000 * 3600 * 24) + 1;
    const adjustedTarget = isDaily ? target.target_value * dayDiff : target.target_value;
    
    const progress = progressByMetric[target.metric] || 0;
    kpiGoals[target.metric] = {
      target: adjustedTarget,
      progress: progress,
      percentage: adjustedTarget > 0 ? (progress / adjustedTarget) * 100 : 0,
      label: formatKey(target.metric)
    };
  });

  // C. Performance Trend (e.g., total_sales over time)
  const trendDataByDate = performanceLogs
    .filter(log => log.metric === 'total_sales' || log.metric === 'video_count') // Example metrics
    .reduce((acc, log) => {
      const date = format(new Date(log.date), "MMM d");
      if (!acc[date]) acc[date] = { date };
      acc[date][log.metric] = (acc[date][log.metric] || 0) + log.value;
      return acc;
    }, {} as Record<string, TrendData>);
  const performanceTrend = Object.values(trendDataByDate);

  // D. Comparison Data (e.g., total_sales per user)
  const comparisonDataByUser = performanceLogs
    .filter(log => log.metric === 'total_sales') // Example metric
    .reduce((acc, log) => {
      const name = (log.users_meta as any)?.full_name || 'Unknown';
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

  // Jika bukan manager, filter selalu berdasarkan user itu sendiri
  const queryFilters = useMemo(() => {
    if (!isManager && user) {
      return { ...filters, filterType: 'user', filterId: user.id };
    }
    return filters;
  }, [filters, isManager, user]);


  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardData', queryFilters],
    queryFn: () => fetchDashboardData(queryFilters),
    enabled: !!user,
  });

  const kpiEntries = stats ? Object.values(stats.kpiGoals) : [];
  const chartConfig = {
    total_sales: { label: "Sales", color: "hsl(var(--teal))" },
    video_count: { label: "Videos", color: "hsl(var(--gold))" },
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
        <div className="rounded-lg border bg-card p-8 text-center text-destructive"><p>Failed to load dashboard data. Please try again later.</p></div>
      ) : !stats ? (
        <div className="text-center py-16 text-muted-foreground"><p>No data available for the selected filters.</p></div>
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
                <CardDescription>Progress towards your goals for the selected period.</CardDescription>
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
                  <p className="text-center text-muted-foreground py-8">No targets set for this selection.</p>
                )}
              </CardContent>
            </Card>
            
            {/* Performance Trend */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Sales and Video Count over the selected period.</CardDescription>
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
          {isManager && filterType !== 'user' && (
            <Card>
              <CardHeader>
                <CardTitle>Team Comparison</CardTitle>
                <CardDescription>Total sales comparison across team members.</CardDescription>
              </CardHeader>
              <CardContent>
                 <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={stats.comparisonData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid horizontal={false} />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                      <XAxis type="number" hide />
                      <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Bar dataKey="value" fill="var(--color-total_sales)" radius={4} />
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
