"use client";

import { useEffect } from "react";

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

export default function PlatformPage() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if ("IntersectionObserver" in window && !reduce) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            const delay = parseInt(el.getAttribute("data-delay") || "0", 10);
            window.setTimeout(() => el.classList.add("in"), delay);
            io.unobserve(el);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
      return () => io.disconnect();
    } else {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    }
  }, []);

  return (
    <main>

      {/* ══════════════════════════════════════
          1. HERO
      ══════════════════════════════════════ */}
      <section className="hero" style={{ paddingBottom: "5rem" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "820px" }}>
          <div className="reveal" style={{ paddingTop: "clamp(5rem,10vw,8rem)" }}>
            <div className="badge" style={{ justifyContent: "center" }}>
              <span className="badge__pulse" />
              Vendor Governance Platform
            </div>
            <h1 className="hero__title" style={{ fontSize: "clamp(2rem,4.5vw,3.2rem)", marginTop: "1.25rem" }}>
              The Complete Vendor<br />
              <span className="grad-text">Governance Platform</span>
            </h1>
            <p style={{ fontSize: "clamp(15px,1.8vw,19px)", color: "var(--text-dim)", maxWidth: "620px", margin: "1.25rem auto 2rem", lineHeight: 1.7 }}>
              Manage every stage of the vendor lifecycle through a unified platform for governance, risk, compliance, audits, and trust.
            </p>
            <div className="hero__cta" style={{ justifyContent: "center" }}>
              <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
              <a href="/signup" className="btn btn--ghost btn--lg">Start Free Trial <span className="arrow">→</span></a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          2. PLATFORM ARCHITECTURE
      ══════════════════════════════════════ */}
      <section className="section section--alt" id="architecture">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Architecture</span>
            <h2>Built Around The Vendor.</h2>
            <p>
              Unlike traditional compliance or GRC tools, AUDT starts with the vendor.
              Every workflow, assessment, audit, and decision is connected to a single vendor record.
            </p>
          </div>

          <div className="reveal" style={{ maxWidth: "440px", margin: "0 auto" }}>
            {[
              { label: "Vendor", icon: "▤", note: "The single source of record", accent: "rgba(99,102,241,0.9)", top: true },
              { label: "Vendor Governance", icon: "📋", note: "Lifecycle, contracts, ownership", accent: "rgba(99,102,241,0.7)" },
              { label: "Trust Operations", icon: "🛡", note: "Assessments, evidence, reviews", accent: "rgba(99,102,241,0.55)" },
              { label: "Risk & Compliance", icon: "◷", note: "Risk, controls, audits, frameworks", accent: "rgba(99,102,241,0.4)" },
              { label: "Trust Intelligence", icon: "✦", note: "AI insights, Trust Score™, monitoring", accent: "rgba(99,102,241,0.3)" },
              { label: "Continuous Trust", icon: "📡", note: "The outcome — always measured", accent: "rgba(45,212,255,0.6)", bottom: true },
            ].map(({ label, icon, note, accent, top, bottom }, i) => (
              <div key={label}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "18px 24px",
                  borderRadius: "12px",
                  background: top ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(45,212,255,0.06))" : bottom ? "linear-gradient(135deg, rgba(45,212,255,0.1), rgba(99,102,241,0.05))" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${accent}`,
                }}>
                  <div style={{ fontSize: "20px", flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{label}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{note}</div>
                  </div>
                  {(top || bottom) && (
                    <div style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: accent }}>
                      {top ? "Core" : "Outcome"}
                    </div>
                  )}
                </div>
                {i < 5 && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                    <div style={{ width: "1px", height: "24px", background: "linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(99,102,241,0.1))" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. VENDOR LIFECYCLE
      ══════════════════════════════════════ */}
      <section className="section" id="lifecycle">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Vendor Lifecycle</span>
            <h2>Manage The Entire Vendor Lifecycle.</h2>
            <p>AUDT governs every stage of the vendor relationship — from discovery through offboarding.</p>
          </div>

          <div className="reveal" style={{ overflowX: "auto", paddingBottom: "8px" }}>
            <div style={{
              display: "flex", alignItems: "stretch", gap: "0",
              minWidth: "700px", margin: "0 auto", maxWidth: "940px",
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
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", textAlign: "center",
                    padding: "20px 6px 16px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
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

      {/* ══════════════════════════════════════
          4. PLATFORM PILLARS
      ══════════════════════════════════════ */}
      <section className="section section--alt" id="pillars">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Platform Pillars</span>
            <h2>Four Integrated Platform Layers.</h2>
            <p>Every dimension of vendor governance is organized into four connected layers.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              {
                id: "vendor-governance",
                icon: "▤",
                pillar: "Pillar 1",
                title: "Vendor Governance",
                desc: "The system of record for every vendor relationship.",
                outcomes: ["Know every vendor", "Track ownership", "Manage contracts", "Govern lifecycle"],
                modules: ["Vendor Registry", "Vendor Directory", "Vendor Classification", "Vendor Ownership", "Vendor Contacts", "Vendor Reviews", "Vendor Lifecycle", "Contract Governance"],
                color: "rgba(99,102,241,0.2)",
                border: "rgba(99,102,241,0.3)",
              },
              {
                id: "trust-operations",
                icon: "🛡",
                pillar: "Pillar 2",
                title: "Trust Operations",
                desc: "Operational workflows that validate vendor trust.",
                outcomes: ["Standardize assessments", "Collect evidence", "Track remediation", "Improve accountability"],
                modules: ["Assessments", "Questionnaires", "Evidence Requests", "Evidence Repository", "Reviews", "Remediation", "Exceptions", "Workflows"],
                color: "rgba(124,58,237,0.15)",
                border: "rgba(124,58,237,0.3)",
              },
              {
                id: "risk-compliance",
                icon: "◷",
                pillar: "Pillar 3",
                title: "Risk & Compliance",
                desc: "Manage governance execution at scale.",
                outcomes: ["Reduce risk", "Maintain compliance", "Accelerate audits", "Improve visibility"],
                modules: ["Framework Management", "Control Management", "Risk Register", "Risk Assessments", "Findings Management", "Policy Governance", "Compliance Management", "Audit Management"],
                color: "rgba(45,212,255,0.08)",
                border: "rgba(45,212,255,0.25)",
              },
              {
                id: "trust-intelligence",
                icon: "✦",
                pillar: "Pillar 4",
                title: "Trust Intelligence",
                desc: "AI-powered governance insights.",
                outcomes: ["Measure trust", "Prioritize reviews", "Improve decisions", "Predict risk"],
                modules: ["Trust Score™", "Governance Copilot™", "Continuous Monitoring", "Benchmarking", "Analytics", "Executive Reporting"],
                color: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(45,212,255,0.06))",
                border: "rgba(99,102,241,0.35)",
              },
            ].map(({ id, icon, pillar, title, desc, outcomes, modules, color, border }) => (
              <div
                key={id}
                id={id}
                className="reveal"
                style={{
                  padding: "2rem 2.5rem",
                  borderRadius: "20px",
                  background: color,
                  border: `1px solid ${border}`,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "2rem",
                  alignItems: "start",
                }}
              >
                {/* Left: pillar info */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "28px" }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--blue)", marginBottom: "2px" }}>{pillar}</div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>{title}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.65 }}>{desc}</p>
                </div>

                {/* Middle: outcomes */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-dim)", marginBottom: "12px" }}>Outcomes</div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                    {outcomes.map((o) => (
                      <div key={o} style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "var(--text-dim)" }}>
                        <span style={{ color: "var(--blue)", fontWeight: 700, flexShrink: 0 }}>✓</span>{o}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: modules */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-dim)", marginBottom: "12px" }}>Modules</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                    {modules.map((m) => (
                      <span key={m} style={{
                        padding: "4px 10px", borderRadius: "999px",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        fontSize: "11px", color: "var(--text-dim)", fontWeight: 500,
                      }}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. GOVERNANCE COVERAGE
      ══════════════════════════════════════ */}
      <section className="section" id="coverage">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Governance Coverage</span>
            <h2>Complete Governance Coverage.</h2>
            <p>Every governance domain in a single platform.</p>
          </div>

          <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", maxWidth: "820px", margin: "0 auto 2.5rem" }}>
            {[
              "Vendor Governance", "Trust Operations", "Risk Management",
              "Compliance Management", "Audit Management", "Policy Governance",
              "Privacy Governance", "Asset Intelligence", "AI Governance", "Continuous Monitoring",
            ].map((item) => (
              <div key={item} style={{
                padding: "10px 20px", borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                fontSize: "14px", color: "var(--text-dim)", fontWeight: 500,
              }}>{item}</div>
            ))}
          </div>

          <div className="reveal" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "var(--text-dim)", marginBottom: "1.5rem" }}>
              Powered by 32 integrated modules working together through a shared intelligence layer.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. TRUST SCORE™
      ══════════════════════════════════════ */}
      <section className="section section--alt" id="trust-score">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Trust Score™</span>
            <h2>The Universal Measure Of Vendor Trust.</h2>
            <p>Every vendor generates governance signals. AUDT converts those signals into a single Trust Score™.</p>
          </div>

          <div className="reveal" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            flexWrap: "wrap", gap: "10px",
            padding: "28px", borderRadius: "16px",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
            maxWidth: "760px", margin: "0 auto 3rem",
          }}>
            {(["Security", "Compliance", "Risk", "Monitoring", "Performance", "Audit Readiness"] as string[]).map((item, i, arr) => (
              <span key={item} style={{ display: "contents" }}>
                <div style={{
                  padding: "10px 18px", borderRadius: "8px",
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                  fontSize: "13px", fontWeight: 600, color: "var(--text)",
                }}>{item}</div>
                {i < arr.length - 1 && <span style={{ color: "var(--blue)", fontWeight: 700, opacity: 0.5, fontSize: "18px" }}>+</span>}
              </span>
            ))}
            <span style={{ color: "var(--blue)", fontWeight: 700, fontSize: "22px", margin: "0 6px" }}>=</span>
            <div style={{
              padding: "12px 24px", borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(45,212,255,0.12))",
              border: "1px solid rgba(99,102,241,0.5)",
              fontSize: "15px", fontWeight: 800, color: "var(--text)",
            }}>Trust Score™</div>
          </div>

          <div className="reveal" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px",
            maxWidth: "680px", margin: "0 auto",
          }}>
            {[
              { label: "Prioritize reviews",          icon: "↑" },
              { label: "Identify risky vendors",       icon: "⚠" },
              { label: "Accelerate audits",            icon: "◎" },
              { label: "Improve renewal decisions",    icon: "🔄" },
            ].map(({ label, icon }) => (
              <div key={label} style={{
                padding: "20px 16px", borderRadius: "12px", textAlign: "center",
                background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)",
              }}>
                <div style={{ fontSize: "20px", marginBottom: "8px" }}>{icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-dim)", lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          7. GOVERNANCE COPILOT™
      ══════════════════════════════════════ */}
      <section className="section" id="copilot">
        <div className="container ai-sec">
          <div className="ai-sec__copy reveal">
            <span className="eyebrow">Governance Copilot™</span>
            <h2>AI For Governance Teams.</h2>
            <p>The Governance Copilot™ is built into every module. Ask questions about your vendor governance data in plain English.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "2rem" }}>
              {[
                "Vendor summaries &amp; risk recommendations",
                "Risk insights &amp; trend analysis",
                "Audit preparation &amp; evidence discovery",
                "Executive reporting &amp; board narratives",
                "Compliance guidance &amp; gap analysis",
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
              <div className="chat__a">4 vendors have declining trust scores. 2 require document refresh. 1 assessment expires in 14 days. 1 contract renewal is overdue.</div>
              <div className="chat__q">Are we audit ready for ISO 27001?</div>
              <div className="chat__a">Audit readiness is 92%. 3 evidence gaps remain across 2 vendor controls. Evidence Vault™ is current for 171 of 174 controls.</div>
            </div>
            <div className="chat__input">
              <span>Ask about your vendor governance posture...</span>
              <span className="chat__send">✦</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          8. ENTERPRISE READY
      ══════════════════════════════════════ */}
      <section className="section section--alt" id="enterprise">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Enterprise Readiness</span>
            <h2>Built For Enterprise Governance.</h2>
            <p>Designed for organizations where vendor governance is a strategic priority.</p>
          </div>

          <div className="reveal" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px",
            maxWidth: "860px", margin: "0 auto",
          }}>
            {[
              { icon: "🏢", title: "Multi-Entity Governance",     desc: "Govern vendors across subsidiaries and business units from one platform." },
              { icon: "🌐", title: "Third-Party Risk Oversight",  desc: "Map risk exposure across your entire third-party ecosystem." },
              { icon: "📡", title: "Continuous Assurance",        desc: "Always-on monitoring replaces point-in-time assessments." },
              { icon: "◎",  title: "Enterprise Audit Readiness",  desc: "Maintain audit-ready evidence, controls, and documentation year-round." },
              { icon: "◻",  title: "Role-Based Access Control",   desc: "7 governance roles with granular permissions across every module." },
              { icon: "✦",  title: "Governance Intelligence",     desc: "AI-powered insights and Trust Score™ built into every workflow." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                padding: "24px 20px", borderRadius: "14px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ fontSize: "22px", marginBottom: "12px" }}>{icon}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{title}</div>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          9. WHY AUDT — COMPARISON
      ══════════════════════════════════════ */}
      <section className="section" id="why-audt">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">A Different Approach</span>
            <h2>A Different Approach To Governance.</h2>
            <p>Most platforms solve a single governance problem. AUDT governs the complete vendor lifecycle while continuously measuring trust.</p>
          </div>

          <div className="reveal" style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "520px", maxWidth: "700px", margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(255,255,255,0.03)", borderRadius: "12px 12px 0 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {[
                  { label: "Traditional Platforms", color: "var(--text-dim)" },
                  { label: "AUDT",                  color: "var(--blue)" },
                ].map(({ label, color }) => (
                  <div key={label} style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color, textAlign: "center" as const }}>
                    {label}
                  </div>
                ))}
              </div>
              {[
                ["Compliance First",    "Vendor First"],
                ["Audit Driven",        "Lifecycle Driven"],
                ["Point Solutions",     "Unified Platform"],
                ["Static Reviews",      "Continuous Monitoring"],
                ["Annual Audits",       "Continuous Trust"],
                ["Multiple Systems",    "Single System Of Record"],
              ].map(([left, right], ri) => (
                <div key={left} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  borderBottom: ri < 5 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  borderRadius: ri === 5 ? "0 0 12px 12px" : undefined,
                }}>
                  <div style={{ padding: "14px 24px", fontSize: "13px", color: "var(--text-dim)", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ color: "#f87171", fontSize: "10px" }}>✕</span>{left}
                  </div>
                  <div style={{ padding: "14px 24px", fontSize: "13px", fontWeight: 600, color: "#a5f3a0", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ color: "#34d399", fontSize: "10px" }}>✓</span>{right}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          10. CTA
      ══════════════════════════════════════ */}
      <section className="cta-final">
        <div className="container cta-final__inner reveal">
          <div className="cta-final__badge">Vendor Governance Platform</div>
          <h2>Govern Every Vendor. Trust Every Decision.</h2>
          <p>
            Discover how AUDT helps organizations manage vendor governance, risk, compliance,
            audits, and trust from a single platform.
          </p>
          <div className="cta-final__btns">
            <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
            <a href="/signup" className="btn btn--ghost btn--lg">Start Free Trial →</a>
          </div>
        </div>
      </section>

    </main>
  );
}
