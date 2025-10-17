import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from 'date-fns';

async function fetchDashboardStats(userId?: string) {
  if (!userId) return null;

  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  // 1. Ambil data statistik umum (tidak berubah)
  const { data: accounts, error: accountsError } = await supabase.from("accounts").select("followers, status");
  if (accountsError) throw new Error("Could not fetch account data");
  
  const totalFollowers = accounts.reduce((acc, account) => acc + (account.followers || 0), 0);
  const activeAccounts = accounts.filter(account => account.status === 'active').length;
  const issues = accounts.filter(account => account.status === 'pelanggaran' || account.status === 'banned').length;
  const performanceScore = accounts.length > 0 ? Math.round((activeAccounts / accounts.length) * 100) : 0;

  // --- PERUBAHAN UTAMA LOGIKA KPI ---
  // 2. Ambil target BULANAN untuk user saat ini
  const { data: monthlyTargets, error: targetsError } = await supabase
    .from("kpi_targets")
    .select("metric, target_value")
    .eq("target_for_type", "user")
    .eq("target_for_id", userId)
    .eq("period", "monthly")
    .gte("start_date", monthStart)
    .lte("end_date", monthEnd);
  if (targetsError) throw new Error("Could not fetch KPI targets");

  // 3. Ambil dan AKUMULASI progres bulanan dari performance_logs
  const { data: performanceLogs, error: logsError } = await supabase
    .from("performance_logs")
    .select("metric, value")
    .eq("user_id", userId)
    .gte("date", monthStart)
    .lte("date", monthEnd);
  if (logsError) throw new Error("Could not fetch performance logs");

  // Buat objek untuk menyimpan total progres setiap metrik
  const progressByMetric = performanceLogs.reduce((acc, log) => {
    if (!acc[log.metric]) {
      acc[log.metric] = 0;
    }
    acc[log.metric] += log.value;
    return acc;
  }, {} as Record<string, number>);


  // Siapkan data untuk ditampilkan di dasbor
  const kpiGoals: Record<string, { target: number; progress: number; percentage: number, label: string }> = {};

  monthlyTargets.forEach(target => {
    const progress = progressByMetric[target.metric] || 0;
    kpiGoals[target.metric] = {
      target: target.target_value,
      progress: progress,
      percentage: target.target_value > 0 ? (progress / target.target_value) * 100 : 0,
      label: target.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
  });


  return { 
    totalFollowers, 
    activeAccounts, 
    performanceScore, 
    issues,
    kpiGoals
  };
}

export default function Dashboard() {
  const { user, userMetadata } = useAuth();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: () => fetchDashboardStats(user?.id),
    enabled: !!user
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isError) {
    return <div className="rounded-lg border bg-card p-8 text-center text-destructive"><p>Failed to load dashboard data. Please try again later.</p></div>
  }

  const kpiEntries = stats ? Object.values(stats.kpiGoals) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient-teal mb-2">Welcome back, {userMetadata?.full_name}</h1>
        <p className="text-muted-foreground text-lg">
          Here's your performance overview for {format(new Date(), 'MMMM yyyy')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Kartu Statistik Umum (tidak berubah) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
            <Users className="h-4 w-4 text-[hsl(var(--teal))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFollowers.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <BarChart3 className="h-4 w-4 text-[hsl(var(--gold))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAccounts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-[hsl(var(--teal))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.performanceScore || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.issues || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Target Progress</CardTitle>
            <CardDescription>Your progress towards your goals this month.</CardDescription>
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
              <p className="text-center text-muted-foreground py-8">No monthly targets set for you yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
