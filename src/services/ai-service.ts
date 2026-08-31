import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { brand } from "@/lib/brand";
import { AppError } from "@/lib/errors";
import { calculatePetAge, getActiveMedications } from "@/lib/calculations";
import type { Allergy, Condition, Medication, Pet, Symptom, Vaccination } from "@/types/database";

const SYSTEM_PROMPT = `You are ${brand.name} AI, a pet-care information assistant.

You have access to the pet profile supplied in context.
Use that information to make answers relevant.
You provide educational information only.
You do not diagnose diseases.
You do not prescribe drugs.
You do not invent medication dosages.
If symptoms could represent an emergency, advise contacting a veterinarian immediately.
Ask concise follow-up questions where useful.
Use friendly, reassuring but factual language.
Make a distinction between:
* safe to monitor
* veterinary appointment recommended
* potentially urgent
Always explain why.

Always remind users that ${brand.name} AI provides general pet-care information and does not replace a veterinarian.
Never claim to diagnose conditions.
Do not provide medication dosages unless the medication information came directly from a veterinarian-recorded prescription in the provided context.`;

const EMERGENCY_PATTERNS = [
  /difficult(y)? breathing/i,
  /can'?t breathe/i,
  /open.?mouth breathing/i,
  /tail bobbing/i,
  /collapse/i,
  /seizure/i,
  /severe bleeding/i,
  /active bleeding/i,
  /poison(ing|ed)?/i,
  /unable to (pee|urinate)/i,
  /can'?t urinate/i,
  /major trauma/i,
  /hit by (a )?car/i,
  /extreme lethargy/i,
  /unresponsive/i,
  /persistent vomiting/i,
  /bloated (belly|abdomen)/i,
  /weak grip/i,
  /egg binding/i,
  /refus(e|al) to eat/i,
  /not eating for/i,
  /severe balance/i,
  /sudden weight loss/i,
];

export interface PetAiContext {
  pet: Pet;
  conditions: Condition[];
  allergies: Allergy[];
  medications: Medication[];
  symptoms: Symptom[];
  vaccinations: Vaccination[];
}

export function buildPetContextSummary(ctx: PetAiContext): string {
  const age = calculatePetAge(ctx.pet);
  const activeMeds = getActiveMedications(ctx.medications);
  const activeSymptoms = ctx.symptoms.filter((s) => s.status === "active").slice(0, 5);
  const upcomingVax = ctx.vaccinations
    .filter((v) => v.status !== "completed" && v.next_due_date)
    .slice(0, 5);

  return [
    `Name: ${ctx.pet.name}`,
    `Species: ${ctx.pet.species}`,
    `Breed: ${ctx.pet.breed ?? "unknown"}`,
    `Age: ${age.label}`,
    `Sex: ${ctx.pet.sex ?? "unknown"}`,
    `Weight: ${ctx.pet.weight_kg != null ? `${ctx.pet.weight_kg} kg` : "unknown"}`,
    `Activity: ${ctx.pet.activity_level ?? "unknown"}`,
    `Neutered/spayed: ${ctx.pet.neutered}`,
    `Conditions: ${ctx.conditions.map((c) => c.name).join(", ") || "none recorded"}`,
    `Allergies: ${ctx.allergies.map((a) => a.name).join(", ") || "none recorded"}`,
    `Active medications: ${
      activeMeds.map((m) => `${m.name} (${m.dose} ${m.unit}, ${m.frequency})`).join("; ") || "none"
    }`,
    `Recent/active symptoms: ${
      activeSymptoms.map((s) => `${s.symptom} (${s.severity})`).join("; ") || "none"
    }`,
    `Upcoming vaccinations: ${
      upcomingVax.map((v) => `${v.name} due ${v.next_due_date}`).join("; ") || "none recorded"
    }`,
  ].join("\n");
}

function detectEmergency(message: string): boolean {
  return EMERGENCY_PATTERNS.some((re) => re.test(message));
}

function answerFromData(message: string, ctx: PetAiContext): string | null {
  const q = message.toLowerCase();
  const age = calculatePetAge(ctx.pet);

  if (/weight/.test(q) && /(chang|current|how much|what)/.test(q)) {
    return ctx.pet.weight_kg != null
      ? `${ctx.pet.name}'s most recently recorded weight is ${ctx.pet.weight_kg} kg. Weight changes can have many causes — track trends and talk with your veterinarian if you notice sudden shifts. ${brand.name} AI provides general information and does not replace veterinary care.`
      : `I don't see a weight recorded for ${ctx.pet.name} yet. You can add one from Health → Weight.`;
  }

  if (/vaccin/.test(q) && /(next|when|upcoming)/.test(q)) {
    const upcoming = ctx.vaccinations
      .filter((v) => v.next_due_date && v.status !== "completed")
      .sort((a, b) => String(a.next_due_date).localeCompare(String(b.next_due_date)))[0];
    if (!upcoming) {
      return `${ctx.pet.name} doesn't have an upcoming vaccination date recorded yet. You can add vaccination records under Health → Vaccinations.`;
    }
    return `${ctx.pet.name}'s next recorded vaccination is ${upcoming.name}${
      upcoming.next_due_date ? ` on ${upcoming.next_due_date}` : ""
    }. This is based on what you've logged in ${brand.name} — confirm timing with your veterinarian.`;
  }

  if (/vaccin/.test(q) && /(recorded|have|list|what)/.test(q)) {
    if (!ctx.vaccinations.length) {
      return `No vaccinations are recorded for ${ctx.pet.name} yet.`;
    }
    const list = ctx.vaccinations
      .slice(0, 8)
      .map((v) => `• ${v.name}${v.administered_date ? ` (given ${v.administered_date})` : ""}${v.next_due_date ? `, next due ${v.next_due_date}` : ""}`)
      .join("\n");
    return `Here are the vaccinations recorded for ${ctx.pet.name}:\n${list}`;
  }

  if (/medication|medicine|taking|on meds/.test(q)) {
    const active = getActiveMedications(ctx.medications);
    if (!active.length) return `${ctx.pet.name} has no active medications recorded.`;
    const list = active
      .map((m) => `• ${m.name}: ${m.dose} ${m.unit}, ${m.frequency}`)
      .join("\n");
    return `${ctx.pet.name}'s active medications (as recorded by you):\n${list}\n\nAlways follow your veterinarian's instructions for dosing.`;
  }

  if (/how old|age/.test(q)) {
    return `${ctx.pet.name} is ${age.label} old based on the profile you provided.`;
  }

  if (/breed|species|what kind/.test(q)) {
    return `${ctx.pet.name} is a ${ctx.pet.species}${ctx.pet.breed ? ` (${ctx.pet.breed})` : ""}.`;
  }

  return null;
}

