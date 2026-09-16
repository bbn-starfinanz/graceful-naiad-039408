const legacyExhibits = [
  {
    eyebrow: "Audio-Nachricht",
    title: "Ihre Stimme, bewahrt wie eine goldene Schallspur.",
    description:
      "Eine reine Sprachbotschaft fuer Worte, Intonation und Naehe. Gestaltet wie ein privates Audiostueck, das erst im verifizierten Moment freigegeben wird.",
  },
  {
    eyebrow: "Video-Botschaft",
    title: "Ihr Bild, Ihre Haltung, Ihr Blick fuer die Zeit danach.",
    description:
      "Eine filmische Hinterlassenschaft fuer Gestik, Mimik und Praesenz. Fuer jene Momente, in denen ein Gesicht mehr troestet als tausend Zeilen Text.",
  },
];

const securityPanels = [
  {
    title: "Der Tresor",
    description:
      "Audio- und Videobotschaften werden verschluesselt in einem digitalen Hochsicherheitstresor verwahrt - diskret, mehrschichtig und vor unbefugtem Zugriff abgeschirmt.",
  },
  {
    title: "Der Schluessel",
    description:
      "Die Freigabe erfolgt erst nach Verifikation durch die Uebermittlung einer Sterbeurkunde. Ohne diesen Nachweis bleibt Ihr Vermaechtnis versiegelt.",
  },
  {
    title: "Die Zustellung",
    description:
      "Jede Botschaft ist auf konkrete Empfaenger ausgerichtet und wird erst dann sichtbar, wenn der vorgesehene Moment offiziell erreicht ist.",
  },
];

function GoldPlaySeal() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-accent-strong/60 bg-[radial-gradient(circle_at_35%_30%,#fff1c8_0%,#f5d48e_22%,#d6a146_48%,#8b5429_100%)] shadow-[inset_0_2px_0_rgba(255,248,226,0.85),0_0_44px_rgba(214,161,70,0.3)]">
      <div className="absolute inset-3 rounded-full border border-white/20" />
      <div className="ml-1 h-0 w-0 border-y-[12px] border-y-transparent border-l-[20px] border-l-[#3b210c]" />
    </div>
  );
}

function SoundwaveOrnament() {
  return (
    <div className="flex items-end gap-2">
      {[28, 48, 66, 42, 76, 54, 34, 58, 26].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-2 rounded-full bg-[linear-gradient(180deg,rgba(255,244,214,0.9),rgba(214,161,70,0.88),rgba(184,109,77,0.8))] shadow-[0_0_16px_rgba(214,161,70,0.24)]"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function FilmGlyph() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
      <span className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-accent-strong/80"
          />
        ))}
      </span>
      <span className="h-px w-14 bg-gradient-to-r from-accent-strong via-accent to-transparent" />
    </div>
  );
}

