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

      {/* NAV */}
      <header className="nav" id="nav">
        <div className="container nav__inner">
          <a href="#top" className="logo" aria-label="AUDT home">
            <span className="logo__mark" aria-hidden="true">
              <span className="logo__icon">A</span>
            </span>
            <span className="logo__text">AUDT</span>
          </a>

          <nav className="nav__menu" aria-label="Primary">
            <a href="#platform">Platform</a>
            <a href="#solutions">Solutions</a>
            <a href="#trust-intelligence">Trust Intelligence</a>
            <a href="/docs">Resources</a>
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
          <a href="#trust-intelligence">Trust Intelligence</a>
          <a href="/docs">Resources</a>
          <a href="/docs">Docs</a>
          <a href="#pricing">Pricing</a>
          <a href="mailto:hello@audt.tech">Contact</a>
          <a href="/login">Sign in</a>
          <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--ghost">Book Demo</a>
          <a href="/signup" className="btn btn--primary">Start Free</a>
        </div>
      </header>

      <main id="top">

        {/* HERO */}
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
                AUDT is the Vendor Governance &amp; Trust Operations platform that helps organizations discover, assess, monitor, audit, and continuously validate every vendor from a single system of record.
              </p>
              <p className="hero__support">
                From onboarding to offboarding — AUDT manages the entire vendor lifecycle while continuously measuring trust, so your governance is always evidence-based and audit-ready.
              </p>
              <div className="hero__cta">
                <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
                <a href="#lifecycle" className="btn btn--ghost btn--lg">
                  See the Lifecycle <span className="arrow">→</span>
                </a>
              </div>
              <div className="hero__trust">
                <span>Vendor Governance™</span>
                <span className="dot">·</span>
                <span>Trust Operations™</span>
                <span className="dot">·</span>
                <span>Continuous Monitoring™</span>
                <span className="dot">·</span>
                <span>Trust Score™</span>
                <span className="dot">·</span>
                <span>AI-Native</span>
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

        {/* SOCIAL PROOF */}
        <section className="proof">
          <div className="container">
            <p className="proof__head reveal">
              Built for vendor governance teams across SaaS, Fintech, Healthcare, Manufacturing &amp; IT Services
            </p>
            <div className="proof__logos reveal">
              <span>SaaS</span><span>Fintech</span><span>Healthcare</span>
              <span>Manufacturing</span><span>IT Services</span><span>Legal</span>
            </div>
            <div className="proof__metrics">
              <div className="metric reveal">
                <div className="metric__num"><span className="counter" data-target="10">0</span><i>+</i></div>
                <div className="metric__label">Vendor Lifecycle Stages Covered</div>
              </div>
              <div className="metric reveal" data-delay="80">
                <div className="metric__num"><span className="counter" data-target="259">0</span><i>+</i></div>
                <div className="metric__label">Database Tables — Full Governance Data Model</div>
              </div>
              <div className="metric reveal" data-delay="160">
                <div className="metric__num"><span className="counter" data-target="32">0</span></div>
                <div className="metric__label">Modules Live &amp; In Production</div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="section" id="problem">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Problem</span>
              <h2>Vendor Risk Is The New Business Risk.</h2>
              <p>
                Organizations rely on hundreds of vendors, SaaS applications, suppliers, contractors, and AI providers.
                But most teams lack a centralized vendor inventory, visibility into vendor risk, continuous compliance validation,
                audit readiness, and structured renewal decisions. Governance becomes reactive, expensive, and impossible to scale.
              </p>
            </div>
            <div className="pain-grid">
              <div className="pain reveal"><span className="pain__icon">🔍</span>No centralized vendor inventory</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">🌫️</span>Zero visibility into vendor risk</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">📦</span>Compliance validation is manual and point-in-time</div>
              <div className="pain reveal"><span className="pain__icon">✍️</span>Audit preparation burns weeks every quarter</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">📋</span>No structured vendor renewal process</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">🔗</span>Multiple disconnected tools for one problem</div>
            </div>
          </div>
        </section>

        {/* VENDOR LIFECYCLE */}
        <section className="section section--alt" id="lifecycle">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">One Platform. Complete Lifecycle.</span>
              <h2>From Discover to Offboard — In One System.</h2>
              <p>AUDT manages the entire vendor lifecycle so your team always has a complete, up-to-date picture of every vendor relationship.</p>
            </div>
            <div className="agents-grid">
              {[
                { icon: "🔎", title: "Discover", desc: "Identify all vendors across the organization — shadow IT, SaaS, suppliers, AI providers.", delay: "0" },
                { icon: "📋", title: "Inventory", desc: "Create a complete vendor system of record with profiles, contacts, and ownership.", delay: "60" },
                { icon: "🏷", title: "Classify", desc: "Determine vendor criticality, data access level, and business impact.", delay: "120" },
                { icon: "🔬", title: "Assess", desc: "Evaluate security, privacy, and compliance posture with AI-powered assessments.", delay: "0" },
                { icon: "⚠", title: "Risk", desc: "Calculate and continuously monitor vendor risk with Trust Score™ and risk scoring.", delay: "60" },
                { icon: "◷", title: "Comply", desc: "Map vendors to controls and compliance frameworks — ISO 27001, SOC 2, DPDP, and more.", delay: "120" },
                { icon: "📡", title: "Monitor", desc: "Continuously validate vendor trustworthiness with automated monitoring rules.", delay: "0" },
                { icon: "◎", title: "Audit", desc: "Maintain evidence and stay audit-ready with structured programs and findings.", delay: "60" },
                { icon: "🔄", title: "Renew", desc: "Make informed vendor renewal decisions using contract data, risk posture, and trust trends.", delay: "120" },
                { icon: "🚪", title: "Offboard", desc: "Safely terminate vendor relationships with documented governance and evidence trails.", delay: "0" },
              ].map(({ icon, title, desc, delay }) => (
                <div key={title} className="agent-card reveal" data-delay={delay}>
                  <div className="agent-card__top">
                    <div className="agent-card__icon agent-card__icon--compliance">{icon}</div>
                    <span className="agent-card__badge">{title}</span>
                  </div>
                  <h3 className="agent-card__name">{title}</h3>
                  <p style={{ fontSize: "13px", color: "var(--color-ink-dim)", lineHeight: 1.5, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
            <div className="agents-cta reveal">
              <a href="/signup" className="btn btn--primary">Start Governing Vendors</a>
              <a href="#platform" className="btn btn--ghost">See Platform Pillars <span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        {/* PLATFORM PILLARS */}
        <section className="section" id="platform">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Built For Modern Vendor Governance</span>
              <h2>Four Pillars. One Platform.</h2>
              <p>Every capability you need to govern vendors, operate trust, manage risk and compliance, and make data-driven decisions — unified in a single system.</p>
            </div>
            <div className="pillars">

              <article className="pillar pillar--live reveal">
                <div className="pillar__top">
                  <div className="pillar__icon">▤</div>
                  <span className="status status--live">Pillar 1</span>
                </div>
                <h3>Vendor Governance</h3>
                <p>Single source of truth for every vendor. Know every vendor, who owns them, and the current state of every relationship.</p>
                <ul className="pillar__feats">
                  <li>Vendor Registry &amp; Profiles</li>
                  <li>Vendor Ownership &amp; Contacts</li>
                  <li>Vendor Classification</li>
                  <li>Contract Governance™</li>
                  <li>Vendor Portal (Magic Link)</li>
                  <li>Renewal Management</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="60">
                <div className="pillar__top">
                  <div className="pillar__icon">🛡</div>
                  <span className="status status--live">Pillar 2</span>
                </div>
                <h3>Trust Operations</h3>
                <p>Operational workflows that validate vendor trust continuously — not just at renewal time.</p>
                <ul className="pillar__feats">
                  <li>Security Assessments</li>
                  <li>Questionnaire Exchange™</li>
                  <li>Evidence Collection™</li>
                  <li>Evidence Requests</li>
                  <li>Vendor Reviews</li>
                  <li>AI Remediation Planner™</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="120">
                <div className="pillar__top">
                  <div className="pillar__icon">◷</div>
                  <span className="status status--live">Pillar 3</span>
                </div>
                <h3>Risk &amp; Compliance</h3>
                <p>Governance execution at scale — from risk identification to compliance validation and audit readiness.</p>
                <ul className="pillar__feats">
                  <li>Framework Management (ISO 27001, SOC 2, DPDP…)</li>
                  <li>Controls Management</li>
                  <li>Risk Register &amp; Heat Map</li>
                  <li>Findings Management</li>
                  <li>Audit Management</li>
                  <li>Policy Governance™</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="180">
                <div className="pillar__top">
                  <div className="pillar__icon">✦</div>
                  <span className="status status--live">Pillar 4</span>
                </div>
                <h3>Trust Intelligence</h3>
                <p>AI-powered trust insights and decision support — so every vendor decision is backed by real data.</p>
                <ul className="pillar__feats">
                  <li>Trust Score™ — live vendor trust measurement</li>
                  <li>Governance Copilot™</li>
                  <li>Trust Graph™</li>
                  <li>Governance Benchmarking™</li>
                  <li>Continuous Monitoring™</li>
                  <li>Executive Reporting &amp; Analytics™</li>
                </ul>
              </article>

            </div>
          </div>
        </section>

        {/* WHY AUDT — COMPARISON TABLE */}
        <section className="section section--alt" id="why-audt">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Why AUDT</span>
              <h2>Most Platforms Start With Compliance.<br />We Start With The Vendor.</h2>
              <p>Compliance is one part of vendor governance. AUDT governs the entire lifecycle.</p>
            </div>
            <div className="comparison-table reveal">
              <div className="comparison-table__head">
                <div className="comparison-table__col comparison-table__col--label" />
                <div className="comparison-table__col comparison-table__col--old">Traditional Platforms</div>
                <div className="comparison-table__col comparison-table__col--new">AUDT</div>
              </div>
              {[
                ["Approach", "Compliance First", "Vendor First"],
                ["Model", "Audit Driven", "Lifecycle Driven"],
                ["Architecture", "Point Solutions", "Unified Platform"],
                ["Monitoring", "Static Reviews", "Continuous Monitoring"],
                ["Audits", "Annual Audits", "Continuous Trust Validation"],
                ["Tooling", "Multiple Disconnected Tools", "Single System of Record"],
                ["Vendor Trust", "Assumed", "Measured with Trust Score™"],
                ["AI", "Reports and dashboards", "Governance Agents™ + Copilot™"],
              ].map(([label, old, neu]) => (
                <div key={label} className="comparison-table__row">
                  <div className="comparison-table__col comparison-table__col--label">{label}</div>
                  <div className="comparison-table__col comparison-table__col--old">
                    <span className="comparison-table__x">✕</span> {old}
                  </div>
                  <div className="comparison-table__col comparison-table__col--new">
                    <span className="comparison-table__check">✓</span> {neu}
                  </div>
                </div>
              ))}
            </div>

            <div className="ti-highlight reveal">
              <div className="ti-highlight__badge">Category Definition</div>
              <h3>The Vendor Governance &amp; Trust Operations Platform</h3>
              <p>
                AUDT is not another GRC tool. We&apos;re building the system of record for vendor trust —
                where every vendor relationship is governed, every assessment is tracked, and every trust decision
                is backed by continuous evidence.
              </p>
              <div className="ti-highlight__items">
                <div className="ti-highlight__item">
                  <span className="ti-highlight__icon">▤</span>
                  <span>Every vendor. One system of record.</span>
                </div>
                <div className="ti-highlight__item">
                  <span className="ti-highlight__icon">✦</span>
                  <span>Trust is measured, not assumed</span>
                </div>
                <div className="ti-highlight__item">
                  <span className="ti-highlight__icon">◷</span>
                  <span>Compliance built on vendor evidence</span>
                </div>
                <div className="ti-highlight__item">
                  <span className="ti-highlight__icon">📊</span>
                  <span>Lifecycle-driven, not audit-driven</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SCORE */}
        <section className="section" id="trust-score">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Trust Score™</span>
              <h2>Measure Vendor Trust In Real Time.</h2>
              <p>
                Trust should not be a subjective decision. AUDT continuously calculates a Trust Score™ for every vendor
                using signals from security, compliance, risk, monitoring, performance, and audit readiness —
                so your team always knows exactly where they stand.
              </p>
            </div>
            <div className="trust-scores reveal">
              <div className="tscore">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#tg1)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="17" strokeLinecap="round"
                      transform="rotate(-90 40 40)" />
                    <defs>
                      <linearGradient id="tg1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#2dd4ff" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="tscore__val">
                    <span className="score-num" data-score="92">0</span>
                  </div>
                </div>
                <div className="tscore__label">Security Posture</div>
                <div className="tscore__sub">↑ 4 pts this month</div>
              </div>
              <div className="tscore">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#tg2)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="26" strokeLinecap="round"
                      transform="rotate(-90 40 40)" />
                    <defs>
                      <linearGradient id="tg2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="tscore__val">
                    <span className="score-num" data-score="88">0</span>
                  </div>
                </div>
                <div className="tscore__label">Compliance Coverage</div>
                <div className="tscore__sub">3 controls need review</div>
              </div>
              <div className="tscore tscore--featured">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#tg3)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="13" strokeLinecap="round"
                      transform="rotate(-90 40 40)" />
                    <defs>
                      <linearGradient id="tg3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2dd4ff" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="tscore__val">
                    <span className="score-num" data-score="94">0</span>
                  </div>
                </div>
                <div className="tscore__label">Vendor Trust Score™</div>
                <div className="tscore__sub">Overall — Trusted</div>
              </div>
              <div className="tscore">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#tg4)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="21" strokeLinecap="round"
                      transform="rotate(-90 40 40)" />
                    <defs>
                      <linearGradient id="tg4" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="tscore__val">
                    <span className="score-num" data-score="90">0</span>
                  </div>
                </div>
                <div className="tscore__label">Audit Readiness</div>
                <div className="tscore__sub">ISO 27001 — Ready</div>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTIONS BY TEAM */}
        <section className="section section--alt" id="solutions">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Solutions By Team</span>
              <h2>Built For Every Governance Team.</h2>
              <p>Purpose-built workflows for every team that touches vendor governance — from security to procurement to the board.</p>
            </div>
            <div className="solutions">
              <div className="sol reveal">
                <div className="sol__icon">🛡</div>
                <h3>Security Teams</h3>
                <p>Assess vendor security posture, track risk across the vendor portfolio, monitor controls, and manage security incidents — all in one place.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">◷</div>
                <h3>Compliance Teams</h3>
                <p>Automate evidence collection from vendors, validate controls against frameworks, and stay audit-ready every day of the year.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">▤</div>
                <h3>Procurement Teams</h3>
                <p>Manage vendor onboarding, track contracts and obligations, schedule reviews, and make structured renewal decisions backed by trust data.</p>
              </div>
              <div className="sol reveal">
                <div className="sol__icon">⚠</div>
                <h3>Risk Teams</h3>
                <p>Identify, prioritize, and remediate vendor risk with a unified register, visual heat maps, treatment tracking, and AI risk officer.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">📊</div>
                <h3>Leadership Teams</h3>
                <p>Understand organizational trust posture and vendor exposure through executive dashboards, board reports, and predictive analytics.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">🤝</div>
                <h3>Audit Teams</h3>
                <p>Work with external auditors in secure audit rooms, exchange evidence, track findings, and run assessments through structured collaboration.</p>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS BANNER */}
        <section className="metrics-banner-section">
          <div className="container">
            <div className="metrics-banner reveal">
              <div className="metrics-banner__item">
                <div className="metrics-banner__val">10</div>
                <div className="metrics-banner__label">Lifecycle Stages</div>
              </div>
              <div className="metrics-banner__divider" />
              <div className="metrics-banner__item">
                <div className="metrics-banner__val">32</div>
                <div className="metrics-banner__label">Governance Modules</div>
              </div>
              <div className="metrics-banner__divider" />
              <div className="metrics-banner__item">
                <div className="metrics-banner__val">Continuous</div>
                <div className="metrics-banner__label">Trust Monitoring</div>
              </div>
              <div className="metrics-banner__divider" />
              <div className="metrics-banner__item">
                <div className="metrics-banner__val">174+</div>
                <div className="metrics-banner__label">Pre-built Controls</div>
              </div>
              <div className="metrics-banner__divider" />
              <div className="metrics-banner__item">
                <div className="metrics-banner__val">Trust</div>
                <div className="metrics-banner__label">Score Built In</div>
              </div>
              <div className="metrics-banner__divider" />
              <div className="metrics-banner__item">
                <div className="metrics-banner__val">AI</div>
                <div className="metrics-banner__label">Governance Native</div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPETITIVE COMPARISON */}
        <section className="section" id="competitive">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">A Different Approach</span>
              <h2>A Different Approach To Vendor Governance.</h2>
              <p>Most platforms solve a single governance problem. AUDT manages the complete vendor lifecycle.</p>
            </div>
            <div className="comparison-table reveal">
              <div className="comparison-table__head">
                <div className="comparison-table__col comparison-table__col--label">Capability</div>
                <div className="comparison-table__col comparison-table__col--old">Vanta / UpGuard</div>
                <div className="comparison-table__col comparison-table__col--new">AUDT</div>
              </div>
              {[
                ["Compliance Automation", "Yes", "Yes — continuous, automated"],
                ["Vendor Governance", "Limited / Partial", "Full lifecycle — Discover to Offboard"],
                ["Risk Management", "Partial", "Full register + heat map + AI risk officer"],
                ["Audit Management", "Partial", "Programs + findings + CAPAs + AI auditor"],
                ["Continuous Monitoring", "Partial", "Always-on 7 monitoring rules"],
                ["Trust Intelligence", "No", "Trust Score™ + Trust Graph™ + Copilot™"],
                ["Full Vendor Lifecycle", "No / Partial", "10-stage lifecycle in one platform"],
                ["AI Governance Agents", "No", "6 agent types — 24/7 autonomous monitoring"],
              ].map(([label, old, neu]) => (
                <div key={label} className="comparison-table__row">
                  <div className="comparison-table__col comparison-table__col--label">{label}</div>
                  <div className="comparison-table__col comparison-table__col--old">
                    <span className="comparison-table__x">✕</span> {old}
                  </div>
                  <div className="comparison-table__col comparison-table__col--new">
                    <span className="comparison-table__check">✓</span> {neu}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST INTELLIGENCE */}
        <section className="section section--alt" id="trust-intelligence">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Trust Intelligence™</span>
              <h2>Trust Intelligence™ For Every Vendor Decision.</h2>
              <p>
                AUDT continuously evaluates vendor governance posture using evidence, controls, risks,
                audits, and compliance signals — giving you a live view of vendor trust across the entire organization.
              </p>
            </div>
            <div className="ti-grid">
              <div className="ti-item reveal">
                <div className="ti-item__icon">✦</div>
                <div>
                  <h3>Trust Score™</h3>
                  <p>A live 0–100 trust score per vendor, computed from security, compliance, risk, assessments, operations, and freshness signals.</p>
                </div>
              </div>
              <div className="ti-item reveal" data-delay="60">
                <div className="ti-item__icon">🌐</div>
                <div>
                  <h3>Trust Graph™</h3>
                  <p>Force-directed governance knowledge graph connecting vendors, controls, risks, findings, policies, and frameworks.</p>
                </div>
              </div>
              <div className="ti-item reveal" data-delay="120">
                <div className="ti-item__icon">✦</div>
                <div>
                  <h3>Governance Copilot™</h3>
                  <p>Ask anything about your vendor governance posture in plain English — across every module, in real time.</p>
                </div>
              </div>
              <div className="ti-item reveal">
                <div className="ti-item__icon">📊</div>
                <div>
                  <h3>Benchmarking™</h3>
                  <p>Compare your vendor governance posture against industry peers across 10 categories and see where you rank.</p>
                </div>
              </div>
              <div className="ti-item reveal" data-delay="60">
                <div className="ti-item__icon">📡</div>
                <div>
                  <h3>Continuous Monitoring™</h3>
                  <p>7 automated governance monitoring rules run continuously — alerting on expired evidence, critical risks, and vendor issues.</p>
                </div>
              </div>
              <div className="ti-item reveal" data-delay="120">
                <div className="ti-item__icon">📈</div>
                <div>
                  <h3>Governance Trends™</h3>
                  <p>90-day trend analysis across 6 governance metrics with change percentage and historical score tables.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI COPILOT */}
        <section className="section" id="copilot">
          <div className="container ai-sec">
            <div className="ai-sec__copy reveal">
              <span className="eyebrow">Governance Copilot™</span>
              <h2>Ask Vendor Governance Anything</h2>
              <p>
                Not a chatbot bolted on. The Governance Copilot™ is woven through every module —
                extracting vendor evidence, explaining risk, writing audit narratives, detecting compliance gaps,
                and answering questions about your exact vendor governance posture in plain English.
              </p>
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
                <div className="chat__q">Which vendors need attention?</div>
                <div className="chat__a">4 vendors have declining trust scores. 2 require document refresh. 1 vendor assessment expires in 14 days. 1 contract renewal is overdue.</div>
                <div className="chat__q">Are we audit ready for ISO 27001?</div>
                <div className="chat__a">Audit readiness is 92%. 3 evidence gaps remain. 2 vendor controls require review. Evidence Vault™ is current.</div>
                <div className="chat__q">Generate vendor risk board report.</div>
                <div className="chat__a">Board report prepared. Includes: Vendor Risk Summary · Trust Score Trends · Compliance Status · Renewal Pipeline · Executive Recommendations</div>
              </div>
              <div className="chat__input">
                <span>Ask about your vendor governance posture...</span>
                <span className="chat__send">✦</span>
              </div>
            </div>
          </div>
        </section>

        {/* GOVERNANCE AGENTS */}
        <section className="section section--alt" id="agents">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Governance Agents™</span>
              <h2>AI Agents That Watch Your Vendors 24/7</h2>
              <p>Specialized AI agents continuously monitor vendor governance across your organization and surface observations, recommendations, and actions — with human approval always in the loop.</p>
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
                <h3 className="agent-card__name">Compliance Agent™</h3>
                <ul className="agent-card__caps">
                  <li>Monitors vendor controls</li>
                  <li>Collects evidence automatically</li>
                  <li>Tracks framework readiness</li>
                  <li>Launches remediation</li>
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
              <div className="agent-card reveal">
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
              <div className="agent-card reveal" data-delay="60">
                <div className="agent-card__top">
                  <div className="agent-card__icon agent-card__icon--trust">✦</div>
                  <span className="agent-card__badge">Active 24/7</span>
                </div>
                <h3 className="agent-card__name">Trust Agent™</h3>
                <ul className="agent-card__caps">
                  <li>Monitors vendor trust posture</li>
                  <li>Tracks verification health</li>
                  <li>Improves trust scores</li>
                  <li>Identifies trust risks</li>
                </ul>
              </div>
              <div className="agent-card reveal" data-delay="120">
                <div className="agent-card__top">
                  <div className="agent-card__icon agent-card__icon--ai">🤖</div>
                  <span className="agent-card__badge">Active 24/7</span>
                </div>
                <h3 className="agent-card__name">AI Governance Agent™</h3>
                <ul className="agent-card__caps">
                  <li>Monitors AI vendor systems</li>
                  <li>Tracks AI risks</li>
                  <li>Evaluates compliance</li>
                  <li>Recommends controls</li>
                </ul>
              </div>
            </div>
            <div className="agents-cta reveal">
              <a href="/signup" className="btn btn--primary">Activate Governance Agents</a>
              <a href="#copilot" className="btn btn--ghost">See Governance Copilot™ <span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="section" id="architecture">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Platform Architecture</span>
              <h2>Built On A Shared Intelligence Layer.</h2>
              <p>Every module is powered by the same vendor evidence, trust intelligence, and workflow engine — no data silos, no disconnected tools.</p>
            </div>
            <div className="arch reveal">
              <div className="arch__top">
                <div className="arch__layer arch__layer--primary">Governance Copilot™</div>
                <div className="arch__layer">Trust Intelligence™</div>
                <div className="arch__layer">Trust Score™</div>
                <div className="arch__layer">Governance Benchmarking™</div>
              </div>
              <div className="arch__divider">
                <span className="arch__arrow">↓</span>
                <span className="arch__core">Evidence Layer™ · Workflow Studio™ · Integration Hub™</span>
                <span className="arch__arrow">↓</span>
              </div>
              <div className="arch__bottom">
                <div className="arch__node">Vendors</div>
                <div className="arch__node">Assessments</div>
                <div className="arch__node">Controls</div>
                <div className="arch__node">Audits</div>
                <div className="arch__node">Risks</div>
                <div className="arch__node">Contracts</div>
                <div className="arch__node">Frameworks</div>
                <div className="arch__node">Issues</div>
                <div className="arch__node">Privacy</div>
                <div className="arch__node">Trust Exchange</div>
                <div className="arch__node">AI Systems</div>
                <div className="arch__node">Certificates</div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section className="section section--alt" id="metrics">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Impact</span>
              <h2>Govern Vendors With Confidence.</h2>
            </div>
            <div className="metrics-grid">
              <div className="mstat reveal">
                <div className="mstat__num"><span className="counter" data-target="95">0</span>%</div>
                <div className="mstat__label">Reduction in evidence collection effort</div>
              </div>
              <div className="mstat reveal" data-delay="60">
                <div className="mstat__num"><span className="counter" data-target="70">0</span>%</div>
                <div className="mstat__label">Faster vendor onboarding</div>
              </div>
              <div className="mstat reveal" data-delay="120">
                <div className="mstat__num">3×</div>
                <div className="mstat__label">Faster compliance reviews</div>
              </div>
              <div className="mstat reveal" data-delay="180">
                <div className="mstat__num">100%</div>
                <div className="mstat__label">Vendor governance visibility from day one</div>
              </div>
            </div>
          </div>
        </section>

        {/* VISION */}
        <section className="section" id="vision">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Our Vision</span>
              <h2>Building The System Of Record For Vendor Trust.</h2>
              <p>
                Our vision is simple.
              </p>
              <p style={{ marginTop: "1rem", fontSize: "1.1rem", color: "var(--color-ink-dim)", lineHeight: 2 }}>
                Every vendor.<br />
                Every assessment.<br />
                Every risk.<br />
                Every control.<br />
                Every audit.
              </p>
              <p style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 700, background: "linear-gradient(135deg, #818cf8, #2dd4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                One platform.
              </p>
            </div>
            <div className="ti-grid">
              <div className="ti-item reveal">
                <div className="ti-item__icon">▤</div>
                <div>
                  <h3>Vendor First</h3>
                  <p>Every governance activity starts with the vendor relationship — not a compliance checklist.</p>
                </div>
              </div>
              <div className="ti-item reveal" data-delay="60">
                <div className="ti-item__icon">🔄</div>
                <div>
                  <h3>Lifecycle Driven</h3>
                  <p>Governance covers the entire vendor lifecycle — from discovery to offboarding, not just annual audits.</p>
                </div>
              </div>
              <div className="ti-item reveal" data-delay="120">
                <div className="ti-item__icon">✦</div>
                <div>
                  <h3>Trust Measured</h3>
                  <p>Every vendor relationship produces a measurable, continuously updated trust signal — not a manual score.</p>
                </div>
              </div>
              <div className="ti-item reveal">
                <div className="ti-item__icon">📊</div>
                <div>
                  <h3>Proof Based</h3>
                  <p>Governance built on evidence — every decision is backed by collected, verified proof from the vendor itself.</p>
                </div>
              </div>
              <div className="ti-item reveal" data-delay="60">
                <div className="ti-item__icon">🤖</div>
                <div>
                  <h3>AI Powered</h3>
                  <p>AI agents continuously monitor vendor posture, surface observations, and generate recommendations — without manual effort.</p>
                </div>
              </div>
              <div className="ti-item reveal" data-delay="120">
                <div className="ti-item__icon">🌐</div>
                <div>
                  <h3>Trust Shared</h3>
                  <p>Trust posture is always visible — to your team, your auditors, your partners, and your customers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="section section--alt" id="pricing">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Simple Pricing</span>
              <h2>Governance Built on Proof.<br />Priced for scale.</h2>
              <p>One flat annual price. Every module included. No per-seat surprises.</p>
            </div>

            <div className="pricing-cards reveal">

              {/* Growth */}
              <div className="pcard">
                <div>
                  <div className="pcard__tier">Growth</div>
                  <div className="pcard__price">
                    <span className="pcard__amount">$2,999</span>
                    <span className="pcard__period">/ year</span>
                  </div>
                  <p className="pcard__tagline">The complete vendor governance foundation for fast-growing companies getting compliance-ready.</p>
                </div>
                <div className="pcard__divider" />
                <ul className="pcard__feats">
                  <li>All Core GRC modules — Vendor Hub™, Evidence Vault™, Audit Management, Risk Lens™, Control Center™, Policy Governance™</li>
                  <li>DPDP Privacy™ &amp; Contract Governance™</li>
                  <li>Trust Intelligence™ &amp; Trust Score™</li>
                  <li>5 compliance frameworks (ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA)</li>
                  <li>Up to 10 users</li>
                  <li>Governance Copilot™ AI assistant</li>
                  <li>Email support</li>
                </ul>
                <a href="mailto:hello@audt.tech?subject=AUDT%20Growth%20Plan" className="pcard__cta pcard__cta--ghost">Get Started</a>
                <p className="pcard__note">Billed annually · Cancel anytime</p>
              </div>

              {/* Business — featured */}
              <div className="pcard pcard--featured">
                <div className="pcard__badge">Most Popular</div>
                <div>
                  <div className="pcard__tier">Business</div>
                  <div className="pcard__price">
                    <span className="pcard__amount">$6,999</span>
                    <span className="pcard__period">/ year</span>
                  </div>
                  <p className="pcard__tagline">The full Vendor Governance OS for organizations scaling their trust program across vendors, auditors, and regulators.</p>
                </div>
                <div className="pcard__divider" />
                <ul className="pcard__feats">
                  <li>Everything in Growth</li>
                  <li>All 32 modules — including Executive Reporting™, Regulatory Intelligence™, Asset Intelligence™</li>
                  <li>Governance Agent Framework™ — 6 AI agent types</li>
                  <li>Continuous Compliance™ — 21 automated checks</li>
                  <li>Security Command Center™ — MFA, SSO, IP allowlists</li>
                  <li>Integration Hub™ — 35+ connectors</li>
                  <li>Trust Network™, Trust Verification Authority™ &amp; Trust API Platform™</li>
                  <li>Auditor Collaboration™ — unlimited audit rooms</li>
                  <li>Up to 50 users</li>
                  <li>Priority support &amp; onboarding</li>
                </ul>
                <a href="mailto:hello@audt.tech?subject=AUDT%20Business%20Plan" className="pcard__cta pcard__cta--primary">Get Started</a>
                <p className="pcard__note">Billed annually · Cancel anytime</p>
              </div>

              {/* Enterprise */}
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
                  <li>Custom SAML/OIDC SSO configuration</li>
                  <li>Dedicated Governance Agent™ configurations</li>
                  <li>Custom compliance frameworks &amp; controls</li>
                  <li>SLA guarantees &amp; dedicated success manager</li>
                  <li>On-premise or private cloud deployment</li>
                  <li>Custom API rate limits &amp; webhooks</li>
                </ul>
                <a href="mailto:hello@audt.tech?subject=AUDT%20Enterprise%20Enquiry" className="pcard__cta pcard__cta--enterprise">Talk to Sales</a>
                <p className="pcard__note">Custom contract · Flexible billing</p>
              </div>
            </div>

            {/* Feature comparison table */}
            <div className="ftable reveal">
              <div className="ftable__head">
                <div className="ftable__cell ftable__cell--label">Features</div>
                <div className="ftable__cell ftable__cell--plan">Growth</div>
                <div className="ftable__cell ftable__cell--plan ftable__cell--featured">Business</div>
                <div className="ftable__cell ftable__cell--plan">Enterprise</div>
              </div>

              <div className="ftable__group">
                <div className="ftable__group-head">Vendor Governance</div>
                {[
                  ["Vendor Hub™ + Trust Score™", true, true, true],
                  ["Contract Governance™", true, true, true],
                  ["Third-Party Risk Exchange™", false, true, true],
                  ["Trust Network™ + public profile", false, true, true],
                  ["Trust Verification Authority™ + certificates", false, true, true],
                  ["Auditor Collaboration™ — audit rooms", false, true, true],
                ].map(([label, g, b, e]) => (
                  <div key={String(label)} className="ftable__row">
                    <div className="ftable__cell ftable__cell--label">{label}</div>
                    <div className="ftable__val">{g ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{b ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{e ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                  </div>
                ))}
              </div>

              <div className="ftable__group">
                <div className="ftable__group-head">Risk &amp; Compliance</div>
                {[
                  ["Evidence Vault™ + 174 controls", true, true, true],
                  ["Audit Management + CAPA tracker", true, true, true],
                  ["Risk Lens™ + Heat Map", true, true, true],
                  ["Control Center™ + Health scoring", true, true, true],
                  ["Policy Governance™ + attestations", true, true, true],
                  ["DPDP Privacy™", true, true, true],
                  ["Issue & Remediation Hub™", false, true, true],
                  ["Workflow Studio™", false, true, true],
                ].map(([label, g, b, e]) => (
                  <div key={String(label)} className="ftable__row">
                    <div className="ftable__cell ftable__cell--label">{label}</div>
                    <div className="ftable__val">{g ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{b ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{e ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                  </div>
                ))}
              </div>

              <div className="ftable__group">
                <div className="ftable__group-head">Trust Intelligence</div>
                {[
                  ["Trust Intelligence™ + Org Trust Score™", true, true, true],
                  ["Governance Trends™ + Monitoring™", true, true, true],
                  ["Governance Benchmarking™", false, true, true],
                  ["Executive Reporting & Analytics™", false, true, true],
                  ["Regulatory Intelligence™ — 18 regulations", false, true, true],
                  ["Asset Intelligence™", false, true, true],
                  ["Trust Graph™", false, true, true],
                ].map(([label, g, b, e]) => (
                  <div key={String(label)} className="ftable__row">
                    <div className="ftable__cell ftable__cell--label">{label}</div>
                    <div className="ftable__val">{g ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{b ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{e ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                  </div>
                ))}
              </div>

              <div className="ftable__group">
                <div className="ftable__group-head">AI &amp; Agents</div>
                {[
                  ["Governance Copilot™ (NL chat across all modules)", true, true, true],
                  ["AI Governance™ — AI system inventory + risks", false, true, true],
                  ["Governance Agent Framework™ — 6 agent types", false, true, true],
                  ["Continuous Compliance™ — 21 automated checks", false, true, true],
                  ["Integration Hub™ — 35+ connectors", false, true, true],
                  ["Trust API Platform™ — 8 products", false, true, true],
                  ["Custom agent configurations", false, false, true],
                ].map(([label, g, b, e]) => (
                  <div key={String(label)} className="ftable__row">
                    <div className="ftable__cell ftable__cell--label">{label}</div>
                    <div className="ftable__val">{g ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{b ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{e ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                  </div>
                ))}
              </div>

              <div className="ftable__group">
                <div className="ftable__group-head">Security &amp; Platform</div>
                {[
                  ["Security Command Center™ — MFA, SSO, sessions, IP rules", false, true, true],
                  ["Evidence protection + share links", false, true, true],
                  ["AI prompt audit trail", false, true, true],
                  ["Customer Managed Encryption (KMS)", false, false, true],
                  ["Custom SAML/OIDC SSO", false, false, true],
                  ["SLA guarantee + dedicated CSM", false, false, true],
                  ["On-premise / private cloud", false, false, true],
                ].map(([label, g, b, e]) => (
                  <div key={String(label)} className="ftable__row">
                    <div className="ftable__cell ftable__cell--label">{label}</div>
                    <div className="ftable__val">{g ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{b ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                    <div className="ftable__val">{e ? <span className="ftable__check">✓</span> : <span className="ftable__dash">—</span>}</div>
                  </div>
                ))}
              </div>

              <div className="ftable__group">
                <div className="ftable__group-head">Users &amp; Support</div>
                {[
                  ["Users included", "10", "50", "Unlimited"],
                  ["Compliance frameworks", "5", "Unlimited", "Unlimited"],
                  ["Support", "Email", "Priority", "Dedicated CSM"],
                  ["Onboarding", "Self-serve", "Guided", "White-glove"],
                ].map(([label, g, b, e]) => (
                  <div key={String(label)} className="ftable__row">
                    <div className="ftable__cell ftable__cell--label">{label}</div>
                    <div className="ftable__val" style={{ fontSize: "12px", color: "var(--color-ink-dim)" }}>{String(g)}</div>
                    <div className="ftable__val" style={{ fontSize: "12px", color: "var(--color-ink-dim)" }}>{String(b)}</div>
                    <div className="ftable__val" style={{ fontSize: "12px", color: "var(--color-ink-dim)" }}>{String(e)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MODULES OVERVIEW */}
        <section className="section" id="modules">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">What&apos;s Built</span>
              <h2>32 Modules. One Vendor Governance OS.</h2>
              <p>AUDT is the most complete vendor governance and trust operations platform available — every module is live and in production.</p>
            </div>
            <div className="roadmap-grid">
              <div className="rmap rmap--done reveal">
                <div className="rmap__label">Vendor Governance</div>
                <div className="rmap__items">
                  <div className="rmap__item rmap__item--done">✓ Vendor Hub™ — Vendor Registry &amp; Lifecycle</div>
                  <div className="rmap__item rmap__item--done">✓ Contract Governance™</div>
                  <div className="rmap__item rmap__item--done">✓ Third-Party Risk Exchange™</div>
                  <div className="rmap__item rmap__item--done">✓ Trust Network™</div>
                  <div className="rmap__item rmap__item--done">✓ Trust Verification Authority™</div>
                  <div className="rmap__item rmap__item--done">✓ Auditor Collaboration™</div>
                </div>
              </div>
              <div className="rmap rmap--done reveal" data-delay="80">
                <div className="rmap__label">Risk &amp; Compliance</div>
                <div className="rmap__items">
                  <div className="rmap__item rmap__item--done">✓ Evidence Vault™ — Compliance</div>
                  <div className="rmap__item rmap__item--done">✓ Audit Management</div>
                  <div className="rmap__item rmap__item--done">✓ Risk Lens™ — Risk Management</div>
                  <div className="rmap__item rmap__item--done">✓ Control Center™</div>
                  <div className="rmap__item rmap__item--done">✓ Policy Governance™</div>
                  <div className="rmap__item rmap__item--done">✓ Issue &amp; Remediation Hub™</div>
                </div>
              </div>
              <div className="rmap rmap--done reveal" data-delay="160">
                <div className="rmap__label">Trust Intelligence</div>
                <div className="rmap__items">
                  <div className="rmap__item rmap__item--done">✓ Trust Intelligence™ + Trust Score™</div>
                  <div className="rmap__item rmap__item--done">✓ Trust Graph™</div>
                  <div className="rmap__item rmap__item--done">✓ Governance Trends™</div>
                  <div className="rmap__item rmap__item--done">✓ Continuous Monitoring™</div>
                  <div className="rmap__item rmap__item--done">✓ Governance Benchmarking™</div>
                  <div className="rmap__item rmap__item--done">✓ Executive Reporting &amp; Analytics™</div>
                </div>
              </div>
              <div className="rmap rmap--done reveal" data-delay="240">
                <div className="rmap__label">Privacy &amp; Regulation</div>
                <div className="rmap__items">
                  <div className="rmap__item rmap__item--done">✓ DPDP Privacy™</div>
                  <div className="rmap__item rmap__item--done">✓ Regulatory Intelligence™</div>
                  <div className="rmap__item rmap__item--done">✓ Asset Intelligence™</div>
                  <div className="rmap__item rmap__item--done">✓ AI Governance™</div>
                  <div className="rmap__item rmap__item--done">✓ Security Command Center™</div>
                  <div className="rmap__item rmap__item--done">✓ Workflow Studio™</div>
                </div>
              </div>
              <div className="rmap rmap--done reveal" data-delay="320">
                <div className="rmap__label">Automation &amp; APIs</div>
                <div className="rmap__items">
                  <div className="rmap__item rmap__item--done">✓ Governance Agent Framework™</div>
                  <div className="rmap__item rmap__item--done">✓ Continuous Compliance™</div>
                  <div className="rmap__item rmap__item--done">✓ Integration Hub™ — 35+ connectors</div>
                  <div className="rmap__item rmap__item--done">✓ Trust API Platform™</div>
                  <div className="rmap__item rmap__item--done">✓ Governance Copilot™</div>
                  <div className="rmap__item rmap__item--done">✓ Help &amp; Documentation Center</div>
                </div>
              </div>
              <div className="rmap rmap--vision reveal" data-delay="400">
                <div className="rmap__label">Vision</div>
                <div className="rmap__vision">
                  <span className="grad-text">Vendor Governance OS</span>
                  <p>The system of record for vendor trust — already here.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cta-final" id="cta">
          <div className="container cta-final__inner reveal">
            <div className="cta-final__badge">audt.tech</div>
            <h2>Ready to Govern Every Vendor?</h2>
            <p>
              One platform. Complete lifecycle. Continuous trust. 32 governance modules built for organizations that cannot afford to get vendor governance wrong.
            </p>
            <div className="cta-final__btns">
              <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
              <a href="/signup" className="btn btn--ghost btn--lg">Start Free Trial →</a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
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
              <a href="#trust-intelligence">Trust Intelligence</a>
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
              <a href="#modules">Modules</a>
              <a href="#pricing">Pricing</a>
              <a href="mailto:hello@audt.tech">Contact</a>
            </div>
            <div className="footer__col">
              <div className="footer__col-head">Trust Intelligence</div>
              <a href="#trust-score">Trust Score™</a>
              <a href="#trust-intelligence">Trust Graph™</a>
              <a href="#copilot">Governance Copilot™</a>
              <a href="#trust-intelligence">Benchmarking™</a>
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
