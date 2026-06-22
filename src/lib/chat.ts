import { supabase } from "@/integrations/supabase/client";

export async function openOrCreateConversation(propertyId: string, buyerId: string, ownerId: string): Promise<string> {
  if (buyerId === ownerId) throw new Error("You can't message yourself on your own listing.");
  const { data: existing, error: selErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("property_id", propertyId)
    .eq("buyer_id", buyerId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ property_id: propertyId, buyer_id: buyerId, owner_id: ownerId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("id")
    .single();
  if (error) {
    console.error("sendMessage error", error);
    throw new Error(error.message || "Could not send message");
  }
  return data;
}
