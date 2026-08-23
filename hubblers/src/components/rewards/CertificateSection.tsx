import { useState } from 'react'
import type { Certificate } from '../../types'
import { CertificateModal } from './CertificateModal'

interface CertificateSectionProps {
  certificates: Certificate[]
  onClaim?: (eventId: string) => void
}

export function CertificateSection({ certificates }: CertificateSectionProps) {
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Earned Certificates</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {certificates.length} Verified
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Official credentials automatically issued upon verified event attendance. +25 XP earned per certificate.
          </p>
        </div>
      </div>

      {/* Certificate Cards */}
      {certificates.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-4xl">📜</p>
          <h3 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            No certificates earned yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Attend workshops, competitions, or volunteering events to automatically receive verified certificates and +25 XP.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-slate-900/40 to-slate-900 p-5 shadow-sm transition hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 dark:border-amber-500/20"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-500 dark:text-amber-400 border border-amber-500/30">
                    {cert.eventCategory || 'EVENT'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{cert.verificationCode}</span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {cert.eventTitle}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{cert.collegeName}</p>

                <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>📅 {new Date(cert.issuedAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span className="font-semibold text-emerald-400">+25 XP Awarded</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:from-amber-400 hover:to-amber-500 active:scale-95"
                >
                  <span>👁️</span>
                  <span>View & Download Certificate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CertificateModal
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </section>
  )
}
