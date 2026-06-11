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

    // Score counter animation for trust intelligence section
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
            <a href="#roadmap">Resources</a>
            <a href="#contact">Pricing</a>
            <a href="#contact">Contact</a>
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
          <a href="#roadmap">Resources</a>
          <a href="#contact">Pricing</a>
          <a href="#contact">Contact</a>
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
                AI-Native · Governance OS · audt.tech
              </div>
              <h1 className="hero__title">
                Governance<br />
                <span className="grad-text">Built on Proof.</span>
              </h1>
              <p className="hero__sub">
                AUDT is the AI-native Trust, Risk &amp; Compliance platform that helps organizations
                govern vendors, controls, policies, audits, and compliance through a single source of truth.
              </p>
              <div className="hero__cta">
                <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
                <a href="/signup" className="btn btn--ghost btn--lg">
                  Start Free <span className="arrow">→</span>
                </a>
              </div>
              <div className="hero__trust">
                <span>Vendor Hub™</span>
                <span className="dot">·</span>
                <span>Risk Lens™</span>
                <span className="dot">·</span>
                <span>Control Center™</span>
                <span className="dot">·</span>
                <span>Trust Intelligence™</span>
                <span className="dot">·</span>
                <span>Integration Hub™</span>
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
                    <div className="mock__nav">▤ Vendors</div>
                    <div className="mock__nav">◷ Compliance</div>
                    <div className="mock__nav">◎ Audits</div>
                    <div className="mock__nav">⚠ Risk Lens™</div>
                    <div className="mock__nav">◻ Controls</div>
                    <div className="mock__nav">✦ Trust Intel™</div>
                    <div className="mock__nav copilot">✦ Copilot</div>
                  </aside>
                  <div className="mock__main">
                    <div className="mock__row">
                      <div className="mcard mcard--score">
                        <div className="mcard__label">Trust Score™</div>
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
                        <div className="mcard__label">Risk Overview</div>
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
                        <p className="ai-line muted">ISO 27001 — 8 controls need evidence.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float-chip float-chip--1">✓ Evidence Vault™ synced</div>
              <div className="float-chip float-chip--2">✦ Trust Score™ updated</div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="proof">
          <div className="container">
            <p className="proof__head reveal">
              Built for governance teams across SaaS, Fintech, Healthcare, Manufacturing &amp; IT Services
            </p>
            <div className="proof__logos reveal">
              <span>SaaS</span><span>Fintech</span><span>Healthcare</span>
              <span>Manufacturing</span><span>IT Services</span><span>Legal</span>
            </div>
            <div className="proof__metrics">
              <div className="metric reveal">
                <div className="metric__num"><span className="counter" data-target="174">0</span><i>+</i></div>
                <div className="metric__label">Pre-built Compliance Controls</div>
              </div>
              <div className="metric reveal" data-delay="80">
                <div className="metric__num"><span className="counter" data-target="115">0</span><i>+</i></div>
                <div className="metric__label">Database Tables — Full Governance Data Model</div>
              </div>
              <div className="metric reveal" data-delay="160">
                <div className="metric__num"><span className="counter" data-target="20">0</span></div>
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
              <h2>Governance Is Fragmented.</h2>
              <p>
                Most organizations manage vendors, compliance evidence, risks, policies, and audits
                across disconnected systems. This creates blind spots, duplicated effort, audit delays,
                and unnecessary risk. AUDT unifies governance into a single operating system.
              </p>
            </div>
            <div className="pain-grid">
              <div className="pain reveal"><span className="pain__icon">🔍</span>Missing evidence at audit time</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">🌫️</span>Compliance gaps no one can see</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">📦</span>Vendor blind spots &amp; third-party risk</div>
              <div className="pain reveal"><span className="pain__icon">✍️</span>Manual audits burning weeks every quarter</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">📋</span>Policy sprawl with no version control</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">🔗</span>Risk data siloed across teams and tools</div>
            </div>
          </div>
        </section>

        {/* GOVERNANCE OS PILLARS */}
        <section className="section section--alt" id="platform">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Platform</span>
              <h2>One Platform For Organizational Trust.</h2>
              <p>Everything needed to govern your organization from a single source of truth.</p>
            </div>
            <div className="pillars">

              <article className="pillar pillar--live reveal">
                <div className="pillar__top">
                  <div className="pillar__icon">▤</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Vendor Hub™</h3>
                <p>Manage vendors, suppliers, and third parties — from onboarding to risk and Trust Score™ monitoring.</p>
                <ul className="pillar__feats">
                  <li>Vendor Registry &amp; Profiles</li>
                  <li>AI Document Extraction</li>
                  <li>Expiry Alerts</li>
                  <li>Security Assessments</li>
                  <li>Trust Score™</li>
                  <li>Vendor Portal</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="60">
                <div className="pillar__top">
                  <div className="pillar__icon">🗄</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Evidence Vault™</h3>
                <p>Collect and maintain proof across every framework — auto-imported from vendors and assessments.</p>
                <ul className="pillar__feats">
                  <li>ISO 27001 · SOC 2 · DPDP · PCI DSS · HIPAA</li>
                  <li>174 Standard Controls</li>
                  <li>Auto-import Pipeline</li>
                  <li>Gap Analysis</li>
                  <li>Readiness Scores</li>
                  <li>Policy Management</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="120">
                <div className="pillar__top">
                  <div className="pillar__icon">◎</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Audit Management</h3>
                <p>Stay continuously audit-ready with structured programs, findings tracking, and CAPA workflows.</p>
                <ul className="pillar__feats">
                  <li>Audit Programs</li>
                  <li>Findings Management</li>
                  <li>CAPA Tracker</li>
                  <li>AI Finding Generator</li>
                  <li>PDF Reports</li>
                  <li>AI Auditor Chat</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal">
                <div className="pillar__top">
                  <div className="pillar__icon">⚠</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Risk Lens™</h3>
                <p>Identify, assess, and treat risks with a unified register, visual heat maps, and AI risk officer.</p>
                <ul className="pillar__feats">
                  <li>Risk Register</li>
                  <li>5×5 Heat Map</li>
                  <li>Treatment Tracking</li>
                  <li>AI Risk Officer</li>
                  <li>13 Risk Categories</li>
                  <li>CSV Export</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="60">
                <div className="pillar__top">
                  <div className="pillar__icon">◻</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Control Center™</h3>
                <p>Track every control with Control Health™ scoring, testing records, and AI gap detection.</p>
                <ul className="pillar__feats">
                  <li>Control Library</li>
                  <li>Control Health™ Score</li>
                  <li>Test Records</li>
                  <li>AI Gap Detection</li>
                  <li>Cross-framework Mapping</li>
                  <li>AI Advisor Chat</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="120">
                <div className="pillar__top">
                  <div className="pillar__icon">📜</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Policy Governance™</h3>
                <p>Full policy lifecycle — drafting, versioning, attestations, reviews, and framework mapping.</p>
                <ul className="pillar__feats">
                  <li>Policy Lifecycle</li>
                  <li>Version History</li>
                  <li>Attestations</li>
                  <li>Policy Health™</li>
                  <li>Owner Accountability</li>
                  <li>Framework Linking</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal">
                <div className="pillar__top">
                  <div className="pillar__icon">🔒</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>DPDP Privacy™</h3>
                <p>India DPDP Act 2023 compliance — data inventory, consent, retention, DSR workflows, and PIA.</p>
                <ul className="pillar__feats">
                  <li>Data Asset Inventory</li>
                  <li>Consent Management</li>
                  <li>Retention Policies</li>
                  <li>DSR Workflows</li>
                  <li>Privacy Impact Assessments</li>
                  <li>Cross-border Transfer Tracking</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="60">
                <div className="pillar__top">
                  <div className="pillar__icon">📄</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Contract Governance™</h3>
                <p>Contract lifecycle, obligation tracking, renewal management, and Contract Score™ engine.</p>
                <ul className="pillar__feats">
                  <li>Contract Library</li>
                  <li>Clause Management</li>
                  <li>Obligation Tracker</li>
                  <li>Renewal Dashboard</li>
                  <li>Contract Score™</li>
                  <li>AI Contract Advisor™</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="120">
                <div className="pillar__top">
                  <div className="pillar__icon">🔧</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Issue &amp; Remediation Hub™</h3>
                <p>Centralized governance execution — issues, tasks, exceptions, SLA tracking, and escalations.</p>
                <ul className="pillar__feats">
                  <li>Issue Registry™</li>
                  <li>Task Management™</li>
                  <li>Exception Management™</li>
                  <li>Escalation Engine™</li>
                  <li>SLA Tracking™</li>
                  <li>AI Remediation Planner™</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal">
                <div className="pillar__top">
                  <div className="pillar__icon">🔗</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Third-Party Risk Exchange™</h3>
                <p>Trust Network — vendor trust profiles, evidence exchange, badges, and a searchable trust directory.</p>
                <ul className="pillar__feats">
                  <li>Trust Profile™</li>
                  <li>Evidence Exchange™</li>
                  <li>Trust Badges™</li>
                  <li>Questionnaire Exchange™</li>
                  <li>Vendor Trust Directory™</li>
                  <li>AI Trust Analyst™</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="60">
                <div className="pillar__top">
                  <div className="pillar__icon">📊</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Governance Benchmarking™</h3>
                <p>Industry peer comparison across 10 governance categories with percentile rankings and maturity levels.</p>
                <ul className="pillar__feats">
                  <li>10 Category Scorecards</li>
                  <li>Percentile Engine™</li>
                  <li>Governance Rankings™</li>
                  <li>Maturity Levels</li>
                  <li>Benchmark Trends™</li>
                  <li>AI Benchmark Analyst™</li>
                </ul>
              </article>

              <article className="pillar pillar--live reveal" data-delay="120">
                <div className="pillar__top">
                  <div className="pillar__icon">⚡</div>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Integration Hub™</h3>
                <p>Connected Governance Platform — 35+ connectors for Identity, Cloud, Security, ITSM, and more.</p>
                <ul className="pillar__feats">
                  <li>35+ Connectors</li>
                  <li>Sync Engine™</li>
                  <li>Evidence Collection™</li>
                  <li>Webhook Engine™</li>
                  <li>Connection Health™</li>
                  <li>AI Integration Advisor™</li>
                </ul>
              </article>

            </div>
          </div>
        </section>

        {/* TRUST INTELLIGENCE */}
        <section className="section" id="trust-intelligence">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Trust Intelligence™</span>
              <h2>Trust Intelligence™ For Every Decision.</h2>
              <p>
                AUDT continuously evaluates governance posture using evidence, controls, risks,
                audits, and compliance signals — giving you a live view of organizational trust.
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
                <div className="tscore__label">Vendor Trust Score™</div>
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
                <div className="tscore__label">Control Health Score</div>
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
                <div className="tscore__label">Audit Readiness</div>
                <div className="tscore__sub">ISO 27001 — Ready</div>
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
                <div className="tscore__label">Compliance Score</div>
                <div className="tscore__sub">SOC 2 in progress</div>
              </div>
            </div>
          </div>
        </section>

        {/* AI COPILOT */}
        <section className="section section--alt" id="solutions">
          <div className="container ai-sec">
            <div className="ai-sec__copy reveal">
              <span className="eyebrow">Governance Copilot™</span>
              <h2>Ask Questions. Get Governance Answers.</h2>
              <p>
                Not a chatbot bolted on. The Governance Copilot™ is woven through every module —
                extracting evidence, explaining risk, writing audit narratives, detecting gaps,
                and answering questions about your exact governance posture in plain English.
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
                <div className="chat__q">Which vendors have expired certifications?</div>
                <div className="chat__a">3 vendors have expired ISO certs — Infosys Ltd (30 days), TechCorp (14 days), Wipro Digital (overdue). View in Vendor Hub™ →</div>
                <div className="chat__q">Which controls failed this quarter?</div>
                <div className="chat__a">12 controls are non-compliant. 4 critical: AC-2, RA-3, SI-7, AU-6. Evidence Vault™ shows 8 gaps requiring remediation.</div>
                <div className="chat__q">What evidence is missing for ISO 27001?</div>
                <div className="chat__a">8 controls lack evidence: A.8.2.1, A.9.4.2 (+6 more). Auto-import from vendor documents can fill 5 of these gaps now.</div>
              </div>
              <div className="chat__input">
                <span>Ask about your governance posture...</span>
                <span className="chat__send">✦</span>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTIONS */}
        <section className="section" id="solutions-grid">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Solutions</span>
              <h2>Solutions Built On The Governance OS</h2>
              <p>Purpose-built solutions for every governance team — powered by the same intelligence layer.</p>
            </div>
            <div className="solutions">
              <div className="sol reveal">
                <div className="sol__icon">▤</div>
                <h3>Vendor Governance</h3>
                <p>Third-party risk, vendor lifecycle, Trust Score™, document management, and AI-powered assessments.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">🛡</div>
                <h3>Risk &amp; Control Management</h3>
                <p>Risk registers, heat maps, Control Health™ scoring, cross-framework mapping, and AI gap detection.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">◷</div>
                <h3>Compliance Management</h3>
                <p>Framework readiness across ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA — with evidence auto-import.</p>
              </div>
              <div className="sol reveal">
                <div className="sol__icon">◎</div>
                <h3>Audit Readiness</h3>
                <p>Structured audit programs, findings, CAPAs, benchmarking, and AI-generated board reports.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">🔒</div>
                <h3>Privacy &amp; Contract</h3>
                <p>India DPDP Act 2023 compliance, DSR workflows, contract lifecycle, obligation tracking, and renewals.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">⚡</div>
                <h3>Connected Governance</h3>
                <p>35+ integrations, trust network exchange, automated evidence collection, and real-time monitoring.</p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY AUDT */}
        <section className="section section--alt" id="why-audt">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Why AUDT</span>
              <h2>Built For Modern Governance Teams.</h2>
              <p>Every role that touches governance has a purpose-built experience in AUDT.</p>
            </div>
            <div className="audience-grid">
              <div className="aud reveal">
                <div className="aud__icon">◷</div>
                <h3>Compliance</h3>
                <p>Framework management, controls, evidence, readiness scores, and gap narratives.</p>
              </div>
              <div className="aud reveal" data-delay="60">
                <div className="aud__icon">🔐</div>
                <h3>Security</h3>
                <p>Vendor assessments, security controls, incident tracking, and risk visibility.</p>
              </div>
              <div className="aud reveal" data-delay="120">
                <div className="aud__icon">⚠</div>
                <h3>Risk</h3>
                <p>Risk registers, heat maps, control effectiveness, and remediation tracking.</p>
              </div>
              <div className="aud reveal">
                <div className="aud__icon">▤</div>
                <h3>Procurement</h3>
                <p>Vendor onboarding, document collection, third-party risk, and contract oversight.</p>
              </div>
              <div className="aud reveal" data-delay="60">
                <div className="aud__icon">◎</div>
                <h3>Internal Audit</h3>
                <p>Audit programs, evidence collection, findings management, and CAPA workflows.</p>
              </div>
              <div className="aud reveal" data-delay="120">
                <div className="aud__icon">📊</div>
                <h3>Executive Leadership</h3>
                <p>AI-narrated executive reports, Trust Score™, and board-ready governance dashboards.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="section" id="architecture">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Platform Architecture</span>
              <h2>Built On A Shared Intelligence Layer.</h2>
              <p>Every module is powered by the same evidence, intelligence, and workflow engine — no data silos.</p>
            </div>
            <div className="arch reveal">
              <div className="arch__top">
                <div className="arch__layer arch__layer--primary">Governance Copilot™</div>
                <div className="arch__layer">Trust Intelligence™</div>
                <div className="arch__layer">Trust Graph™</div>
                <div className="arch__layer">Governance Benchmarking™</div>
              </div>
              <div className="arch__divider">
                <span className="arch__arrow">↓</span>
                <span className="arch__core">Evidence Layer™ · Workflow Studio™ · Integration Hub™</span>
                <span className="arch__arrow">↓</span>
              </div>
              <div className="arch__bottom">
                <div className="arch__node">Vendors</div>
                <div className="arch__node">Policies</div>
                <div className="arch__node">Controls</div>
                <div className="arch__node">Audits</div>
                <div className="arch__node">Risks</div>
                <div className="arch__node">Contracts</div>
                <div className="arch__node">Frameworks</div>
                <div className="arch__node">Issues</div>
                <div className="arch__node">Privacy</div>
                <div className="arch__node">Trust Exchange</div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section className="section section--alt" id="metrics">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Impact</span>
              <h2>Govern With Confidence.</h2>
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
                <div className="mstat__label">Governance visibility from day one</div>
              </div>
            </div>
          </div>
        </section>

        {/* ROADMAP */}
        <section className="section" id="roadmap">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">What&apos;s Built</span>
              <h2>20 Modules. One Governance OS.</h2>
              <p>AUDT is the most complete AI-native governance platform available — every module is live and in production.</p>
            </div>
            <div className="roadmap-grid">
              <div className="rmap rmap--done reveal">
                <div className="rmap__label">Governance Core</div>
                <div className="rmap__items">
                  <div className="rmap__item rmap__item--done">✓ Vendor Hub™ — Vendor Governance</div>
                  <div className="rmap__item rmap__item--done">✓ Evidence Vault™ — Compliance</div>
                  <div className="rmap__item rmap__item--done">✓ Audit Management</div>
                  <div className="rmap__item rmap__item--done">✓ Risk Lens™ — Risk Management</div>
                  <div className="rmap__item rmap__item--done">✓ Control Center™</div>
                  <div className="rmap__item rmap__item--done">✓ Policy Governance™</div>
                </div>
              </div>
              <div className="rmap rmap--done reveal" data-delay="80">
                <div className="rmap__label">Intelligence Layer</div>
                <div className="rmap__items">
                  <div className="rmap__item rmap__item--done">✓ Trust Intelligence™</div>
                  <div className="rmap__item rmap__item--done">✓ Trust Score™</div>
                  <div className="rmap__item rmap__item--done">✓ Trust Graph™</div>
                  <div className="rmap__item rmap__item--done">✓ Governance Trends™</div>
                  <div className="rmap__item rmap__item--done">✓ Continuous Monitoring™</div>
                  <div className="rmap__item rmap__item--done">✓ Governance Benchmarking™</div>
                </div>
              </div>
              <div className="rmap rmap--done reveal" data-delay="160">
                <div className="rmap__label">Extended Platform</div>
                <div className="rmap__items">
                  <div className="rmap__item rmap__item--done">✓ DPDP Privacy™</div>
                  <div className="rmap__item rmap__item--done">✓ Contract Governance™</div>
                  <div className="rmap__item rmap__item--done">✓ Issue &amp; Remediation Hub™</div>
                  <div className="rmap__item rmap__item--done">✓ Workflow Studio™</div>
                  <div className="rmap__item rmap__item--done">✓ Third-Party Risk Exchange™</div>
                  <div className="rmap__item rmap__item--done">✓ Integration Hub™ — 35+ connectors</div>
                </div>
              </div>
              <div className="rmap rmap--vision reveal" data-delay="240">
                <div className="rmap__label">Vision</div>
                <div className="rmap__vision">
                  <span className="grad-text">Governance OS</span>
                  <p>The operating system for organizational trust — already here.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cta-final" id="contact">
          <div className="container cta-final__inner reveal">
            <div className="cta-final__badge">audt.tech</div>
            <h2>Stop Managing Governance In Silos.</h2>
            <p>
              Unify vendors, risk, compliance, audits, controls, policies, contracts, privacy, and trust — 20 modules, one Governance OS.
            </p>
            <div className="cta-final__btns">
              <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
              <a href="/signup" className="btn btn--ghost btn--lg">Start Free →</a>
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
            <p className="footer__sub">AI-Native Trust, Risk &amp; Compliance Platform.</p>
          </div>
          <div className="footer__cols">
            <div className="footer__col">
              <div className="footer__col-head">Product</div>
              <a href="#platform">Platform</a>
              <a href="#solutions">Solutions</a>
              <a href="#contact">Pricing</a>
            </div>
            <div className="footer__col">
              <div className="footer__col-head">Resources</div>
              <a href="#roadmap">Roadmap</a>
              <a href="#contact">Documentation</a>
              <a href="#contact">Security</a>
            </div>
            <div className="footer__col">
              <div className="footer__col-head">Company</div>
              <a href="#contact">About</a>
              <a href="#contact">Careers</a>
              <a href="mailto:hello@audt.tech">Contact</a>
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
