"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { PetAvatar } from "@/components/pets/pet-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadPetPhoto } from "@/lib/pet-photo";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { PetService } from "@/services/pet-service";
import type { Species } from "@/types/database";

interface PetPhotoFieldProps {
  petId: string;
  name: string;
  species: Species;
  imageUrl?: string | null;
  onPhotoChange?: (url: string | null) => void;
  size?: "md" | "lg";
  disabled?: boolean;
}

export function PetPhotoField({
  petId,
  name,
  species,
  imageUrl,
  onPhotoChange,
  size = "lg",
  disabled = false,
}: PetPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const displayUrl = localPreview ?? imageUrl ?? null;

  async function handleFile(file: File | null) {
    if (!file || disabled) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");

      const url = await uploadPetPhoto(supabase, user.id, petId, file);
      const petService = new PetService(supabase);
      await petService.update(petId, { profile_image_url: url });
      onPhotoChange?.(url);
      toast.success("Photo updated!");
    } catch (err) {
      setLocalPreview(null);
      toast.error(toUserMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    if (disabled) return;
    setUploading(true);
    try {
      const petService = new PetService(supabase);
      await petService.update(petId, { profile_image_url: null });
      setLocalPreview(null);
      onPhotoChange?.(null);
      toast.success("Photo removed.");
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <PetAvatar name={name} species={species} imageUrl={displayUrl} size={size} />
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <Label>Profile photo</Label>
        <p className="text-xs text-muted-foreground">
          Optional. Without a photo, we&apos;ll show a species icon for {name}.
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-xl"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="mr-2 size-4" />
            {displayUrl ? "Change photo" : "Add photo"}
          </Button>
          {displayUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              disabled={disabled || uploading}
              onClick={() => void removePhoto()}
            >
              <X className="mr-2 size-4" />
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/** Local preview + picker before the pet exists (onboarding). */
export function PetPhotoPicker({
  name,
  species,
  file,
  onFileChange,
}: {
  name: string;
  species: Species;
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <PetAvatar name={name || "Pet"} species={species} imageUrl={preview} size="lg" />
      <div className="flex flex-col gap-2">
        <Label>Profile photo (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Add a photo now, or skip and we&apos;ll use a species icon.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-xl"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="mr-2 size-4" />
            {file ? "Change photo" : "Add photo"}
          </Button>
          {file ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => onFileChange(null)}
            >
              <X className="mr-2 size-4" />
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}
