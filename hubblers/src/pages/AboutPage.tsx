export function AboutPage() {
  return (
    <main className="mx-auto min-h-[calc(100dvh-88px)] max-w-7xl px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <header className="mb-16 text-center">
<p className="text-sm uppercase tracking-[0.3em] text-emerald-500 font-bold">Our Journey</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900 dark:text-white sm:text-6xl">About INAIV</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          INAIV empowers students to explore activities beyond their studies while giving organizers an effortless way to plan, run, and manage events.
        </p>
      </header>

      <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8">
          <section>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">The INAIV Vision</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              College is more than just lectures and exams. INAIV creates a space where students can grow beyond the classroom — joining workshops, fests, and activities that build real skills and memorable experiences — while automating the busywork so organizers can focus on what matters.
            </p>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 transition-colors dark:border-slate-800 dark:bg-slate-900/50">
              <div className="text-3xl">🎯</div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Our Mission</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">To give students a platform that encourages activities and growth beyond their college studies.</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 transition-colors dark:border-slate-800 dark:bg-slate-900/50">
              <div className="text-3xl">🚀</div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Our Goal</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">To help organizers automate their regular event process — from registration to attendance.</p>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 rounded-[3rem] bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-20 blur transition duration-1000 group-hover:opacity-30"></div>
          <div className="relative rounded-[2.5rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900/80">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
              alt="Team INAIV" 
              className="rounded-[2rem] object-cover aspect-video w-full" 
            />
          </div>
        </div>
      </div>
    </main>
  )
}