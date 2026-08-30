import Link from "next/link";
import {
  Activity,
  Calendar,
  FileText,
  Pill,
  Scale,
  Shield,
  Stethoscope,
  Utensils,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  { href: "/health/diet", label: "Diet plan", description: "Personalized feeding guidance", icon: Utensils },
  { href: "/health/weight", label: "Weight", description: "Track trends over time", icon: Scale },
  { href: "/health/vaccinations", label: "Vaccinations", description: "Due dates & history", icon: Shield },
  { href: "/health/medications", label: "Medications", description: "Active & past meds", icon: Pill },
  { href: "/health/nutrition", label: "Nutrition", description: "Meals & daily targets", icon: Utensils },
  { href: "/health/records", label: "Health records", description: "Vet visits & documents", icon: FileText },
  { href: "/health/symptoms", label: "Symptoms", description: "Log & resolve symptoms", icon: Stethoscope },
  { href: "/health/timeline", label: "Timeline", description: "Everything in one view", icon: Calendar },
];

export default function HealthPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Health</h1>
        <p className="text-sm text-muted-foreground">
          Everything about your pet's wellbeing, in one place.
        </p>
      </div>
      <div className="grid gap-3">
        {sections.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="rounded-2xl shadow-sm transition-colors hover:bg-secondary/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
