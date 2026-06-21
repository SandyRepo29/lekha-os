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
            What AUDT is. What it delivers.
        ════════════════════════════════════ */}
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__copy reveal">
              <div className="badge">
                <span className="badge__pulse" />
                Vendor Governance Platform · audt.tech
              </div>
              <h1 className="hero__title">
                Govern Every Vendor.<br />
                <span className="grad-text">Trust Every Decision.</span>
              </h1>
              <p className="hero__sub">
                AUDT is the Vendor Governance Platform for modern organizations.
              </p>
              <p style={{ fontSize: "clamp(13px, 1.4vw, 15px)", color: "var(--text-dim)", maxWidth: "520px", marginBottom: "28px", lineHeight: 1.7 }}>
                Using a Trust Operations model, AUDT helps teams discover, assess, govern, monitor, audit, and continuously validate every vendor — from a single platform.
              </p>
              <div className="hero__cta">
                <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
                <a href="/signup" className="btn btn--ghost btn--lg">Start Free Trial <span className="arrow">→</span></a>
              </div>
              <div className="hero__trust">
                <span>Vendor Governance</span>
                <span className="dot">·</span>
                <span>Trust Operations</span>
                <span className="dot">·</span>
                <span>Risk &amp; Compliance</span>
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
        ════════════════════════════════════ */}
        <section className="section" id="problem">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Problem</span>
              <h2>Vendor Risk Is The New Business Risk.</h2>
              <p>
                Organizations depend on hundreds of vendors, SaaS applications, and AI providers.
                Yet vendor governance is still fragmented across spreadsheets, questionnaires, and disconnected tools.
              </p>
            </div>
            <div className="pain-grid">
              <div className="pain reveal"><span className="pain__icon">🌫️</span>No vendor visibility</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">✍️</span>Manual assessments</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">◎</span>Audit chaos</div>
              <div className="pain reveal"><span className="pain__icon">📋</span>Compliance gaps</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">⚠</span>Risk blind spots</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">🔄</span>Weak renewal decisions</div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            3. WHY GOVERNANCE MUST BECOME CONTINUOUS
            Category creation — urgency.
        ════════════════════════════════════ */}
        <section className="section section--alt" id="why-continuous">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Why Now</span>
              <h2>Why Governance Must Become Continuous.</h2>
              <p>The way organizations govern vendors has fundamentally changed. Annual processes no longer match the pace of modern vendor risk.</p>
            </div>

            <div className="reveal" style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              maxWidth: "820px",
              margin: "0 auto 3rem",
            }}>
              {/* Yesterday */}
              <div style={{
                padding: "2rem",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#f87171", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
                  Yesterday
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
                  {[
                    "Annual assessments",
                    "Annual audits",
                    "Periodic vendor reviews",
                    "Spreadsheet-based tracking",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: "var(--text-dim)" }}>
                      <span style={{ color: "#f87171", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>✕</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Today */}
              <div style={{
                padding: "2rem",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(45,212,255,0.04))",
                border: "1px solid rgba(99,102,241,0.25)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#4ade80", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                  Today
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
                  {[
                    "Hundreds of SaaS vendors",
                    "AI providers to govern",
                    "Third-party risk exposure",
                    "Continuous compliance",
                    "Continuous monitoring",
                    "Continuous audits",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: "var(--text-dim)" }}>
                      <span style={{ color: "#4ade80", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="reveal" style={{
              maxWidth: "620px",
              margin: "0 auto",
              textAlign: "center",
              padding: "28px 32px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", lineHeight: 1.6, marginBottom: "10px" }}>
                Governance is no longer an annual exercise.<br />It is a continuous operation.
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-dim)" }}>
                AUDT was built for this new reality.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            4. VENDOR LIFECYCLE
        ════════════════════════════════════ */}
        <section className="section" id="lifecycle">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Vendor Lifecycle</span>
              <h2>Manage The Entire Vendor Lifecycle.</h2>
              <p>AUDT governs every stage of the vendor relationship — from discovery through offboarding.</p>
            </div>

            <div className="reveal" style={{ overflowX: "auto", paddingBottom: "8px" }}>
              <div style={{
                display: "flex",
                alignItems: "stretch",
                gap: "0",
                minWidth: "700px",
                margin: "0 auto",
                maxWidth: "940px",
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
                      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--blue)", marginBottom: "8px", opacity: 0.8 }}>{step}</div>
                      <div style={{ fontSize: "20px", marginBottom: "6px" }}>{icon}</div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{label}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", lineHeight: 1.4 }}>{desc}</div>
                    </div>
                    {i < 9 && (
                      <div style={{ display: "flex", alignItems: "center", padding: "0 3px", color: "var(--blue)", fontSize: "14px", opacity: 0.4, flexShrink: 0 }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal" style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
                Most platforms focus on one stage.<br />
                <strong style={{ color: "var(--text)" }}>AUDT manages the complete lifecycle.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            5. PLATFORM PILLARS
        ════════════════════════════════════ */}
        <section className="section section--alt" id="platform">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Platform Overview</span>
              <h2>One Platform. Four Pillars.</h2>
              <p>Every dimension of vendor governance, integrated into a single platform.</p>
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
                  <li>Vendor Registry</li>
                  <li>Ownership &amp; Contacts</li>
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
                <p>Assessments, reviews, evidence collection, and remediation.</p>
                <ul className="pillar__feats">
                  <li>Security Assessments</li>
                  <li>Evidence Collection</li>
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
                <p>Risks, controls, compliance frameworks, and audits.</p>
                <ul className="pillar__feats">
                  <li>Risk Register</li>
                  <li>Control Center™</li>
                  <li>Framework Coverage</li>
                  <li>Audit Management</li>
                </ul>
              </article>
              <article className="pillar pillar--live reveal" data-delay="180">
                <div className="pillar__top">
                  <div className="pillar__icon">✦</div>
                  <span className="status status--live">Pillar 4</span>
                </div>
                <h3>Trust Intelligence</h3>
                <p>AI-powered signals that surface trust across the entire vendor portfolio.</p>
                <ul className="pillar__feats">
                  <li>Trust Score™</li>
                  <li>Governance Copilot™</li>
                  <li>Benchmarking™</li>
                  <li>Continuous Monitoring</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            6. BUILT FOR EVERY GOVERNANCE TEAM
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
                <div className="sol__icon">🛡</div>
                <h3>Security Teams</h3>
                <p>Assess vendor risk. Monitor security posture. Manage third-party exposure. Track assessments and remediation end-to-end.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">◷</div>
                <h3>Compliance Teams</h3>
                <p>Automate evidence collection from vendors. Maintain audit readiness. Track framework coverage continuously.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">▤</div>
                <h3>Procurement Teams</h3>
                <p>Manage vendor onboarding. Track contract renewals. Coordinate periodic reviews. Handle safe offboarding.</p>
              </div>
              <div className="sol reveal">
                <div className="sol__icon">⚠</div>
                <h3>Risk Teams</h3>
                <p>Prioritize vendor risk. Track remediation progress. Monitor vendor health continuously across the portfolio.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">📊</div>
                <h3>Leadership Teams</h3>
                <p>Measure organizational trust. Understand vendor exposure. Make informed renewal and onboarding decisions.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">🤝</div>
                <h3>Audit Teams</h3>
                <p>Engage external auditors in secure rooms. Exchange vendor evidence. Track findings and assessment progress.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            7. WHY AUDT
        ════════════════════════════════════ */}
        <section className="section section--alt" id="why-audt">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Why AUDT</span>
              <h2>Most Platforms Start With Compliance.<br />We Start With The Vendor.</h2>
              <p>Compliance is one part of vendor governance. AUDT governs the entire lifecycle.</p>
            </div>

            <div className="reveal" style={{ overflowX: "auto" }}>
              <div style={{ minWidth: "560px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", background: "rgba(255,255,255,0.03)", borderRadius: "12px 12px 0 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {[
                    { label: "Capability", color: "var(--text-dim)" },
                    { label: "Compliance Platforms", color: "var(--text-dim)" },
                    { label: "Traditional GRC", color: "var(--text-dim)" },
                    { label: "AUDT", color: "var(--blue)" },
                  ].map(({ label, color }) => (
                    <div key={label} style={{ padding: "14px 20px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color, textAlign: label === "Capability" ? "left" as const : "center" as const }}>
                      {label}
                    </div>
                  ))}
                </div>
                {[
                  ["Vendor Lifecycle",      "Partial",  "Partial",  "Complete"],
                  ["Vendor Registry",       "Limited",  "Strong",   "Strong"],
                  ["Compliance Frameworks", "Strong",   "Strong",   "Strong"],
                  ["Audit Management",      "Partial",  "Strong",   "Strong"],
                  ["Continuous Monitoring", "Partial",  "Limited",  "Always-on"],
                  ["AI Governance",         "Limited",  "Limited",  "Native"],
                  ["Trust Intelligence",    "None",     "None",     "Native"],
                ].map(([label, col1, col2, col3], ri) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", borderBottom: ri < 6 ? "1px solid rgba(255,255,255,0.05)" : "none", borderRadius: ri === 6 ? "0 0 12px 12px" : undefined }}>
                    <div style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>{label}</div>
                    {[col1, col2].map((val, ci) => (
                      <div key={ci} style={{ padding: "14px 20px", fontSize: "13px", color: "var(--text-dim)", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <span style={{ color: val === "Strong" ? "#4ade80" : val === "None" || val === "Limited" ? "#f87171" : "#facc15", fontWeight: 700, fontSize: "10px" }}>
                          {val === "Strong" ? "●" : val === "None" ? "○" : "◐"}
                        </span>
                        {val}
                      </div>
                    ))}
                    <div style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#a5f3a0", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <span style={{ color: "#34d399", fontWeight: 700 }}>✓</span> {col3}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal" style={{
              marginTop: "2.5rem",
              textAlign: "center",
              padding: "28px 32px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              maxWidth: "680px",
              margin: "2.5rem auto 0",
            }}>
              <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: 1.8 }}>
                Most compliance platforms focus on audits.{" "}
                Most GRC platforms focus on risks.{" "}<br />
                <strong style={{ color: "var(--text)" }}>
                  AUDT governs the complete vendor lifecycle while continuously measuring trust.
                </strong>
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            8. TRUST SCORE™ — UNIVERSAL MEASURE
            Category asset. Core innovation.
        ════════════════════════════════════ */}
        <section className="section" id="trust-score">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Trust Score™</span>
              <h2>The Universal Measure Of Vendor Trust.</h2>
              <p>
                Every vendor generates signals. Security posture. Compliance status. Risk exposure.
                Audit readiness. Operational performance.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "18px", lineHeight: 1.65, marginTop: "12px" }}>
                AUDT continuously combines these signals into a single Trust Score™ — so organizations always know which vendors can be trusted and which require attention.
              </p>
            </div>

            {/* Signal equation */}
            <div className="reveal" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "8px",
              padding: "28px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              maxWidth: "800px",
              margin: "0 auto 3.5rem",
            }}>
              {(["Security", "Compliance", "Risk", "Monitoring", "Audit Readiness"] as string[]).map((item, i, arr) => (
                <span key={item} style={{ display: "contents" }}>
                  <div style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}>{item}</div>
                  {i < arr.length - 1 && (
                    <span style={{ color: "var(--blue)", fontWeight: 700, opacity: 0.5, fontSize: "18px" }}>+</span>
                  )}
                </span>
              ))}
              <span style={{ color: "var(--blue)", fontWeight: 700, fontSize: "22px", margin: "0 6px" }}>=</span>
              <div style={{
                padding: "12px 24px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(45,212,255,0.12))",
                border: "1px solid rgba(99,102,241,0.5)",
                fontSize: "15px",
                fontWeight: 800,
                color: "var(--text)",
                letterSpacing: "0.01em",
              }}>Trust Score™</div>
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

            <div className="reveal" style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <p style={{ fontSize: "15px", color: "var(--text-dim)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.7 }}>
                Move beyond periodic assessments and static reviews.<br />
                <strong style={{ color: "var(--text)" }}>Continuously understand which vendors are trusted and which require attention.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            9. GOVERNANCE COPILOT™
        ════════════════════════════════════ */}
        <section className="section section--alt" id="copilot">
          <div className="container ai-sec">
            <div className="ai-sec__copy reveal">
              <span className="eyebrow">Governance Copilot™</span>
              <h2>AI Built Into Every Governance Workflow.</h2>
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
                  <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: "var(--text-dim)" }}>
                    <span style={{ color: "var(--blue)", fontWeight: 700 }}>✓</span>
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
        ════════════════════════════════════ */}
        <section className="section" id="agents">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">AI Agents</span>
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
          </div>
        </section>

        {/* ════════════════════════════════════
            11. GOVERNANCE COVERAGE
            10 domains. Breadth without overload.
        ════════════════════════════════════ */}
        <section className="section section--alt" id="coverage">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Governance Coverage</span>
              <h2>Every Governance Domain. One Platform.</h2>
              <p>AUDT covers the full breadth of modern vendor governance — from vendor intake to continuous monitoring.</p>
            </div>
            <div className="reveal" style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              justifyContent: "center",
              maxWidth: "820px",
              margin: "0 auto 2.5rem",
            }}>
              {[
                "Vendor Governance",
                "Trust Operations",
                "Risk Management",
                "Compliance Management",
                "Audit Management",
                "Policy Governance",
                "Privacy Governance",
                "Asset Intelligence",
                "AI Governance",
                "Continuous Monitoring",
              ].map((item) => (
                <div key={item} style={{
                  padding: "10px 20px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: "14px",
                  color: "var(--text-dim)",
                  fontWeight: 500,
                }}>{item}</div>
              ))}
            </div>
            <div className="reveal" style={{ textAlign: "center", maxWidth: "540px", margin: "0 auto" }}>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                Powered by 32 integrated modules and a shared intelligence layer.
              </p>
              <a href="/docs" className="btn btn--ghost">Explore Platform →</a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            12. ENTERPRISE READINESS
            Signals for enterprise buyers.
        ════════════════════════════════════ */}
        <section className="section" id="enterprise">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Enterprise Readiness</span>
              <h2>Built For Enterprise Governance.</h2>
              <p>AUDT is designed for organizations where vendor governance is a strategic priority — not a compliance checkbox.</p>
            </div>
            <div className="reveal" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              maxWidth: "960px",
              margin: "0 auto",
            }}>
              {[
                { icon: "🏢", title: "Multi-Entity Governance",       desc: "Govern vendors across subsidiaries, business units, and legal entities from one platform." },
                { icon: "🌐", title: "Third-Party Risk Oversight",    desc: "Map risk exposure across your entire third-party ecosystem, including Nth-party dependencies." },
                { icon: "📡", title: "Continuous Assurance",          desc: "Always-on monitoring replaces point-in-time assessments. Governance signals update in real time." },
                { icon: "◎",  title: "Enterprise Audit Readiness",    desc: "Maintain audit-ready evidence, controls, and documentation 365 days a year." },
                { icon: "◻",  title: "Policy & Control Management",   desc: "Manage policies, controls, and frameworks with version history and attestation workflows." },
                { icon: "▤",  title: "Vendor Lifecycle Governance",   desc: "Govern the complete vendor lifecycle from intake to offboarding — not just assessments." },
                { icon: "🤖", title: "AI Governance",                  desc: "Govern AI vendors, AI systems, and AI risks with dedicated AI governance frameworks." },
                { icon: "✦",  title: "Governance Intelligence",       desc: "AI-powered insights, Trust Score™, and the Governance Copilot™ built into every workflow." },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{
                  padding: "24px 20px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "12px" }}>{icon}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px", lineHeight: 1.3 }}>{title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.65 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            13. SHARED INTELLIGENCE LAYER
        ════════════════════════════════════ */}
        <section className="section section--alt" id="intelligence">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Architecture</span>
              <h2>Everything Shares The Same Intelligence.</h2>
              <p>
                Unlike point solutions that operate in silos, every AUDT module shares a single vendor intelligence layer —
                so risk data informs compliance, compliance informs audits, and audits inform trust scores. Automatically.
              </p>
            </div>

            <div className="reveal" style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              maxWidth: "860px",
              margin: "0 auto 3rem",
            }}>
              {[
                { icon: "🔗", title: "Connected Data Model",     body: "Every vendor, risk, control, evidence, and audit is linked. Changes propagate across modules automatically." },
                { icon: "✦",  title: "Shared AI Layer",          body: "The Governance Copilot™ and AI Agents operate on your complete governance graph — not isolated module data." },
                { icon: "📡", title: "Continuous Signal Engine", body: "Trust scores, compliance readiness, and risk posture update in real time as vendor data changes." },
              ].map(({ icon, title, body }) => (
                <div key={title} style={{
                  padding: "28px 24px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "16px" }}>{icon}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "10px", color: "var(--text)" }}>{title}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.65 }}>{body}</div>
                </div>
              ))}
            </div>

            <div className="metrics-grid reveal">
              <div className="mstat">
                <div className="mstat__num"><span className="counter" data-target="32">0</span></div>
                <div className="mstat__label">Integrated Modules</div>
              </div>
              <div className="mstat">
                <div className="mstat__num"><span className="counter" data-target="174">0</span><span style={{ fontSize: "1.2rem" }}>+</span></div>
                <div className="mstat__label">Pre-Mapped Controls</div>
              </div>
              <div className="mstat">
                <div className="mstat__num">10</div>
                <div className="mstat__label">Vendor Lifecycle Stages</div>
              </div>
              <div className="mstat">
                <div className="mstat__num"><span className="counter" data-target="35">0</span><span style={{ fontSize: "1.2rem" }}>+</span></div>
                <div className="mstat__label">Integration Connectors</div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            14. VISION
        ════════════════════════════════════ */}
        <section className="section" id="vision">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Our Vision</span>
              <h2>Building The System Of Record For Vendor Trust.</h2>
              <p>
                Today, organizations use AUDT to govern vendors.<br />
                Tomorrow, organizations will use AUDT to verify trust across an entire ecosystem.
              </p>
            </div>

            <div className="reveal" style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              maxWidth: "760px",
              margin: "0 auto 3rem",
            }}>
              <div style={{
                padding: "2rem",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4ade80", marginBottom: "1rem" }}>Platform Today</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                  {["Vendor Governance", "Trust Operations", "Risk & Compliance", "Trust Intelligence"].map((item) => (
                    <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "var(--text-dim)" }}>
                      <span style={{ color: "#4ade80", fontSize: "10px" }}>●</span>{item}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{
                padding: "2rem",
                borderRadius: "16px",
                background: "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--blue)", marginBottom: "1rem" }}>Future Vision</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                  {["Trust Network™", "Trust Exchange™", "Trust Verification Authority™", "Industry Benchmarking™"].map((item) => (
                    <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "var(--text-dim)" }}>
                      <span style={{ color: "var(--blue)", fontSize: "10px" }}>◆</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="reveal" style={{ textAlign: "center" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, background: "linear-gradient(135deg, #818cf8, #2dd4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                One platform. Every vendor. Continuous trust.
              </span>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            PRICING
        ════════════════════════════════════ */}
        <section className="section section--alt" id="pricing">
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
                  <p className="pcard__tagline">The full Vendor Governance Platform for organizations scaling their trust program.</p>
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
                  <p className="pcard__tagline">Tailored deployment for large, regulated organizations.</p>
                </div>
                <div className="pcard__divider" />
                <ul className="pcard__feats">
                  <li>Everything in Business</li>
                  <li>Unlimited users &amp; organizations</li>
                  <li>Customer Managed Encryption (AWS KMS · Azure Key Vault)</li>
                  <li>Custom SAML/OIDC SSO</li>
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
            <div className="cta-final__badge">Vendor Governance Platform</div>
            <h2>Ready to Govern Every Vendor?</h2>
            <p>
              One platform. Complete lifecycle. Continuous trust.<br />Built for organizations that cannot afford to get vendor governance wrong.
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
            <p className="footer__sub">The Vendor Governance Platform for modern organizations.</p>
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
              <a href="#solutions">Security Teams</a>
              <a href="#solutions">Compliance Teams</a>
              <a href="#solutions">Procurement Teams</a>
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
          <span>audt.tech · Vendor Governance Platform</span>
        </div>
      </footer>
    </>
  );
}
