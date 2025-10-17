import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye } from "lucide-react";

// Tipe untuk data laporan yang digabungkan dengan data user
type ReportWithUser = {
  id: string;
  date: string;
  meta: Record<string, any> | null;
  created_at: string;
  user_id: string;
  division: string | null;
  user_name: string;
};

// Fungsi untuk mengambil laporan dari Supabase
async function fetchReportsForManager(): Promise<ReportWithUser[]> {
  const { data, error } = await supabase
    .from("performance_logs")
    .select(`
      id,
      date,
      meta,
      created_at,
      user_id,
      division,
      users_meta (
        full_name
      )
    `)
    .eq("metric", "daily_report")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reports:", error);
    throw new Error("Failed to fetch reports for manager");
  }

  // Mengubah format data agar lebih mudah digunakan
  const formattedData = data.map((report: any) => ({
    ...report,
    user_name: report.users_meta?.full_name || "Unknown User",
  }));

  return formattedData;
}

// Fungsi untuk format teks agar lebih mudah dibaca
const formatKey = (key: string) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


export default function ReportReview() {
  const [selectedReport, setSelectedReport] = useState<ReportWithUser | null>(null);

  const { data: reports, isLoading, isError } = useQuery({
    queryKey: ['reportsForManager'],
    queryFn: fetchReportsForManager,
  });

  return (
    <ProtectedRoute requireManager>
      <div className="space-y-6">
        <div>
          <h1 className="text-gradient-teal mb-2">Review Laporan Harian</h1>
          <p className="text-muted-foreground text-lg">
            Tinjau laporan harian yang dikirim oleh tim Anda.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Laporan Masuk</CardTitle>
            <CardDescription>Daftar semua laporan harian yang telah dikirim oleh karyawan.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-16 text-destructive">
                <p>Gagal memuat data laporan. Coba muat ulang halaman.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Tanggal Laporan</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports && reports.length > 0 ? (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.user_name}</TableCell>
                        <TableCell>{format(new Date(report.date), 'd MMMM yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {report.division ? formatKey(report.division) : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Belum ada laporan yang masuk.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog untuk melihat detail laporan */}
      <Dialog open={!!selectedReport} onOpenChange={(isOpen) => !isOpen && setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Laporan - {selectedReport?.user_name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedReport && format(new Date(selectedReport.date), 'eeee, d MMMM yyyy')}
            </p>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {selectedReport?.meta && Object.entries(selectedReport.meta).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-semibold text-muted-foreground">{formatKey(key)}:</span>
                <span>{value}</span>
              </div>
            ))}
             <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-semibold text-muted-foreground">Catatan:</span>
                <span>{selectedReport?.meta?.notes || "-"}</span>
              </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
