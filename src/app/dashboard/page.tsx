import { redirect } from "next/navigation";
import { UploadForm } from "@/components/dashboard/upload-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Notice } from "@/components/ui/notice";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface DashboardMessage {
  id: string;
  title: string;
  media_type: "audio" | "video";
  original_file_name: string;
  file_size_bytes: number;
  is_unlocked: boolean;
  created_at: string;
  recipients: { email: string }[];
}

export default async function DashboardPage() {
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!hasSupabaseEnv) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
        <div className="mx-auto max-w-4xl">
          <Notice
            message="Supabase ist noch nicht konfiguriert. Bitte hinterlegen Sie die Umgebungsvariablen in .env.local."
            tone="info"
          />
        </div>
      </main>
    );
  }

  const dashboardData = await loadDashboardData();

  if (!dashboardData.success) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
        <div className="mx-auto max-w-4xl">
          <Notice message={dashboardData.message} tone="error" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="relative overflow-hidden rounded-[2.25rem] border border-border bg-card px-8 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(240,215,161,0.08),transparent_40%,rgba(205,161,93,0.08))]" />
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-strong">
            Dashboard
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            Ihr gesicherter Bereich fuer digitale Nachlassbotschaften
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Laden Sie Ihre Audio- oder Videobotschaften hoch, hinterlegen Sie
            Empfaenger und loesen Sie bei Bedarf einen Voucher ein.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-white/3 px-4 py-4 text-sm text-foreground/80">
            <span className="font-medium">Angemeldet als:</span>{" "}
            {dashboardData.user.email}
          </div>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_380px]">
          <div className="rounded-[1.85rem] border border-border bg-card px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Neue Nachricht
              </h2>
              <p className="mt-2 text-sm text-muted">
                Die Nachricht wird direkt in Supabase Storage gespeichert und
                anschliessend mit Ihren Empfaengern verknuepft.
              </p>
            </div>

            <UploadForm userId={dashboardData.user.id} />
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.85rem] border border-border bg-card px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
              <h2 className="text-lg font-semibold text-foreground">
                Bereits hinterlegte Nachrichten
              </h2>
              <div className="mt-4 space-y-4">
                {dashboardData.messages.length === 0 ? (
                  <Notice
                    message="Noch keine Nachrichten hinterlegt."
                    tone="info"
                  />
                ) : (
                  dashboardData.messages.map((message) => (
                    <article
                      key={message.id}
                      className="rounded-2xl border border-border bg-white/3 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {message.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            {message.media_type === "video" ? "Video" : "Audio"} ·{" "}
                            {message.original_file_name}
                          </p>
                          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                            Empfaenger:{" "}
                            {message.recipients
                              .map((recipient) => recipient.email)
                              .join(", ")}
                          </p>
                        </div>
                        <span className="rounded-full border border-accent-strong/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                          {message.is_unlocked ? "Freigegeben" : "Versiegelt"}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

async function loadDashboardData():
  Promise<
    | {
        success: true;
        user: {
          id: string;
          email: string;
        };
        messages: DashboardMessage[];
      }
    | {
        success: false;
        message: string;
      }
  > {
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
      redirect("/login");
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(
        "id, title, media_type, original_file_name, file_size_bytes, is_unlocked, created_at, recipients(email)",
      )
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    const normalizedMessages = (messages ?? []).map((message) => ({
      ...message,
      recipients: Array.isArray(message.recipients) ? message.recipients : [],
    })) as DashboardMessage[];

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email ?? "Unbekannt",
      },
      messages: normalizedMessages,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Das Dashboard konnte nicht geladen werden.",
    };
  }
}
