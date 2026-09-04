"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string;
  describedBy?: string;
  showRequirements?: boolean;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  error,
  describedBy,
  showRequirements = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const tooShort = value.length > 0 && value.length < 8;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 rounded-xl pr-12"
          aria-invalid={Boolean(error || tooShort)}
          aria-describedby={[error ? errorId : null, showRequirements ? helpId : null, describedBy]
            .filter(Boolean)
            .join(" ") || undefined}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 min-h-11 min-w-11 -translate-y-1/2"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </Button>
      </div>
      {showRequirements ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          Use at least 8 characters. A longer passphrase is stronger than a short complex password.
        </p>
      ) : null}
      {tooShort && !error ? (
        <p className="text-sm text-destructive" role="alert">
          Password is too short.
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
