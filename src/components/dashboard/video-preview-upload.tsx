"use client";

import { useMemo, useState } from "react";
import { createVideoPreviewUrl } from "@/lib/actions/dashboard";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { VideoPlayer } from "@/components/ui/video-player";

export function VideoPreviewUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const previewSource = useMemo(() => previewUrl ?? "", [previewUrl]);

  async function handleGeneratePreview() {
    if (!file) {
      setStatus("Bitte waehlen Sie zuerst eine Videodatei aus.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsPending(true);
    const result = await createVideoPreviewUrl(formData);
    setStatus(result.message);

    if (result.success && result.previewUrl) {
      setPreviewUrl(result.previewUrl);
    }

    setIsPending(false);
  }

  return (
    <div className="space-y-5 rounded-[1.85rem] border border-border bg-card px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Videovorschau
        </h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          Laden Sie eine Videodatei hoch, um sofort eine elegante Vorschau im
          Player zu sehen.
        </p>
      </div>

      {status ? <Notice message={status} tone="info" /> : null}

      <label className="block space-y-2 text-sm font-medium text-foreground">
        Video-Datei
        <input
          accept="video/*"
          className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-foreground outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent-strong focus:border-accent-strong"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>

      <button
        className="inline-flex items-center justify-center gap-2 rounded-full border border-accent-strong/80 bg-[linear-gradient(135deg,#fbe6b0_0%,#d6a146_40%,#b86d4d_100%)] px-6 py-3 text-sm font-medium uppercase tracking-[0.16em] text-[#2f1b0a] transition disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleGeneratePreview}
        type="button"
      >
        {isPending ? <Spinner /> : null}
        {isPending ? "Erstelle..." : "Vorschau erstellen"}
      </button>

      {previewUrl ? (
        <VideoPlayer src={previewSource} />
      ) : (
        <div className="rounded-[1.4rem] border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          Noch keine Vorschau geladen.
        </div>
      )}
    </div>
  );
}
