import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Division } from "@/lib/auth";

// Skema dasar validasi
const baseSchema = z.object({
    notes: z.string().optional(),
});

// Skema spesifik untuk setiap divisi
const creatorSchema = baseSchema.extend({
    video_count: z.coerce.number().min(0, "Jumlah video tidak boleh negatif."),
    post_count: z.coerce.number().min(0, "Jumlah postingan tidak boleh negatif."),
});

const hostSchema = baseSchema.extend({
    live_duration_hours: z.coerce.number().min(0, "Durasi tidak boleh negatif."),
    total_sales: z.coerce.number().min(0, "Total penjualan tidak boleh negatif."),
});

const modelSchema = baseSchema.extend({
    project_name: z.string().min(3, "Nama proyek minimal 3 karakter."),
});

// Fungsi untuk mendapatkan skema yang tepat berdasarkan divisi
const getValidationSchema = (division: Division | null | undefined) => {
    switch (division) {
        case "konten_kreator":
            return creatorSchema;
        case "host_live":
            return hostSchema;
        case "model":
            return modelSchema;
        default:
            return baseSchema;
    }
};

interface AddDailyReportFormProps {
    onSuccess: () => void;
}

export function AddDailyReportForm({ onSuccess }: AddDailyReportFormProps) {
    const queryClient = useQueryClient();
    const { user, userMetadata } = useAuth();
    const division = userMetadata?.division;

    const validationSchema = getValidationSchema(division);
    type FormValues = z.infer<typeof validationSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            notes: "",
            ...(division === "konten_kreator" && { video_count: 0, post_count: 0 }),
            ...(division === "host_live" && { live_duration_hours: 0, total_sales: 0 }),
            ...(division === "model" && { project_name: "" }),
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            if (!user || !division) throw new Error("User not authenticated or division not set");

            const today = new Date().toISOString().split('T')[0];
            const meta = { ...values };
            delete (meta as any).notes; // Hapus catatan dari meta jika ada

            const dataToInsert = {
                date: today,
                user_id: user.id,
                division: division,
                metric: 'daily_report',
                value: 1, // Nilai 1 untuk menandakan 1 laporan
                meta: meta,
            };

            const { error } = await supabase.from("performance_logs").insert([dataToInsert]);
            if (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: () => {
            toast.success("Laporan harian berhasil dikirim!");
            queryClient.invalidateQueries({ queryKey: ["dailyReports", user?.id] });
            onSuccess();
            form.reset();
        },
        onError: (error) => {
            toast.error(`Gagal mengirim laporan: ${error.message}`);
        },
    });

    function onSubmit(data: FormValues) {
        mutation.mutate(data);
    }

    const renderDivisionFields = () => {
        switch (division) {
            case "konten_kreator":
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="video_count"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jumlah Video</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="post_count"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jumlah Postingan</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                );
            case "host_live":
                return (
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="live_duration_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Durasi Live (Jam)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="total_sales"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Penjualan (Rp)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                );
            case "model":
                 return (
                    <FormField
                        control={form.control}
                        name="project_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nama Proyek/Endorsement</FormLabel>
                                <FormControl>
                                    <Input placeholder="cth: Photoshoot Brand A" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            default:
                return <p className="text-sm text-muted-foreground">Divisi Anda tidak memerlukan input spesifik.</p>;
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {renderDivisionFields()}

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catatan Tambahan</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ada kendala atau informasi tambahan?"
                                    className="resize-y"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={mutation.isPending} className="w-full">
                    {mutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Kirim Laporan
                </Button>
            </form>
        </Form>
    );
}
