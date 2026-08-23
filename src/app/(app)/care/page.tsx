"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddCareTaskDialog } from "@/components/forms/add-care-task-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { usePet } from "@/contexts/pet-context";
import { getTodaysCareTasks } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { CareTaskService } from "@/services/care-task-service";
import type { CareCategory, CareTask, TaskCompletion } from "@/types/database";

const CATEGORY_LABELS: Record<CareCategory, string> = {
  food: "Food",
  medication: "Medication",
  vaccination: "Vaccination",
  weight: "Weight",
  grooming: "Grooming",
  activity: "Activity",
  vet: "Vet",
  custom: "Custom",
};

export default function CarePage() {
  const { selectedPet, selectedPetId } = usePet();
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const service = new CareTaskService(supabase);
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const [taskList, completionList] = await Promise.all([
        service.list(selectedPetId),
        service.listCompletions(selectedPetId, since.toISOString()),
      ]);
      setTasks(taskList);
      setCompletions(completionList);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const byCategory = useMemo(() => {
    const map = new Map<CareCategory, CareTask[]>();
    for (const task of tasks) {
      const list = map.get(task.category) ?? [];
      list.push(task);
      map.set(task.category, list);
    }
    return map;
  }, [tasks]);

  const todayTasks = useMemo(() => getTodaysCareTasks(tasks, completions), [tasks, completions]);

  async function completeTask(task: CareTask) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");
      const service = new CareTaskService(supabase);
      await service.complete(task, user.id);
      toast.success("Done! Great job taking care of your pet.");
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  if (!selectedPet) {
    return <EmptyState title="Select a pet" description="Choose a pet to view care tasks." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Care plan</h1>
          <p className="text-sm text-muted-foreground">{selectedPet.name}'s daily routines</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl">Add task</Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No care tasks yet"
          description="Build a routine that works for you and your pet."
          action={{ label: "Add task", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Today's tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayTasks.map((task) => (
                <label key={task.id} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3 cursor-pointer">
                  <Checkbox
                    checked={task.completed}
                    disabled={task.completed}
                    onCheckedChange={() => !task.completed && void completeTask(task)}
                  />
                  <span className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          {Array.from(byCategory.entries()).map(([category, categoryTasks]) => (
            <Card key={category} className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {CATEGORY_LABELS[category]}
                  <Badge variant="secondary">{categoryTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categoryTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{task.frequency}</p>
                    </div>
                    {task.scheduled_time && (
                      <span className="text-xs text-muted-foreground">{task.scheduled_time.slice(0, 5)}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {selectedPetId && (
        <AddCareTaskDialog petId={selectedPetId} open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={loadData} />
      )}
    </div>
  );
}
