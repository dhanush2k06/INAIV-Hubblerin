export function AboutPage() {
  return (
    <main className="min-h-[calc(100dvh-88px)] bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-7">
        <header className="mb-12 text-center sm:mb-16">
          <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-green)]">
            Our Journey & Purpose
          </p>
          <h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--hx-text-primary)] sm:text-5xl">
            About HubblerX
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-['DM_Sans'] text-base text-[var(--hx-text-muted)] sm:text-lg">
            Empowering students to learn beyond the classroom through campus experiences, verified participation, and collaborative growth.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <section>
              <h2 className="font-[Manrope] text-2xl font-bold text-[var(--hx-text-primary)] sm:text-3xl">
                The HubblerX Vision
              </h2>
              <p className="mt-4 font-['DM_Sans'] text-base leading-relaxed text-[var(--hx-text-muted)]">
                College is far more than lectures and exams. HubblerX bridges the gap between campus events and lifelong student achievements — giving students a unified passport to discover workshops, hackathons, fests, and volunteering drives while earning verifiable skills, credentials, and rewards.
              </p>
            </section>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-card border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-6 transition hover:border-[var(--hx-green)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-btn bg-[var(--hx-green-40)] font-[Manrope] text-lg text-[var(--hx-green)]">
                  🎯
                </div>
                <h3 className="mt-4 font-[Manrope] text-base font-bold text-[var(--hx-text-primary)]">
                  Our Mission
                </h3>
                <p className="mt-1.5 font-['DM_Sans'] text-sm leading-relaxed text-[var(--hx-text-muted)]">
                  To inspire and recognize student growth beyond traditional coursework through active extracurricular participation.
                </p>
              </div>

              <div className="rounded-card border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-6 transition hover:border-[var(--hx-green)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-btn bg-[var(--hx-green-40)] font-[Manrope] text-lg text-[var(--hx-green)]">
                  ⚡
                </div>
                <h3 className="mt-4 font-[Manrope] text-base font-bold text-[var(--hx-text-primary)]">
                  Organizer Automation
                </h3>
                <p className="mt-1.5 font-['DM_Sans'] text-sm leading-relaxed text-[var(--hx-text-muted)]">
                  To provide campus organizers with seamless CRM tools, QR check-ins, automated certificates, and actionable attendee analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-hero border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[var(--hx-green-160)] pb-4">
                <span className="font-[Manrope] text-xs font-bold uppercase tracking-wider text-[var(--hx-green)]">
                  The Experience Cycle
                </span>
                <span className="hx-tag">Campus Verified</span>
              </div>
              <div className="space-y-4 font-['DM_Sans']">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--hx-green)] text-xs font-bold text-white">1</span>
                  <p className="text-sm text-[var(--hx-text-primary)]"><strong className="font-[Manrope]">Discover:</strong> Browse vetted competitions, workshops, fests, and community drives.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--hx-green)] text-xs font-bold text-white">2</span>
                  <p className="text-sm text-[var(--hx-text-primary)]"><strong className="font-[Manrope]">Participate:</strong> 1-click registration with instant QR codes for hassle-free check-ins.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--hx-green)] text-xs font-bold text-white">3</span>
                  <p className="text-sm text-[var(--hx-text-primary)]"><strong className="font-[Manrope]">Achieve & Grow:</strong> Earn verified certificates, build your Activity Passport, and level up your XP.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}