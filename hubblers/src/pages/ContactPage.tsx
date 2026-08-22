export function ContactPage() {
  return (
    <main className="mx-auto min-h-[calc(100dvh-88px)] max-w-7xl px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <header className="mb-16 text-center">
<p className="text-sm uppercase tracking-[0.3em] text-emerald-500 font-bold">Connect With Us</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900 dark:text-white sm:text-6xl">Contact INAIV</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Whether you're a student, an event organizer, or just curious about our platform, we're here to help. Reach out and let's start a conversation.
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[3rem] border border-slate-200 bg-white p-8 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-900/50 lg:p-12">
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">First Name</label>
                <input 
                  type="text" 
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                <input 
                  type="text" 
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
                  placeholder="Smith"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">College Email</label>
              <input 
                type="email" 
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
                placeholder="jane@university.edu"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">How can we help?</label>
              <textarea 
                rows={5} 
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
                placeholder="Tell us about your inquiry..."
              ></textarea>
            </div>
            <button className="w-full rounded-full bg-emerald-500 py-5 text-lg font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 hover:scale-[1.01] active:scale-95">
              Send Message ➤
            </button>
          </form>
        </div>

        <div className="flex flex-col space-y-12 lg:justify-center lg:pl-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Information</h3>
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  📍
                </div>
                <div>
<h4 className="font-bold text-slate-900 dark:text-white">Our Headquarters</h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">INAIV Campus Connect Center<br/>Community for Student Activities</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  ✉️
                </div>
                <div>
<h4 className="font-bold text-slate-900 dark:text-white">Email Us</h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">support@inaiv.com<br/>partners@inaiv.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}