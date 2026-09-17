"use client";

import { useMemo, useState, useTransition } from "react";
import { createVaultItem, type VaultActionResult } from "@/lib/actions/vault";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";

type VaultItem = {
  id: string;
  itemType: "account" | "bank" | "pin" | "document" | "note";
  title: string;
  username?: string | null;
  secretLabel: string;
  notes?: string | null;
};

const demoItems: VaultItem[] = [
  {
    id: "1",
    itemType: "account",
    title: "E-Mail-Konto",
    username: "name@example.com",
    secretLabel: "Passwort verborgen",
    notes: "Primärer Zugang fuer wichtige Benachrichtigungen.",
  },
  {
    id: "2",
    itemType: "bank",
    title: "Hausbank",
    username: "Kundennummer 123456",
    secretLabel: "PIN verborgen",
    notes: "Zugangsdaten fuer Notfaelle und Vollmachten.",
  },
  {
    id: "3",
    itemType: "pin",
    title: "Telefon-PIN",
    secretLabel: "PIN verborgen",
    notes: "Zum Entsperren von Mobilgeraeten im Notfall.",
  },
];

const initialStatus: VaultActionResult | null = null;

export function SecureVault() {
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [status, setStatus] = useState<VaultActionResult | null>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const visibleItems = useMemo(
    () =>
      demoItems.map((item) =>
        item.id === revealedId
          ? { ...item, secretLabel: "Zugang sichtbar" }
          : item,
      ),
    [revealedId],
  );

  function handleCreateVaultItem(formData: FormData) {
    setStatus(null);
    startTransition(async () => {
      const result = await createVaultItem(formData);
      setStatus(result);
    });
  }

  return (
    <section className="rounded-[1.85rem] border border-border bg-card px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong">
          Secure Vault
        </p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">
          Passwoerter, PINs und wichtige Zugriffe
        </h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          Ein separater Tresor fuer sensible Zugangsdaten, Bank-Infos,
          Konten und Notfallhinweise.
        </p>
      </div>

      <Notice
        tone="info"
        message="Im MVP werden Geheimnisse serverseitig als verschluesselte Platzhalter gespeichert. Die saubere End-to-End-Verschluesselung folgt im naechsten Schritt."
      />

      {status ? <Notice tone={status.success ? "success" : "error"} message={status.message} /> : null}

      <form action={handleCreateVaultItem} className="mt-4 space-y-4 rounded-[1.5rem] border border-border bg-surface p-4">
        <div className="grid gap-3">
          <label className="space-y-2 text-sm font-medium text-foreground">
            Typ
            <select
              className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm outline-none focus:border-accent-strong"
              name="itemType"
              defaultValue="account"
            >
              <option value="account">Konto</option>
              <option value="bank">Bank</option>
              <option value="pin">PIN</option>
              <option value="document">Dokument</option>
              <option value="note">Notiz</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Titel
            <input className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm outline-none focus:border-accent-strong" name="title" placeholder="Passwort fuer E-Mail" />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Benutzername / Referenz
            <input className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm outline-none focus:border-accent-strong" name="username" placeholder="name@example.com" />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Geheimnis
            <input className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm outline-none focus:border-accent-strong" name="secret" placeholder="Passwort, PIN oder Zugangscode" />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Notizen
            <textarea className="min-h-24 w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm outline-none focus:border-accent-strong" name="notes" placeholder="Wofuer ist dieser Zugang wichtig?" />
          </label>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full border border-accent-strong/80 bg-[linear-gradient(135deg,#fbe6b0_0%,#d6a146_40%,#b86d4d_100%)] px-6 py-3 text-sm font-medium uppercase tracking-[0.16em] text-[#2f1b0a] transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? <Spinner /> : null}
          {isPending ? "Speichert..." : "Tresor-Eintrag speichern"}
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {visibleItems.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.35rem] border border-border bg-surface px-4 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent-strong">
                  {item.itemType}
                </p>
                <h4 className="mt-1 font-medium text-foreground">{item.title}</h4>
                {item.username ? (
                  <p className="mt-1 text-sm text-muted">{item.username}</p>
                ) : null}
              </div>
              <button
                className="rounded-full border border-accent-strong/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent-strong"
                onClick={() =>
                  setRevealedId(item.id === revealedId ? null : item.id)
                }
                type="button"
              >
                {item.id === revealedId ? "Verstecken" : "Ansehen"}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">{item.secretLabel}</p>
            {item.notes ? <p className="mt-2 text-sm text-muted">{item.notes}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
