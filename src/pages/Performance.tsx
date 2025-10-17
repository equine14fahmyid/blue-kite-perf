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
  followers: number;
};

// Fungsi untuk mengambil dan memproses data log performa
async function fetchPerformanceData(): Promise<PerformanceData[]> {
  const { data, error } = await supabase
    .from("performance_logs")
    .select("date, metric, value")
    // Kita hanya ambil metrik 'followers' untuk contoh ini
    .eq("metric", "total_followers") 
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching performance data:", error);
    throw new Error("Failed to fetch performance data");
  }

  // Memformat data agar sesuai dengan kebutuhan grafik
  const formattedData = data.map(log => ({
    // Format tanggal menjadi lebih pendek dan mudah dibaca (mis: "Oct 17")
    date: format(new Date(log.date), "MMM d"),
    followers: log.value,
  }));

  return formattedData;
}

// Konfigurasi untuk komponen Chart kita
const chartConfig = {
  followers: {
    label: "Followers",
    color: "hsl(var(--teal))",
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
                  margin={{
                    top: 5,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
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
                    dataKey="followers"
                    type="monotone"
                    stroke="var(--color-followers)"
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
    </div>
  );
}
