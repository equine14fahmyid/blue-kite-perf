import { useState } from "react";
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
import { AddProductForm } from "@/components/AddProductForm"; // <-- Impor komponen baru

// Tipe data untuk Product
type Product = {
  id: string;
  title: string;
  description: string | null;
  spreadsheet_url: string;
  created_at: string;
  creator_name: string;
};

// Fungsi untuk mengambil data products
async function fetchProducts(): Promise<Product[]> {
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, title, description, spreadsheet_url, created_at, created_by")
    .order("created_at", { ascending: false });

  if (productsError) throw new Error(productsError.message);

  const userIds = [...new Set(products.map((p) => p.created_by))];
  const { data: users, error: usersError } = await supabase
    .from("users_meta")
    .select("id, full_name")
    .in("id", userIds);

  if (usersError) throw new Error(usersError.message);

  const userNameMap = new Map(users.map(u => [u.id, u.full_name]));

  const hydratedProducts = products.map((product) => ({
    ...product,
    creator_name: userNameMap.get(product.created_by) || "Unknown",
  }));

  return hydratedProducts;
}

export default function Products() {
  const { isManager } = useAuth();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-gradient-teal mb-2">Product Recommendations</h1>
            <p className="text-muted-foreground text-lg">
                Browse recommended products for campaigns.
            </p>
            </div>
            {isManager && (
                <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            <DialogDescription>
                                Add a new product recommendation.
                            </DialogDescription>
                        </DialogHeader>
                        <AddProductForm onSuccess={() => setIsAddProductOpen(false)} />
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
                <p>Failed to load products.</p>
            </div>
        ) : products && products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-col hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-lg leading-snug">{product.title}</CardTitle>
                            <CardDescription>
                                Added by {product.creator_name} • {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                           <p className="text-sm text-muted-foreground line-clamp-3">
                                {product.description || "No description provided."}
                           </p>
                        </CardContent>
                        <CardFooter>
                             <Button variant="outline" size="sm" asChild className="w-full">
                                <a href={product.spreadsheet_url} target="_blank" rel="noopener noreferrer">
                                    Open Spreadsheet <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                             </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="rounded-lg border-2 border-dashed bg-card p-16 text-center">
                <h3 className="text-xl font-semibold">No Products Found</h3>
                <p className="text-muted-foreground mt-2">
                  When you add product recommendations, they will appear here.
                </p>
            </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
