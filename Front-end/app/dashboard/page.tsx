'use client'

import { useEffect, useState } from 'react'
import { Bell, CalendarDays, ChartNoAxesColumnIncreasing, CheckSquare, ChevronDown, FileText, Home, Menu, MessageSquare, MoreHorizontal, PanelLeft, Search, Settings, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react'

/** Read the non-HttpOnly wallet cookie that the BFF sets after successful auth. */
function readPublicWalletCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)aimarketplace_wallet_pub=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Abbreviate a wallet address: 0x1234…abcd */
function shortAddress(addr: string): string {
  if (addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const navItems = [
  { label: 'Dashboard', icon: Home },
  { label: 'Analytics', icon: ChartNoAxesColumnIncreasing },
  { label: 'Team', icon: Users },
  { label: 'Messages', icon: MessageSquare },
  { label: 'Documents', icon: FileText },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Settings', icon: Settings },
]

const teammates = [
  ['Sarah Kim', 'Design', 'SK', 'bg-[#5f7076]'],
  ['John Doe', 'Engineering', 'JD', 'bg-[#6b8292]'],
  ['Mike Taylor', 'Engineering', 'MT', 'bg-[#936f52]'],
  ['Lisa Park', 'Product', 'LP', 'bg-[#8d2630]'],
  ['Ravi Singh', 'Data', 'RS', 'bg-[#322b2e]'],
]

const stats = [
  ['Total projects', '24', '+2 from last month', FileText],
  ['Active tasks', '127', '+12 from yesterday', CheckSquare],
  ['Team members', '16', '+1 new member', Users],
  ['Completion rate', '87%', '+5% from last week', ChartNoAxesColumnIncreasing],
]

function ThroughputChart() {
  return <div className="relative mt-8 h-[260px] overflow-hidden rounded-xl bg-[#181818] px-10 pb-8 pt-4">
    <div className="absolute inset-x-10 top-4 flex h-[190px] flex-col justify-between text-[12px] text-[#8b8b8b]"><div className="border-t border-dashed border-white/[.07]">60</div><div className="border-t border-dashed border-white/[.07]">45</div><div className="border-t border-dashed border-white/[.07]">30</div><div className="border-t border-dashed border-white/[.07]">15</div><div className="border-t border-dashed border-white/[.07]">0</div></div>
    <svg className="absolute inset-x-10 top-4 h-[190px] w-[calc(100%-5rem)]" viewBox="0 0 700 190" preserveAspectRatio="none" aria-label="Task throughput line chart" role="img"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dedede" stopOpacity=".18" /><stop offset="1" stopColor="#dedede" stopOpacity="0" /></linearGradient></defs><path d="M0 150 C75 127 105 113 170 101 S250 89 320 72 S410 66 470 58 S575 34 700 16 L700 190 L0 190 Z" fill="url(#area)" /><path d="M0 150 C75 127 105 113 170 101 S250 89 320 72 S410 66 470 58 S575 34 700 16" fill="none" stroke="#f2f2f2" strokeWidth="2" /><path d="M0 137 C45 110 90 91 130 109 S185 170 225 128 S270 57 315 86 S365 119 408 91 S455 20 498 31 S578 63 700 72" fill="none" stroke="#979797" strokeDasharray="4 5" strokeWidth="2" /></svg>
    <div className="absolute inset-x-10 bottom-2 flex justify-between text-[12px] text-[#8b8b8b]">{['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5','Wk 6','Wk 7','Wk 8'].map((week) => <span key={week}>{week}</span>)}</div>
  </div>
}

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [wallet, setWallet] = useState<string | null>(null)

  // Read wallet address from non-HttpOnly cookie (set by BFF after successful auth)
  useEffect(() => {
    setWallet(readPublicWalletCookie())
  }, [])

  // Derive initials for the avatar — use wallet prefix when available
  const displayName = wallet ? shortAddress(wallet) : 'Jordan Diaz'
  const avatarInitials = wallet
    ? wallet.slice(2, 4).toUpperCase()
    : 'JD'
  return <main className="min-h-screen bg-[#090909] text-[#f4f4f4] font-sans">
    <div className="mx-auto flex min-h-screen max-w-[1536px] border-x border-white/[.08] bg-[#0b0b0b]">
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 flex w-[265px] flex-col border-r border-white/[.08] bg-[#181818] p-3 transition-transform lg:static lg:translate-x-0`}>
        <div className="flex items-center justify-between px-3 py-2"><a href="/" className="font-serif text-[16px] font-bold tracking-[-.06em]">PRISMATIC</a><button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button></div>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-white/[.06] bg-[#202020] p-2 text-[#c7c7c7]"><Sparkles className="size-4" /><span className="text-xs">Workspace</span><ChevronDown className="ml-auto size-3" /></div>
        <nav className="mt-4 flex flex-col gap-1">{navItems.map(({ label, icon: Icon }, index) => <a key={label} href={index === 0 ? '/dashboard' : '#'} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] ${index === 0 ? 'bg-[#2a2a2a] text-white' : 'text-[#d0d0d0] hover:bg-white/[.05]'}`}><Icon className="size-[17px]" />{label}</a>)}</nav>
        <div className="mt-8 px-3 text-[12px] text-[#a0a0a0]">Your team</div>
        <div className="mt-2 flex flex-col gap-1">{teammates.map(([name, role, initials, color]) => <div key={name} className="flex items-center gap-2 rounded-md px-2 py-1.5"><span className={`flex size-6 items-center justify-center rounded-full text-[9px] font-medium text-white ${color}`}>{initials}</span><span className="text-[14px] text-[#dedede]">{name}</span><span className="ml-auto text-[12px] text-[#a0a0a0]">{role}</span></div>)}</div>
        <div className="mt-auto flex items-center gap-2 border-t border-white/[.08] px-2 pt-4"><span className="flex size-7 items-center justify-center rounded-full bg-[#d7e0e2] text-[10px] text-[#333]">{avatarInitials}</span><div><div className="text-[14px]">{displayName}</div><div className="text-[12px] text-[#999]">{wallet ?? 'jordan@shadcnstore.com'}</div></div><MoreHorizontal className="ml-auto size-4 text-[#999]" /></div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" />}
      <section className="min-w-0 flex-1">
        <header className="flex h-[64px] items-center border-b border-white/[.08] px-6 sm:px-8"><button className="mr-5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button><PanelLeft className="mr-5 hidden size-4 text-[#d6d6d6] lg:block" /><h1 className="text-[20px] font-semibold">Welcome back, {displayName}</h1><div className="ml-auto flex items-center gap-6 text-[#dfdfdf]"><Search className="size-[18px]" /><Bell className="size-[17px]" /><span className="flex size-8 items-center justify-center rounded-full bg-[#dae3e3] text-[10px] text-[#333]">{avatarInitials}</span></div></header>
        <div className="px-6 py-6 sm:px-8 sm:py-7"><div className="grid gap-4 sm:grid-cols-2">{stats.map(([label, value, detail, Icon]) => <article key={label as string} className="rounded-2xl border border-white/[.12] bg-[#1a1a1a] p-6"><div className="flex items-start justify-between"><p className="text-[15px]">{label as string}</p><Icon className="size-[19px] text-[#a5a5a5]" /></div><p className="mt-8 text-[24px] font-semibold tracking-[-.04em]">{value as string}</p><p className="mt-1 text-[13px] text-[#999]">{detail as string}</p></article>)}</div>
          <section className="mt-6 rounded-2xl border border-white/[.12] bg-[#1a1a1a] p-6"><div><h2 className="text-[17px] font-semibold">Task throughput</h2><p className="mt-1 text-[14px] text-[#999]">Tasks opened against tasks completed over the last eight weeks</p></div><ThroughputChart /></section>
        </div>
      </section>
    </div>
  </main>
}
