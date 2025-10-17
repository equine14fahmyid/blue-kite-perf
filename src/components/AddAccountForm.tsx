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

// Skema validasi menggunakan Zod
const accountFormSchema = z.object({
  username: z.string().min(2, "Username minimal 2 karakter."),
  platform: z.enum(["tiktok", "shopee", "other"]),
  account_type: z.enum(["affiliate", "seller"]),
  followers: z.coerce.number().min(0, "Followers tidak boleh negatif.").optional(),
  keranjang_kuning: z.boolean().default(false).optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AddAccountFormProps {
  onSuccess: () => void;
}

export function AddAccountForm({ onSuccess }: AddAccountFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      username: "",
      platform: "tiktok",
      account_type: "affiliate",
      followers: 0,
      keranjang_kuning: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (newAccount: AccountFormValues) => {
      const { error } = await supabase.from("accounts").insert([newAccount]);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Akun berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onSuccess(); // Panggil fungsi ini untuk menutup dialog
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan akun: ${error.message}`);
    },
  });

  function onSubmit(data: AccountFormValues) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
            name="account_type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tipe Akun</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe akun" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
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
                <FormDescription>
                  Aktifkan jika akun ini memiliki fitur keranjang kuning.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Tambahkan Akun
        </Button>
      </form>
    </Form>
  );
}
