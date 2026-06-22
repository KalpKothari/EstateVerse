import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { sendMessage } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/messages")({
  head: () => ({ meta: [{ title: "Messages — EstateVerse" }] }),
  component: MessagesPage,
});

type Conv = {
  id: string;
  property_id: string;
  buyer_id: string;
  owner_id: string;
  last_message_at: string;
  propTitle?: string | null;
  propCity?: string | null;
  buyerName?: string | null;
  ownerName?: string | null;
};

async function loadConversations(userId: string): Promise<Conv[]> {
  const { data } = await supabase
    .from("conversations")
    .select("id,property_id,buyer_id,owner_id,last_message_at")
    .or(`buyer_id.eq.${userId},owner_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  const convs = data ?? [];
  if (!convs.length) return [];
  const propIds = Array.from(new Set(convs.map((c) => c.property_id)));
  const userIds = Array.from(new Set(convs.flatMap((c) => [c.buyer_id, c.owner_id])));
  const [{ data: props }, { data: profs }] = await Promise.all([
    supabase.from("properties").select("id,title,city").in("id", propIds),
    supabase.from("profiles").select("id,full_name").in("id", userIds),
  ]);
  const propMap = Object.fromEntries((props ?? []).map((p) => [p.id, p]));
  const profMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
  return convs.map((c) => ({
    ...c,
    propTitle: propMap[c.property_id]?.title ?? null,
    propCity: propMap[c.property_id]?.city ?? null,
    buyerName: profMap[c.buyer_id]?.full_name ?? null,
    ownerName: profMap[c.owner_id]?.full_name ?? null,
  }));
}

function MessagesPage() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => loadConversations(user!.id),
    enabled: !!user,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Messages</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Your conversations</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">No messages yet</h2>
          <p className="mt-2 text-muted-foreground">Start a conversation from any property page.</p>
        </div>
      ) : (
        <div className="grid gap-4 rounded-3xl border border-border bg-card overflow-hidden md:grid-cols-[300px_1fr] min-h-[600px]">
          <aside className="border-r border-border bg-background overflow-y-auto max-h-[600px]">
            {conversations.map((c) => {
              const isBuyer = c.buyer_id === user?.id;
              const otherName = isBuyer ? c.ownerName : c.buyerName;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full border-b border-border p-4 text-left hover:bg-accent transition-colors ${activeId === c.id ? "bg-primary-soft" : ""}`}
                >
                  <div className="font-semibold truncate">{otherName ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{c.propTitle ?? "Property"} · {c.propCity}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{new Date(c.last_message_at).toLocaleDateString()}</div>
                </button>
              );
            })}
          </aside>

          {active ? <ChatPanel conv={active} key={active.id} /> : <div className="grid place-items-center text-muted-foreground">Select a conversation</div>}
        </div>
      )}
    </div>
  );
}

function ChatPanel({ conv }: { conv: Conv }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conv.id],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("id,sender_id,body,created_at").eq("conversation_id", conv.id).order("created_at", { ascending: true });
      return data ?? [];
    },
    refetchInterval: 3000,
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const isBuyer = conv.buyer_id === user?.id;
  const otherName = isBuyer ? conv.ownerName : conv.buyerName;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setBusy(true);
    try {
      await sendMessage(conv.id, user.id, text.trim());
      setText("");
      qc.invalidateQueries({ queryKey: ["messages", conv.id] });
      qc.invalidateQueries({ queryKey: ["conversations", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col max-h-[600px]">
      <header className="flex items-center gap-3 border-b border-border bg-primary p-4 text-primary-foreground">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-gold-foreground font-semibold">
          {(otherName ?? "U").slice(0,2).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="truncate font-display text-lg font-semibold">{otherName ?? "Unknown"}</div>
          <div className="truncate text-xs opacity-80">{conv.propTitle} · {conv.propCity}</div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto bg-background p-4 space-y-2">
        {messages.map((m) => {
          const mine = user && m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-card p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message…" className="flex-1 rounded-full bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        <Button type="submit" disabled={busy || !text.trim()} className="h-11 w-11 rounded-full bg-primary p-0 text-primary-foreground hover:bg-primary/90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
