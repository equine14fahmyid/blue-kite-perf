import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle } from "lucide-react";
import type { UserMetadata } from "@/lib/auth"; // Menggunakan tipe yang sudah ada

// Fungsi untuk mengambil data karyawan
async function fetchEmployees(): Promise<UserMetadata[]> {
  const { data, error } = await supabase
    .from("users_meta")
    .select("id, full_name, username, role, division")
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching employees:", error);
    throw new Error("Failed to fetch employees");
  }

  return data;
}

// Helper untuk format teks (kapitalisasi dan ganti underscore)
const formatText = (text: string | null | undefined) => {
  if (!text) return 'N/A';
  return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function Employees() {
  const { data: employees, isLoading, isError } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees
  });

  return (
    <ProtectedRoute requireManager>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gradient-teal mb-2">Employee Management</h1>
            <p className="text-muted-foreground text-lg">
              View and manage your team members.
            </p>
          </div>
          <Button disabled>
             <PlusCircle className="mr-2 h-4 w-4" />
             Add Employee
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              A list of all users in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-16 text-destructive">
                <p>Failed to load employees. Please try refreshing the page.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Division</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees && employees.length > 0 ? (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.full_name}</TableCell>
                        <TableCell>{employee.username}</TableCell>
                        <TableCell>
                           <Badge 
                             variant={employee.role === 'manager' ? 'default' : 'secondary'}
                             className="capitalize"
                           >
                            {formatText(employee.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="capitalize">
                            {formatText(employee.division)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No employees found.
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
