import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddAccountForm } from "@/components/AddAccountForm"; // <-- Import komponen baru

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle } from "lucide-react";

// Tipe data untuk sebuah akun, sesuai dengan skema Supabase Anda
type Account = {
  id: string;
  platform: 'tiktok' | 'shopee' | 'other';
  username: string;
  followers: number | null;
  status: 'active' | 'banned' | 'pelanggaran' | 'not_recommended';
  keranjang_kuning: boolean | null;
};

// Fungsi untuk mengambil semua data akun
async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, platform, username, followers, status, keranjang_kuning")
    .order('created_at', { ascending: false }); // Urutkan berdasarkan yang terbaru

  if (error) {
    console.error("Error fetching accounts:", error);
    throw new Error("Failed to fetch accounts");
  }

  return data;
}

// Fungsi untuk memformat status menjadi lebih mudah dibaca
const formatStatus = (status: Account['status']) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'banned':
      return 'Banned';
    case 'pelanggaran':
      return 'Pelanggaran';
    case 'not_recommended':
      return 'Not Recommended';
    default:
      return 'Unknown';
  }
};

export default function Accounts() {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const { data: accounts, isLoading, isError } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts
  });

  return (
    <ProtectedRoute requireManager>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gradient-teal mb-2">Account Management</h1>
            <p className="text-muted-foreground text-lg">
              Manage affiliate accounts securely
            </p>
          </div>
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Fill in the details for the new affiliate account.
                </DialogDescription>
              </DialogHeader>
              <AddAccountForm onSuccess={() => setIsAddAccountOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Accounts</CardTitle>
            <CardDescription>
              A list of all affiliate accounts in your system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-16 text-destructive">
                <p>Failed to load accounts. Please try refreshing the page.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keranjang Kuning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts && accounts.length > 0 ? (
                    accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.username}</TableCell>
                        <TableCell className="capitalize">{account.platform}</TableCell>
                        <TableCell>{account.followers?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                             variant={
                              account.status === 'active' ? 'default' : 
                              account.status === 'banned' || account.status === 'pelanggaran' ? 'destructive' : 'secondary'
                            }
                            className="capitalize"
                          >
                            {formatStatus(account.status)}
                          </Badge>
                        </TableCell>
                         <TableCell>
                          <Badge variant={account.keranjang_kuning ? 'default' : 'secondary'}>
                            {account.keranjang_kuning ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No accounts found. Click "Add Account" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
