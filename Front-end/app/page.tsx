
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

const navItems = ['Explore', 'Dashboard', 'Upload model', 'Company']

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-hidden bg-[#030303] text-white selection:bg-cyan-300 selection:text-black">
      <section className="relative isolate min-h-[760px] border-x border-white/15 bg-[#030303] lg:min-h-[810px]">

        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_56%,rgba(0,220,255,.08),transparent_22%),radial-gradient(circle_at_88%_45%,rgba(255,69,51,.08),transparent_25%)]" />

        <div className="absolute inset-0 -z-10 opacity-55 [background-image:repeating-radial-gradient(ellipse_at_70%_57%,transparent_0,transparent_5px,rgba(255,255,255,.025)_6px,transparent_8px)] [background-size:100%_115%]" />

        <div
          aria-hidden="true"
          className="spectral-beam pointer-events-none absolute right-[-12%] top-[30%] z-0 hidden h-[43%] w-[67%] skew-y-[-10deg] blur-[10px] lg:block"
          style={{
            background:
              'linear-gradient(164deg, transparent 0%, rgba(255,55,50,.88) 25%, rgba(255,173,120,.9) 36%, rgba(255,255,255,.98) 47%, rgba(0,218,255,.98) 61%, rgba(30,93,255,.65) 72%, transparent 100%)',
            clipPath: 'polygon(0 48%, 100% 0, 100% 100%, 0 52%)',
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-4%] top-[38%] -z-10 hidden h-[18%] w-[52%] blur-[20px] lg:block"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,.92) 40%, rgba(19,210,255,.72) 80%, transparent)',
          }}
        />

        <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-6 py-7 sm:px-10 lg:px-12">

          <a
            href="#top"
            className="font-serif text-[15px] tracking-[-.04em] text-white/90"
          >
            PRISMATIC
          </a>

          <nav
            className="hidden items-center gap-11 md:flex"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <a
                key={item}
                href={
                  item === 'Explore'
                    ? '/explore'
                    : item === 'Dashboard'
                      ? '/dashboard'
                      : item === 'Upload model'
                        ? '/upload'
                        : '#company'
                }
                className="text-[12px] font-medium uppercase tracking-[.08em] text-white/65 transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <Button
            onClick={() => setMenuOpen((open) => !open)}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>

          {menuOpen && (
            <nav className="absolute left-5 right-5 top-20 z-20 flex flex-col gap-1 rounded-2xl border border-white/15 bg-black/95 p-3 shadow-2xl md:hidden">
              {navItems.map((item) => (
                <a
                  onClick={() => setMenuOpen(false)}
                  key={item}
                  href={
                    item === 'Explore'
                      ? '/explore'
                      : item === 'Dashboard'
                        ? '/dashboard'
                        : item === 'Upload model'
                          ? '/upload'
                          : '#company'
                  }
                  className="rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  {item}
                </a>
              ))}
            </nav>
          )}
        </header>

        <div
          id="top"
          className="relative z-10 mx-auto flex max-w-[1440px] flex-col px-6 pb-28 pt-14 sm:px-10 lg:px-12 lg:pt-24"
        >
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[.03em] text-white/75">
            AI-powered clarity
          </p>

          <h1 className="max-w-[650px] font-serif text-[clamp(4rem,7.2vw,7.6rem)] leading-[.84] tracking-[-.075em] text-white">
            Clarity Today
            <br />
            Impact Tomorrow
          </h1>

          <p className="mt-8 max-w-[580px] text-base leading-relaxed text-white/50 sm:text-[17px]">
            Prismatic helps forward-thinking teams turn complexity into
            clarity—so they can move faster and build what matters.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">

            {/* Explore Platform */}
            <a href="#product">
              <Button
                className="w-fit rounded-full border border-white/40 bg-white/10 px-8 py-6 font-serif text-base text-white shadow-[inset_0_0_18px_rgba(255,255,255,.16)] backdrop-blur-sm transition-all hover:scale-[1.02] hover:bg-white/20"
              >
                Explore Platform
                <ArrowRight data-icon="inline-end" />
              </Button>
            </a>

            {/* Connect Wallet */}
            <Link href="/login">
              <Button
                variant="ghost"
                className="rounded-full px-6 py-6 text-white/60 hover:bg-white/10 hover:text-white"
              >
                Connect wallet
              </Button>
            </Link>

          </div>
        </div>

        <div className="absolute top-[57%] left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-white/80 to-transparent lg:block" />

        <div className="absolute top-[calc(57%-41px)] left-[51%] hidden size-[82px] -translate-x-1/2 rotate-45 border border-white/40 bg-[#050505] shadow-[0_0_28px_rgba(255,255,255,.2)] lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_47%,#ff8585_48%,#ff6c9e_64%,transparent_65%),linear-gradient(45deg,transparent_47%,#13d8ff_48%,#0a80ff_66%,transparent_67%)] opacity-95" />
        </div>

        <div className="absolute bottom-7 left-6 right-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-[10px] font-semibold tracking-[.12em] text-white/35 sm:left-10 lg:left-12">
          <span>△ ALTITUDE</span>
          <span>Ｎ NORTHWIND</span>
          <span>◯ QUANTUM</span>
          <span>∿ SUMMIT</span>
          <span>≡ ELEVATE</span>
        </div>
      </section>

      <section
        id="product"
        className="border-x border-t border-white/10 bg-[#070707] px-6 py-28 sm:px-10 lg:px-12"
      >
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[.18em] text-cyan-300/75">
              The clarity engine
            </p>

            <h2 className="max-w-xl font-serif text-5xl leading-[.95] tracking-[-.06em] text-white sm:text-7xl">
              See the signal
              <br />
              inside the noise.
            </h2>
          </div>

          <p className="max-w-md text-base leading-7 text-white/45">
            One living system for the questions that move your business
            forward. Prismatic turns fragmented data into a point of view
            your whole team can act on.
          </p>
        </div>

        <div className="mx-auto mt-20 grid max-w-[1440px] gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
          {[
            ['01', 'Illuminate', 'Surface what matters before it becomes urgent.'],
            ['02', 'Align', 'Give every team one shared source of truth.'],
            ['03', 'Accelerate', 'Move from knowing to doing without the drag.'],
          ].map(([num, title, copy]) => (
            <article
              key={num}
              className="group bg-[#0b0b0b] p-8 transition-colors hover:bg-[#111] sm:p-10"
            >
              <span className="font-mono text-xs text-white/30">{num}</span>

              <h3 className="mt-20 font-serif text-3xl tracking-[-.04em]">
                {title}
              </h3>

              <p className="mt-4 max-w-xs text-sm leading-6 text-white/45">
                {copy}
              </p>

              <ArrowRight className="mt-10 text-cyan-300 opacity-0 transition-all group-hover:translate-x-2 group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </section>

      <section
        id="solutions"
        className="relative border-x border-t border-white/10 bg-[#050505] px-6 py-28 sm:px-10 lg:px-12"
      >
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs uppercase tracking-[.18em] text-white/35">
            Built for momentum
          </p>

          <div className="mt-8 grid gap-16 lg:grid-cols-2">
            <h2 className="font-serif text-5xl leading-none tracking-[-.06em] sm:text-7xl">
              Complexity is a
              <br />
              <span className="text-white/35">choice.</span>
            </h2>

            <div className="flex flex-col justify-end">
              <p className="max-w-md text-lg leading-8 text-white/55">
                From first signal to final decision, Prismatic makes the
                invisible visible—and gives your best thinking room to
                compound.
              </p>

              <a
                href="#resources"
                className="mt-8 flex w-fit items-center gap-3 text-sm text-white underline-offset-8 hover:underline"
              >
                Discover the system
                <ChevronDown className="-rotate-90" />
              </a>
            </div>
          </div>

          <div className="mt-24 h-px bg-gradient-to-r from-cyan-300/70 via-white/20 to-transparent" />
        </div>
      </section>

      <section
        id="resources"
        className="border-x border-t border-white/10 bg-[#f1eee8] px-6 py-24 text-[#0a0a0a] sm:px-10 lg:px-12"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-10 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[.18em] text-black/45">
                A better way forward
              </p>

              <h2 className="mt-5 max-w-2xl font-serif text-5xl leading-[.92] tracking-[-.06em] sm:text-7xl">
                Make the next
                <br />
                move obvious.
              </h2>
            </div>

            {/* Talk to Prismatic */}
            <a href="#company">
              <Button className="w-fit rounded-full bg-black px-7 py-6 font-serif text-white hover:bg-black/80">
                Talk to Prismatic
                <ArrowRight data-icon="inline-end" />
              </Button>
            </a>
          </div>

          <div className="mt-20 grid gap-10 border-t border-black/15 pt-6 text-sm sm:grid-cols-3">
            <div>
              <span className="text-black/40">01</span>
              <p className="mt-8 max-w-[220px] leading-6">
                Decide with confidence, even when the path is new.
              </p>
            </div>

            <div>
              <span className="text-black/40">02</span>
              <p className="mt-8 max-w-[220px] leading-6">
                Create alignment that lasts beyond the meeting.
              </p>
            </div>

            <div>
              <span className="text-black/40">03</span>
              <p className="mt-8 max-w-[220px] leading-6">
                Build an advantage that compounds over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer
        id="company"
        className="border-x border-t border-white/10 bg-[#030303] px-6 py-10 text-white sm:px-10 lg:px-12"
      >
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <span className="font-serif text-sm tracking-[-.04em]">
            PRISMATIC
          </span>

          <div className="flex gap-6 text-xs text-white/40">
            <a href="#product" className="hover:text-white">
              Platform
            </a>

            <a href="#solutions" className="hover:text-white">
              Solutions
            </a>

            <a href="#resources" className="hover:text-white">
              Contact
            </a>
          </div>

          <span className="text-xs text-white/25">
            © 2026 Prismatic
          </span>
        </div>
      </footer>
    </main>
  )
}

