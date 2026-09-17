"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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

export interface UploadPreviewResult {
  success: boolean;
  message: string;
  previewUrl?: string;
}

export interface ReportActionResult {
  success: boolean;
  message: string;
}

type VoucherUpdate = Database["public"]["Tables"]["vouchers"]["Update"];
type DeathVerificationInsert =
  Database["public"]["Tables"]["death_verifications"]["Insert"];
type ProfileAuditInsert = Database["public"]["Tables"]["profiles_audit"]["Insert"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

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

    const adminSupabase = createAdminSupabaseClient();
    const auditInsert: ProfileAuditInsert = {
      profile_id: user.id,
      action: "message_created",
      metadata: {
        message_id: messageRow.id,
        recipient_count: recipients.length,
      },
    };

    await adminSupabase.from("profiles_audit").insert(auditInsert);

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

    const adminSupabase = createAdminSupabaseClient();
    const { error: updateError } = await adminSupabase
      .from("vouchers")
      .update(voucherUpdate)
      .eq("id", voucher.id)
      .eq("is_redeemed", false);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const auditInsert: ProfileAuditInsert = {
      profile_id: user.id,
      action: "voucher_redeemed",
      metadata: {
        voucher_id: voucher.id,
        code: voucherCode,
      },
    };

    await adminSupabase.from("profiles_audit").insert(auditInsert);

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

export async function createDeathVerification(
  formData: FormData,
): Promise<ReportActionResult> {
  try {
    const deceasedName = getString(formData, "deceasedName");
    const reporterEmail = getString(formData, "contactEmail").toLowerCase();
    const certificate = formData.get("certificate");

    if (!deceasedName || !reporterEmail) {
      throw new Error("Bitte fuellen Sie alle Felder aus.");
    }

    if (!(certificate instanceof File) || certificate.size === 0) {
      throw new Error("Bitte laden Sie eine Sterbeurkunde hoch.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const reportPath = `${crypto.randomUUID()}/${crypto.randomUUID()}-${certificate.name}`;

    const { error: uploadError } = await adminSupabase.storage
      .from("death-certificates")
      .upload(reportPath, certificate, {
        upsert: false,
        contentType: certificate.type || "application/octet-stream",
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const insertPayload: DeathVerificationInsert = {
      deceased_name: deceasedName,
      reporter_email: reporterEmail,
      certificate_path: reportPath,
      status: "pending",
    };

    const { error: insertError } = await adminSupabase
      .from("death_verifications")
      .insert(insertPayload);

    if (insertError) {
      throw new Error(insertError.message);
    }

    revalidatePath("/report");

    return {
      success: true,
      message:
        "Vielen Dank. Die Meldung wurde gespeichert und wird nun geprüft.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Die Meldung konnte nicht gespeichert werden.",
    };
  }
}

export async function createVideoPreviewUrl(
  formData: FormData,
): Promise<UploadPreviewResult> {
  try {
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Bitte waehlen Sie zuerst eine Videodatei aus.");
    }

    if (!file.type.startsWith("video/")) {
      throw new Error("Bitte laden Sie fuer die Vorschau eine Videodatei hoch.");
    }

    const previewUrl = URL.createObjectURL(file);

    return {
      success: true,
      message: "Videovorschau wurde erstellt.",
      previewUrl,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Die Videovorschau konnte nicht erstellt werden.",
    };
  }
}
