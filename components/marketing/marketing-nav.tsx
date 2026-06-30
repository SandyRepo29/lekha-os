"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PLATFORM_ITEMS = [
  { label: "Platform Overview",        href: "/platform",                              desc: "Everything inside AUDT" },
  { label: "Vendor Governance",        href: "/platform#vendor-governance",            desc: "Vendor lifecycle management" },
  { label: "Trust Operations",         href: "/platform#trust-operations",             desc: "Assessments & evidence" },
  { label: "Risk & Compliance",        href: "/platform#risk-compliance",              desc: "Risk, controls & frameworks" },
  { label: "Trust Intelligence",       href: "/platform#trust-intelligence",           desc: "AI insights & Trust Score™" },
  { label: "Trust Operations Engine™", href: "/platform#trust-operations-engine",      desc: "Workflow & automation layer" },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [mobilePlatOpen, setMobilePlatOpen] = useState(false);
  const [dropOpen, setDropOpen]         = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openDrop  = () => { if (timerRef.current) clearTimeout(timerRef.current); setDropOpen(true); };
  const closeDrop = () => { timerRef.current = setTimeout(() => setDropOpen(false), 120); };
  const close     = () => { setMobileOpen(false); setMobilePlatOpen(false); };

  return (
    <>
      <style>{`
        .ndrop-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          width: 270px;
          background: #FFFFFF;
          border: 1px solid #E4E8EF;
          border-radius: 14px;
          padding: 8px;
          z-index: 200;
          box-shadow: 0 8px 32px rgba(30,41,59,0.12), 0 2px 8px rgba(30,41,59,0.06);
          animation: dropIn .15s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .ndrop-item {
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 14px; border-radius: 9px;
          text-decoration: none; transition: background .12s;
        }
        .ndrop-item:hover { background: #F8F9FB; }
        .ndrop-label { font-size: 13px; font-weight: 600; color: #1E293B; }
        .ndrop-desc  { font-size: 11px; color: #64748B; }
        .ndrop-divider { height: 1px; background: #E4E8EF; margin: 4px 6px; }
        .ndrop-section { font-size: 10px; font-weight: 700; letter-spacing: .09em;
          text-transform: uppercase; color: #007A94; padding: 6px 14px 4px; }
        .ndrop-btn {
          display: flex; align-items: center; gap: 5px; cursor: pointer;
          font-size: 14px; color: rgba(255,255,255,0.80); font-weight: 400;
          background: none; border: none; padding: 0; font-family: inherit;
          transition: color .2s;
        }
        .ndrop-btn:hover { color: rgba(255,255,255,1); }
        .nav.scrolled .ndrop-btn { color: #64748B; }
        .nav.scrolled .ndrop-btn:hover { color: #1E293B; }
        .ndrop-btn::after {
          content: "";
          width: 5px; height: 5px;
          border-right: 1.5px solid currentColor;
          border-bottom: 1.5px solid currentColor;
          transform: rotate(45deg) translateY(-1px);
          opacity: 0.55;
          transition: transform .14s;
          flex-shrink: 0;
        }
        .ndrop-btn.open::after { transform: rotate(-135deg) translateY(2px); }
      `}</style>

      <header className="nav" id="nav">
        <div className="container nav__inner">
          <Link href="/" className="logo" aria-label="AUDT home">
            <span className="logo__mark" aria-hidden="true"><span className="logo__icon">A</span></span>
            <span className="logo__text">AUDT</span>
          </Link>

          <nav className="nav__menu" aria-label="Primary">
            {/* Platform dropdown */}
            <div
              ref={dropRef}
              style={{ position: "relative" }}
              onMouseEnter={openDrop}
              onMouseLeave={closeDrop}
            >
              <button
                className={`ndrop-btn${dropOpen ? " open" : ""}`}
                aria-expanded={dropOpen}
                aria-haspopup="true"
                onClick={() => setDropOpen((o) => !o)}
              >
                Platform
              </button>

              {dropOpen && (
                <div
                  className="ndrop-menu"
                  onMouseEnter={openDrop}
                  onMouseLeave={closeDrop}
                >
                  <div className="ndrop-section">Overview</div>
                  <Link href="/platform" className="ndrop-item" onClick={close}>
                    <span className="ndrop-label">Platform Overview</span>
                    <span className="ndrop-desc">Everything inside AUDT</span>
                  </Link>
                  <div className="ndrop-divider" />
                  <div className="ndrop-section">Pillars</div>
                  {PLATFORM_ITEMS.slice(1).map((item) => (
                    <a key={item.href} href={item.href} className="ndrop-item" onClick={close}>
                      <span className="ndrop-label">{item.label}</span>
                      <span className="ndrop-desc">{item.desc}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <Link href="/#solutions">Solutions</Link>
            <Link href="/#why-audt">Why AUDT</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/trust">Trust Center</Link>
            <Link href="/#pricing">Pricing</Link>
            <a href="mailto:hello@audt.tech">Contact</a>
          </nav>

          <div className="nav__actions">
            <Link href="/login" className="nav__signin">Sign in</Link>
            <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--ghost btn--sm">Book Demo</a>
            <Link href="/signup" className="btn btn--primary btn--sm">Start Free</Link>
          </div>

          <button
            className={`nav__toggle${mobileOpen ? " open" : ""}`}
            id="navToggle"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile nav */}
        <div className={`nav__mobile${mobileOpen ? " open" : ""}`} id="navMobile">
          <button
            onClick={() => setMobilePlatOpen((o) => !o)}
            style={{
              background: "none", border: "none", color: "#64748B",
              font: "inherit", cursor: "pointer", textAlign: "left",
              display: "flex", justifyContent: "space-between", width: "100%",
              padding: "12px 0", borderBottom: "1px solid #EEF2F7",
              alignItems: "center",
            }}
          >
            Platform
            <span style={{ fontSize: "18px", opacity: 0.5, lineHeight: 1 }}>{mobilePlatOpen ? "−" : "+"}</span>
          </button>
          {mobilePlatOpen && (
            <div style={{ display: "flex", flexDirection: "column", paddingLeft: "16px" }}>
              {PLATFORM_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  style={{ padding: "10px 0", fontSize: "13px", color: "#64748B", borderBottom: "1px solid #EEF2F7" }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
          <Link href="/#solutions" onClick={close}>Solutions</Link>
          <Link href="/#why-audt" onClick={close}>Why AUDT</Link>
          <Link href="/docs" onClick={close}>Docs</Link>
          <Link href="/trust" onClick={close}>Trust Center</Link>
          <Link href="/#pricing" onClick={close}>Pricing</Link>
          <a href="mailto:hello@audt.tech" onClick={close}>Contact</a>
          <Link href="/login" onClick={close}>Sign in</Link>
          <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--ghost" onClick={close}>Book Demo</a>
          <Link href="/signup" className="btn btn--primary" onClick={close}>Start Free</Link>
        </div>
      </header>
    </>
  );
}
