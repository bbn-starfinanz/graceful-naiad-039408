"use client";

import { useState, useTransition } from "react";
import { createDeathVerification, type ReportActionResult } from "@/lib/actions/dashboard";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";

export function PublicReportForm() {
  const [fileName, setFileName] = useState("Noch keine Datei ausgewaehlt");
  const [status, setStatus] = useState<ReportActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setStatus(null);
    startTransition(async () => {
      const result = await createDeathVerification(formData);
      setStatus(result);

      if (result.success) {
        setFileName("Noch keine Datei ausgewaehlt");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {status ? (
        <Notice
          message={status.message}
          tone={status.success ? "success" : "error"}
        />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-foreground">
          Name des Verstorbenen
          <input
            className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong"
            name="deceasedName"
            placeholder="Maria Mustermann"
            type="text"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground">
          Kontakt-E-Mail
          <input
            className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong"
            name="contactEmail"
            placeholder="angehoerige@example.com"
            type="email"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-foreground">
        Sterbeurkunde
        <span className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-white/3 px-6 py-8 text-center transition hover:border-accent-strong hover:bg-accent-soft">
          <span className="text-sm font-semibold text-foreground">
            Datei auswaehlen
          </span>
          <span className="mt-2 text-sm text-muted">{fileName}</span>
          <input
            className="sr-only"
            name="certificate"
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              setFileName(selectedFile?.name ?? "Noch keine Datei ausgewaehlt");
            }}
          />
        </span>
      </label>

      <button
        className="inline-flex items-center justify-center rounded-full border border-accent-strong/70 bg-[linear-gradient(135deg,#f5e3ba_0%,#cda15d_100%)] px-6 py-3 text-sm font-semibold text-[#1f160c] shadow-[0_14px_40px_rgba(205,161,93,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? <Spinner /> : null}
        {isPending ? "Sende..." : "Meldung absenden"}
      </button>
    </form>
  );
}
