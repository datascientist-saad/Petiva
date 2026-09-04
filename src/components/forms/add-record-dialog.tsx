"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { medicalRecordSchema } from "@/lib/validations";
import { HealthRecordService } from "@/services/health-record-service";
import type { MedicalRecordType } from "@/types/database";

interface AddRecordDialogProps {
  petId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RECORD_TYPES: { value: MedicalRecordType; label: string }[] = [
  { value: "vet_visit", label: "Vet visit" },
  { value: "blood_test", label: "Blood test" },
  { value: "prescription", label: "Prescription" },
  { value: "vaccination_certificate", label: "Vaccination certificate" },
  { value: "lab_result", label: "Lab result" },
  { value: "other", label: "Other" },
];

export function AddRecordDialog({ petId, open, onOpenChange, onSuccess }: AddRecordDialogProps) {
  const [title, setTitle] = useState("");
  const [recordType, setRecordType] = useState<MedicalRecordType>("vet_visit");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [clinic, setClinic] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = medicalRecordSchema.safeParse({
      title,
      record_type: recordType,
      record_date: recordDate,
      clinic: clinic || null,
      notes: notes || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to add records.");

      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;

      if (file) {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        if (!allowed.includes(file.type)) {
          toast.error("Please upload a PDF, JPG, or PNG file.");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Please choose a file smaller than 10 MB.");
          return;
        }
        const path = `${user.id}/${petId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("medical-files")
          .upload(path, file);
        if (uploadError) throw uploadError;
        attachmentUrl = path;
        attachmentName = file.name;
      }

      const service = new HealthRecordService(supabase);
      await service.create(petId, user.id, {
        ...parsed.data,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      });

      toast.success("Health record saved safely.");
      setTitle("");
      setClinic("");
      setNotes("");
      setFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add health record</DialogTitle>
          <DialogDescription>Keep vet visits and documents in one place.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="record_title">Title</Label>
            <Input
              id="record_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Annual checkup"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={recordType} onValueChange={(v) => setRecordType(v as MedicalRecordType)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="record_date">Date</Label>
              <Input
                id="record_date"
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="record_clinic">Clinic (optional)</Label>
            <Input
              id="record_clinic"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              placeholder="Happy Paws Veterinary"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="record_file">Attachment (PDF, JPG, PNG)</Label>
            <Input
              id="record_file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="record_notes">Notes (optional)</Label>
            <Textarea
              id="record_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "Saving…" : "Save record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
