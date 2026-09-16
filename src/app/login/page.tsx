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
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.8fr)]">
        <section className="rounded-[2.25rem] border border-border bg-card px-8 py-10 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <p className="font-script text-4xl text-accent">
            Access the private vault
          </p>
          <h1 className="mt-6 font-serif text-5xl leading-tight text-foreground">
            Melden Sie sich an, um Audio- und Video-Vermaechtnisse sicher zu
            hinterlegen.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-loose text-muted">
            Der gesicherte Bereich ist ausschliesslich fuer registrierte Nutzer
            bestimmt. Dort koennen Nachrichten hochgeladen, Empfaenger
            verwaltet und Voucher-Codes eingeloest werden.
          </p>
          <div className="mt-10 rounded-[2rem] border border-border bg-surface p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-accent-strong">
              Was Sie im Dashboard erwartet
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-loose text-muted">
              <li>Geschuetzter Upload fuer Audio- und Videodateien</li>
              <li>Empfaengerverwaltung pro Nachricht</li>
              <li>Voucher-Einloesung und spaetere Freigabelogik</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[2.25rem] border border-border bg-card px-8 py-10 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent-strong">
                Anmeldung
              </p>
              <h2 className="mt-4 font-serif text-4xl text-foreground">
                Bestehendes Konto
              </h2>
            </div>
            <AuthForm mode="signin" />
          </div>

          <div className="my-10 h-px bg-gradient-to-r from-transparent via-accent-strong/40 to-transparent" />

          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent-strong">
                Registrierung
              </p>
              <h2 className="mt-4 font-serif text-4xl text-foreground">
                Neues Konto erstellen
              </h2>
            </div>
            <AuthForm mode="signup" />
          </div>

          <p className="mt-8 text-sm text-muted">
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
