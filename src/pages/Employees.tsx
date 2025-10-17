import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Employees() {
  return (
    <ProtectedRoute requireManager>
      <div className="space-y-6">
        <div>
          <h1 className="text-gradient-teal mb-2">Employee Management</h1>
          <p className="text-muted-foreground text-lg">
            Manage your team members
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Employee management features coming soon
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
