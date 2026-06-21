"use client";

import { useEffect } from "react";

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

export default function LandingPage() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const toggle = document.getElementById("navToggle");
    const mobile = document.getElementById("navMobile");
    const onToggle = () => {
      if (!mobile || !toggle) return;
      const open = mobile.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle?.addEventListener("click", onToggle);
    const closeMobile = () => {
      mobile?.classList.remove("open");
      toggle?.classList.remove("open");
    };
    mobile?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobile));

    const animateCounter = (el: HTMLElement) => {
      const target = parseFloat(el.getAttribute("data-target") || "0");
      const dur = 1500;
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.floor(target * eased);
        el.textContent = target >= 1000 ? val.toLocaleString("en-IN") : String(val);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target >= 1000 ? target.toLocaleString("en-IN") : String(target);
      };
      requestAnimationFrame(step);
    };

    const activateMockViz = () => {
      document.querySelectorAll<HTMLElement>(".ring[data-ring]").forEach((ring) => {
        const pct = parseFloat(ring.getAttribute("data-ring") || "0");
        const circ = 2 * Math.PI * 52;
        ring.style.setProperty("--off", String(circ - (pct / 100) * circ));
        const fg = ring.querySelector<SVGElement>(".ring__fg");
        if (fg) {
          fg.style.strokeDasharray = String(circ);
          fg.style.strokeDashoffset = String(circ);
        }
        requestAnimationFrame(() => ring.classList.add("run"));
      });
      [".mcard--risk", ".mcard--audit"].forEach((sel) =>
        document.querySelectorAll(sel).forEach((c) => c.classList.add("run"))
      );
    };

    const animateScores = () => {
      document.querySelectorAll<HTMLElement>(".score-num[data-score]").forEach((el) => {
        if (el.dataset.done) return;
        el.dataset.done = "1";
        const target = parseInt(el.getAttribute("data-score") || "0", 10);
        const dur = 1800;
        let start: number | null = null;
        const step = (ts: number) => {
          if (start === null) start = ts;
          const p = Math.min((ts - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.floor(target * eased));
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = String(target);
        };
        requestAnimationFrame(step);
      });
    };

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && !reduce) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.getAttribute("data-delay") || "0", 10);
            window.setTimeout(() => el.classList.add("in"), delay);
            el.querySelectorAll<HTMLElement>(".counter").forEach((c) => {
              if (!c.dataset.done) { c.dataset.done = "1"; animateCounter(c); }
            });
            if (el.classList.contains("trust-scores") || el.querySelector(".score-num")) {
              animateScores();
            }
            io?.unobserve(el);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      document.querySelectorAll(".reveal").forEach((el) => io!.observe(el));
      window.setTimeout(activateMockViz, 500);
    } else {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      document.querySelectorAll<HTMLElement>(".counter").forEach((c) => {
        const t = parseFloat(c.getAttribute("data-target") || "0");
        c.textContent = t >= 1000 ? t.toLocaleString("en-IN") : String(t);
      });
      document.querySelectorAll<HTMLElement>(".score-num[data-score]").forEach((el) => {
        el.textContent = el.getAttribute("data-score") || "0";
      });
      activateMockViz();
    }

    const mock = document.querySelector<HTMLElement>(".mock");
    const visual = document.querySelector<HTMLElement>(".hero__visual");
    const onMove = (e: MouseEvent) => {
      if (!mock || !visual) return;
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      mock.style.transform = `rotateY(${-9 + x * 6}deg) rotateX(${4 - y * 6}deg)`;
    };
    const onLeave = () => { if (mock) mock.style.transform = ""; };
    if (!reduce && visual) {
      visual.addEventListener("mousemove", onMove);
      visual.addEventListener("mouseleave", onLeave);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      toggle?.removeEventListener("click", onToggle);
      io?.disconnect();
      visual?.removeEventListener("mousemove", onMove);
      visual?.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-glow bg-glow--1" aria-hidden="true" />
      <div className="bg-glow bg-glow--2" aria-hidden="true" />
      <div className="bg-glow bg-glow--3" aria-hidden="true" />

      {/* ── NAV ── */}
      <header className="nav" id="nav">
        <div className="container nav__inner">
          <a href="#top" className="logo" aria-label="AUDT home">
            <span className="logo__mark" aria-hidden="true"><span className="logo__icon">A</span></span>
            <span className="logo__text">AUDT</span>
          </a>
          <nav className="nav__menu" aria-label="Primary">
            <a href="#platform">Platform</a>
            <a href="#solutions">Solutions</a>
            <a href="#why-audt">Why AUDT</a>
            <a href="/docs">Docs</a>
            <a href="#pricing">Pricing</a>
            <a href="mailto:hello@audt.tech">Contact</a>
          </nav>
          <div className="nav__actions">
            <a href="/login" className="nav__signin">Sign in</a>
            <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--ghost btn--sm">Book Demo</a>
            <a href="/signup" className="btn btn--primary btn--sm">Start Free</a>
          </div>
          <button className="nav__toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
            <span /><span /><span />
          </button>
        </div>
        <div className="nav__mobile" id="navMobile">
          <a href="#platform">Platform</a>
          <a href="#solutions">Solutions</a>
          <a href="#why-audt">Why AUDT</a>
          <a href="/docs">Docs</a>
          <a href="#pricing">Pricing</a>
          <a href="mailto:hello@audt.tech">Contact</a>
          <a href="/login">Sign in</a>
          <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--ghost">Book Demo</a>
          <a href="/signup" className="btn btn--primary">Start Free</a>
        </div>
      </header>

      <main id="top">

        {/* ════════════════════════════════════
            1. HERO
            What AUDT is.
        ════════════════════════════════════ */}
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__copy reveal">
              <div className="badge">
                <span className="badge__pulse" />
                Vendor Governance &amp; Trust Operations · audt.tech
              </div>
              <h1 className="hero__title">
                Govern Every Vendor.<br />
                <span className="grad-text">Trust Every Decision.</span>
              </h1>
              <p className="hero__sub">
                Govern vendor risk, compliance, audits, and renewals from a single platform.
              </p>
              <p className="hero__support">
                The complete system for vendor governance — from onboarding and assessments to audits and offboarding.
              </p>
              <div className="hero__cta">
                <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
                <a href="/signup" className="btn btn--ghost btn--lg">Start Free Trial <span className="arrow">→</span></a>
              </div>
              <div className="hero__trust">
                <span>Vendor Governance</span>
                <span className="dot">·</span>
                <span>Risk Management</span>
                <span className="dot">·</span>
                <span>Compliance</span>
                <span className="dot">·</span>
                <span>Audit Management</span>
                <span className="dot">·</span>
                <span>Continuous Trust</span>
              </div>
            </div>

            <div className="hero__visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock__chrome">
                  <span className="mock__dot" /><span className="mock__dot" /><span className="mock__dot" />
                  <div className="mock__url">app.audt.tech</div>
                </div>
                <div className="mock__body">
                  <aside className="mock__side">
                    <div className="mock__brand">
                      <span className="mock__brand-icon">A</span>
                      AUDT
                    </div>
                    <div className="mock__nav active">▦ Dashboard</div>
                    <div className="mock__nav">▤ Vendor Hub™</div>
                    <div className="mock__nav">◷ Evidence Vault™</div>
                    <div className="mock__nav">◎ Audits</div>
                    <div className="mock__nav">⚠ Risk Lens™</div>
                    <div className="mock__nav">◻ Controls</div>
                    <div className="mock__nav">✦ Trust Intel™</div>
                    <div className="mock__nav copilot">✦ Copilot</div>
                  </aside>
                  <div className="mock__main">
                    <div className="mock__row">
                      <div className="mcard mcard--score">
                        <div className="mcard__label">Vendor Trust Score™</div>
                        <div className="ring" data-ring="92">
                          <svg viewBox="0 0 120 120">
                            <circle className="ring__bg" cx="60" cy="60" r="52" />
                            <circle className="ring__fg" cx="60" cy="60" r="52" />
                          </svg>
                          <div className="ring__val">
                            <span className="counter" data-target="92">0</span>
                            <i>%</i>
                          </div>
                        </div>
                      </div>
                      <div className="mcard mcard--risk">
                        <div className="mcard__label">Vendor Risk Overview</div>
                        <div className="bars">
                          <div className="bar"><span style={{ "--h": "30%" } as CSSVars} /><em>Low</em></div>
                          <div className="bar"><span style={{ "--h": "65%" } as CSSVars} /><em>Med</em></div>
                          <div className="bar"><span style={{ "--h": "25%" } as CSSVars} /><em>High</em></div>
                          <div className="bar"><span style={{ "--h": "90%" } as CSSVars} /><em>OK</em></div>
                        </div>
                      </div>
                    </div>
                    <div className="mock__row">
                      <div className="mcard mcard--audit">
                        <div className="mcard__label">Audit Readiness</div>
                        <div className="mcard__big">
                          <span className="counter" data-target="94">0</span>%
                        </div>
                        <div className="progress"><span style={{ "--w": "94%" } as CSSVars} /></div>
                      </div>
                      <div className="mcard mcard--ai">
                        <div className="ai-chip">✦ Governance Copilot™</div>
                        <p className="ai-line">2 vendor certs expire in 14 days.</p>
                        <p className="ai-line muted">4 vendors need assessment refresh.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float-chip float-chip--1">✓ Vendor Trust Score™ updated</div>
              <div className="float-chip float-chip--2">✦ 3 vendors assessed today</div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            2. PROBLEM
            Why vendor governance matters.
        ════════════════════════════════════ */}
        <section className="section" id="problem">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Problem</span>
              <h2>Vendor Risk Is The New Business Risk.</h2>
              <p>
                Organizations depend on hundreds of vendors, SaaS applications, suppliers, and AI providers.
                Yet vendor governance is still fragmented across spreadsheets, questionnaires, emails,
                and disconnected compliance tools.
              </p>
            </div>
            <div className="pain-grid">
              <div className="pain reveal"><span className="pain__icon">🌫️</span>Poor vendor visibility</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">✍️</span>Manual assessments</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">◎</span>Audit chaos</div>
              <div className="pain reveal"><span className="pain__icon">📋</span>Compliance gaps</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">⚠</span>Risk blind spots</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">🔄</span>Weak renewal decisions</div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            3. VENDOR LIFECYCLE
            How the lifecycle works.
        ════════════════════════════════════ */}
        <section className="section section--alt" id="lifecycle">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Vendor Lifecycle</span>
              <h2>Manage The Entire Vendor Lifecycle.</h2>
              <p>AUDT covers every stage — so your team always has a complete, up-to-date picture of every vendor relationship.</p>
            </div>

            <div className="reveal" style={{ overflowX: "auto", paddingBottom: "8px" }}>
              <div style={{
                display: "flex",
                alignItems: "stretch",
                gap: "0",
                minWidth: "700px",
                margin: "0 auto",
                maxWidth: "920px",
              }}>
                {[
                  { step: "01", icon: "🔎", label: "Discover",  desc: "Find all vendors" },
                  { step: "02", icon: "📋", label: "Inventory", desc: "System of record" },
                  { step: "03", icon: "🏷",  label: "Classify",  desc: "Criticality & impact" },
                  { step: "04", icon: "🔬", label: "Assess",    desc: "Security & compliance" },
                  { step: "05", icon: "⚠",  label: "Risk",      desc: "Score & prioritize" },
                  { step: "06", icon: "◷",  label: "Comply",    desc: "Map to frameworks" },
                  { step: "07", icon: "📡", label: "Monitor",   desc: "Continuous trust" },
                  { step: "08", icon: "◎",  label: "Audit",     desc: "Stay audit-ready" },
                  { step: "09", icon: "🔄", label: "Renew",     desc: "Informed decisions" },
                  { step: "10", icon: "🚪", label: "Offboard",  desc: "Safe termination" },
                ].map(({ step, icon, label, desc }, i) => (
                  <div key={label} style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
                    <div style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      padding: "20px 6px 16px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-blue)", marginBottom: "8px", opacity: 0.8 }}>{step}</div>
                      <div style={{ fontSize: "20px", marginBottom: "6px" }}>{icon}</div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-ink)", marginBottom: "4px" }}>{label}</div>
                      <div style={{ fontSize: "10px", color: "var(--color-ink-dim)", lineHeight: 1.4 }}>{desc}</div>
                    </div>
                    {i < 9 && (
                      <div style={{ display: "flex", alignItems: "center", padding: "0 3px", color: "var(--color-blue)", fontSize: "14px", opacity: 0.4, flexShrink: 0 }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            4. ENTERPRISE PROOF
            Proof the platform exists.
        ════════════════════════════════════ */}
        <section className="section" id="proof">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Built For Modern Governance Teams</span>
              <h2>A Platform Built For Scale.</h2>
              <p>Every number reflects production-ready capability — not a roadmap.</p>
            </div>
            <div className="metrics-grid">
              <div className="mstat reveal">
                <div className="mstat__num"><span className="counter" data-target="32">0</span></div>
                <div className="mstat__label">Integrated Governance Modules</div>
              </div>
              <div className="mstat reveal" data-delay="60">
                <div className="mstat__num"><span className="counter" data-target="174">0</span><span style={{ fontSize: "1.2rem" }}>+</span></div>
                <div className="mstat__label">Pre-Mapped Compliance Controls</div>
              </div>
              <div className="mstat reveal" data-delay="120">
                <div className="mstat__num">10</div>
                <div className="mstat__label">Vendor Lifecycle Stages</div>
              </div>
              <div className="mstat reveal" data-delay="180">
                <div className="mstat__num"><span className="counter" data-target="35">0</span><span style={{ fontSize: "1.2rem" }}>+</span></div>
                <div className="mstat__label">Integration Connectors</div>
              </div>
            </div>

            {/* Platform Coverage */}
            <div style={{ marginTop: "3.5rem" }}>
              <p className="reveal" style={{ textAlign: "center", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-dim)", marginBottom: "1.5rem", fontWeight: 600 }}>Platform Coverage</p>
              <div className="reveal" style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                justifyContent: "center",
                maxWidth: "780px",
                margin: "0 auto",
              }}>
                {[
                  "Vendor Governance", "Trust Operations", "Risk Management",
                  "Compliance Management", "Audit Management", "Policy Governance",
                  "Privacy Governance", "Asset Intelligence", "AI Governance",
                ].map((item) => (
                  <div key={item} style={{
                    padding: "8px 18px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    fontSize: "13px",
                    color: "var(--color-ink-dim)",
                    fontWeight: 500,
                  }}>{item}</div>
                ))}
              </div>
              <p className="reveal" style={{ textAlign: "center", fontSize: "13px", color: "var(--color-ink-dim)", marginTop: "1.5rem", maxWidth: "480px", margin: "1.5rem auto 0", lineHeight: 1.6 }}>
                Powered by 32 integrated modules working together through a unified vendor governance platform.
              </p>
              <div className="reveal" style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <a href="/docs" className="btn btn--ghost">Explore Platform →</a>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            5. PLATFORM PILLARS
            What AUDT covers — outcome-focused.
        ════════════════════════════════════ */}
        <section className="section section--alt" id="platform">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Platform Overview</span>
              <h2>One Platform For Vendor Governance.</h2>
              <p>Four integrated pillars that cover every dimension of vendor governance.</p>
            </div>
            <div className="pillars">

              <article className="pillar pillar--live reveal">
                <div className="pillar__top">
                  <div className="pillar__icon">▤</div>
                  <span className="status status--live">Pillar 1</span>
                </div>
                <h3>Vendor Governance</h3>
                <p>Single source of truth for every vendor relationship.</p>
                <ul className="pillar__feats">
                  <li>Registry &amp; Ownership</li>
                  <li>Classification &amp; Contacts</li>
                  <li>Contract Tracking</li>
                  <li>Vendor Reviews</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="60">
                <div className="pillar__top">
                  <div className="pillar__icon">🛡</div>
                  <span className="status status--live">Pillar 2</span>
                </div>
                <h3>Trust Operations</h3>
                <p>Operational workflows that validate vendor trust throughout the lifecycle.</p>
                <ul className="pillar__feats">
                  <li>Assessments &amp; Questionnaires</li>
                  <li>Evidence Requests</li>
                  <li>Vendor Reviews</li>
                  <li>Remediation Tracking</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="120">
                <div className="pillar__top">
                  <div className="pillar__icon">◷</div>
                  <span className="status status--live">Pillar 3</span>
                </div>
                <h3>Risk &amp; Compliance</h3>
                <p>Manage vendor risk, controls, compliance, and audits from one platform.</p>
                <ul className="pillar__feats">
                  <li>Risk Register &amp; Heat Map</li>
                  <li>Controls &amp; Frameworks</li>
                  <li>Audit Management</li>
                  <li>Findings &amp; CAPAs</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="180">
                <div className="pillar__top">
                  <div className="pillar__icon">✦</div>
                  <span className="status status--live">Pillar 4</span>
                </div>
                <h3>Trust Intelligence</h3>
                <p>AI-powered trust insights that help teams make better governance decisions.</p>
                <ul className="pillar__feats">
                  <li>Trust Score™</li>
                  <li>Governance Copilot™</li>
                  <li>Continuous Monitoring</li>
                  <li>Executive Reporting</li>
                </ul>
              </article>

            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            6. SOLUTIONS BY TEAM
            Help buyers identify themselves.
        ════════════════════════════════════ */}
        <section className="section" id="solutions">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Solutions By Team</span>
              <h2>Built For Every Governance Team.</h2>
              <p>Every team that touches vendor governance has a purpose-built workflow inside AUDT.</p>
            </div>
            <div className="solutions">
              <div className="sol reveal">
                <div className="sol__icon">▤</div>
                <h3>Procurement Teams</h3>
                <p>Manage vendor onboarding, reviews, renewals, and offboarding from a single platform. Vendor intake, contract tracking, renewal management — all in one place.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">🛡</div>
                <h3>Security Teams</h3>
                <p>Assess vendor security posture. Monitor risk across the vendor portfolio. Track findings and remediation to completion.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">◷</div>
                <h3>Compliance Teams</h3>
                <p>Automate evidence collection from vendors. Maintain audit readiness every day of the year. Track framework coverage continuously.</p>
              </div>
              <div className="sol reveal">
                <div className="sol__icon">⚠</div>
                <h3>Risk Teams</h3>
                <p>Identify and prioritize vendor risk. Track treatments and remediation. Maintain a live view of vendor risk exposure.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">📊</div>
                <h3>Leadership</h3>
                <p>Measure organizational trust. Understand vendor exposure through board-ready reports, scorecards, and executive dashboards.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">🤝</div>
                <h3>Audit Teams</h3>
                <p>Work with external auditors in secure rooms. Exchange vendor evidence. Track findings and assessment progress.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            7. WHY AUDT
            Why we are different.
        ════════════════════════════════════ */}
        <section className="section section--alt" id="why-audt">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Why AUDT</span>
              <h2>Most Platforms Start With Compliance.<br />We Start With The Vendor.</h2>
              <p>Compliance is one part of vendor governance. AUDT governs the entire lifecycle.</p>
            </div>

            {/* 3-column comparison */}
            <div className="comparison-table reveal" style={{ overflowX: "auto" }}>
              <div className="comparison-table__head" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1px" }}>
                <div className="comparison-table__col comparison-table__col--label">Capability</div>
                <div className="comparison-table__col comparison-table__col--old" style={{ textAlign: "center" }}>Compliance Platforms</div>
                <div className="comparison-table__col comparison-table__col--old" style={{ textAlign: "center" }}>Traditional GRC</div>
                <div className="comparison-table__col comparison-table__col--new" style={{ textAlign: "center" }}>AUDT</div>
              </div>
              {[
                ["Vendor Lifecycle",      "Partial",  "Partial",  "Complete"],
                ["Vendor Governance",     "Limited",  "Strong",   "Strong"],
                ["Compliance",            "Strong",   "Strong",   "Strong"],
                ["Audit Management",      "Partial",  "Strong",   "Strong"],
                ["Continuous Monitoring", "Partial",  "Limited",  "Always-on"],
                ["AI Governance",         "Limited",  "Limited",  "Native"],
                ["Trust Intelligence",    "None",     "None",     "Native"],
              ].map(([label, col1, col2, col3]) => (
                <div key={label} className="comparison-table__row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1px" }}>
                  <div className="comparison-table__col comparison-table__col--label">{label}</div>
                  <div className="comparison-table__col comparison-table__col--old" style={{ textAlign: "center", justifyContent: "center" }}>
                    <span className="comparison-table__x">✕</span> {col1}
                  </div>
                  <div className="comparison-table__col comparison-table__col--old" style={{ textAlign: "center", justifyContent: "center" }}>
                    {col2 === "Strong" || col2 === "Partial"
                      ? <><span className="comparison-table__x" style={{ opacity: col2 === "Strong" ? 0 : 1 }}>✕</span> {col2}</>
                      : <><span className="comparison-table__x">✕</span> {col2}</>}
                  </div>
                  <div className="comparison-table__col comparison-table__col--new" style={{ textAlign: "center", justifyContent: "center" }}>
                    <span className="comparison-table__check">✓</span> {col3}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            8. TRUST SCORE™
            First differentiator.
        ════════════════════════════════════ */}
        <section className="section" id="trust-score">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Differentiator 1 — Trust Score™</span>
              <h2>Measure Vendor Trust In Real Time.</h2>
              <p>
                Trust should not be subjective. AUDT continuously calculates a Trust Score™ for every vendor
                using live signals across six dimensions — so your team always knows exactly where they stand.
              </p>
            </div>

            <div className="trust-scores reveal">
              <div className="tscore">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ts1)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="17" strokeLinecap="round" transform="rotate(-90 40 40)" />
                    <defs><linearGradient id="ts1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#2dd4ff" />
                    </linearGradient></defs>
                  </svg>
                  <div className="tscore__val"><span className="score-num" data-score="92">0</span></div>
                </div>
                <div className="tscore__label">Security</div>
                <div className="tscore__sub">↑ 4 pts this month</div>
              </div>
              <div className="tscore">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ts2)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="26" strokeLinecap="round" transform="rotate(-90 40 40)" />
                    <defs><linearGradient id="ts2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#6366f1" />
                    </linearGradient></defs>
                  </svg>
                  <div className="tscore__val"><span className="score-num" data-score="88">0</span></div>
                </div>
                <div className="tscore__label">Compliance</div>
                <div className="tscore__sub">3 controls need review</div>
              </div>
              <div className="tscore tscore--featured">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ts3)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="13" strokeLinecap="round" transform="rotate(-90 40 40)" />
                    <defs><linearGradient id="ts3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2dd4ff" /><stop offset="100%" stopColor="#6366f1" />
                    </linearGradient></defs>
                  </svg>
                  <div className="tscore__val"><span className="score-num" data-score="94">0</span></div>
                </div>
                <div className="tscore__label">Vendor Trust Score™</div>
                <div className="tscore__sub">Overall — Trusted</div>
              </div>
              <div className="tscore">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ts4)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="21" strokeLinecap="round" transform="rotate(-90 40 40)" />
                    <defs><linearGradient id="ts4" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient></defs>
                  </svg>
                  <div className="tscore__val"><span className="score-num" data-score="90">0</span></div>
                </div>
                <div className="tscore__label">Audit Readiness</div>
                <div className="tscore__sub">ISO 27001 — Ready</div>
              </div>
            </div>

            {/* Six signal components */}
            <div className="cc-grid reveal" style={{ marginTop: "3rem" }}>
              {[
                { icon: "🔐", label: "Security",       desc: "Assessment scores, certifications, vulnerability status" },
                { icon: "◷",  label: "Compliance",     desc: "Framework coverage, control status, readiness scores" },
                { icon: "⚠",  label: "Risk",           desc: "Active risks, severity distribution, treatment progress" },
                { icon: "📡", label: "Monitoring",     desc: "Evidence freshness, expiry alerts, continuous check results" },
                { icon: "⚙",  label: "Performance",    desc: "Review history, responsiveness, document turnaround" },
                { icon: "◎",  label: "Audit Readiness", desc: "Open findings, CAPA completion, program status" },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="cc-card">
                  <div className="cc-card__icon">{icon}</div>
                  <h3>{label}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            9. GOVERNANCE COPILOT™
            Second differentiator.
        ════════════════════════════════════ */}
        <section className="section section--alt" id="copilot">
          <div className="container ai-sec">
            <div className="ai-sec__copy reveal">
              <span className="eyebrow">Differentiator 2 — Governance Copilot™</span>
              <h2>AI For Governance Teams.</h2>
              <p>
                The Governance Copilot™ is woven through every module — not a chatbot bolted on.
                It answers questions about your actual vendor governance data, in plain English.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "2rem" }}>
                {[
                  "Vendor summaries &amp; risk recommendations",
                  "Audit preparation &amp; evidence discovery",
                  "Compliance guidance &amp; gap analysis",
                  "Board report generation",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: "var(--color-ink-dim)" }}>
                    <span style={{ color: "var(--color-blue)", fontWeight: 700 }}>✓</span>
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </div>
                ))}
              </div>
              <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary">Book a Demo</a>
            </div>
            <div className="ai-chat reveal" data-delay="100">
              <div className="chat__header">
                <span className="chat__dot" style={{ background: "#ff5f57" }} />
                <span className="chat__dot" style={{ background: "#febc2e" }} />
                <span className="chat__dot" style={{ background: "#28c840" }} />
                <span className="chat__title">✦ Governance Copilot™</span>
              </div>
              <div className="chat__body">
                <div className="chat__q">Which vendors need attention this week?</div>
                <div className="chat__a">4 vendors have declining trust scores. 2 require document refresh. 1 vendor assessment expires in 14 days. 1 contract renewal is overdue.</div>
                <div className="chat__q">Are we audit ready for ISO 27001?</div>
                <div className="chat__a">Audit readiness is 92%. 3 evidence gaps remain across 2 vendor controls. Evidence Vault™ is current for 171 of 174 controls.</div>
                <div className="chat__q">Generate vendor risk board report.</div>
                <div className="chat__a">Board report prepared: Vendor Risk Summary · Trust Score Trends · Compliance Status · Renewal Pipeline · Executive Recommendations.</div>
              </div>
              <div className="chat__input">
                <span>Ask about your vendor governance posture...</span>
                <span className="chat__send">✦</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            10. AI AGENTS
            Third differentiator.
        ════════════════════════════════════ */}
        <section className="section" id="agents">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Differentiator 3 — AI Agents</span>
              <h2>Autonomous Governance Operations.</h2>
              <p>AI agents continuously monitor vendor governance and surface observations, recommendations, and actions — with human approval always in the loop.</p>
            </div>
            <div className="agents-grid">
              <div className="agent-card reveal">
                <div className="agent-card__top">
                  <div className="agent-card__icon agent-card__icon--vendor">▤</div>
                  <span className="agent-card__badge">Active 24/7</span>
                </div>
                <h3 className="agent-card__name">Vendor Agent™</h3>
                <ul className="agent-card__caps">
                  <li>Monitors vendor trust scores</li>
                  <li>Requests vendor evidence</li>
                  <li>Launches assessments</li>
                  <li>Tracks periodic reviews</li>
                </ul>
              </div>
              <div className="agent-card reveal" data-delay="60">
                <div className="agent-card__top">
                  <div className="agent-card__icon agent-card__icon--compliance">◷</div>
                  <span className="agent-card__badge">Active 24/7</span>
                </div>
                <h3 className="agent-card__name">Evidence Agent™</h3>
                <ul className="agent-card__caps">
                  <li>Collects evidence automatically</li>
                  <li>Monitors control coverage</li>
                  <li>Tracks framework readiness</li>
                  <li>Triggers remediation</li>
                </ul>
              </div>
              <div className="agent-card reveal" data-delay="120">
                <div className="agent-card__top">
                  <div className="agent-card__icon agent-card__icon--risk">⚠</div>
                  <span className="agent-card__badge">Active 24/7</span>
                </div>
                <h3 className="agent-card__name">Risk Agent™</h3>
                <ul className="agent-card__caps">
                  <li>Detects emerging vendor risks</li>
                  <li>Monitors risk trends</li>
                  <li>Escalates critical issues</li>
                  <li>Tracks mitigation progress</li>
                </ul>
              </div>
              <div className="agent-card reveal" data-delay="180">
                <div className="agent-card__top">
                  <div className="agent-card__icon agent-card__icon--audit">◎</div>
                  <span className="agent-card__badge">Active 24/7</span>
                </div>
                <h3 className="agent-card__name">Audit Agent™</h3>
                <ul className="agent-card__caps">
                  <li>Prepares audit rooms</li>
                  <li>Collects vendor evidence</li>
                  <li>Identifies audit gaps</li>
                  <li>Creates findings</li>
                </ul>
              </div>
            </div>
            <div className="agents-cta reveal">
              <a href="/signup" className="btn btn--primary">Activate Governance Agents</a>
              <a href="#copilot" className="btn btn--ghost">See Governance Copilot™ <span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            11. VISION
            Today and tomorrow — simplified.
        ════════════════════════════════════ */}
        <section className="section section--alt" id="vision">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Our Vision</span>
              <h2>Building The System Of Record For Vendor Trust.</h2>
            </div>

            <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", maxWidth: "800px", margin: "0 auto 3rem" }}>

              {/* Today */}
              <div style={{
                padding: "2rem",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-blue)", marginBottom: "1rem" }}>Today</div>
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.25rem", lineHeight: 1.5 }}>Manage every vendor.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["Vendor Governance", "Risk Management", "Compliance", "Audit Management", "Trust Intelligence"].map((item) => (
                    <div key={item} style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "var(--color-ink-dim)" }}>
                      <span style={{ color: "#4ade80", fontSize: "10px" }}>●</span>{item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tomorrow */}
              <div style={{
                padding: "2rem",
                borderRadius: "16px",
                background: "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-blue)", marginBottom: "1rem" }}>Tomorrow</div>
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.25rem", lineHeight: 1.5 }}>Create a global trust network for vendor governance.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["Trust Network™", "Trust Exchange™", "Trust Verification Authority™"].map((item) => (
                    <div key={item} style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "var(--color-ink-dim)" }}>
                      <span style={{ color: "var(--color-blue)", fontSize: "10px" }}>◆</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="reveal" style={{ textAlign: "center", lineHeight: 2.2, fontSize: "1.05rem", color: "var(--color-ink-dim)", marginBottom: "0.5rem" }}>
              Every vendor. Every assessment. Every risk. Every audit. Every decision.
            </div>
            <div className="reveal" style={{ textAlign: "center" }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, background: "linear-gradient(135deg, #818cf8, #2dd4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                One platform.
              </span>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            PRICING
        ════════════════════════════════════ */}
        <section className="section" id="pricing">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Simple Pricing</span>
              <h2>Governance Built on Proof.<br />Priced for scale.</h2>
              <p>One flat annual price. Every module included. No per-seat surprises.</p>
            </div>

            <div className="pricing-cards reveal">
              <div className="pcard">
                <div>
                  <div className="pcard__tier">Growth</div>
                  <div className="pcard__price">
                    <span className="pcard__amount">$2,999</span>
                    <span className="pcard__period">/ year</span>
                  </div>
                  <p className="pcard__tagline">The complete vendor governance foundation for fast-growing companies.</p>
                </div>
                <div className="pcard__divider" />
                <ul className="pcard__feats">
                  <li>Vendor Hub™ + Trust Score™</li>
                  <li>Evidence Vault™ — 174 controls</li>
                  <li>Audit Management + Risk Lens™</li>
                  <li>Control Center™ + Policy Governance™</li>
                  <li>DPDP Privacy™ &amp; Contract Governance™</li>
                  <li>Trust Intelligence™</li>
                  <li>5 compliance frameworks</li>
                  <li>Up to 10 users · Email support</li>
                </ul>
                <a href="mailto:hello@audt.tech?subject=AUDT%20Growth%20Plan" className="pcard__cta pcard__cta--ghost">Get Started</a>
                <p className="pcard__note">Billed annually · Cancel anytime</p>
              </div>

              <div className="pcard pcard--featured">
                <div className="pcard__badge">Most Popular</div>
                <div>
                  <div className="pcard__tier">Business</div>
                  <div className="pcard__price">
                    <span className="pcard__amount">$6,999</span>
                    <span className="pcard__period">/ year</span>
                  </div>
                  <p className="pcard__tagline">The full Vendor Governance OS for organizations scaling their trust program.</p>
                </div>
                <div className="pcard__divider" />
                <ul className="pcard__feats">
                  <li>Everything in Growth</li>
                  <li>All 32 modules</li>
                  <li>Governance Agent Framework™ — 6 AI agents</li>
                  <li>Continuous Compliance™ — 21 automated checks</li>
                  <li>Security Command Center™</li>
                  <li>Integration Hub™ — 35+ connectors</li>
                  <li>Trust Network™ + Trust Verification Authority™</li>
                  <li>Auditor Collaboration™ — unlimited audit rooms</li>
                  <li>Up to 50 users · Priority support</li>
                </ul>
                <a href="mailto:hello@audt.tech?subject=AUDT%20Business%20Plan" className="pcard__cta pcard__cta--primary">Get Started</a>
                <p className="pcard__note">Billed annually · Cancel anytime</p>
              </div>

              <div className="pcard pcard__enterprise">
                <div>
                  <div className="pcard__tier">Enterprise</div>
                  <div className="pcard__price">
                    <span className="pcard__amount">Custom</span>
                  </div>
                  <p className="pcard__tagline">Tailored deployment for large, regulated organizations with complex vendor governance requirements.</p>
                </div>
                <div className="pcard__divider" />
                <ul className="pcard__feats">
                  <li>Everything in Business</li>
                  <li>Unlimited users &amp; organizations</li>
                  <li>Customer Managed Encryption (AWS KMS · Azure Key Vault · Google KMS)</li>
                  <li>Custom SAML/OIDC SSO</li>
                  <li>Dedicated Governance Agent™ configurations</li>
                  <li>Custom compliance frameworks &amp; controls</li>
                  <li>SLA guarantees &amp; dedicated success manager</li>
                  <li>On-premise or private cloud deployment</li>
                </ul>
                <a href="mailto:hello@audt.tech?subject=AUDT%20Enterprise%20Enquiry" className="pcard__cta pcard__cta--enterprise">Talk to Sales</a>
                <p className="pcard__note">Custom contract · Flexible billing</p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════ */}
        <section className="cta-final" id="cta">
          <div className="container cta-final__inner reveal">
            <div className="cta-final__badge">audt.tech</div>
            <h2>Ready to Govern Every Vendor?</h2>
            <p>
              One platform. Complete lifecycle. Continuous trust. Built for organizations that cannot afford to get vendor governance wrong.
            </p>
            <div className="cta-final__btns">
              <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
              <a href="/signup" className="btn btn--ghost btn--lg">Start Free Trial →</a>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__brand">
            <a href="#top" className="logo">
              <span className="logo__mark" aria-hidden="true"><span className="logo__icon">A</span></span>
              <span className="logo__text">AUDT</span>
            </a>
            <p className="footer__tag">Governance Built on Proof.</p>
            <p className="footer__sub">Vendor Governance &amp; Trust Operations Platform.</p>
          </div>
          <div className="footer__cols">
            <div className="footer__col">
              <div className="footer__col-head">Platform</div>
              <a href="#platform">Vendor Governance</a>
              <a href="#platform">Trust Operations</a>
              <a href="#platform">Risk &amp; Compliance</a>
              <a href="#platform">Trust Intelligence</a>
            </div>
            <div className="footer__col">
              <div className="footer__col-head">Solutions</div>
              <a href="#solutions">Procurement Teams</a>
              <a href="#solutions">Security Teams</a>
              <a href="#solutions">Compliance Teams</a>
              <a href="#solutions">Risk Teams</a>
            </div>
            <div className="footer__col">
              <div className="footer__col-head">Resources</div>
              <a href="/docs">Documentation</a>
              <a href="#pricing">Pricing</a>
              <a href="#vision">Vision</a>
              <a href="mailto:hello@audt.tech">Contact</a>
            </div>
            <div className="footer__col">
              <div className="footer__col-head">Differentiators</div>
              <a href="#trust-score">Trust Score™</a>
              <a href="#copilot">Governance Copilot™</a>
              <a href="#agents">AI Agents</a>
              <a href="#lifecycle">Vendor Lifecycle</a>
            </div>
          </div>
        </div>
        <div className="container footer__bottom">
          <span>© <span id="year" /> AUDT. All rights reserved.</span>
          <span>audt.tech · Governance Built on Proof.</span>
        </div>
      </footer>
    </>
  );
}
