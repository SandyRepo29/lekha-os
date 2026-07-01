"use client";

import { useEffect } from "react";

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

export default function LandingPage() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


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
      io?.disconnect();
      visual?.removeEventListener("mousemove", onMove);
      visual?.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
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
                AI-Native Governance OS · Built for CISOs, CROs &amp; Compliance Teams
              </div>
              <h1 className="hero__title">
                <span className="grad-text">Trust Every Decision.</span>
              </h1>
              <p className="hero__sub">
                AUDT replaces spreadsheets and disconnected GRC tools with a single AI-native platform — built on proof, not promises.
              </p>
              <p style={{ fontSize: "clamp(13px, 1.4vw, 15px)", color: "var(--text-dim)", maxWidth: "520px", marginBottom: "28px", lineHeight: 1.7 }}>
                Vendor governance, risk, compliance, audits, regulatory intelligence, and AI governance — unified with a shared intelligence layer that learns across every module.
              </p>
              <div className="hero__cta">
                <a href="/signup" className="btn btn--primary btn--lg">Start Free Trial <span className="arrow">→</span></a>
                <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--ghost btn--lg">Book a Demo</a>
              </div>
              <div className="hero__trust">
                <span>Vendor Governance</span>
                <span className="dot">·</span>
                <span>Risk &amp; Compliance</span>
                <span className="dot">·</span>
                <span>AI Governance</span>
                <span className="dot">·</span>
                <span>Regulatory Intelligence</span>
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
              <h2>Your Governance Stack Is Failing You.</h2>
              <p>
                Organizations run compliance, risk, vendor governance, and audits across spreadsheets, point tools, and disconnected systems.
                The result: blind spots, audit chaos, and decisions made without proof.
              </p>
            </div>
            <div className="pain-grid">
              <div className="pain reveal"><span className="pain__icon">🌫️</span>No vendor visibility</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">✍️</span>Manual assessments</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">◎</span>Audit chaos</div>
              <div className="pain reveal"><span className="pain__icon">📋</span>Compliance gaps</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">⚠</span>Risk blind spots</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">◱</span>No single source of truth</div>
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
              <p>The threat surface has changed. Annual GRC processes no longer match the pace of modern risk, regulation, and AI adoption.</p>
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
                background: "#FFFFFF",
                border: "1px solid #E4E8EF",
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
                background: "linear-gradient(135deg, rgba(73,51,214,0.07), rgba(0,184,217,0.05))",
                border: "1px solid rgba(73,51,214,0.20)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#4ade80", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                  Today
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
                  {[
                    "Hundreds of SaaS vendors to govern",
                    "AI systems with new regulatory risk",
                    "Real-time third-party breaches",
                    "Board-level accountability for risk",
                    "Regulators moving faster than teams",
                    "Continuous audit expectations",
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
              background: "#FFFFFF",
              border: "1px solid #E4E8EF",
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
              <h2>Every Stage. Every Vendor. No Gaps.</h2>
              <p>Most platforms pick one stage. AUDT governs the complete vendor lifecycle — from discovery to offboarding — with AI at every step.</p>
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
                      background: "#FFFFFF",
                      border: "1px solid #E4E8EF",
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

          </div>
        </section>

        {/* ════════════════════════════════════
            5. PLATFORM PILLARS
        ════════════════════════════════════ */}
        <section className="section section--alt" id="platform">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Platform Overview</span>
              <h2>One Platform. Every Governance Need.</h2>
              <p>Vendor governance, risk, compliance, audits, regulatory intelligence, and AI governance — unified with a shared intelligence layer.</p>
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
              <p>Every team responsible for governance, risk, and compliance has a purpose-built workflow inside AUDT.</p>
            </div>
            <div className="solutions">
              <div className="sol reveal">
                <div className="sol__icon">🛡</div>
                <h3>Security Teams</h3>
                <p>Assess vendor and AI risk. Monitor security posture continuously. Track assessments and remediation end-to-end.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">◷</div>
                <h3>Compliance Teams</h3>
                <p>Automate evidence collection. Maintain audit readiness across ISO 27001, SOC 2, DPDP, and more. Track framework coverage continuously.</p>
              </div>
              <div className="sol reveal" data-delay="120">
                <div className="sol__icon">▤</div>
                <h3>Procurement Teams</h3>
                <p>Manage vendor onboarding. Track contract renewals. Coordinate periodic reviews. Handle safe offboarding.</p>
              </div>
              <div className="sol reveal">
                <div className="sol__icon">⚠</div>
                <h3>Risk Teams</h3>
                <p>Identify, score, and prioritize risks across vendors, controls, and operations. Track treatments and monitor continuously.</p>
              </div>
              <div className="sol reveal" data-delay="60">
                <div className="sol__icon">📊</div>
                <h3>Leadership Teams</h3>
                <p>Measure organizational trust with a single score. Get board-ready reports and AI-powered governance insights.</p>
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
            7. WHY AUDT + COMPETITIVE
        ════════════════════════════════════ */}
        <section className="section section--alt" id="why-audt">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Why AUDT</span>
              <h2>Built Different. Governed Continuously.</h2>
              <p>Most compliance platforms audit once a year. Most GRC platforms focus on risks. AUDT connects every vendor action, risk change, and evidence update into an always-on governance layer.</p>
            </div>

            <div className="reveal" style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              maxWidth: "820px",
              margin: "0 auto 3rem",
            }}>
              {[
                { icon: "⚡", title: "Event-Driven", body: "37 governance event types. Every vendor action, risk change, and evidence update triggers the right workflow automatically — no manual coordination." },
                { icon: "🔄", title: "Workflow Automation", body: "6 built-in workflow templates. Custom automations. Cross-module orchestration connecting vendor, risk, compliance, and audit in a single execution layer." },
                { icon: "✦", title: "AI Decision Engine", body: "AI recommendations reviewed by humans. Every governance decision carries a confidence score, audit trail, and one-click action — at the speed of risk." },
              ].map(({ icon, title, body }) => (
                <div key={title} style={{
                  padding: "28px 24px",
                  borderRadius: "16px",
                  background: "#FFFFFF",
                  border: "1px solid #E4E8EF",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "26px", marginBottom: "14px" }}>{icon}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "10px", color: "var(--text)" }}>{title}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: body }} />
                </div>
              ))}
            </div>

            <div className="reveal" style={{ overflowX: "auto" }}>
              <div style={{ minWidth: "560px", maxWidth: "860px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", background: "#F8F9FB", borderRadius: "12px 12px 0 0", borderBottom: "1px solid #E4E8EF" }}>
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
                  ["Vendor Lifecycle",       "Partial",  "Partial",  "Complete"],
                  ["Compliance Frameworks",  "Strong",   "Strong",   "Strong"],
                  ["Audit Management",       "Partial",  "Strong",   "Strong"],
                  ["Continuous Monitoring",  "Partial",  "Limited",  "Always-on"],
                  ["AI Governance",          "Limited",  "Limited",  "Native"],
                  ["Trust Intelligence",     "None",     "None",     "Native"],
                  ["Workflow Automation",    "Limited",  "Partial",  "Native"],
                  ["Regulatory Intelligence","None",     "Partial",  "Native"],
                ].map(([label, col1, col2, col3], ri) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", borderBottom: ri < 7 ? "1px solid #EEF2F7" : "none", borderRadius: ri === 7 ? "0 0 12px 12px" : undefined }}>
                    <div style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text)", borderRight: "1px solid #EEF2F7" }}>{label}</div>
                    {[col1, col2].map((val, ci) => (
                      <div key={ci} style={{ padding: "14px 20px", fontSize: "13px", color: "var(--text-dim)", textAlign: "center", borderRight: "1px solid #EEF2F7", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <span style={{ color: val === "Strong" ? "#4ade80" : val === "None" || val === "Limited" ? "#f87171" : "#facc15", fontWeight: 700, fontSize: "10px" }}>
                          {val === "Strong" ? "●" : val === "None" ? "○" : "◐"}
                        </span>
                        {val}
                      </div>
                    ))}
                    <div style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#007A94", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <span style={{ color: "#34d399", fontWeight: 700 }}>✓</span> {col3}
                    </div>
                  </div>
                ))}
              </div>
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
              <h2>Your Vendor Trust Posture In A Single Number.</h2>
              <p>
                Every vendor generates thousands of governance signals.
                AUDT converts those signals into a single Trust Score™ that helps organizations:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "420px", margin: "1.25rem auto 0", textAlign: "left" }}>
                {[
                  "Identify risky vendors before they become a problem",
                  "Prioritize which vendors need immediate attention",
                  "Improve governance scores over time",
                  "Accelerate audits with pre-scored vendor evidence",
                  "Make renewal decisions based on trust data",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: "var(--text-dim)" }}>
                    <span style={{ color: "var(--blue)", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
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
              background: "#FFFFFF",
              border: "1px solid #E4E8EF",
              maxWidth: "800px",
              margin: "0 auto 3.5rem",
            }}>
              {(["Evidence", "Risk", "Compliance", "Assessment", "Contract", "Operational", "Freshness"] as string[]).map((item, i, arr) => (
                <span key={item} style={{ display: "contents" }}>
                  <div style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "rgba(73,51,214,0.08)",
                    border: "1px solid rgba(73,51,214,0.20)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}>{item}</div>
                  {i < arr.length - 1 && (
                    <span style={{ color: "var(--blue)", fontWeight: 700, opacity: 0.5, fontSize: "16px" }}>+</span>
                  )}
                </span>
              ))}
              <span style={{ color: "var(--blue)", fontWeight: 700, fontSize: "22px", margin: "0 6px" }}>=</span>
              <div style={{
                padding: "12px 24px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(0,122,148,0.12), rgba(73,51,214,0.10))",
                border: "1px solid rgba(73,51,214,0.35)",
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
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(30,41,59,0.12)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ts1)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="17" strokeLinecap="round" transform="rotate(-90 40 40)" />
                    <defs><linearGradient id="ts1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#2dd4ff" />
                    </linearGradient></defs>
                  </svg>
                  <div className="tscore__val"><span className="score-num" data-score="92">0</span></div>
                </div>
                <div className="tscore__label">Evidence</div>
                <div className="tscore__sub">↑ 4 pts this month</div>
              </div>
              <div className="tscore">
                <div className="tscore__ring">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(30,41,59,0.12)" strokeWidth="6" />
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
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(30,41,59,0.12)" strokeWidth="6" />
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
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(30,41,59,0.12)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ts4)" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="21" strokeLinecap="round" transform="rotate(-90 40 40)" />
                    <defs><linearGradient id="ts4" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient></defs>
                  </svg>
                  <div className="tscore__val"><span className="score-num" data-score="90">0</span></div>
                </div>
                <div className="tscore__label">Risk Posture</div>
                <div className="tscore__sub">ISO 27001 — Ready</div>
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════
            9. AI — COPILOT + AGENTS
        ════════════════════════════════════ */}
        <section className="section section--alt" id="copilot">
          <div className="container ai-sec">
            <div className="ai-sec__copy reveal">
              <span className="eyebrow">Governance AI</span>
              <h2>AI That Answers. AI That Acts.</h2>
              <p>
                The Governance Copilot™ answers questions about your live governance data in plain English.
                AI Agents monitor continuously and surface observations, recommendations, and actions — with human approval always in the loop.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
                {[
                  "Vendor summaries &amp; risk recommendations",
                  "Audit preparation &amp; evidence discovery",
                  "Compliance guidance &amp; gap analysis",
                  "Board report generation",
                  "24/7 autonomous risk monitoring",
                  "Agent actions reviewed before execution",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: "var(--text-dim)" }}>
                    <span style={{ color: "var(--blue)", fontWeight: 700 }}>✓</span>
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "2rem" }}>
                {[
                  { icon: "▤", name: "Vendor Agent™", desc: "Monitors trust scores &amp; requests evidence" },
                  { icon: "◷", name: "Evidence Agent™", desc: "Collects evidence &amp; tracks control coverage" },
                  { icon: "⚠", name: "Risk Agent™", desc: "Detects emerging risks &amp; escalates critical issues" },
                  { icon: "◎", name: "Audit Agent™", desc: "Prepares audit rooms &amp; identifies evidence gaps" },
                ].map(({ icon, name, desc }) => (
                  <div key={name} style={{ padding: "14px 16px", borderRadius: "12px", background: "#F8F9FB", border: "1px solid #E4E8EF" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                      <span style={{ marginRight: "6px" }}>{icon}</span>
                      <span dangerouslySetInnerHTML={{ __html: name }} />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-dim)" }} dangerouslySetInnerHTML={{ __html: desc }} />
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
                <span>Ask about your governance posture...</span>
                <span className="chat__send">✦</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            10. ENTERPRISE + INTELLIGENCE
        ════════════════════════════════════ */}
        <section className="section" id="enterprise">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Enterprise Ready</span>
              <h2>Built For Organizations That Cannot Afford To Get Governance Wrong.</h2>
              <p>India data residency. AES-256-GCM encryption. Role-based access. TOTP MFA. Everything enterprise governance demands — on day one.</p>
            </div>
            <div className="reveal" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              maxWidth: "960px",
              margin: "0 auto 3rem",
            }}>
              {[
                { icon: "🔗", title: "Connected Data Model",      desc: "Every vendor, risk, control, evidence, and audit is linked. Changes propagate across modules automatically — no manual reconciliation." },
                { icon: "✦",  title: "Shared AI Layer",           desc: "The Governance Copilot™ and AI Agents operate on your complete governance graph — not isolated module data." },
                { icon: "📡", title: "Continuous Signal Engine",  desc: "Trust scores, compliance readiness, and risk posture update in real time as vendor data changes." },
                { icon: "◎",  title: "Audit-Ready Always",        desc: "Maintain audit-ready evidence, controls, and documentation 365 days a year — not just before audit season." },
                { icon: "◻",  title: "Policy &amp; Control Management", desc: "Manage policies, controls, and frameworks with version history and attestation workflows." },
                { icon: "🤖", title: "AI Governance",             desc: "Govern AI vendors, AI systems, and AI risks with dedicated AI governance frameworks and risk registers." },
                { icon: "🌐", title: "Third-Party Risk Oversight", desc: "Map risk exposure across your entire third-party ecosystem, including Nth-party dependencies." },
                { icon: "🔒", title: "Enterprise Security",       desc: "TOTP MFA, SSO (Entra ID, Okta), IP allow lists, session governance, AES-256-GCM encryption, and India data residency." },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{
                  padding: "24px 20px",
                  borderRadius: "14px",
                  background: "#FFFFFF",
                  border: "1px solid #E4E8EF",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "12px" }}>{icon}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px", lineHeight: 1.3 }}>{title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: desc }} />
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

            <div className="reveal" style={{ textAlign: "center" as const, marginTop: "3rem" }}>
              <div style={{
                display: "inline-flex", flexDirection: "column" as const, alignItems: "center",
                gap: "16px", padding: "32px 40px",
                borderRadius: "20px",
                background: "#FFFFFF",
                border: "1px solid #E4E8EF",
              }}>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" as const, justifyContent: "center" }}>
                  {[
                    { label: "Security", href: "/trust/architecture" },
                    { label: "Compliance", href: "/trust/frameworks" },
                    { label: "Privacy", href: "/trust/privacy" },
                    { label: "Responsible AI", href: "/trust/ai" },
                  ].map(({ label, href }) => (
                    <a key={label} href={href} style={{
                      fontSize: "12px", fontWeight: 600, color: "#64748B",
                      textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
                    }}>
                      <span style={{ color: "#22c55e", fontSize: "8px" }}>&#9679;</span> {label}
                    </a>
                  ))}
                </div>
                <a href="/trust" style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "10px 22px", borderRadius: "10px",
                  background: "rgba(73,51,214,0.08)", border: "1px solid rgba(73,51,214,0.25)",
                  fontSize: "13px", fontWeight: 700, color: "var(--text)", textDecoration: "none",
                }}>
                  Visit Trust Center →
                </a>
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
              <h2>Building The Governance OS For Every Organization.</h2>
              <p>
                Today, organizations use AUDT to replace spreadsheets and disconnected tools.<br />
                Tomorrow, AUDT becomes the system of record for organizational trust.
              </p>
            </div>

            <div className="reveal" style={{
              maxWidth: "560px",
              margin: "0 auto 3rem",
              padding: "2rem",
              borderRadius: "16px",
              background: "#FFFFFF",
              border: "1px solid #E4E8EF",
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4ade80", marginBottom: "1rem" }}>Live Today — 32 Modules</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {["Vendor Governance + Lifecycle", "Risk, Compliance &amp; Audit", "Trust Intelligence + Monitoring", "AI Governance + Regulatory Intel", "Trust Network + Verification", "Security Command Center™", "Governance Agent Framework™", "Trust Operations Engine™"].map((item) => (
                  <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "var(--text-dim)" }}>
                    <span style={{ color: "#4ade80", fontSize: "10px", flexShrink: 0 }}>●</span><span dangerouslySetInnerHTML={{ __html: item }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal" style={{ textAlign: "center" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, background: "linear-gradient(120deg, #00B8D9 0%, #4933D6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
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
                  <p className="pcard__tagline">The complete Governance OS for organisations scaling their trust program.</p>
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

            {/* SLA Table */}
            <div className="reveal" style={{ marginTop: "3rem", overflowX: "auto" }}>
              <div style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase" as const, color: "rgba(154,160,181,0.6)",
                textAlign: "center" as const, marginBottom: "1rem",
              }}>
                Support SLA by Plan
              </div>
              <table style={{
                width: "100%", maxWidth: "700px", margin: "0 auto",
                borderCollapse: "collapse" as const, fontSize: "13px",
              }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E4E8EF" }}>
                    {["Plan", "Support", "Initial Response", "Coverage"].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, fontWeight: 700, color: "#64748B", fontSize: "12px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Growth", "Email", "Next Business Day", "Business hours"],
                    ["Business", "Priority Email", "Within 8 Business Hours", "Business hours"],
                    ["Enterprise", "Dedicated Support", "Within 1 Business Hour", "24 / 5 (P1: 24 / 7)"],
                  ].map(([plan, support, response, coverage], i) => (
                    <tr key={plan} style={{ borderBottom: "1px solid #EEF2F7", background: i === 1 ? "rgba(73,51,214,0.06)" : "transparent" }}>
                      <td style={{ padding: "10px 16px", fontWeight: 700, color: "var(--text)" }}>{plan}</td>
                      <td style={{ padding: "10px 16px", color: "#64748B" }}>{support}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text)" }}>{response}</td>
                      <td style={{ padding: "10px 16px", color: "#64748B" }}>{coverage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: "center" as const, marginTop: "0.75rem" }}>
                <a href="/trust/support" style={{ fontSize: "12px", color: "var(--blue)", textDecoration: "none" }}>
                  Full SLA documentation →
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════ */}
        <section className="cta-final" id="cta">
          <div className="container cta-final__inner reveal">
            <div className="cta-final__badge">AI-Native Trust, Risk &amp; Compliance Platform</div>
            <h2>Ready to Build Governance on Proof?</h2>
            <p>
              One platform. 32 modules. Continuous trust.<br />Built for organizations that cannot afford to get governance wrong.
            </p>
            <div className="cta-final__btns">
              <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
              <a href="/signup" className="btn btn--ghost btn--lg">Start Free Trial →</a>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(154,160,181,0.5)", marginTop: "1.25rem" }}>
              By signing up you agree to our{" "}
              <a href="/trust/terms" style={{ color: "rgba(0,184,217,0.80)", textDecoration: "none" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="/trust/privacy" style={{ color: "rgba(0,184,217,0.80)", textDecoration: "none" }}>Privacy Policy</a>.
            </p>
          </div>
        </section>

      </main>

    </>
  );
}