function KeyGlyph() {
  return (
    <div className="relative h-14 w-14">
      <div className="absolute left-0 top-4 h-6 w-6 rounded-full border-2 border-accent-strong bg-accent-soft" />
      <div className="absolute left-5 top-[1.65rem] h-2 w-7 rounded-r-full bg-[linear-gradient(90deg,#fbe6b0_0%,#d6a146_60%,#b86d4d_100%)]" />
      <div className="absolute right-1 top-[1.65rem] h-4 w-1.5 bg-accent-strong" />
      <div className="absolute right-3 top-[2.05rem] h-2.5 w-1.5 bg-accent-copper" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-[92rem] flex-col gap-28 px-6 py-8 sm:px-10 lg:px-16">
        <header className="fade-in flex items-center justify-between py-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.34em] text-accent-strong">
              Final Echo
            </p>
            <p className="mt-3 text-sm text-muted">
              Audio- und Videobotschaften fuer die Zeit nach dem Tod
            </p>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            <a
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm text-foreground/85 transition duration-500 hover:border-accent-strong hover:shadow-[0_0_0_1px_rgba(214,161,70,0.2)]"
              href="/report"
            >
              Melde-Portal
            </a>
            <a
              className="rounded-full border border-accent-strong/70 bg-[linear-gradient(135deg,#f7dfaa_0%,#d6a146_42%,#b86d4d_100%)] px-5 py-2.5 text-sm font-medium text-[#2f1b0a] shadow-[inset_0_1px_0_rgba(255,244,220,0.55),0_0_26px_rgba(214,161,70,0.2)] transition duration-500 hover:shadow-[inset_0_1px_0_rgba(255,244,220,0.65),0_0_32px_rgba(214,161,70,0.34)]"
              href="/dashboard"
            >
              Vermaechtnis beginnen
            </a>
          </nav>
        </header>

        <section className="theater-rise gold-dust relative overflow-hidden rounded-[3rem] border border-border bg-[linear-gradient(135deg,rgba(17,31,70,0.3),rgba(59,17,24,0.38)_42%,rgba(0,0,0,0.74))] px-8 py-10 shadow-[0_40px_140px_rgba(0,0,0,0.62)] lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(245,212,142,0.14),transparent_20%),radial-gradient(circle_at_85%_22%,rgba(184,109,77,0.12),transparent_18%)]" />
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent-strong to-transparent" />
          <div className="pointer-events-none absolute bottom-10 left-12 h-32 w-32 rounded-full border border-accent-strong/15" />

          <div className="relative grid gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.82fr)] lg:items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <p className="font-script text-4xl text-accent">
                  A final message, beautifully preserved
                </p>
                <h1 className="max-w-5xl font-serif text-6xl leading-[0.9] font-semibold tracking-[0.02em] text-foreground sm:text-7xl lg:text-[6rem]">
                  Hinterlassen Sie Ihre Stimme und Ihr Bild fuer die Zeit nach
                  dem Tod.
                </h1>
                <p className="max-w-3xl text-lg leading-loose text-muted">
                  Final Echo ist ein exklusiver Digital-Legacy-Dienst, mit dem
                  Sie persoenliche Audio-Nachrichten und filmische
                  Video-Botschaften fuer Ihre Hinterbliebenen aufnehmen,
                  sicher verwahren und erst nach verifizierter Freigabe
                  zugaenglich machen.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <a
                  className="inline-flex items-center justify-center rounded-full border border-accent-strong/80 bg-[linear-gradient(135deg,#fbe6b0_0%,#d6a146_40%,#b86d4d_100%)] px-8 py-4 text-sm font-medium uppercase tracking-[0.16em] text-[#2f1b0a] shadow-[inset_0_1px_0_rgba(255,245,219,0.75),0_16px_50px_rgba(214,161,70,0.26)] transition duration-500 hover:shadow-[inset_0_1px_0_rgba(255,245,219,0.9),0_20px_60px_rgba(214,161,70,0.34)]"
                  href="/login"
                >
                  Ein Vermaechtnis beginnen
                </a>
                <a
                  className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-8 py-4 text-sm uppercase tracking-[0.16em] text-foreground/85 transition duration-500 hover:border-accent hover:bg-accent-soft/80 hover:shadow-[0_0_28px_rgba(214,161,70,0.14)]"
                  href="/report"
                >
                  So funktioniert die Freigabe
                </a>
              </div>

              <div className="grid gap-5 pt-4 lg:grid-cols-3">
                {[
                  "Goldene Klanglinien fuer Audio-Botschaften",
                  "Filmische Vermaechtnisse in privater Verwahrung",
                  "Freigabe nur nach offizieller Verifikation",
                ].map((item) => (
                  <div
                    key={item}
                    className="luxury-frame rounded-[1.8rem] border border-border bg-card px-5 py-5 backdrop-blur-md"
                  >
                    <p className="text-sm leading-loose text-muted">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="luxury-frame relative min-h-[760px] overflow-hidden rounded-[2.8rem] border border-border bg-card-strong p-6 backdrop-blur-lg">
                <div className="absolute inset-6 rounded-[2.35rem] bg-[radial-gradient(circle_at_50%_18%,rgba(247,239,225,0.16),transparent_14%),radial-gradient(circle_at_24%_58%,rgba(214,161,70,0.24),transparent_18%),radial-gradient(circle_at_72%_70%,rgba(17,31,70,0.24),transparent_20%),linear-gradient(165deg,#3b1118_0%,#16111a_36%,#090909_100%)]" />
                <div className="absolute inset-x-14 top-14 h-px bg-gradient-to-r from-transparent via-accent-strong to-transparent" />
                <div className="relative flex h-full flex-col justify-between rounded-[2.3rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,245,219,0.05),rgba(0,0,0,0.16))] p-8">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-script text-3xl text-accent">
                        Vault of voice & vision
                      </p>
                      <FilmGlyph />
                    </div>

                    <div className="rounded-[2rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,248,237,0.08),rgba(255,248,237,0.02))] p-6 shadow-[inset_0_1px_0_rgba(255,245,219,0.14)]">
                      <div className="flex min-h-[420px] flex-col items-center justify-center gap-12 rounded-[1.7rem] bg-[radial-gradient(circle_at_50%_24%,rgba(247,239,225,0.24),transparent_12%),radial-gradient(circle_at_32%_52%,rgba(214,161,70,0.22),transparent_18%),radial-gradient(circle_at_70%_70%,rgba(17,31,70,0.26),transparent_18%),linear-gradient(165deg,#47251d_0%,#22171f_38%,#0b0b0b_100%)] px-8 py-10 shadow-[inset_0_0_80px_rgba(0,0,0,0.35)]">
                        <GoldPlaySeal />
                        <SoundwaveOrnament />
                        <div className="flex items-center gap-4 rounded-full border border-border bg-black/20 px-5 py-3">
                          <span className="h-10 w-10 rounded-full border border-accent-strong/40 bg-accent-soft" />
                          <span className="h-px w-28 bg-gradient-to-r from-accent-strong via-accent to-transparent" />
                          <span className="grid h-10 w-10 place-items-center rounded-full border border-accent-copper/40 bg-white/5 text-accent">
                            ▶
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {[
                      "Audio und Video sind allgegenwaertig Teil Ihres Vermaechtnisses",
                      "Abgesichert wie ein privater Tresorraum",
                      "Freigabe erst nach nachgewiesenem Todesfall",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[1.7rem] border border-border bg-surface px-5 py-4 shadow-[inset_0_1px_0_rgba(255,245,219,0.08)]"
                      >
                        <p className="text-sm uppercase tracking-[0.18em] text-accent-strong">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="space-y-5">
            <p className="font-script text-4xl text-accent">
              Two legacies, one house
            </p>
            <h2 className="max-w-xl font-serif text-5xl leading-tight text-foreground lg:text-6xl">
              Zwei Formen des Vermaechtnisses: die Stimme und das bewegte Bild.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {legacyExhibits.map((exhibit, index) => (
              <article
                key={exhibit.eyebrow}
                className={`luxury-frame rounded-[2.3rem] border border-border px-8 py-9 shadow-[0_26px_80px_rgba(0,0,0,0.26)] ${
                  index === 0
                    ? "bg-[linear-gradient(180deg,rgba(17,31,70,0.2),rgba(15,11,11,0.78))]"
                    : "translate-y-10 bg-[linear-gradient(180deg,rgba(59,17,24,0.28),rgba(15,11,11,0.78))]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-accent-strong">
                    {exhibit.eyebrow}
                  </p>
                  {index === 0 ? <SoundwaveOrnament /> : <GoldPlaySeal />}
                </div>
                <h3 className="mt-8 font-serif text-4xl leading-tight text-foreground">
                  {exhibit.title}
                </h3>
                <p className="mt-5 text-base leading-loose text-muted">
                  {exhibit.description}
                </p>

                {index === 0 ? (
                  <div className="mt-8 rounded-[1.8rem] border border-border bg-surface p-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-script text-3xl text-accent">
                        Audio heirloom
                      </span>
                      <span className="rounded-full border border-accent-strong/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent-strong">
                        Voice only
                      </span>
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-full border border-accent-strong/50 bg-[radial-gradient(circle_at_35%_30%,#fff1c8_0%,#f5d48e_22%,#d6a146_48%,#8b5429_100%)] text-[#3b210c]">
                        ▶
                      </div>
                      <div className="flex-1">
                        <div className="flex items-end gap-1">
                          {[12, 28, 18, 34, 24, 38, 20, 30, 16, 26, 14].map(
                            (height, itemIndex) => (
                              <span
                                key={`${height}-${itemIndex}`}
                                className="w-1.5 rounded-full bg-[linear-gradient(180deg,#fbe6b0_0%,#d6a146_70%,#b86d4d_100%)]"
                                style={{ height }}
                              />
                            ),
                          )}
                        </div>
                        <div className="mt-4 h-px bg-gradient-to-r from-accent-strong via-accent to-transparent" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-[1.8rem] border border-border bg-surface p-5">
                    <div className="aspect-video rounded-[1.4rem] border border-border bg-[radial-gradient(circle_at_50%_28%,rgba(247,239,225,0.18),transparent_18%),linear-gradient(165deg,#3d1320_0%,#18131e_42%,#0b0b0b_100%)] p-5">
                      <div className="flex h-full items-center justify-center rounded-[1rem] border border-accent-strong/20">
                        <GoldPlaySeal />
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-12 pb-10">
          <div className="space-y-5">
            <p className="font-script text-4xl text-accent">
              Security & the key mechanism
            </p>
            <h2 className="max-w-4xl font-serif text-5xl leading-tight text-foreground lg:text-6xl">
              Ein goldener Schluessel oeffnet nichts, bevor die Wirklichkeit es
              erlaubt.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {securityPanels.map((panel) => (
              <article
                key={panel.title}
                className="luxury-frame rounded-[2.2rem] border border-border bg-[linear-gradient(180deg,rgba(36,19,18,0.82),rgba(15,11,11,0.92))] px-7 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-sm transition duration-500 hover:border-accent-strong/50 hover:shadow-[0_32px_100px_rgba(0,0,0,0.32)]"
              >
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent-strong/40 bg-[radial-gradient(circle_at_30%_30%,rgba(251,230,176,0.62),rgba(214,161,70,0.3)_45%,rgba(0,0,0,0)_75%)] text-[#2f1b0a] shadow-[inset_0_1px_0_rgba(255,245,219,0.7),0_0_28px_rgba(214,161,70,0.28)]">
                    <KeyGlyph />
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-accent-strong">
                    Verified unlock
                  </span>
                </div>
                <div className="mb-6 h-px w-20 bg-gradient-to-r from-accent-strong via-accent-copper to-transparent" />
                <h3 className="font-serif text-3xl leading-tight text-foreground">
                  {panel.title}
                </h3>
                <p className="mt-4 text-sm leading-loose text-muted">
                  {panel.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
