import type { Certificate } from '../../types'

interface CertificateModalProps {
  certificate: Certificate | null
  onClose: () => void
}

export function CertificateModal({ certificate, onClose }: CertificateModalProps) {
  if (!certificate) return null

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 p-4 sm:p-8 shadow-2xl">
        {/* Actions bar */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Verified Certificate of Completion</h3>
            <p className="text-xs text-slate-400">Credential ID: {certificate.verificationCode}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
            >
              <span>🖨️</span>
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>

        {/* Certificate Sheet (Printable Canvas) */}
        <div
          id="printable-certificate"
          className="relative overflow-hidden rounded-2xl border-4 sm:border-8 border-double border-amber-600/60 bg-gradient-to-b from-amber-50/95 via-white to-amber-50/90 p-4 sm:p-14 text-slate-900 shadow-xl"
        >
          {/* Watermark Logo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
            <span className="text-[12rem] font-black uppercase tracking-widest text-amber-950">HUBBLERX</span>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-3 left-3 h-10 w-10 border-t-2 border-l-2 border-amber-600/80" />
          <div className="absolute top-3 right-3 h-10 w-10 border-t-2 border-r-2 border-amber-600/80" />
          <div className="absolute bottom-3 left-3 h-10 w-10 border-b-2 border-l-2 border-amber-600/80" />
          <div className="absolute bottom-3 right-3 h-10 w-10 border-b-2 border-r-2 border-amber-600/80" />

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Header */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">✨</span>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">
                HubblerX Official Credential
              </p>
              <span className="text-2xl">✨</span>
            </div>

            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Certificate of Achievement
            </h1>

            <p className="mt-4 text-xs uppercase tracking-widest text-slate-500">
              This is proudly presented to
            </p>

            {/* Recipient Name */}
            <div className="mt-3 inline-block border-b-2 border-amber-500/80 pb-2 px-8">
              <h2 className="font-serif text-2xl font-black text-amber-900 sm:text-4xl">
                {certificate.studentName}
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-600 font-medium">{certificate.collegeName}</p>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-700">
              For successful participation and exemplary engagement in the verified campus event{' '}
              <strong className="text-slate-950 font-bold">"{certificate.eventTitle}"</strong> ({certificate.eventCategory}),
              demonstrating commitment to continuous learning, collaborative innovation, and leadership.
            </p>

            {/* Verification & Signatures */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 items-end gap-6 border-t border-amber-300/80 pt-6 text-left">
              {/* Verification QR & ID */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credential ID</p>
                <p className="font-mono text-xs font-bold text-slate-900">{certificate.verificationCode}</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Gold Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-600 bg-amber-500 text-3xl text-slate-950 shadow-md shadow-amber-500/30">
                  🏅
                </div>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-amber-900">
                  Verified Seal
                </p>
              </div>

              {/* Authorized Signatory */}
              <div className="sm:text-right">
                <div className="font-serif text-lg font-bold italic text-slate-800">
                  {certificate.organizerName}
                </div>
                <div className="mt-1 border-t border-slate-400 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Authorized Signatory
                  </p>
                  <p className="text-[10px] text-slate-400">HubblerX Event Directorate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
