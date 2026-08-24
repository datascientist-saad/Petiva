"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PetSelector } from "@/components/pets/pet-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState, LoadingState } from "@/components/shared/page-states";
import { brand } from "@/lib/brand";
import { usePet } from "@/contexts/pet-context";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiPage() {
  const { selectedPet, loading: petLoading } = usePet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions = selectedPet
    ? [
        `What vaccinations does ${selectedPet.name} have?`,
        `How much does ${selectedPet.name} weigh?`,
        `What medications is ${selectedPet.name} on?`,
        `Is ${selectedPet.name}'s limping something to worry about?`,
      ]
    : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || !selectedPet || sending) return;
    const userMsg = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: selectedPet.id,
          message: userMsg,
          conversationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send message.");
    } finally {
      setSending(false);
    }
  }

  if (petLoading) return <LoadingState message="Loading AI assistant…" />;

  if (!selectedPet) {
    return <EmptyState title="Add a pet first" description={`${brand.name} AI needs a pet profile to give helpful answers.`} />;
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            {brand.name} AI
          </h1>
          <p className="text-sm text-muted-foreground">Ask about {selectedPet.name}'s care</p>
        </div>
        <PetSelector />
      </div>

      <Card className="rounded-2xl border-warning/30 bg-warning/10">
        <CardContent className="p-3 text-xs text-muted-foreground">
          {brand.name} AI shares general pet-care information and does not replace your veterinarian. For emergencies, contact a vet immediately.
        </CardContent>
      </Card>

      <ScrollArea className="flex-1 rounded-2xl border bg-card p-4">
        {messages.length === 0 ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-muted-foreground">Hi! I'm here to help with questions about {selectedPet.name}.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  variant="secondary"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => void sendMessage(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${selectedPet.name}…`}
          className="rounded-xl"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !input.trim()} className="rounded-xl shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
