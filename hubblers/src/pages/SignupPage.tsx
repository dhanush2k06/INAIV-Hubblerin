import { Link } from 'react-router-dom'

export function SignupPage() {
  const cards = [
    {
      to: '/student-signup',
      title: 'Student',
      subtitle: 'Discover & grow',
      description: 'Join your campus network. Participate in events, earn XP, and build a verified activity record.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174V15a.75.75 0 01-.75.75c-.876 0-1.7-.19-2.4-.5a.75.75 0 01-.6-.75V12.14a50.167 50.167 0 00-2.6-1.082.75.75 0 01-.231-1.337A60.65 60.65 0 0111.7 2.805z" />
          <path d="M13.5 15.756V21.75a.75.75 0 01-.75.75c-2.25 0-4.5-.75-4.5-3.75 0-1.5.5-2.963 1.5-3.882a49.93 49.93 0 003.75-.612z" />
        </svg>
      ),
    },
    {
      to: '/college-signup',
      title: 'College',
      subtitle: 'Host & manage',
      description: 'Register your institution to host campus events, manage registrations, and engage your students.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 18.75a6.75 6.75 0 017.5 0v3.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v-3.75z" clipRule="evenodd" />
        </svg>
      ),
    },
  ]

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-2xl flex-col items-center justify-center px-4 py-12 sm:px-6">

      {/* Header */}
      <div className="mb-8 text-center">
        <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">
          Get started
        </p>
        <h1 className="mt-2 font-[Manrope] text-2xl font-extrabold tracking-tight text-[var(--hx-text-primary)]">
          Create your account
        </h1>
        <p className="mt-2 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
          Select your role to get started with HubblerX.
        </p>
      </div>

      {/* Role cards */}
      <div className="w-full grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="group hx-card flex flex-col gap-4 p-6 text-left"
          >
            {/* Icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-green)] transition-colors group-hover:border-[var(--hx-green)] group-hover:bg-[var(--hx-green)] group-hover:text-white">
              {card.icon}
            </div>

            {/* Content */}
            <div>
              <p className="font-[Manrope] text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">
                {card.subtitle}
              </p>
              <h2 className="mt-0.5 font-[Manrope] text-lg font-bold text-[var(--hx-text-primary)]">
                {card.title}
              </h2>
              <p className="mt-2 font-['DM_Sans'] text-sm leading-6 text-[var(--hx-text-muted)]">
                {card.description}
              </p>
            </div>

            {/* CTA */}
            <div className="mt-auto flex items-center gap-1.5 font-[Manrope] text-sm font-semibold text-[var(--hx-green)] transition-transform group-hover:gap-2.5">
              Sign up as {card.title}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-6 text-center font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="font-[Manrope] font-semibold text-[var(--hx-green)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
