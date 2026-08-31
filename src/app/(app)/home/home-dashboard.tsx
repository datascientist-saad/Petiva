"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { brand } from "@/lib/brand";
import {
  AlertTriangle,
  Droplets,
  FileText,
  Home,
  MessageCircle,
  Moon,
  Pill,
  Scale,
  Utensils,
  Wind,
} from "lucide-react";
import { toast } from "sonner";
import { DietDashboardCard } from "@/components/diet/diet-dashboard-card";
import { DietCheckInDialog } from "@/components/forms/diet-check-in-dialog";
import { AddMedicationDialog } from "@/components/forms/add-medication-dialog";
import { AddRecordDialog } from "@/components/forms/add-record-dialog";
import { AddWeightDialog } from "@/components/forms/add-weight-dialog";
import { LogMealDialog } from "@/components/forms/log-meal-dialog";
import { PetAvatar } from "@/components/pets/pet-avatar";
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
  getActiveMedications,
  getTodaysCareTasks,
  isVaccinationDueSoon,
  weeklyCareCompletionPercent,
} from "@/lib/calculations";
import { getSpeciesDefinition } from "@/lib/species/registry";
import { formatPetWeight, weightTrendLabel } from "@/lib/units/weight";
import { evaluateWellnessInsights, pickTopInsight } from "@/lib/wellness/insight-rules";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { greetingForNow } from "@/lib/utils";
import { CareTaskService } from "@/services/care-task-service";
import { DietCheckInService } from "@/services/diet-check-in-service";
import { DietPlanService } from "@/services/diet-plan-service";
import { MedicationService } from "@/services/medication-service";
import { VaccinationService } from "@/services/vaccination-service";
import { WeightService } from "@/services/nutrition-service";
import type { CareTask, DietPlan, TaskCompletion, Vaccination } from "@/types/database";

function todayCompletionPercent(tasks: CareTask[], completions: TaskCompletion[]): number {
  const today = getTodaysCareTasks(tasks, completions);
  if (!today.length) return 100;
  const done = today.filter((t) => t.completed).length;
  return Math.round((done / today.length) * 100);
}

function insightBadgeVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "emergency" || severity === "vet_review") return "destructive";
  if (severity === "attention") return "secondary";
  return "outline";
}

