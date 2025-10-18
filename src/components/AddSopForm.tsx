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

// Skema validasi untuk form SOP
const sopFormSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter."),
  description: z.string().optional(),
  file_path: z.string().url("URL file tidak valid.").min(1, "URL File harus diisi."),
});

type SopFormValues = z.infer<typeof sopFormSchema>;

interface AddSopFormProps {
  onSuccess: () => void;
}

export function AddSopForm({ onSuccess }: AddSopFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<SopFormValues>({
    resolver: zodResolver(sopFormSchema),
    defaultValues: {
      title: "",
      description: "",
      file_path: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SopFormValues) => {
      if (!user) throw new Error("User not authenticated");

      const dataToInsert: {
        title: string;
        description?: string;
        file_path?: string;
        created_by: string;
      } = {
        title: values.title,
        description: values.description,
        file_path: values.file_path,
        created_by: user.id,
      };

      const { error } = await supabase.from("sops").insert([dataToInsert]);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("SOP berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["sops"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Gagal membuat SOP: ${error.message}`);
    },
  });

  function onSubmit(data: SopFormValues) {
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
                <Input placeholder="Judul SOP..." {...field} />
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
                  placeholder="Deskripsi singkat tentang SOP..."
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="file_path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File URL</FormLabel>
              <FormControl>
                <Input placeholder="https://.../dokumen-sop.pdf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create SOP
        </Button>
      </form>
    </Form>
  );
}
