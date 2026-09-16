"use client";

import { useMemo, useState, useTransition } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import {
  createMessageWithRecipients,
  redeemVoucherCode,
  type DashboardActionResult,
} from "@/lib/actions/dashboard";
import { formatBytes } from "@/lib/utils/format";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";

interface UploadFormProps {
  userId: string;
}

type StatusState = DashboardActionResult | null;

function inferMediaType(file: File) {
  return file.type.startsWith("video/") ? "video" : "audio";
}

export function UploadForm({ userId }: UploadFormProps) {
  const supabase = useMemo(() => createClientSupabaseClient(), []);
  const [title, setTitle] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<StatusState>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isVoucherPending, startVoucherTransition] = useTransition();

  const recipientList = useMemo(
    () =>
      recipientInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [recipientInput],
  );

  async function handleVoucherRedeem() {
    setStatus(null);

    startVoucherTransition(async () => {
      const result = await redeemVoucherCode(voucherCode);
      setStatus(result);

      if (result.success) {
        setVoucherCode("");
      }
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!selectedFile) {
      setStatus({
        success: false,
        message: "Bitte waehlen Sie zuerst eine Audio- oder Videodatei aus.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);

    try {
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      const storagePath = `${userId}/${crypto.randomUUID()}${fileExtension ? `.${fileExtension}` : ""}`;

      const uploadResult = await new Promise<
        | { data: { path: string }; error: null }
        | { data: null; error: Error }
      >((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (progressEvent) => {
          if (!progressEvent.lengthComputable) {
            return;
          }

          const percent = Math.round(
            (progressEvent.loaded / progressEvent.total) * 80,
          );
          setUploadProgress(Math.max(10, percent));
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              data: { path: storagePath },
              error: null,
            });
            return;
          }

          resolve({
            data: null,
            error: new Error("Upload fehlgeschlagen."),
          });
        });

        xhr.addEventListener("error", () => {
          resolve({
            data: null,
            error: new Error("Upload fehlgeschlagen."),
          });
        });

        supabase.auth.getSession().then(({ data, error }) => {
          if (error) {
            resolve({
              data: null,
              error: new Error(error.message),
            });
            return;
          }

          const accessToken = data.session?.access_token;

          if (!accessToken) {
            resolve({
              data: null,
              error: new Error("Bitte melden Sie sich an, um Dateien hochzuladen."),
            });
            return;
          }

          xhr.open(
            "POST",
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/legacy-media/${storagePath}`,
          );
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.setRequestHeader(
            "apikey",
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
          );
          xhr.setRequestHeader("x-upsert", "false");
          xhr.send(selectedFile);
        });
      });

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      setUploadProgress(90);

      const result = await createMessageWithRecipients({
        title,
        mediaType: inferMediaType(selectedFile),
        storagePath: uploadResult.data.path,
        originalFileName: selectedFile.name,
        fileSizeBytes: selectedFile.size,
        recipients: recipientList,
      });

      setStatus(result);
      setUploadProgress(result.success ? 100 : 0);

      if (result.success) {
        setTitle("");
        setRecipientInput("");
        setSelectedFile(null);
      }
    } catch (error) {
      setStatus({
        success: false,
        message:
          error instanceof Error ? error.message : "Upload fehlgeschlagen.",
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {status ? (
        <Notice
          tone={status.success ? "success" : "error"}
          message={status.message}
        />
      ) : null}

      {recipientList.length > 0 ? (
        <Notice
          message={`Empfaenger: ${recipientList.join(", ")}`}
          tone="info"
        />
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-5">
          <label className="space-y-2 text-sm font-medium text-foreground">
            Titel der Nachricht
            <input
              className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Abschied fuer meine Familie"
              type="text"
              value={title}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Empfaenger-E-Mails
            <textarea
              className="min-h-28 w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong"
              onChange={(event) => setRecipientInput(event.target.value)}
              placeholder="anna@example.com, max@example.com"
              value={recipientInput}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-foreground">
            Audio- oder Videodatei
            <span className="flex cursor-pointer flex-col rounded-[1.8rem] border border-dashed border-border bg-white/3 px-6 py-6 transition hover:border-accent-strong hover:bg-accent-soft">
              <span className="text-sm font-semibold text-foreground">
                Datei auswaehlen
              </span>
              <span className="mt-2 text-sm text-muted">
                {selectedFile
                  ? `${selectedFile.name} - ${formatBytes(selectedFile.size)}`
                  : "MP3, WAV, MP4 oder MOV"}
              </span>
              <input
                accept="audio/*,video/*"
                className="sr-only"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
                type="file"
              />
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,#fbe6b0_0%,#d6a146_42%,#b86d4d_100%)] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Upload-Fortschritt {uploadProgress}%
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full border border-accent-strong/80 bg-[linear-gradient(135deg,#fbe6b0_0%,#d6a146_40%,#b86d4d_100%)] px-8 py-4 text-sm font-medium uppercase tracking-[0.16em] text-[#2f1b0a] shadow-[inset_0_1px_0_rgba(255,245,219,0.75),0_16px_50px_rgba(214,161,70,0.26)] transition duration-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? <Spinner /> : null}
          {isUploading ? "Speichert..." : "Nachricht hochladen"}
        </button>
      </form>

      <section className="space-y-4 rounded-[1.85rem] border border-border bg-card px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Voucher einloesen
          </h3>
          <p className="mt-2 text-sm leading-7 text-muted">
            Loesen Sie einen Bestatter-Code ein, bevor Sie die Nachricht
            kostenpflichtig freischalten.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            className="w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm uppercase tracking-[0.12em] text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong"
            onChange={(event) => setVoucherCode(event.target.value)}
            placeholder="Voucher-Code"
            value={voucherCode}
          />
          <button
            className="inline-flex min-w-52 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm uppercase tracking-[0.16em] text-foreground/85 transition duration-500 hover:border-accent hover:bg-accent-soft/80 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isVoucherPending}
            onClick={handleVoucherRedeem}
            type="button"
          >
            {isVoucherPending ? <Spinner /> : null}
            {isVoucherPending ? "Prueft..." : "Voucher pruefen"}
          </button>
        </div>
      </section>
    </div>
  );
}
