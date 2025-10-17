import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';

// Tipe untuk data performa yang sudah diproses
type PerformanceData = {
  date: string;
  [key: string]: any; // Memungkinkan metrik dinamis
};

// Fungsi untuk mengambil dan memproses data log performa
async function fetchPerformanceData(): Promise<PerformanceData[]> {
  const { data, error } = await supabase
    .from("performance_logs")
    .select("date, metric, value")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching performance data:", error);
    throw new Error("Failed to fetch performance data");
  }

  // Mengelompokkan data berdasarkan tanggal
  const dataByDate = data.reduce((acc, log) => {
    const date = format(new Date(log.date), "MMM d");
    if (!acc[date]) {
      acc[date] = { date };
    }
    acc[date][log.metric] = log.value;
    return acc;
  }, {} as Record<string, PerformanceData>);

  return Object.values(dataByDate);
}

// Konfigurasi untuk komponen Chart kita
const chartConfig = {
  total_followers: {
    label: "Followers",
    color: "hsl(var(--teal))",
  },
  engagement_rate: {
    label: "Engagement Rate",
    color: "hsl(var(--gold))",
  },
};

export default function Performance() {
  const { data: performanceData, isLoading, isError } = useQuery({
    queryKey: ['performanceData'],
    queryFn: fetchPerformanceData
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient-teal mb-2">Performance Analytics</h1>
        <p className="text-muted-foreground text-lg">
          Track and analyze performance metrics over time.
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Followers Trend</CardTitle>
            <CardDescription>Showing total followers growth for the last period.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex justify-center items-center h-[350px] text-destructive">
                <p>Failed to load chart data.</p>
              </div>
            ) : performanceData && performanceData.length > 0 ? (
              <div className="h-[350px]">
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={performanceData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Line
                      dataKey="total_followers"
                      type="monotone"
                      stroke="var(--color-total_followers)"
                      strokeWidth={2}
                      dot={true}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-[350px]">
                 <p className="text-muted-foreground">No performance data available to display.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate</CardTitle>
            <CardDescription>Showing daily engagement rate.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex justify-center items-center h-[350px] text-destructive">
                <p>Failed to load chart data.</p>
              </div>
            ) : performanceData && performanceData.length > 0 ? (
              <div className="h-[350px]">
                <ChartContainer config={chartConfig}>
                  <BarChart accessibilityLayer data={performanceData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="engagement_rate" fill="var(--color-engagement_rate)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-[350px]">
                 <p className="text-muted-foreground">No engagement data available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
