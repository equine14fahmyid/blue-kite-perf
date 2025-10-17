import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// Tipe data untuk sebuah akun, bisa kita impor dari Accounts.tsx jika perlu
type Account = {
  id: string;
  platform: 'tiktok' | 'shopee' | 'other';
  username: string;
  followers: number | null;
  status: 'active' | 'banned' | 'pelanggaran' | 'not_recommended';
  keranjang_kuning: boolean | null;
};

// Skema validasi yang sama dengan form tambah
const accountFormSchema = z.object({
  username: z.string().min(2, "Username minimal 2 karakter."),
  platform: z.enum(["tiktok", "shopee", "other"]),
  account_type: z.enum(["affiliate", "seller"]),
  followers: z.coerce.number().min(0, "Followers tidak boleh negatif.").optional(),
  keranjang_kuning: z.boolean().default(false).optional(),
  status: z.enum(['active', 'banned', 'pelanggaran', 'not_recommended']).optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface EditAccountFormProps {
  account: Account;
  onSuccess: () => void;
}

export function EditAccountForm({ account, onSuccess }: EditAccountFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    // Mengisi form dengan data akun yang ada
    defaultValues: {
      username: account.username,
      platform: account.platform,
      // `account_type` tidak ada di data kita, jadi kita beri default
      account_type: "affiliate", 
      followers: account.followers || 0,
      keranjang_kuning: account.keranjang_kuning || false,
      status: account.status || 'active',
    },
  });

  const mutation = useMutation({
    mutationFn: async (updatedAccount: AccountFormValues) => {
      const { error } = await supabase
        .from("accounts")
        .update(updatedAccount)
        .eq("id", account.id);
        
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Akun berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui akun: ${error.message}`);
    },
  });

  function onSubmit(data: AccountFormValues) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ... field lainnya sama persis dengan AddAccountForm ... */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="contoh: @tokokita" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Platform</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih platform" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="shopee">Shopee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                            <SelectItem value="pelanggaran">Pelanggaran</SelectItem>
                            <SelectItem value="not_recommended">Not Recommended</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
             />
        </div>
        <FormField
          control={form.control}
          name="followers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Followers</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="keranjang_kuning"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Keranjang Kuning
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Simpan Perubahan
        </Button>
      </form>
    </Form>
  );
}
