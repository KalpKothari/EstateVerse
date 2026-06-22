import { useEffect, useRef, useState } from "react";
import { Send, X, MessageSquare } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { openOrCreateConversation, sendMessage } from "@/lib/chat";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function MessageDialog({
  open,
  onOpenChange,
  propertyId,
  ownerId,
  ownerName,
  propertyTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  ownerId: string;
  ownerName?: string;
  propertyTitle?: string;
}) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    openOrCreateConversation(propertyId, user.id, ownerId)
      .then(setConversationId)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not open chat"));
  }, [open, user, propertyId, ownerId]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data } = await supabase
        .from("messages")
        .select("id,sender_id,body,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!conversationId && open,
    refetchInterval: open ? 3000 : false,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !conversationId || !text.trim()) return;
    setBusy(true);
    try {
      await sendMessage(conversationId, user.id, text.trim());
      setText("");
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-end p-4 sm:place-items-center" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lift sm:h-[600px]">
        <header className="flex items-center gap-3 border-b border-border bg-primary p-4 text-primary-foreground">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-gold-foreground"><MessageSquare className="h-5 w-5" /></span>
          <div className="flex-1 min-w-0">
            <div className="truncate font-display text-lg font-semibold">{ownerName ?? "Owner"}</div>
            <div className="truncate text-xs opacity-80">{propertyTitle ?? "Property chat"}</div>
          </div>
          <button onClick={() => onOpenChange(false)} className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex-1 overflow-y-auto bg-background p-4 space-y-2">
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div>
                <MessageSquare className="mx-auto mb-2 h-6 w-6 text-primary/40" />
                Start the conversation. Owners typically reply within a few hours.
              </div>
            </div>
          ) : messages.map((m) => {
            const mine = user && m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                  <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-card p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 rounded-full bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="submit" disabled={busy || !text.trim()} className="h-11 w-11 rounded-full bg-primary p-0 text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
