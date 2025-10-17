import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from 'date-fns';

// Fungsi untuk mengambil data statistik dari Supabase
async function fetchDashboardStats(userId?: string) {
  if (!userId) return null;

  // 1. Ambil data statistik umum
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("followers, status");
  if (accountsError) throw new Error("Could not fetch account data");

  const { data: teamMembers, error: teamMembersError } = await supabase
    .from("team_members")
    .select("id");
  if (teamMembersError) throw new Error("Could not fetch team data");
  
  // Kalkulasi statistik umum
  const totalFollowers = accounts.reduce((acc, account) => acc + (account.followers || 0), 0);
  const activeAccounts = accounts.filter(account => account.status === 'active').length;
  const issues = accounts.filter(account => account.status === 'pelanggaran' || account.status === 'banned').length;
  const performanceScore = accounts.length > 0 ? Math.round((activeAccounts / accounts.length) * 100) : 0;

  // 2. Ambil target harian untuk user saat ini
  const today = new Date();
  const { data: dailyTargets, error: targetsError } = await supabase
    .from("kpi_targets")
    .select("metric, target_value")
    .eq("target_for_type", "user")
    .eq("target_for_id", userId)
    .eq("period", "daily")
    .gte("start_date", format(startOfDay(today), 'yyyy-MM-dd'))
    .lte("end_date", format(endOfDay(today), 'yyyy-MM-dd'));
  if (targetsError) throw new Error("Could not fetch KPI targets");

  const followersGoal = dailyTargets.find(t => t.metric === 'total_followers')?.target_value || 0;
  const engagementGoal = dailyTargets.find(t => t.metric === 'engagement_rate')?.target_value || 0;

  // 3. Ambil progres harian dari performance_logs
  const { data: performanceLogs, error: logsError } = await supabase
    .from("performance_logs")
    .select("metric, value")
    .eq("user_id", userId)
    .eq("date", format(today, 'yyyy-MM-dd'));
  if (logsError) throw new Error("Could not fetch performance logs");

  const followersProgress = performanceLogs.find(l => l.metric === 'total_followers')?.value || 0;
  const engagementProgress = performanceLogs.find(l => l.metric === 'engagement_rate')?.value || 0;

  return { 
    totalFollowers, 
    activeAccounts, 
    performanceScore, 
    issues,
    totalTeamMembers: teamMembers.length,
    dailyGoals: {
      followers: {
        target: followersGoal,
        progress: followersProgress,
        percentage: followersGoal > 0 ? (followersProgress / followersGoal) * 100 : 0,
      },
      engagement: {
        target: engagementGoal,
        progress: engagementProgress,
        percentage: engagementGoal > 0 ? (engagementProgress / engagementGoal) * 100 : 0,
      }
    }
  };
}


export default function Dashboard() {
  const { user, userMetadata } = useAuth();

  // Menggunakan useQuery untuk mengambil dan menyimpan data, sekarang bergantung pada user.id
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: () => fetchDashboardStats(user?.id),
    enabled: !!user // Hanya jalankan query jika user sudah tersedia
  });

  // Tampilan saat loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tampilan jika terjadi error
  if (isError) {
    return (
       <div className="rounded-lg border bg-card p-8 text-center text-destructive">
        <p>
          Failed to load dashboard data. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient-teal mb-2">Welcome back, {userMetadata?.full_name}</h1>
        <p className="text-muted-foreground text-lg">
          Here's your performance overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
            <Users className="h-4 w-4 text-[hsl(var(--teal))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFollowers.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <BarChart3 className="h-4 w-4 text-[hsl(var(--gold))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAccounts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready for campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-[hsl(var(--teal))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.performanceScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Based on account status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.issues || 0}</div>
            <p className="text-xs text-muted-foreground">
              Accounts needing attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Target Progress</CardTitle>
            <CardDescription>Your progress towards daily goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Followers Goal</span>
                <span className="font-medium">
                    {stats?.dailyGoals.followers.progress.toLocaleString() || 0} / {stats?.dailyGoals.followers.target.toLocaleString() || 0}
                </span>
              </div>
              <Progress value={stats?.dailyGoals.followers.percentage || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Engagement Goal</span>
                <span className="font-medium">
                    {stats?.dailyGoals.engagement.progress || 0}% / {stats?.dailyGoals.engagement.target || 0}%
                </span>
              </div>
              <Progress value={stats?.dailyGoals.engagement.percentage || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Overview</CardTitle>
            <CardDescription>Your team's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Team Members</span>
                <span className="font-medium">{stats?.totalTeamMembers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Accounts</span>
                <span className="font-medium">{stats?.activeAccounts || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Performance</span>
                <span className="font-medium">{stats?.performanceScore || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display
            </p>
          </CardContent>
        </Card>
      </div>
      
       <Card className="border-[hsl(var(--teal))]/20 bg-[hsl(var(--teal))]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[hsl(var(--teal))]" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {userMetadata?.role === "manager" ? (
              <>
                Welcome to your Performance Monitoring System! As a manager, you can:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Add and manage employees</li>
                  <li>Create and assign KPI targets</li>
                  <li>Monitor team performance</li>
                  <li>Manage affiliate accounts securely</li>
                </ul>
              </>
            ) : (
              <>
                Welcome to your Performance Monitoring System! You can:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>View your performance metrics</li>
                  <li>Track your KPI targets</li>
                  <li>Access tutorials and SOPs</li>
                  <li>View team performance</li>
                </ul>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
