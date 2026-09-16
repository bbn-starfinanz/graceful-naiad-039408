"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createRecipientAccessToken } from "@/lib/utils/token";
import type {
  Database,
  MessageInsert,
  RecipientInsert,
} from "@/lib/types/database";

export interface CreateMessagePayload {
  title: string;
  mediaType: "audio" | "video";
  storagePath: string;
  originalFileName: string;
  fileSizeBytes: number;
  recipients: string[];
}

export interface DashboardActionResult {
  success: boolean;
  message: string;
}

type VoucherUpdate = Database["public"]["Tables"]["vouchers"]["Update"];

function normalizeRecipients(recipients: string[]) {
  return recipients
    .map((recipient) => recipient.trim().toLowerCase())
    .filter(Boolean);
}

export async function createMessageWithRecipients(
  payload: CreateMessagePayload,
): Promise<DashboardActionResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(authError.message);
    }

    if (!user) {
      throw new Error("Bitte melden Sie sich an, um eine Nachricht zu speichern.");
    }

    const recipients = normalizeRecipients(payload.recipients);

    if (!payload.title.trim()) {
      throw new Error("Bitte geben Sie einen Titel fuer die Nachricht ein.");
    }

    if (recipients.length === 0) {
      throw new Error("Bitte hinterlegen Sie mindestens eine Empfaenger-E-Mail.");
    }

    const messageInsert: MessageInsert = {
      profile_id: user.id,
      title: payload.title.trim(),
      media_type: payload.mediaType,
      storage_path: payload.storagePath,
      original_file_name: payload.originalFileName,
      file_size_bytes: payload.fileSizeBytes,
    };

    const { data: messageRow, error: messageError } = await supabase
      .from("messages")
      .insert([messageInsert])
      .select("id")
      .single();

    if (messageError) {
      throw new Error(messageError.message);
    }

    const recipientRows: RecipientInsert[] = recipients.map((email) => ({
      message_id: messageRow.id,
      email,
      access_token: createRecipientAccessToken(),
    }));

    const { error: recipientsError } = await supabase
      .from("recipients")
      .insert(recipientRows);

    if (recipientsError) {
      throw new Error(recipientsError.message);
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Nachricht und Empfaenger wurden erfolgreich gespeichert.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Die Nachricht konnte nicht gespeichert werden.",
    };
  }
}

export async function redeemVoucherCode(
  rawVoucherCode: string,
): Promise<DashboardActionResult> {
  try {
    const voucherCode = rawVoucherCode.trim().toUpperCase();

    if (!voucherCode) {
      throw new Error("Bitte geben Sie einen Voucher-Code ein.");
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
      throw new Error("Bitte melden Sie sich an, um einen Voucher einzuloesen.");
    }

    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .select("id, is_redeemed")
      .eq("code", voucherCode)
      .single();

    if (voucherError) {
      throw new Error("Voucher-Code ungueltig.");
    }

    if (voucher.is_redeemed) {
      throw new Error("Dieser Voucher-Code wurde bereits eingeloest.");
    }

    const voucherUpdate: VoucherUpdate = {
      is_redeemed: true,
      redeemed_by_profile_id: user.id,
      redeemed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("vouchers")
      .update(voucherUpdate)
      .eq("id", voucher.id)
      .eq("is_redeemed", false);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Voucher erfolgreich eingeloest.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Der Voucher konnte nicht eingeloest werden.",
    };
  }
}
