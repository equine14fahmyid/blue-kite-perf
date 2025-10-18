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

// Skema validasi untuk form produk
const productFormSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter."),
  description: z.string().optional(),
  spreadsheet_url: z.string().url("URL spreadsheet tidak valid."),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface AddProductFormProps {
  onSuccess: () => void;
}

export function AddProductForm({ onSuccess }: AddProductFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      description: "",
      spreadsheet_url: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (!user) throw new Error("User not authenticated");

      const dataToInsert: {
        title: string;
        spreadsheet_url: string;
        description?: string;
        created_by: string;
      } = {
        title: values.title,
        spreadsheet_url: values.spreadsheet_url,
        description: values.description,
        created_by: user.id,
      };

      const { error } = await supabase.from("products").insert([dataToInsert]);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Produk berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan produk: ${error.message}`);
    },
  });

  function onSubmit(data: ProductFormValues) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Nama produk..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spreadsheet_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spreadsheet URL</FormLabel>
              <FormControl>
                <Input placeholder="https://docs.google.com/spreadsheets/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Deskripsi singkat tentang produk..."
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
          Add Product
        </Button>
      </form>
    </Form>
  );
}
