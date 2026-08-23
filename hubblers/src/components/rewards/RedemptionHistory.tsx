import { useState } from 'react'
import type { Redemption } from '../../types'
import { equipCosmetic } from '../../services/rewardsApi'

interface RedemptionHistoryProps {
  redemptions: Redemption[]
  activeTheme: string | null
  activeFrame: string | null
  activeTitle: string | null
  onEquipSuccess: (type: 'THEME' | 'FRAME' | 'TITLE', value: string | null) => void
}

export function RedemptionHistory({
  redemptions,
  activeTheme,
  activeFrame,
  activeTitle,
  onEquipSuccess,
}: RedemptionHistoryProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [equipping, setEquipping] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  // Filter redeemed cosmetics
  const themeRedemptions = redemptions.filter((r) => r.category === 'THEME')
  const frameRedemptions = redemptions.filter((r) => r.category === 'FRAME')
  const titleRedemptions = redemptions.filter((r) => r.category === 'TITLE')
  const voucherRedemptions = redemptions.filter(
    (r) => r.category === 'DISCOUNT' || r.category === 'ACCESS' || r.category === 'BADGE',
  )

  async function handleToggleEquip(type: 'THEME' | 'FRAME' | 'TITLE', valueKey: string | null) {
    const isCurrentlyActive =
      (type === 'THEME' && activeTheme === valueKey) ||
      (type === 'FRAME' && activeFrame === valueKey) ||
      (type === 'TITLE' && activeTitle === valueKey)

    const nextValue = isCurrentlyActive ? null : valueKey
    setEquipping(`${type}_${valueKey}`)
    setMessage('')

    try {
      await equipCosmetic(type, nextValue)
      onEquipSuccess(type, nextValue)
      setMessage(nextValue ? `Equipped ${type.toLowerCase()}!` : `Unequipped ${type.toLowerCase()}.`)
    } catch (err) {
      console.error('Failed to update cosmetic:', err)
    } finally {
      setEquipping(null)
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2500)
    })
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>✓ {message}</span>
          <button onClick={() => setMessage('')} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* 1. COSMETICS WARDROBE */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cosmetics Wardrobe</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Equip your unlocked profile themes, frames, and special titles across HubblerX.
          </p>
        </div>

        <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-3">
          {/* Active Themes */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">🎨 Profile Themes</span>
              <span className="text-[10px] text-slate-400">{themeRedemptions.length} Unlocked</span>
            </div>

            {themeRedemptions.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400">No themes unlocked. Visit the XP Store to get one.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {themeRedemptions.map((r) => {
                  const themeKey = String(r.meta?.themeKey || '')
                  const isEquipped = activeTheme === themeKey
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition ${
                        isEquipped
                          ? 'border border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400'
                          : 'bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{r.rewardName}</span>
                      <button
                        onClick={() => handleToggleEquip('THEME', themeKey)}
                        disabled={equipping === `THEME_${themeKey}`}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          isEquipped
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active Frames */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">🖼️ Profile Frames</span>
              <span className="text-[10px] text-slate-400">{frameRedemptions.length} Unlocked</span>
            </div>

            {frameRedemptions.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400">No frames unlocked. Visit the XP Store to get one.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {frameRedemptions.map((r) => {
                  const frameKey = String(r.meta?.frameKey || '')
                  const isEquipped = activeFrame === frameKey
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition ${
                        isEquipped
                          ? 'border border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400'
                          : 'bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{r.rewardName}</span>
                      <button
                        onClick={() => handleToggleEquip('FRAME', frameKey)}
                        disabled={equipping === `FRAME_${frameKey}`}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          isEquipped
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active Special Titles */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">🎖️ Special Titles</span>
              <span className="text-[10px] text-slate-400">{titleRedemptions.length} Unlocked</span>
            </div>

            {titleRedemptions.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400">No titles unlocked. Visit the XP Store to get one.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {titleRedemptions.map((r) => {
                  const titleText = String(r.meta?.titleText || r.rewardName)
                  const isEquipped = activeTitle === titleText
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition ${
                        isEquipped
                          ? 'border border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400'
                          : 'bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{r.rewardName}</span>
                      <button
                        onClick={() => handleToggleEquip('TITLE', titleText)}
                        disabled={equipping === `TITLE_${titleText}`}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          isEquipped
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. VOUCHER & PASS WALLET */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Redeemed Vouchers & Passes</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Use your generated voucher codes during event checkout or registration.
          </p>
        </div>

        {voucherRedemptions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-3xl">🎟️</p>
            <p className="mt-2 text-xs">No discount vouchers or early access passes redeemed yet.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {voucherRedemptions.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    {r.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(r.redeemedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{r.rewardName}</h3>

                {/* Voucher Code Box */}
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-2.5 font-mono text-xs font-black text-slate-900 shadow-inner dark:bg-slate-950 dark:text-emerald-400">
                  <span>{r.redemptionCode}</span>
                  <button
                    onClick={() => handleCopy(r.redemptionCode)}
                    className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-sans font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                  >
                    {copiedCode === r.redemptionCode ? 'Copied! ✓' : 'Copy Code'}
                  </button>
                </div>

                <p className="mt-2 text-[10px] text-slate-400">Cost: {r.xpCost} XP · Status: Active</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
