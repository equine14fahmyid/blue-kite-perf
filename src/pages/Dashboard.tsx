import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { userMetadata } = useAuth();

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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-[hsl(var(--teal))]">+0%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <BarChart3 className="h-4 w-4 text-[hsl(var(--gold))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-[hsl(var(--gold))]">+0%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-[hsl(var(--teal))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Target: 100%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
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
                <span className="font-medium">0 / 0</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Engagement Goal</span>
                <span className="font-medium">0 / 0</span>
              </div>
              <Progress value={0} className="h-2" />
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
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Accounts</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Performance</span>
                <span className="font-medium">0%</span>
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

      {/* Getting Started Card */}
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
