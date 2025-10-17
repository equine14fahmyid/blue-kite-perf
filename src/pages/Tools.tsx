import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AddToolForm } from "@/components/AddToolForm";

// Tipe data untuk Tool
type Tool = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  created_at: string;
  creator_name: string;
};

// Fungsi untuk mengambil data tools
async function fetchTools(): Promise<Tool[]> {
  const { data: tools, error: toolsError } = await supabase
    .from("tools")
    .select("id, title, description, url, created_at, created_by")
    .order("created_at", { ascending: false });

  if (toolsError) throw new Error(toolsError.message);

  const userIds = [...new Set(tools.map((t) => t.created_by))];
  const { data: users, error: usersError } = await supabase
    .from("users_meta")
    .select("id, full_name")
    .in("id", userIds);

  if (usersError) throw new Error(usersError.message);

  const userNameMap = new Map(users.map(u => [u.id, u.full_name]));

  const hydratedTools = tools.map((tool) => ({
    ...tool,
    creator_name: userNameMap.get(tool.created_by) || "Unknown",
  }));

  return hydratedTools;
}

export default function Tools() {
  const { isManager } = useAuth();
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const { data: tools, isLoading, isError } = useQuery({
    queryKey: ['tools'],
    queryFn: fetchTools,
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-gradient-teal mb-2">Tools</h1>
            <p className="text-muted-foreground text-lg">
                Access useful tools and resources.
            </p>
            </div>
            {isManager && (
                <Dialog open={isAddToolOpen} onOpenChange={setIsAddToolOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Tool
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Tool</DialogTitle>
                            <DialogDescription>
                                Add a new tool or resource for your team.
                            </DialogDescription>
                        </DialogHeader>
                        <AddToolForm onSuccess={() => setIsAddToolOpen(false)} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
        
        {isLoading ? (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : isError ? (
            <div className="rounded-lg border bg-card p-16 text-center text-destructive">
                <p>Failed to load tools.</p>
            </div>
        ) : tools && tools.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                    <Card key={tool.id} className="flex flex-col hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-lg leading-snug">{tool.title}</CardTitle>
                            <CardDescription>
                                Added by {tool.creator_name} • {formatDistanceToNow(new Date(tool.created_at), { addSuffix: true })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                           <p className="text-sm text-muted-foreground line-clamp-3">
                                {tool.description || "No description provided."}
                           </p>
                        </CardContent>
                        <CardFooter>
                             <Button variant="outline" size="sm" asChild className="w-full">
                                <a href={tool.url} target="_blank" rel="noopener noreferrer">
                                    Open Tool <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                             </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="rounded-lg border-2 border-dashed bg-card p-16 text-center">
                <h3 className="text-xl font-semibold">No Tools Found</h3>
                <p className="text-muted-foreground mt-2">
                  When you add useful tools, they will appear here.
                </p>
            </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
