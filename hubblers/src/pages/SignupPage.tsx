import { Link } from 'react-router-dom'

export function SignupPage() {
  const cards = [
    {
      to: '/student-signup',
      title: 'Student',
      description: 'Join your college network to participate in events, earn credits, and grow your campus profile.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
          <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174V15a.75.75 0 01-.75.75c-.876 0-1.7-.19-2.4-.5a.75.75 0 01-.6-.75V12.14a50.167 50.167 0 00-2.6-1.082.75.75 0 01-.231-1.337A60.65 60.65 0 0111.7 2.805z" />
          <path d="M13.5 15.756V21.75a.75.75 0 01-.75.75c-2.25 0-4.5-.75-4.5-3.75 0-1.5.5-2.963 1.5-3.882a49.93 49.93 0 003.75-.612z" />
        </svg>
      ),
    },
    {
      to: '/organizer-signup',
      title: 'Organizer',
      description: 'Register your college, club, or organization to host events and engage with the community.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
      ),
    },
  ]

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-4xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-[2.5rem] border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95 sm:p-12">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400 font-bold">
            Create your account
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Who are you?</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
Select your role to get started with INAIV.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="group flex flex-col items-start gap-5 rounded-[2rem] border border-slate-200 bg-white p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-500 transition group-hover:bg-emerald-500 group-hover:text-slate-950">
                {card.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{card.description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Sign up as {card.title}
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
