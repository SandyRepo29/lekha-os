"use client";

import { useEffect, useState } from "react";

const PLATFORM_ITEMS = [
  { label: "Platform Overview",  href: "/platform",                      desc: "Everything inside AUDT" },
  { label: "Vendor Governance",  href: "/platform#vendor-governance",    desc: "Vendor lifecycle management" },
  { label: "Trust Operations",   href: "/platform#trust-operations",     desc: "Assessments & evidence" },
  { label: "Risk & Compliance",  href: "/platform#risk-compliance",      desc: "Risk, controls & frameworks" },
  { label: "Trust Intelligence", href: "/platform#trust-intelligence",   desc: "AI insights & Trust Score™" },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePlatOpen, setMobilePlatOpen] = useState(false);

  useEffect(() => {
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => { setMobileOpen(false); setMobilePlatOpen(false); };

  return (
    <>
      <style>{`
        .ndrop { position: relative; }
        .ndrop__btn {
          cursor: default;
          display: flex; align-items: center; gap: 5px;
          font-size: inherit; color: inherit; font-weight: inherit;
          background: none; border: none; padding: 0;
          font-family: inherit;
        }
        .ndrop__btn::after {
          content: "";
          width: 5px; height: 5px;
          border-right: 1.5px solid currentColor;
          border-bottom: 1.5px solid currentColor;
          transform: rotate(45deg) translateY(-1px);
          opacity: 0.55;
          transition: transform 0.14s;
          flex-shrink: 0;
        }
        .ndrop:hover .ndrop__btn::after { transform: rotate(-135deg) translateY(2px); }
        .ndrop__menu {
          position: absolute;
          top: calc(100% + 14px);
          left: 50%; transform: translateX(-50%) translateY(-6px);
          width: 268px;
          background: rgba(8,8,18,0.97);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 8px;
          backdrop-filter: blur(24px);
          opacity: 0; pointer-events: none;
          transition: opacity 0.15s, transform 0.15s;
          z-index: 200;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        }
        .ndrop:hover .ndrop__menu {
          opacity: 1; pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }
        .ndrop__item {
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 14px;
          border-radius: 9px;
          text-decoration: none;
          transition: background 0.12s;
        }
        .ndrop__item:hover { background: rgba(255,255,255,0.07); }
        .ndrop__item-label { font-size: 13px; font-weight: 600; color: var(--color-ink,#f1f5f9); }
        .ndrop__item-desc  { font-size: 11px; color: var(--color-ink-dim,rgba(241,245,249,.5)); }
        .ndrop__divider { height: 1px; background: rgba(255,255,255,0.07); margin: 4px 6px; }
        .ndrop__overview-label {
          font-size: 10px; font-weight: 700; letter-spacing: .09em;
          text-transform: uppercase; color: var(--color-blue,#6366f1);
          padding: 6px 14px 4px;
        }
      `}</style>

      <header className="nav" id="nav">
        <div className="container nav__inner">
          <a href="/" className="logo" aria-label="AUDT home">
            <span className="logo__mark" aria-hidden="true"><span className="logo__icon">A</span></span>
            <span className="logo__text">AUDT</span>
          </a>

          <nav className="nav__menu" aria-label="Primary">
            {/* Platform dropdown */}
            <div className="ndrop">
              <button className="ndrop__btn">Platform</button>
              <div className="ndrop__menu" role="menu">
                <div className="ndrop__overview-label">Overview</div>
                <a href="/platform" className="ndrop__item">
                  <span className="ndrop__item-label">Platform Overview</span>
                  <span className="ndrop__item-desc">Everything inside AUDT</span>
                </a>
                <div className="ndrop__divider" />
                <div className="ndrop__overview-label">Pillars</div>
                {PLATFORM_ITEMS.slice(1).map((item) => (
                  <a key={item.href} href={item.href} className="ndrop__item">
                    <span className="ndrop__item-label">{item.label}</span>
                    <span className="ndrop__item-desc">{item.desc}</span>
                  </a>
                ))}
              </div>
            </div>
            <a href="/#solutions">Solutions</a>
            <a href="/#why-audt">Why AUDT</a>
            <a href="/docs">Docs</a>
            <a href="/#pricing">Pricing</a>
            <a href="mailto:hello@audt.tech">Contact</a>
          </nav>

          <div className="nav__actions">
            <a href="/login" className="nav__signin">Sign in</a>
            <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--ghost btn--sm">Book Demo</a>
            <a href="/signup" className="btn btn--primary btn--sm">Start Free</a>
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
          {/* Platform expandable */}
          <button
            onClick={() => setMobilePlatOpen((o) => !o)}
            style={{
              background: "none", border: "none", color: "inherit",
              font: "inherit", cursor: "pointer", textAlign: "left",
              display: "flex", justifyContent: "space-between", width: "100%",
              padding: "0", alignItems: "center",
            }}
          >
            Platform
            <span style={{ fontSize: "18px", opacity: 0.5, lineHeight: 1 }}>{mobilePlatOpen ? "−" : "+"}</span>
          </button>
          {mobilePlatOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "16px", paddingTop: "4px" }}>
              {PLATFORM_ITEMS.map((item) => (
                <a key={item.href} href={item.href} onClick={close} style={{ fontSize: "13px", opacity: 0.75 }}>
                  {item.label}
                </a>
              ))}
            </div>
          )}
          <a href="/#solutions" onClick={close}>Solutions</a>
          <a href="/#why-audt" onClick={close}>Why AUDT</a>
          <a href="/docs" onClick={close}>Docs</a>
          <a href="/#pricing" onClick={close}>Pricing</a>
          <a href="mailto:hello@audt.tech" onClick={close}>Contact</a>
          <a href="/login" onClick={close}>Sign in</a>
          <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--ghost" onClick={close}>Book Demo</a>
          <a href="/signup" className="btn btn--primary" onClick={close}>Start Free</a>
        </div>
      </header>
    </>
  );
}
