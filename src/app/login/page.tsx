import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.8fr)] lg:gap-8">
        <section className="rounded-[2rem] border border-border bg-card px-5 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:rounded-[2.25rem] sm:px-8 sm:py-10">
          <p className="font-script text-3xl text-accent sm:text-4xl">
            Access the private vault
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-foreground sm:mt-6 sm:text-5xl">
            Melden Sie sich an, um Audio- und Video-Vermaechtnisse sicher zu
            hinterlegen.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-loose text-muted sm:mt-6 sm:text-base">
            Der gesicherte Bereich ist ausschliesslich fuer registrierte Nutzer
            bestimmt. Dort koennen Nachrichten hochgeladen, Empfaenger
            verwaltet und Voucher-Codes eingeloest werden.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-border bg-surface p-4 sm:mt-10 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-accent-strong sm:tracking-[0.24em]">
              Was Sie im Dashboard erwartet
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-loose text-muted">
              <li>Geschuetzter Upload fuer Audio- und Videodateien</li>
              <li>Empfaengerverwaltung pro Nachricht</li>
              <li>Voucher-Einloesung und spaetere Freigabelogik</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card px-5 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:rounded-[2.25rem] sm:px-8 sm:py-10">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-accent-strong sm:tracking-[0.3em]">
                Anmeldung
              </p>
              <h2 className="mt-3 font-serif text-3xl text-foreground sm:mt-4 sm:text-4xl">
                Bestehendes Konto
              </h2>
            </div>
            <AuthForm mode="signin" />
          </div>

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-accent-strong/40 to-transparent sm:my-10" />

          <div className="space-y-6 sm:space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-accent-strong sm:tracking-[0.3em]">
                Registrierung
              </p>
              <h2 className="mt-3 font-serif text-3xl text-foreground sm:mt-4 sm:text-4xl">
                Neues Konto erstellen
              </h2>
            </div>
            <AuthForm mode="signup" />
          </div>

          <p className="mt-6 text-sm text-muted sm:mt-8">
            Zurueck zur{" "}
            <Link className="text-accent-strong" href="/">
              Landingpage
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
