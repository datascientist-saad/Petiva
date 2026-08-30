"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { brand } from "@/lib/brand";
import {
  FileText,
  MessageCircle,
  Pill,
  Salad,
  Scale,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { DietDashboardCard } from "@/components/diet/diet-dashboard-card";
import { AddMedicationDialog } from "@/components/forms/add-medication-dialog";
import { AddRecordDialog } from "@/components/forms/add-record-dialog";
import { AddWeightDialog } from "@/components/forms/add-weight-dialog";
import { LogMealDialog } from "@/components/forms/log-meal-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { useUser } from "@/contexts/user-context";
import {
  calculatePetAge,
  daysUntilVaccination,
  getTodaysCareTasks,
  isVaccinationDueSoon,
  weeklyCareCompletionPercent,
} from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { greetingForNow } from "@/lib/utils";
import { CareTaskService } from "@/services/care-task-service";
import { VaccinationService } from "@/services/vaccination-service";
import type { CareTask, TaskCompletion, Vaccination } from "@/types/database";

export function HomeDashboard() {
  const { profile } = useUser();
  const { selectedPet, selectedPetId } = usePet();
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealOpen, setMealOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [medOpen, setMedOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const careService = new CareTaskService(supabase);
      const vaxService = new VaccinationService(supabase);
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const [taskList, completionList, vaxList] = await Promise.all([
        careService.list(selectedPetId),
        careService.listCompletions(selectedPetId, since.toISOString()),
        vaxService.list(selectedPetId),
      ]);
      setTasks(taskList);
      setCompletions(completionList);
      setVaccinations(vaxList);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const todayTasks = useMemo(
    () => getTodaysCareTasks(tasks, completions),
    [tasks, completions]
  );
  const completionPercent = useMemo(
    () => weeklyCareCompletionPercent(tasks, completions),
    [tasks, completions]
  );

  const upcomingVax = vaccinations.filter(
    (v) => v.status !== "completed" && (isVaccinationDueSoon(v) || v.status === "overdue")
  );

  async function completeTask(task: CareTask) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");
      const service = new CareTaskService(supabase);
      await service.complete(task, user.id);
      toast.success("Nice! Task marked complete.");
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (!selectedPet) {
    return (
      <EmptyState
        title="No pets yet"
        description="Let's set up your first pet profile."
        action={{ label: "Get started", onClick: () => (window.location.href = "/get-started") }}
      />
    );
  }

  if (loading) return <LoadingState message={`Loading ${selectedPet.name}'s dashboard…`} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            {greetingForNow(firstName)} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s how {selectedPet.name} is doing today.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{selectedPet.species === "dog" ? "🐶" : "🐱"}</div>
          <div>
            <p className="font-semibold">{selectedPet.name}</p>
            <p className="text-sm text-muted-foreground">
              {[
                selectedPet.breed,
                calculatePetAge(selectedPet).label,
                selectedPet.weight_kg != null ? `${selectedPet.weight_kg} kg` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      </Card>

      <DietDashboardCard />

      <Card className="rounded-2xl border-none bg-primary text-primary-foreground shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium opacity-90">Care completion this week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{completionPercent}%</span>
            <span className="mb-1 text-sm opacity-80">
              {completionPercent >= 80 ? "You're on a roll!" : "Keep going — every bit helps."}
            </span>
          </div>
          <Progress value={completionPercent} className="mt-3 h-2 bg-primary-foreground/20" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today's care</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks scheduled for today. Enjoy the calm!</p>
          ) : (
            todayTasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3 cursor-pointer"
              >
                <Checkbox
                  checked={task.completed}
                  disabled={task.completed}
                  onCheckedChange={() => !task.completed && void completeTask(task)}
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  {task.scheduled_time && (
                    <p className="text-xs text-muted-foreground">{task.scheduled_time.slice(0, 5)}</p>
                  )}
                </div>
              </label>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Coming up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingVax.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vaccinations due soon.</p>
          ) : (
            upcomingVax.slice(0, 3).map((v) => {
              const days = daysUntilVaccination(v.next_due_date);
              return (
                <div key={v.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {days === 0 ? "Due today" : days != null && days < 0 ? "Overdue" : `Due in ${days} days`}
                    </p>
                  </div>
                  <Badge variant={v.status === "overdue" ? "destructive" : "secondary"}>
                    {v.status === "overdue" ? "Overdue" : "Due soon"}
                  </Badge>
                </div>
              );
            })
          )}
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
            <div>
              <p className="text-sm font-medium">Monthly weight check</p>
              <p className="text-xs text-muted-foreground">Stay on top of trends</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setWeightOpen(true)} className="rounded-lg">
              Log
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Button variant="secondary" className="h-auto flex-col gap-2 rounded-2xl py-4" onClick={() => setMealOpen(true)}>
            <Utensils className="h-5 w-5 text-accent" />
            Log meal
          </Button>
          <Button asChild variant="secondary" className="h-auto flex-col gap-2 rounded-2xl py-4">
            <Link href="/health/diet">
              <Salad className="h-5 w-5 text-primary" />
              Diet plan
            </Link>
          </Button>
          <Button variant="secondary" className="h-auto flex-col gap-2 rounded-2xl py-4" onClick={() => setWeightOpen(true)}>
            <Scale className="h-5 w-5 text-primary" />
            Add weight
          </Button>
          <Button variant="secondary" className="h-auto flex-col gap-2 rounded-2xl py-4" onClick={() => setMedOpen(true)}>
            <Pill className="h-5 w-5 text-primary" />
            Medication
          </Button>
          <Button variant="secondary" className="h-auto flex-col gap-2 rounded-2xl py-4" onClick={() => setRecordOpen(true)}>
            <FileText className="h-5 w-5 text-accent" />
            Health record
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-accent/30 bg-gradient-to-br from-accent/10 to-secondary shadow-sm">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Ask {brand.name} AI</p>
            <p className="text-sm text-muted-foreground">
              Wondering about {selectedPet.name}'s care? I'm here to help.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/ai">Chat</Link>
          </Button>
        </CardContent>
      </Card>

      {selectedPetId && (
        <>
          <LogMealDialog petId={selectedPetId} open={mealOpen} onOpenChange={setMealOpen} onSuccess={loadData} defaultUnit={selectedPet.food_unit} />
          <AddWeightDialog petId={selectedPetId} open={weightOpen} onOpenChange={setWeightOpen} onSuccess={loadData} />
          <AddMedicationDialog petId={selectedPetId} petName={selectedPet.name} open={medOpen} onOpenChange={setMedOpen} onSuccess={loadData} />
          <AddRecordDialog petId={selectedPetId} open={recordOpen} onOpenChange={setRecordOpen} onSuccess={loadData} />
        </>
      )}
    </div>
  );
}
