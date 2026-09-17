"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export interface VaultActionResult {
  success: boolean;
  message: string;
}

type VaultItemInsert = Database["public"]["Tables"]["secure_vault_items"]["Insert"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function encodeSecret(secret: string) {
  return Buffer.from(secret, "utf8").toString("base64");
}

export async function createVaultItem(
  formData: FormData,
): Promise<VaultActionResult> {
  try {
    const title = getString(formData, "title");
    const itemType = getString(formData, "itemType") as VaultItemInsert["item_type"];
    const username = getString(formData, "username");
    const secret = getString(formData, "secret");
    const notes = getString(formData, "notes");

    if (!title || !itemType || !secret) {
      throw new Error("Bitte fuellen Sie Titel, Typ und Geheimnis aus.");
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(authError.message);
    }

    if (!user) {
      throw new Error("Bitte melden Sie sich an, um Tresor-Eintraege anzulegen.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const payload: VaultItemInsert = {
      profile_id: user.id,
      item_type: itemType,
      title,
      username: username || null,
      encrypted_secret: encodeSecret(secret),
      notes: notes || null,
    };

    const { error } = await adminSupabase.from("secure_vault_items").insert(payload);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard");
    return { success: true, message: "Tresor-Eintrag gespeichert." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Tresor-Eintrag fehlgeschlagen.",
    };
  }
}
