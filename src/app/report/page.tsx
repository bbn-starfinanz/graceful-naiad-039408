import { PublicReportForm } from "@/components/report/public-report-form";

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-5 py-7 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:rounded-[2.25rem] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(240,215,161,0.08),transparent_40%,rgba(205,161,93,0.08))]" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong sm:text-sm sm:tracking-[0.24em]">
            Melde-Portal
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:mt-4 sm:text-3xl">
            Todesfall melden und Sterbeurkunde sicher uebermitteln
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:mt-4">
            Diese oeffentliche Route ist fuer Angehoerige gedacht. Die
            Sterbeurkunde wird spaeter in Supabase Storage hochgeladen und als
            Eintrag in <code>death_verifications</code> hinterlegt.
          </p>

          <div className="mt-6 sm:mt-8">
            <PublicReportForm />
          </div>
        </section>

        <aside className="space-y-4 sm:space-y-6">
          <section className="rounded-[1.5rem] border border-border bg-card px-4 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:rounded-[1.85rem] sm:px-6 sm:py-6">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Benoetigte Angaben
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-muted sm:mt-4 sm:space-y-3">
              <li>Name des Verstorbenen</li>
              <li>Eigene Kontakt-E-Mail</li>
              <li>Sterbeurkunde als PDF oder Bild</li>
            </ul>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-card px-4 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:rounded-[1.85rem] sm:px-6 sm:py-6">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Naechster Prozessschritt
            </h2>
            <p className="mt-2.5 text-sm leading-7 text-muted sm:mt-3">
              Nach erfolgreicher Verifikation koennen Nachrichten im Admin-Flow
              freigeschaltet und anschliessend an Empfaenger versendet werden.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
