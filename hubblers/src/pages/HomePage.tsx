import { Link } from 'react-router-dom'

const events = [
  {
    title: 'Campus Tech Fest 2026',
    date: 'July 18, 2026',
    location: 'North Campus Auditorium',
    price: '₹299',
    description: 'Hands-on workshops, live demos, and industry speaker sessions. Includes lunch and swag bag.',
  },
  {
    title: 'Leadership Summit',
    date: 'August 2, 2026',
    location: 'Central Lecture Hall',
    price: '₹199',
    description: 'Panels with alumni and industry leaders on management and entrepreneurship.',
  },
  {
    title: 'Career Sprint',
    date: 'September 12, 2026',
    location: 'Innovation Center',
    price: '₹249',
    description: 'Mock interviews, resume workshops, and direct interaction with HR representatives.',
  },
]

const testimonials = [
  {
    quote: 'Registering for workshops and fests takes seconds. My QR pass arrives instantly, and check-in at the venue is seamless.',
    name: 'Aditi Sharma',
    role: 'Computer Science, Student',
  },
  {
    quote: 'INAIV automates our entire event process — from registration to attendance. It has saved our team hours every single time.',
    name: 'Dr. Ravi Menon',
    role: 'College Organizer',
  },
  {
    quote: 'Planning, promoting, and validating attendance is now completely stress-free. Our students are more engaged than ever.',
    name: 'Neha Patel',
    role: 'Event Organizer',
  },
]

export function HomePage({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <main className="bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl space-y-8">
<div className="inline-flex rounded-full bg-emerald-500/10 px-4 py-1 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                Grow beyond your studies
              </div>
<div className="space-y-5">
                <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                  Discover, Join &amp; Grow Through Activities.
                </h1>
                <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
                  INAIV is the platform that encourages students to take part in activities beyond college studies — discover workshops, fests, and events, register in seconds, and enter with a digital QR pass.
                </p>
              </div>
{isAuthenticated ? (
                <Link
                  to="/events"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                >
                  View Events
                </Link>
              ) : (
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
                >
                  Login
                </Link>
              </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_40px_120px_-40px_rgba(15,23,42,0.85)] sm:p-8">
              <div className="grid gap-6">
                <div className="space-y-4">
<p className="text-sm uppercase tracking-[0.3em] text-emerald-400 font-bold">Live Activity Registrations</p>
                  <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">This week&apos;s top activities</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5 transition-colors duration-300 dark:bg-slate-950/90">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Instant Registration</p>
                    <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Join in seconds</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Register for workshops and events in seconds with a seamless, mobile-friendly experience.</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5 transition-colors duration-300 dark:bg-slate-950/90">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">QR Check-in</p>
                    <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Scan &amp; attend</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Your activity pass is a unique QR code — validated instantly at the venue.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 px-4 py-16 transition-colors duration-300 dark:border-slate-800 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-3">
<div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 transition-colors duration-300 dark:bg-slate-900/90 dark:ring-slate-800">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Activity Discovery</p>
              <h3 className="font-display mt-4 text-2xl font-bold text-slate-900 dark:text-white">Find activities worth joining</h3>
              <p className="mt-3 text-slate-600 dark:text-slate-400">Explore a curated catalog of workshops, fests, and events with dates and venues — all in one place.</p>
            </div>
            <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 transition-colors duration-300 dark:bg-slate-900/90 dark:ring-slate-800">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">QR Passes</p>
              <h3 className="font-display mt-4 text-2xl font-bold text-slate-900 dark:text-white">QR passes, zero paper</h3>
              <p className="mt-3 text-slate-600 dark:text-slate-400">Every registration generates a unique QR pass delivered instantly. Scan to attend — fast, secure, and eco-friendly.</p>
            </div>
            <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 transition-colors duration-300 dark:bg-slate-900/90 dark:ring-slate-800">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Automated Events</p>
              <h3 className="font-display mt-4 text-2xl font-bold text-slate-900 dark:text-white">Automated tools for organizers</h3>
              <p className="mt-3 text-slate-600 dark:text-slate-400">Organizers get automated registration, attendee lists, and attendance verification — no more manual work.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div>
<p className="text-sm uppercase tracking-[0.3em] text-emerald-500 font-bold">Our Journey</p>
              <h2 className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">About INAIV</h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Student life is more than lectures and exams. INAIV builds the platform that encourages students to take part in activities beyond college studies — discovering new skills, meeting people, and growing.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 transition-colors dark:border-slate-800 dark:bg-slate-900/50">
                <div className="text-3xl">🎯</div>
                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Empower Students</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Encourage students to take part in activities beyond their college studies.</p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 transition-colors dark:border-slate-800 dark:bg-slate-900/50">
                <div className="text-3xl">🚀</div>
                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Automate for Organizers</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Help organizers automate the entire process of conducting events.</p>
              </div>
            </div>
          </div>
          <div className="relative rounded-[2.5rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900/80">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" alt="Students at a campus event" className="rounded-[2rem] object-cover w-full aspect-video" />
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="bg-slate-50 px-4 py-16 transition-colors duration-300 dark:bg-slate-900/70 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
<p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Featured activities</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Registrations now open</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {events.map((event) => (
              <article key={event.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">{event.date}</p>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-500 ring-1 ring-emerald-500/20">{event.price}</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900 transition-colors group-hover:text-emerald-500 dark:text-emerald-50 dark:group-hover:text-emerald-400">{event.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
                <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-200">📍 {event.location}</p>
                <Link
                  to="/events"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
Register Now
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-16 transition-colors duration-300 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Student stories</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Loved by students &amp; organizers</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-3xl border border-slate-200 bg-white p-8 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">“{item.quote}”</p>
                <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-500 transition-colors duration-300 dark:border-slate-800 dark:text-slate-400">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                  <p>{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 transition-colors duration-300">
        <header className="mb-16 text-center">
<p className="text-sm uppercase tracking-[0.3em] text-emerald-500 font-bold">Connect With Us</p>
          <h2 className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">Contact INAIV</h2>
        </header>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[3rem] border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900/50 lg:p-12">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-6 sm:grid-cols-2">
                <input type="text" placeholder="First Name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-emerald-500" />
                <input type="text" placeholder="Last Name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-emerald-500" />
              </div>
              <input type="email" placeholder="College Email" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-emerald-500" />
              <textarea rows={4} placeholder="How can we help with your activity or event?" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:border-emerald-500"></textarea>
              <button className="w-full rounded-full bg-emerald-500 py-4 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all">Send Message ➤</button>
            </form>
          </div>
          <div className="flex flex-col space-y-10 lg:justify-center">
            <div className="flex gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">📍</div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Headquarters</h4>
                <p className="text-slate-600 dark:text-slate-400">123 Innovation Way, Student District</p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">✉️</div>
              <div>
<h4 className="font-bold text-slate-900 dark:text-white">Email Us</h4>
                <p className="text-slate-600 dark:text-slate-400">support@inaiv.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-t-[3rem] bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-16 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
<p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Ready to grow beyond your studies?</p>
<h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">Join an activity today and never miss out on growth.</h2>
{isAuthenticated ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/events"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                View Events
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

