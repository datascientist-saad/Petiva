"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/shared/page-states";

interface Metrics {
  totalUsers: number;
  totalPets: number;
  petsOnboarded: number;
  aiMessagesToday: number;
  eventsLast7Days: Record<string, number>;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/metrics");
        if (res.status === 403) {
          setAuthorized(false);
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to load metrics");
        }
        setAuthorized(true);
        setMetrics(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingState message="Loading pilot metrics…" />;

  if (authorized === false) {
    return (
      <ErrorState message="You don't have access to the admin dashboard." />
    );
  }

  if (error) return <ErrorState message={error} />;

  if (!metrics) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Pilot metrics</h1>
        <p className="text-sm text-muted-foreground">Pawly admin dashboard</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{metrics.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total users</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{metrics.totalPets}</p>
            <p className="text-xs text-muted-foreground">Total pets</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{metrics.petsOnboarded}</p>
            <p className="text-xs text-muted-foreground">Onboarded pets</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-accent">{metrics.aiMessagesToday}</p>
            <p className="text-xs text-muted-foreground">AI messages today</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Events (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(metrics.eventsLast7Days).length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded yet.</p>
          ) : (
            Object.entries(metrics.eventsLast7Days).map(([name, count]) => (
              <div key={name} className="flex justify-between rounded-xl bg-secondary/50 p-2 text-sm">
                <span>{name}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
