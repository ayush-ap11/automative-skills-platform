"use server";

import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function markAsRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);

  if (error) {
    return { error: error.message || "Failed to update notification." };
  }

  return { success: true };
}

export async function markAllAsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { error: error.message || "Failed to mark all as read." };
  }

  return { success: true };
}
