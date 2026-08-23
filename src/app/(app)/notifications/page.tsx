"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { NotificationService } from "@/services/notification-service";
import type { AppNotification } from "@/types/database";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");
      const service = new NotificationService(supabase);
      setNotifications(await service.list(user.id));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function markAllRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const service = new NotificationService(supabase);
      await service.markAllRead(user.id);
      toast.success("All caught up!");
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function markRead(id: string) {
    try {
      const service = new NotificationService(supabase);
      await service.markRead(id);
      void loadData();
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay on top of care reminders</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-xl">
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : notifications.length === 0 ? (
        <EmptyState title="All quiet here" description="We'll let you know when something needs your attention." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`rounded-2xl cursor-pointer transition-colors ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}
              onClick={() => void markRead(n.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent mt-2" />}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