export function HomeDashboard() {
  const { profile } = useUser();
  const { selectedPet, selectedPetId } = usePet();
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [medications, setMedications] = useState<Awaited<ReturnType<MedicationService["list"]>>>([]);
  const [weightRecords, setWeightRecords] = useState<Awaited<ReturnType<WeightService["list"]>>>([]);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [checkInDue, setCheckInDue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealOpen, setMealOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [medOpen, setMedOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

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
      const medService = new MedicationService(supabase);
      const weightService = new WeightService(supabase);
      const dietService = new DietPlanService(supabase);
      const checkInService = new DietCheckInService(supabase);
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const [taskList, completionList, vaxList, medList, weights, plan, daysSinceCheckIn] =
        await Promise.all([
          careService.list(selectedPetId),
          careService.listCompletions(selectedPetId, since.toISOString()),
          vaxService.list(selectedPetId),
          medService.list(selectedPetId),
          weightService.list(selectedPetId),
          dietService.getCurrent(selectedPetId),
          checkInService.daysSinceLastCheckIn(selectedPetId),
        ]);
      setTasks(taskList);
      setCompletions(completionList);
      setVaccinations(vaxList);
      setMedications(medList);
      setWeightRecords(weights);
      setDietPlan(plan);
      setCheckInDue(daysSinceCheckIn === null || daysSinceCheckIn >= 7);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const speciesDef = selectedPet ? getSpeciesDefinition(selectedPet.species) : null;
  const todayTasks = useMemo(
    () => getTodaysCareTasks(tasks, completions),
    [tasks, completions]
  );
  const todayPercent = useMemo(
    () => todayCompletionPercent(tasks, completions),
    [tasks, completions]
  );
  const weeklyPercent = useMemo(
    () => weeklyCareCompletionPercent(tasks, completions),
    [tasks, completions]
  );
  const activeMeds = useMemo(() => getActiveMedications(medications), [medications]);
  const weightTrend = useMemo(
    () => (selectedPet ? weightTrendLabel(selectedPet.species, weightRecords) : { current: null, change: null }),
    [selectedPet, weightRecords]
  );

  const topInsight = useMemo(() => {
    if (!selectedPet) return null;
    return pickTopInsight(
      evaluateWellnessInsights({
        pet: selectedPet,
        weightRecords,
        vaccinations,
        tasks,
        completions,
        dietPlan,
      })
    );
  }, [selectedPet, weightRecords, vaccinations, tasks, completions, dietPlan]);

  const upcomingVax = vaccinations.filter(
    (v) => v.status !== "completed" && (isVaccinationDueSoon(v) || v.status === "overdue")
  );

  const birdQuickItems = speciesDef?.features.habitat
    ? [
        { label: "Morning weight", icon: Scale, action: () => setWeightOpen(true) },
        { label: "Fresh food", icon: Utensils, action: () => setMealOpen(true) },
        { label: "Water change", icon: Droplets, href: "/care-plan" },
        { label: "Cage care", icon: Home, href: `/pets/${selectedPetId}/habitat` },
        { label: "Out-of-cage time", icon: Wind, href: "/care-plan" },
        { label: "Sleep review", icon: Moon, href: `/pets/${selectedPetId}/habitat` },
      ]
    : [];

  async function completeTask(task: CareTask) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");
      const service = new CareTaskService(supabase);
      await service.complete(task, user.id);
      toast.success("Task marked complete.");
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (!selectedPet) {
    return (
      <EmptyState
        title="No pets yet"
        description="Create a personalized care plan for your companion."
        action={{ label: "Get started", onClick: () => (window.location.href = "/") }}
      />
    );
  }

  if (loading) return <LoadingState message={`Loading ${selectedPet.name}'s dashboard…`} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const firstName = profile?.full_name?.split(" ")[0];
  const petWeight = formatPetWeight(selectedPet);

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {greetingForNow(firstName)}
        </h1>
        <p className="text-sm text-muted-foreground">{brand.tagline}</p>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <PetAvatar
            name={selectedPet.name}
            species={selectedPet.species}
            imageUrl={selectedPet.profile_image_url}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold">{selectedPet.name}</p>
              <Badge variant="outline" className="capitalize">
                {speciesDef?.displayName ?? selectedPet.species}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {[selectedPet.breed, calculatePetAge(selectedPet).label, petWeight]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="text-xs text-muted-foreground">
                Today <span className="font-semibold text-foreground">{todayPercent}%</span> complete
              </div>
              <div className="text-xs text-muted-foreground">
                This week <span className="font-semibold text-foreground">{weeklyPercent}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {topInsight ? (
        <Card className="rounded-2xl border-accent/30 bg-accent/5 shadow-sm">
          <CardContent className="flex gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">Important insight</p>
                <Badge variant={insightBadgeVariant(topInsight.severity)} className="text-[10px]">
                  {topInsight.severity.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm font-medium">{topInsight.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{topInsight.body}</p>
              {topInsight.requiresVetReview ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Consider contacting a veterinarian — Animivo does not diagnose.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Today</h2>

        {speciesDef?.features.habitat ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {birdQuickItems.map((item) => {
              const Icon = item.icon;
              if (item.href) {
                return (
                  <Button key={item.label} asChild variant="secondary" className="h-auto flex-col gap-1 rounded-2xl py-3 text-xs">
                    <Link href={item.href}>
                      <Icon className="size-4 text-primary" />
                      {item.label}
                    </Link>
                  </Button>
                );
              }
              return (
                <Button
                  key={item.label}
                  variant="secondary"
                  className="h-auto flex-col gap-1 rounded-2xl py-3 text-xs"
                  onClick={item.action}
                >
                  <Icon className="size-4 text-primary" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        ) : null}

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Care tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks scheduled for today.</p>
            ) : (
              todayTasks.map((task) => (
                <label
                  key={task.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-secondary/50 p-3"
                >
                  <Checkbox
                    checked={task.completed}
                    disabled={task.completed}
                    onCheckedChange={() => !task.completed && void completeTask(task)}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.title}
                    </p>
                    {task.scheduled_time ? (
                      <p className="text-xs text-muted-foreground">{task.scheduled_time.slice(0, 5)}</p>
                    ) : null}
                  </div>
                </label>
              ))
            )}
          </CardContent>
        </Card>

        {activeMeds.length > 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Pill className="size-4" />
                Medication today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeMeds.slice(0, 3).map((med) => (
                <div key={med.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {med.dose} {med.unit} · {med.frequency}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setMedOpen(true)}>
                    Log
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Nutrition</h2>
          {checkInDue ? (
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setCheckInOpen(true)}>
              Check-in due
            </Button>
          ) : null}
        </div>
        <DietDashboardCard />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Coming up</h2>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="space-y-2 p-4">
            {speciesDef?.features.vaccinations && upcomingVax.length > 0 ? (
              upcomingVax.slice(0, 2).map((v) => {
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
            ) : null}

            {dietPlan?.review_by ? (
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                <div>
                  <p className="text-sm font-medium">Diet plan review</p>
                  <p className="text-xs text-muted-foreground">By {dietPlan.review_by}</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setCheckInOpen(true)}>
                  Review
                </Button>
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
              <div>
                <p className="text-sm font-medium">
                  {speciesDef?.defaultWeightUnit === "g" ? "Morning weight check" : "Weight check"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {weightTrend.current ?? "No weight logged yet"}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setWeightOpen(true)}>
                Log
              </Button>
            </div>

            {selectedPetId ? (
              <Button asChild variant="secondary" className="w-full rounded-xl">
                <Link href={`/reports/${selectedPetId}`}>Veterinary report</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {weightTrend.current ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Weight trend</h2>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <p className="text-2xl font-semibold">{weightTrend.current}</p>
              {weightTrend.change ? (
                <p className="text-sm text-muted-foreground">{weightTrend.change}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Log again to see trends</p>
              )}
              <Progress value={weeklyPercent} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </section>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Button variant="secondary" className="h-auto flex-col gap-2 rounded-2xl py-4" onClick={() => setMealOpen(true)}>
            <Utensils className="h-5 w-5 text-accent" />
            Log meal
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
            <p className="font-medium">Ask {brand.aiName}</p>
            <p className="text-sm text-muted-foreground">
              Explain {selectedPet.name}&apos;s plan, care tasks, or recent records.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/ai">Chat</Link>
          </Button>
        </CardContent>
      </Card>

      {selectedPetId ? (
        <>
          <LogMealDialog
            petId={selectedPetId}
            open={mealOpen}
            onOpenChange={setMealOpen}
            onSuccess={loadData}
            defaultUnit={selectedPet.food_unit}
          />
          <AddWeightDialog petId={selectedPetId} open={weightOpen} onOpenChange={setWeightOpen} onSuccess={loadData} />
          <AddMedicationDialog
            petId={selectedPetId}
            petName={selectedPet.name}
            open={medOpen}
            onOpenChange={setMedOpen}
            onSuccess={loadData}
          />
          <AddRecordDialog petId={selectedPetId} open={recordOpen} onOpenChange={setRecordOpen} onSuccess={loadData} />
          <DietCheckInDialog pet={selectedPet} open={checkInOpen} onOpenChange={setCheckInOpen} onSuccess={loadData} />
        </>
      ) : null}
    </div>
  );
}
