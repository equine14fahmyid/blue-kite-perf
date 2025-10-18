import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signUp } from "@/lib/auth"; // Kita gunakan fungsi signUp yang sudah ada
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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

// Skema validasi untuk karyawan baru
const employeeFormSchema = z.object({
  full_name: z.string().min(2, "Nama lengkap minimal 2 karakter."),
  username: z.string().min(3, "Username minimal 3 karakter."),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  role: z.enum(["karyawan", "pkl", "manager"]),
  division: z.enum(["konten_kreator", "host_live", "model", "manager"]).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface AddEmployeeFormProps {
  onSuccess: () => void;
}

export function AddEmployeeForm({ onSuccess }: AddEmployeeFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      password: "",
      role: "karyawan",
      division: "konten_kreator",
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ email, password, ...meta }: EmployeeFormValues) => {
      const { error } = await signUp(email, password, {
          full_name: meta.full_name,
          username: meta.username,
          role: meta.role,
          division: meta.division,
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Karyawan baru berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan karyawan: ${error.message}`);
    },
  });

  function onSubmit(data: EmployeeFormValues) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="e.g., johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Minimal 6 karakter" {...field} />
              </FormControl>
              <FormDescription>
                Karyawan dapat mengubah password ini nanti.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="karyawan">Karyawan</SelectItem>
                        <SelectItem value="pkl">PKL</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="division"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Division</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih divisi" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="konten_kreator">Konten Kreator</SelectItem>
                        <SelectItem value="host_live">Host Live</SelectItem>
                        <SelectItem value="model">Model</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Employee
        </Button>
      </form>
    </Form>
  );
}
