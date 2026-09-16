import { PublicReportForm } from "@/components/report/public-report-form";

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-border bg-card px-8 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(240,215,161,0.08),transparent_40%,rgba(205,161,93,0.08))]" />
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-strong">
            Melde-Portal
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            Todesfall melden und Sterbeurkunde sicher uebermitteln
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            Diese oeffentliche Route ist fuer Angehoerige gedacht. Die
            Sterbeurkunde wird spaeter in Supabase Storage hochgeladen und als
            Eintrag in <code>death_verifications</code> hinterlegt.
          </p>

          <div className="mt-8">
            <PublicReportForm />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[1.85rem] border border-border bg-card px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-semibold text-foreground">
              Benoetigte Angaben
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <li>Name des Verstorbenen</li>
              <li>Eigene Kontakt-E-Mail</li>
              <li>Sterbeurkunde als PDF oder Bild</li>
            </ul>
          </section>

          <section className="rounded-[1.85rem] border border-border bg-card px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-semibold text-foreground">
              Naechster Prozessschritt
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Nach erfolgreicher Verifikation koennen Nachrichten im Admin-Flow
              freigeschaltet und anschliessend an Empfaenger versendet werden.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
