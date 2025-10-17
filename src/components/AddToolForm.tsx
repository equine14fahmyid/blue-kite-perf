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

// Skema validasi untuk form tool
const toolFormSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter."),
  description: z.string().optional(),
  url: z.string().url("URL tidak valid."),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

interface AddToolFormProps {
  onSuccess: () => void;
}

export function AddToolForm({ onSuccess }: AddToolFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ToolFormValues) => {
      if (!user) throw new Error("User not authenticated");

      const dataToInsert = {
        ...values,
        created_by: user.id,
      };

      const { error } = await supabase.from("tools").insert([dataToInsert]);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Tool berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan tool: ${error.message}`);
    },
  });

  function onSubmit(data: ToolFormValues) {
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
                <Input placeholder="Nama tool..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
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
                  placeholder="Deskripsi singkat tentang tool..."
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
          Create Tool
        </Button>
      </form>
    </Form>
  );
}