function fallbackResponse(message: string, ctx: PetAiContext): string {
  const factual = answerFromData(message, ctx);
  if (factual) return factual;

  const emergency = detectEmergency(message);
  const preface = emergency
    ? `⚠️ This could require urgent veterinary care. Please contact a veterinarian or emergency clinic.\n\n`
    : "";

  return (
    preface +
    `Thanks for asking about ${ctx.pet.name}. Based on the profile I have, ${ctx.pet.name} is a ${
      ctx.pet.species
    }${ctx.pet.breed ? ` (${ctx.pet.breed})` : ""}.` +
    `\n\nI can help with general care guidance using the information you've recorded — weight, vaccines, medications, meals, and symptoms.` +
    `\n\n${brand.name} AI provides general pet-care information and does not replace a veterinarian. If ${ctx.pet.name} seems unwell, contact your vet.` +
    `\n\nCould you share a bit more detail about what you'd like help with?`
  );
}

export class AIService {
  constructor(private supabase: SupabaseClient) {}

  async getDailyUsage(userId: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await this.supabase
      .from("ai_usage")
      .select("message_count")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .maybeSingle();
    return data?.message_count ?? 0;
  }

  async incrementUsage(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const current = await this.getDailyUsage(userId);
    const { error } = await this.supabase.from("ai_usage").upsert(
      {
        user_id: userId,
        usage_date: today,
        message_count: current + 1,
      },
      { onConflict: "user_id,usage_date" }
    );
    if (error) throw new AppError("Could not update AI usage.", { cause: error });
  }

  async ensureConversation(userId: string, petId: string, conversationId?: string | null) {
    if (conversationId) {
      const { data } = await this.supabase
        .from("ai_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();
      if (data) return data;
    }
    const { data, error } = await this.supabase
      .from("ai_conversations")
      .insert({ user_id: userId, pet_id: petId })
      .select("*")
      .single();
    if (error) throw new AppError("Could not start conversation.", { cause: error });
    return data;
  }

  async listMessages(conversationId: string) {
    const { data, error } = await this.supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new AppError("Could not load messages.", { cause: error });
    return data ?? [];
  }

  async chat(params: {
    userId: string;
    petId: string;
    message: string;
    conversationId?: string | null;
    context: PetAiContext;
  }) {
    const limit = Number(process.env.AI_DAILY_MESSAGE_LIMIT ?? 20);
    const used = await this.getDailyUsage(params.userId);
    if (used >= limit) {
      throw new AppError(
        `You've reached today's AI message limit (${limit}). Please try again tomorrow.`,
        { code: "AI_LIMIT", status: 429 }
      );
    }

    const conversation = await this.ensureConversation(
      params.userId,
      params.petId,
      params.conversationId
    );

    await this.supabase.from("ai_messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: params.message.slice(0, 2000),
    });

    const emergency = detectEmergency(params.message);
    let reply = "";

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const openai = new OpenAI({ apiKey });
        const summary = buildPetContextSummary(params.context);
        const history = (await this.listMessages(conversation.id)).slice(-8);
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 700,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "system",
              content: `Pet context:\n${summary}${
                emergency
                  ? "\n\nThe user's message may indicate an emergency. Lead with an urgent care warning."
                  : ""
              }`,
            },
            ...history.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
        });
        reply =
          completion.choices[0]?.message?.content?.trim() ||
          fallbackResponse(params.message, params.context);
      } catch (error) {
        console.error("[AIService] OpenAI failed, using fallback", error);
        reply = fallbackResponse(params.message, params.context);
      }
    } else {
      reply = fallbackResponse(params.message, params.context);
    }

    if (emergency && !reply.includes("urgent veterinary")) {
      reply =
        "⚠️ This could require urgent veterinary care. Please contact a veterinarian or emergency clinic.\n\n" +
        reply;
    }

    await this.supabase.from("ai_messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: reply,
    });
    await this.incrementUsage(params.userId);

    return {
      conversationId: conversation.id as string,
      reply,
      emergency,
    };
  }
}
