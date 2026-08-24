"use client";

import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/shared/page-states";

interface AdminPayload {
  totals: {
    users: number;
    pets: number;
    cats: number;
    dogs: number;
    tasksCompleted: number;
    mealsLogged: number;
    weightRecords: number;
    vaccinations: number;
    medicalRecords: number;
    aiConversations: number;
  };
  metrics: {
    activationRate: number;
    onboardingCompletion: number;
    weeklyActiveUsers: number;
    activePets: number;
    averageCareTasksCompletedPerUser: number;
    averageAiInteractionsPerUser: number;
    medicalRecordUploadRate: number;
    vaccinationTrackingRate: number;
  };
  recentRegistrations: Array<{
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
  }>;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function AdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
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
          const body = await res.json();
          throw new Error(body.error ?? "Failed to load metrics");
        }
        setAuthorized(true);
        setData(await res.json());
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
    return <ErrorState message="You don't have access to the admin dashboard." />;
  }
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const cards = [
    { label: "Users", value: data.totals.users },
    { label: "Pets", value: data.totals.pets },
    { label: "Cats", value: data.totals.cats },
    { label: "Dogs", value: data.totals.dogs },
    { label: "Tasks completed", value: data.totals.tasksCompleted },
    { label: "Meals logged", value: data.totals.mealsLogged },
    { label: "Weight records", value: data.totals.weightRecords },
    { label: "Vaccinations", value: data.totals.vaccinations },
    { label: "Medical records", value: data.totals.medicalRecords },
    { label: "AI conversations", value: data.totals.aiConversations },
  ];

  const rates = [
    { label: "Activation rate", value: pct(data.metrics.activationRate) },
    { label: "Onboarding completion", value: pct(data.metrics.onboardingCompletion) },
    { label: "Weekly active users", value: data.metrics.weeklyActiveUsers },
    { label: "Active pets", value: data.metrics.activePets },
    { label: "Avg care tasks / user", value: data.metrics.averageCareTasksCompletedPerUser },
    { label: "Avg AI interactions / user", value: data.metrics.averageAiInteractionsPerUser },
    { label: "Medical record upload rate", value: pct(data.metrics.medicalRecordUploadRate) },
    { label: "Vaccination tracking rate", value: pct(data.metrics.vaccinationTrackingRate) },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">Pilot dashboard</h1>
        <p className="text-sm text-muted-foreground">Aggregate usage for the {brand.name} pilot — no private medical details.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pilot health metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {rates.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-sm">
              <span>{row.label}</span>
              <span className="font-semibold">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent registrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentRegistrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            data.recentRegistrations.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{user.full_name || "Pet parent"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
