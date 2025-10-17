import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AddDailyReportForm } from "@/components/AddDailyReportForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

// Tipe untuk log performa
type PerformanceLog = {
    id: string;
    date: string;
    meta: any;
    created_at: string;
};

// Fungsi untuk mengambil riwayat laporan
async function fetchDailyReports(userId?: string): Promise<PerformanceLog[]> {
    if (!userId) return [];

    const { data, error } = await supabase
        .from("performance_logs")
        .select("id, date, meta, created_at")
        .eq("user_id", userId)
        .eq("metric", 'daily_report')
        .order("date", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching daily reports:", error);
        throw new Error("Failed to fetch reports");
    }

    return data;
}


export default function DailyReport() {
    const { user } = useAuth();
    const { data: reports, isLoading, isError } = useQuery({
        queryKey: ['dailyReports', user?.id],
        queryFn: () => fetchDailyReports(user?.id),
        enabled: !!user,
    });

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                 <div>
                    <h1 className="text-gradient-teal mb-2">Laporan Harian</h1>
                    <p className="text-muted-foreground text-lg">
                        Input progres dan lihat riwayat pekerjaan harianmu di sini.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Input Laporan Hari Ini</CardTitle>
                             <CardDescription>
                                Laporan untuk tanggal: {format(new Date(), "d MMMM yyyy")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddDailyReportForm onSuccess={() => {}} />
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Laporan</CardTitle>
                            <CardDescription>10 laporan terakhir yang kamu kirim.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : isError ? (
                                 <p className="text-destructive text-center">Gagal memuat riwayat.</p>
                            ) : reports && reports.length > 0 ? (
                                <ul className="space-y-3">
                                    {reports.map(report => (
                                        <li key={report.id} className="text-sm border-b pb-2">
                                            <p className="font-semibold">{format(new Date(report.date), "eeee, d MMM yyyy")}</p>
                                            <p className="text-muted-foreground text-xs">
                                                Dikirim pada: {format(new Date(report.created_at), "p")}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-muted-foreground py-16">Belum ada riwayat laporan.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}
