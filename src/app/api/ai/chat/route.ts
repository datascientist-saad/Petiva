import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { toUserMessage } from "@/lib/errors";
import { aiMessageSchema } from "@/lib/validations";
import { AIService } from "@/services/ai-service";
import { AnalyticsService } from "@/services/notification-service";
import { MedicationService } from "@/services/medication-service";
import { PetService } from "@/services/pet-service";
import { VaccinationService } from "@/services/vaccination-service";
import { SymptomService } from "@/services/health-record-service";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = aiMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { petId, message, conversationId } = parsed.data;
    const petService = new PetService(supabase);
    const pet = await petService.getById(petId);
    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const [medications, symptoms, vaccinations] = await Promise.all([
      new MedicationService(supabase).list(petId),
      new SymptomService(supabase).list(petId),
      new VaccinationService(supabase).list(petId),
    ]);

    const aiService = new AIService(supabase);
    const result = await aiService.chat({
      userId: user.id,
      petId,
      message,
      conversationId,
      context: {
        pet,
        conditions: pet.conditions,
        allergies: pet.allergies,
        medications,
        symptoms,
        vaccinations,
      },
    });

    const analytics = new AnalyticsService(supabase);
    await analytics.track("ai_message_sent", user.id, petId, {
      conversationId: result.conversationId,
      emergency: result.emergency,
    });

    return NextResponse.json({
      conversationId: result.conversationId,
      reply: result.reply,
      emergency: result.emergency,
    });
  } catch (error) {
    const message = toUserMessage(error);
    const status = error instanceof Error && "status" in error ? (error as { status: number }).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
