import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AddSopForm } from "@/components/AddSopForm"; // <-- Impor baru
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Tipe data untuk SOP yang sudah digabungkan
type Sop = {
  id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  created_at: string;
  creator_name: string;
};

// Fungsi untuk mengambil dan menggabungkan data SOP
async function fetchSops(): Promise<Sop[]> {
  const { data: sops, error: sopsError } = await supabase
    .from("sops")
    .select("id, title, description, file_path, created_at, created_by")
    .order("created_at", { ascending: false });

  if (sopsError) throw new Error(sopsError.message);

  const userIds = [...new Set(sops.map((s) => s.created_by))];

  const { data: users, error: usersError } = await supabase
    .from("users_meta")
    .select("id, full_name")
    .in("id", userIds);

  if (usersError) throw new Error(usersError.message);

  const userNameMap = new Map(users.map(u => [u.id, u.full_name]));

  const hydratedSops = sops.map((sop) => ({
    ...sop,
    creator_name: userNameMap.get(sop.created_by) || "Unknown",
  }));

  return hydratedSops;
}

export default function SOPs() {
  const { isManager } = useAuth();
  const [isAddSopOpen, setIsAddSopOpen] = useState(false);
  
  const { data: sops, isLoading, isError } = useQuery({
    queryKey: ['sops'],
    queryFn: fetchSops,
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-gradient-teal mb-2">Standard Operating Procedures</h1>
            <p className="text-muted-foreground text-lg">
                Access official guidelines and workflows.
            </p>
            </div>
            {isManager && (
                 <Dialog open={isAddSopOpen} onOpenChange={setIsAddSopOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add SOP
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New SOP</DialogTitle>
                            <DialogDescription>
                                Upload a new standard operating procedure document.
                            </DialogDescription>
                        </DialogHeader>
                        <AddSopForm onSuccess={() => setIsAddSopOpen(false)} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
        
        {/* ... sisa kode tetap sama ... */}
        {isLoading ? (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : isError ? (
            <div className="rounded-lg border bg-card p-16 text-center text-destructive">
                <p>Failed to load SOPs.</p>
            </div>
        ) : sops && sops.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sops.map((sop) => (
                    <Card key={sop.id} className="flex flex-col hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-lg leading-snug">{sop.title}</CardTitle>
                            <CardDescription>
                                By {sop.creator_name} • {formatDistanceToNow(new Date(sop.created_at), { addSuffix: true })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                           <p className="text-sm text-muted-foreground line-clamp-3">
                                {sop.description || "No description provided."}
                           </p>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                {sop.file_path && <FileText className="h-5 w-5 text-blue-500" />}
                             </div>
                             <Button variant="outline" size="sm" asChild>
                                <a href={sop.file_path || "#"} target="_blank" rel="noopener noreferrer" disabled={!sop.file_path}>
                                    View Document
                                </a>
                             </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="rounded-lg border-2 border-dashed bg-card p-16 text-center">
                <h3 className="text-xl font-semibold">No SOPs Found</h3>
                <p className="text-muted-foreground mt-2">
                  When you add SOPs, they will appear here.
                </p>
            </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
