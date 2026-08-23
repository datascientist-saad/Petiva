"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AddWeightDialog } from "@/components/forms/add-weight-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { weightDifference } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { WeightService } from "@/services/nutrition-service";
import type { WeightRecord } from "@/types/database";

export default function WeightPage() {
  const { selectedPet, selectedPetId } = usePet();
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const service = new WeightService(supabase);
      setRecords(await service.list(selectedPetId));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => weightDifference(records), [records]);
  const chartData = useMemo(
    () =>
      records.map((r) => ({
        date: formatDate(r.recorded_at, { month: "short", day: "numeric" }),
        weight: Number(r.weight_kg),
      })),
    [records]
  );

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view weight history." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/health"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Weight</h1>
          <p className="text-sm text-muted-foreground">{selectedPet.name}'s weight history</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl">Add weight</Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No weight records yet"
          description={`Log ${selectedPet.name}'s first weigh-in to start tracking.`}
          action={{ label: "Add weight", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-xl font-bold">{stats.current?.toFixed(1)} kg</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Previous</p>
                <p className="text-xl font-bold">{stats.previous?.toFixed(1) ?? "—"} kg</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Change</p>
                <p className={`text-xl font-bold ${stats.diff && stats.diff > 0 ? "text-warning" : ""}`}>
                  {stats.diff != null ? `${stats.diff > 0 ? "+" : ""}${stats.diff.toFixed(1)}` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#6B8F71" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {selectedPetId && (
        <AddWeightDialog petId={selectedPetId} open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={loadData} />
      )}
    </div>
  );
}
