export function ContactPage() {
  return (
    <main className="min-h-[calc(100dvh-88px)] bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-7">
        <header className="mb-12 text-center sm:mb-16">
          <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-green)]">
            Connect With Us
          </p>
          <h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--hx-text-primary)] sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-['DM_Sans'] text-base text-[var(--hx-text-muted)] sm:text-lg">
            Whether you're a student, campus club organizer, or university partner, we're here to help you get the most out of HubblerX.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          {/* Contact form card */}
          <div className="rounded-hero border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-6 sm:p-10">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="mt-1.5 w-full rounded-btn border border-[var(--hx-green-160)] bg-white px-3.5 py-2.5 font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] outline-none transition focus:border-[var(--hx-green)] focus:ring-2 focus:ring-[var(--hx-green-90)]"
                    placeholder="Alex"
                  />
                </div>
                <div>
                  <label className="block font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="mt-1.5 w-full rounded-btn border border-[var(--hx-green-160)] bg-white px-3.5 py-2.5 font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] outline-none transition focus:border-[var(--hx-green)] focus:ring-2 focus:ring-[var(--hx-green-90)]"
                    placeholder="Rivers"
                  />
                </div>
              </div>

              <div>
                <label className="block font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                  College / Institutional Email
                </label>
                <input
                  type="email"
                  className="mt-1.5 w-full rounded-btn border border-[var(--hx-green-160)] bg-white px-3.5 py-2.5 font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] outline-none transition focus:border-[var(--hx-green)] focus:ring-2 focus:ring-[var(--hx-green-90)]"
                  placeholder="alex@university.edu"
                />
              </div>

              <div>
                <label className="block font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                  Message / Inquiry
                </label>
                <textarea
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-btn border border-[var(--hx-green-160)] bg-white px-3.5 py-2.5 font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] outline-none transition focus:border-[var(--hx-green)] focus:ring-2 focus:ring-[var(--hx-green-90)]"
                  placeholder="Tell us how we can help..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 text-sm"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-6">
            <div className="rounded-card border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-[var(--hx-green-40)] font-[Manrope] text-base text-[var(--hx-green)]">
                  📍
                </div>
                <div>
                  <h3 className="font-[Manrope] text-base font-bold text-[var(--hx-text-primary)]">
                    Campus Network Headquarters
                  </h3>
                  <p className="mt-1 font-['DM_Sans'] text-sm leading-relaxed text-[var(--hx-text-muted)]">
                    HubblerX Learning Ecosystem<br />
                    Supporting universities, student clubs, and campus events.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-[var(--hx-green-40)] font-[Manrope] text-base text-[var(--hx-green)]">
                  ✉️
                </div>
                <div>
                  <h3 className="font-[Manrope] text-base font-bold text-[var(--hx-text-primary)]">
                    Email Support
                  </h3>
                  <p className="mt-1 font-['DM_Sans'] text-sm leading-relaxed text-[var(--hx-text-muted)]">
                    General: <span className="font-semibold text-[var(--hx-green)]">support@hubblerx.com</span><br />
                    Partnerships: <span className="font-semibold text-[var(--hx-green)]">partners@hubblerx.com</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] p-6">
              <h4 className="font-[Manrope] text-xs font-bold uppercase tracking-wider text-[var(--hx-green)]">
                Quick Response
              </h4>
              <p className="mt-2 font-['DM_Sans'] text-sm text-[var(--hx-text-primary)]">
                Our campus coordination team responds to all student and organizer inquiries within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}