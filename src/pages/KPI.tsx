import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, User, Users, Building } from "lucide-react";

// Tipe data untuk KPI yang sudah digabungkan dengan nama target
export type KpiTarget = {
  id: string;
  target_for_type: 'user' | 'team' | 'division';
  target_for_id: string;
  metric: string;
  target_value: number;
  period: 'daily' | 'monthly';
  start_date: string;
  end_date: string;
  target_name: string; // Nama user/tim/divisi
};

// Fungsi untuk mengambil dan menggabungkan data KPI
async function fetchKpiTargets(): Promise<KpiTarget[]> {
  const { data: targets, error: targetsError } = await supabase
    .from("kpi_targets")
    .select("*");

  if (targetsError) throw new Error(targetsError.message);

  const userIds = targets
    .filter((t) => t.target_for_type === "user")
    .map((t) => t.target_for_id);
  
  const teamIds = targets
    .filter((t) => t.target_for_type === "team")
    .map((t) => t.target_for_id);

  const [
    { data: users, error: usersError },
    { data: teams, error: teamsError }
  ] = await Promise.all([
    supabase.from("users_meta").select("id, full_name").in("id", userIds),
    supabase.from("teams").select("id, name").in("id", teamIds),
  ]);

  if (usersError) throw new Error(usersError.message);
  if (teamsError) throw new Error(teamsError.message);

  const userNameMap = new Map(users.map(u => [u.id, u.full_name]));
  const teamNameMap = new Map(teams.map(t => [t.id, t.name]));

  const hydratedTargets = targets.map((target) => {
    let target_name = "N/A";
    if (target.target_for_type === "user") {
      target_name = userNameMap.get(target.target_for_id) || "Unknown User";
    } else if (target.target_for_type === "team") {
      target_name = teamNameMap.get(target.target_for_id) || "Unknown Team";
    } else if (target.target_for_type === "division") {
        target_name = target.target_for_id.replace("_", " "); // Asumsi ID divisi adalah namanya
    }
    return { ...target, target_name };
  });

  return hydratedTargets;
}

const TargetIcon = ({ type }: { type: KpiTarget['target_for_type'] }) => {
  if (type === 'user') return <User className="h-4 w-4 mr-2 text-muted-foreground" />;
  if (type === 'team') return <Users className="h-4 w-4 mr-2 text-muted-foreground" />;
  if (type === 'division') return <Building className="h-4 w-4 mr-2 text-muted-foreground" />;
  return null;
};

export default function KPI() {
  const { data: kpiTargets, isLoading, isError } = useQuery({
    queryKey: ['kpiTargets'],
    queryFn: fetchKpiTargets,
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-gradient-teal mb-2">KPI Targets</h1>
            <p className="text-muted-foreground text-lg">
                Set and track key performance indicators for your team.
            </p>
            </div>
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Target
            </Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Active KPI Targets</CardTitle>
                <CardDescription>
                A list of all performance targets currently in the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-16 text-destructive">
                        <p>Failed to load KPI targets.</p>
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Target For</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead>Target Value</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Date Range</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {kpiTargets && kpiTargets.length > 0 ? (
                        kpiTargets.map((target) => (
                        <TableRow key={target.id}>
                            <TableCell className="font-medium flex items-center">
                                <TargetIcon type={target.target_for_type} />
                                <div className="flex flex-col">
                                    <span>{target.target_name}</span>
                                    <span className="text-xs text-muted-foreground capitalize">{target.target_for_type}</span>
                                </div>
                            </TableCell>
                            <TableCell className="capitalize">{target.metric.replace(/_/g, ' ')}</TableCell>
                            <TableCell>{target.target_value.toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="capitalize">{target.period}</Badge>
                            </TableCell>
                            <TableCell>
                                {format(new Date(target.start_date), 'd MMM yyyy')} - {format(new Date(target.end_date), 'd MMM yyyy')}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No KPI targets found.
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
