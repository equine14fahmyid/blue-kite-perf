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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Skema validasi untuk form tutorial
const tutorialFormSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter."),
  body: z.string().optional(),
  youtube_url: z.string().url("URL YouTube tidak valid.").optional().or(z.literal('')),
  file_path: z.string().url("URL file tidak valid.").optional().or(z.literal('')),
  is_public: z.boolean().default(false),
});

type TutorialFormValues = z.infer<typeof tutorialFormSchema>;

interface AddTutorialFormProps {
  onSuccess: () => void;
}

export function AddTutorialForm({ onSuccess }: AddTutorialFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<TutorialFormValues>({
    resolver: zodResolver(tutorialFormSchema),
    defaultValues: {
      title: "",
      body: "",
      youtube_url: "",
      file_path: "",
      is_public: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: TutorialFormValues) => {
      if (!user) throw new Error("User not authenticated");

      const dataToInsert: {
        title: string;
        body?: string;
        youtube_url?: string;
        file_path?: string;
        is_public: boolean;
        created_by: string;
      } = {
        title: values.title,
        body: values.body,
        youtube_url: values.youtube_url,
        file_path: values.file_path,
        is_public: values.is_public,
        created_by: user.id,
      };

      const { error } = await supabase.from("tutorials").insert([dataToInsert]);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Tutorial berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["tutorials"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Gagal membuat tutorial: ${error.message}`);
    },
  });

  function onSubmit(data: TutorialFormValues) {
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
                <Input placeholder="Judul tutorial..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content (Artikel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tulis konten tutorial di sini..."
                  className="resize-y min-h-[150px]"
                  {...field}
                />
              </FormControl>
               <FormDescription>Isi jika tutorial ini berupa artikel teks.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="youtube_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube URL</FormLabel>
              <FormControl>
                <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
              </FormControl>
               <FormDescription>Isi jika tutorial ini berupa video YouTube.</FormDescription>
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
                <Input placeholder="https://.../dokumen.pdf" {...field} />
              </FormControl>
              <FormDescription>Isi jika tutorial ini berupa tautan ke file (PDF, gambar, dll.).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <FormLabel className="text-base">
                    Publikasikan Tutorial
                    </FormLabel>
                    <FormDescription>
                    Jika diaktifkan, semua pengguna dapat melihat tutorial ini.
                    </FormDescription>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
            />

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Tutorial
        </Button>
      </form>
    </Form>
  );
}
