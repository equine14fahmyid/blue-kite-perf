import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Youtube, FileText, Link as LinkIcon } from "lucide-react";

// Tipe data untuk Tutorial yang sudah digabungkan
type Tutorial = {
  id: string;
  title: string;
  body: string | null;
  file_path: string | null;
  youtube_url: string | null;
  created_at: string;
  creator_name: string; // Nama pembuat
};

// Fungsi untuk mengambil dan menggabungkan data Tutorial
async function fetchTutorials(): Promise<Tutorial[]> {
  const { data: tutorials, error: tutorialsError } = await supabase
    .from("tutorials")
    .select("id, title, body, file_path, youtube_url, created_at, created_by")
    .order("created_at", { ascending: false });

  if (tutorialsError) throw new Error(tutorialsError.message);

  const userIds = [...new Set(tutorials.map((t) => t.created_by))];

  const { data: users, error: usersError } = await supabase
    .from("users_meta")
    .select("id, full_name")
    .in("id", userIds);

  if (usersError) throw new Error(usersError.message);

  const userNameMap = new Map(users.map(u => [u.id, u.full_name]));

  const hydratedTutorials = tutorials.map((tutorial) => ({
    ...tutorial,
    creator_name: userNameMap.get(tutorial.created_by) || "Unknown",
  }));

  return hydratedTutorials;
}

export default function Tutorials() {
  const { isManager } = useAuth();
  const { data: tutorials, isLoading, isError } = useQuery({
    queryKey: ['tutorials'],
    queryFn: fetchTutorials,
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-gradient-teal mb-2">Tutorials</h1>
            <p className="text-muted-foreground text-lg">
                Learn and improve your skills with these resources.
            </p>
            </div>
            {isManager && (
                <Button disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Tutorial
                </Button>
            )}
        </div>
        
        {isLoading ? (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : isError ? (
            <div className="rounded-lg border bg-card p-16 text-center text-destructive">
                <p>Failed to load tutorials.</p>
            </div>
        ) : tutorials && tutorials.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tutorials.map((tutorial) => (
                    <Card key={tutorial.id} className="flex flex-col hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-lg leading-snug">{tutorial.title}</CardTitle>
                            <CardDescription>
                                By {tutorial.creator_name} • {formatDistanceToNow(new Date(tutorial.created_at), { addSuffix: true })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            {/* Di sini kita bisa menambahkan deskripsi singkat jika ada */}
                        </CardContent>
                        <CardFooter className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                {tutorial.youtube_url && <Youtube className="h-5 w-5 text-red-500" />}
                                {tutorial.body && <FileText className="h-5 w-5 text-blue-500" />}
                                {tutorial.file_path && <LinkIcon className="h-5 w-5 text-gray-500" />}
                             </div>
                             <Button variant="outline" size="sm">View</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="rounded-lg border-2 border-dashed bg-card p-16 text-center">
                <h3 className="text-xl font-semibold">No Tutorials Yet</h3>
                <p className="text-muted-foreground mt-2">
                  Check back later, or if you're a manager, add the first one!
                </p>
            </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
