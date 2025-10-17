import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Skema validasi untuk form KPI
const kpiFormSchema = z.object({
  target_for_type: z.enum(["user", "team", "division"]),
  target_for_id: z.string().min(1, "Target harus dipilih."),
  metric: z.string().min(3, "Nama metrik minimal 3 karakter."),
  target_value: z.coerce.number().min(1, "Target value harus lebih dari 0."),
  period: z.enum(["daily", "monthly"]),
  // Start date and end date will be calculated, so not in the form
});

type KpiFormValues = z.infer<typeof kpiFormSchema>;

interface AddKpiFormProps {
  onSuccess: () => void;
}

// Fungsi untuk mengambil daftar user dan tim
async function fetchTargetOptions() {
    const [
        { data: users, error: usersError },
        { data: teams, error: teamsError }
    ] = await Promise.all([
        supabase.from("users_meta").select("id, full_name"),
        supabase.from("teams").select("id, name"),
    ]);

    if (usersError || teamsError) {
        throw new Error("Failed to fetch users or teams");
    }
    
    // Divisi adalah nilai enum yang tetap
    const divisions = [
        { id: 'konten_kreator', name: 'Konten Kreator'},
        { id: 'host_live', name: 'Host Live'},
        { id: 'model', name: 'Model'},
        { id: 'manager', name: 'Manager'},
    ];

    return { users, teams, divisions };
}


export function AddKpiForm({ onSuccess }: AddKpiFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Untuk mengisi created_by

  const { data: options, isLoading: isLoadingOptions } = useQuery({
    queryKey: ['kpiTargetOptions'],
    queryFn: fetchTargetOptions,
  });

  const form = useForm<KpiFormValues>({
    resolver: zodResolver(kpiFormSchema),
    defaultValues: {
        metric: "",
        period: "monthly",
        target_for_type: "user",
    },
  });
  
  // Hook untuk memantau perubahan pada field 'target_for_type'
  const targetType = useWatch({ control: form.control, name: 'target_for_type' });

  const mutation = useMutation({
    mutationFn: async (values: KpiFormValues) => {
        const now = new Date();
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);

        const dataToInsert = {
            ...values,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            created_by: user?.id,
        };

      const { error } = await supabase.from("kpi_targets").insert([dataToInsert]);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Target KPI berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["kpiTargets"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Gagal membuat target: ${error.message}`);
    },
  });

  function onSubmit(data: KpiFormValues) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="target_for_type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Target Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="division">Division</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="target_for_id"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Target For</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingOptions}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a target" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {targetType === 'user' && options?.users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                        {targetType === 'team' && options?.teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        {targetType === 'division' && options?.divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="metric"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metric</FormLabel>
              <FormControl><Input placeholder="e.g., total_followers" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="target_value"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Target Value</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 10000" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Period</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a period" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Target
        </Button>
      </form>
    </Form>
  );
}
