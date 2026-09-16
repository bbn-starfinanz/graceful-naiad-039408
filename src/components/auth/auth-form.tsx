"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/lib/actions/auth";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";

interface AuthFormProps {
  mode: "signin" | "signup";
}

const initialState: AuthActionState = {
  success: false,
  message: "",
};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "signin" ? signInAction : signUpAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && mode === "signin") {
      router.push("/dashboard");
      router.refresh();
    }
  }, [mode, router, state.success]);

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <Notice
          message={state.message}
          tone={state.success ? "success" : "error"}
        />
      ) : null}

      {mode === "signup" ? (
        <label className="block space-y-2 text-sm font-medium text-foreground">
          Vollstaendiger Name
          <input
            className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong"
            name="fullName"
            placeholder="Benjamin Brinkmann"
            type="text"
          />
        </label>
      ) : null}

      <label className="block space-y-2 text-sm font-medium text-foreground">
        E-Mail
        <input
          className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong"
          name="email"
          placeholder="name@example.com"
          type="email"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-foreground">
        Passwort
        <input
          className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong"
          name="password"
          placeholder="Mindestens 8 Zeichen"
          type="password"
        />
      </label>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent-strong/80 bg-[linear-gradient(135deg,#fbe6b0_0%,#d6a146_40%,#b86d4d_100%)] px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] text-[#2f1b0a] shadow-[inset_0_1px_0_rgba(255,245,219,0.75),0_16px_50px_rgba(214,161,70,0.26)] transition duration-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-4 sm:tracking-[0.16em]"
        disabled={isPending}
        type="submit"
      >
        {isPending ? <Spinner /> : null}
        {mode === "signin"
          ? isPending
            ? "Anmeldung..."
            : "Anmelden"
          : isPending
            ? "Erstellt..."
            : "Konto erstellen"}
      </button>
    </form>
  );
}
