"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export interface AuthActionState {
  success: boolean;
  message: string;
}

type ProfileAuditInsert =
  Database["public"]["Tables"]["profiles_audit"]["Insert"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const email = getString(formData, "email").toLowerCase();
    const password = getString(formData, "password");
    const fullName = getString(formData, "fullName");

    if (!email || !password) {
      throw new Error("Bitte geben Sie E-Mail und Passwort ein.");
    }

    if (password.length < 8) {
      throw new Error("Das Passwort muss mindestens 8 Zeichen lang sein.");
    }

    const supabase = await createServerSupabaseClient();
    const siteUrl = getSiteUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/login`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Registrierung fehlgeschlagen.");
    }

    const adminSupabase = createAdminSupabaseClient();
    const { error: profileError } = await adminSupabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName || null,
      status: "alive",
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const auditInsert: ProfileAuditInsert = {
      profile_id: data.user.id,
      action: "account_created",
      metadata: {
        email,
        has_full_name: Boolean(fullName),
      },
    };

    const { error: auditError } = await adminSupabase
      .from("profiles_audit")
      .insert(auditInsert);

    if (auditError) {
      throw new Error(auditError.message);
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message:
        "Konto erstellt. Falls E-Mail-Bestaetigung aktiv ist, bestaetigen Sie bitte zuerst Ihre Adresse.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Registrierung fehlgeschlagen.",
    };
  }
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const email = getString(formData, "email").toLowerCase();
    const password = getString(formData, "password");

    if (!email || !password) {
      throw new Error("Bitte geben Sie E-Mail und Passwort ein.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Anmeldung erfolgreich. Sie werden weitergeleitet.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.",
    };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  } catch {
    // Redirect regardless so a broken local session does not trap the user.
  }

  revalidatePath("/");
  redirect("/");
}
