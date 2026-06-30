"use client";

import Link from "next/link";
import { useEffect } from "react";

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
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );
      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
      return () => io.disconnect();
    } else {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    }
  }, []);

  return (
    <main id="top">

      {/* ─── 1. HERO ─────────────────────────────────── */}
      <section className="hero" style={{ paddingBottom: "80px" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "820px" }}>
          <div className="hero__copy reveal" style={{ maxWidth: "100%" }}>
            <div className="badge" style={{ display: "inline-flex" }}>
              <span className="badge__pulse" />
              AI-Native Trust, Risk &amp; Compliance Platform
            </div>
            <h1 className="hero__title">
              The Complete Governance<br />
              <span className="grad-text">OS for Modern Teams.</span>
            </h1>
            <p className="hero__sub" style={{ margin: "0 auto 34px" }}>
              32 modules. One platform. Vendor governance, risk, compliance, audits, regulatory intelligence, AI governance, and continuous monitoring &#8212; unified through a shared intelligence layer.
            </p>
            <div className="hero__cta" style={{ justifyContent: "center" }}>
              <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
              <Link href="/signup" className="btn btn--ghost btn--lg">Start Free Trial <span className="arrow">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. ARCHITECTURE ─────────────────────────── */}
      <section className="section section--alt" id="architecture">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Architecture</span>
            <h2>Built For Complete Governance.</h2>
            <p>
              AUDT connects every governance domain into a single intelligent platform &#8212; from vendor management through regulatory intelligence, all sharing one data model and AI layer.
            </p>
          </div>

          <div className="reveal" style={{ maxWidth: "420px", margin: "0 auto" }}>
            {([
              { label: "Vendor",             icon: "▤",  note: "Single source of record",           hi: true,  lo: false },
              { label: "Vendor Governance",  icon: "📋", note: "Lifecycle, contracts, ownership",   hi: false, lo: false },
              { label: "Trust Operations",   icon: "🛡", note: "Assessments, evidence, reviews",    hi: false, lo: false },
              { label: "Risk & Compliance",  icon: "◷",  note: "Risk, controls, audits, frameworks",hi: false, lo: false },
              { label: "Trust Intelligence", icon: "✦",  note: "AI insights, Trust Score™",         hi: false, lo: false },
              { label: "Continuous Trust",   icon: "📡", note: "The outcome — always measured",     hi: false, lo: true  },
            ]).map(({ label, icon, note, hi, lo }, i, arr) => (
              <div key={label}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "16px 22px", borderRadius: "12px",
                  background: hi
                    ? "linear-gradient(135deg, rgba(73,51,214,0.10), rgba(0,184,217,0.06))"
                    : lo
                    ? "linear-gradient(135deg, rgba(0,184,217,0.08), rgba(73,51,214,0.05))"
                    : "#FFFFFF",
                  border: hi
                    ? "1px solid rgba(73,51,214,0.30)"
                    : lo
                    ? "1px solid rgba(0,184,217,0.30)"
                    : "1px solid #E4E8EF",
                }}>
                  <div style={{ fontSize: "20px", flexShrink: 0 }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{label}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{note}</div>
                  </div>
                  {(hi || lo) && (
                    <span style={{
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                      color: hi ? "#4933D6" : "#007A94",
                    }}>
                      {hi ? "Core" : "Outcome"}
                    </span>
                  )}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "3px 0" }}>
                    <div style={{ width: "1px", height: "20px", background: "linear-gradient(to bottom, rgba(73,51,214,0.25), rgba(73,51,214,0.06))" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. VENDOR LIFECYCLE ─────────────────────── */}
      <section className="section" id="lifecycle">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Vendor Lifecycle</span>
            <h2>Manage The Complete Vendor Lifecycle.</h2>
            <p>AUDT governs every stage of the vendor relationship — from discovery through offboarding.</p>
          </div>

          <div className="reveal" style={{ overflowX: "auto", paddingBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "stretch", minWidth: "700px", maxWidth: "960px", margin: "0 auto" }}>
              {(["Discover","Inventory","Classify","Assess","Risk","Comply","Monitor","Audit","Renew","Offboard"]).map((label, i, arr) => (
                <div key={label} style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
                  <div style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                    textAlign: "center", padding: "18px 6px 14px",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    border: "1px solid #E4E8EF",
                  }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--blue)", marginBottom: "6px", opacity: 0.8 }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>{label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", padding: "0 3px", color: "var(--blue)", fontSize: "12px", opacity: 0.35, flexShrink: 0 }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="reveal" style={{ textAlign: "center", marginTop: "2rem", fontSize: "15px", color: "var(--text-dim)" }}>
            Most platforms focus on one stage.{" "}
            <strong style={{ color: "var(--text)" }}>AUDT manages all ten.</strong>
          </p>
        </div>
      </section>

      {/* ─── 4. PLATFORM PILLARS ─────────────────────── */}
      <section className="section section--alt" id="pillars">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Platform Pillars</span>
            <h2>Four Integrated Layers.</h2>
            <p>Every dimension of vendor governance — organized into four connected layers.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {([
              {
                id: "vendor-governance", icon: "▤",  n: "01",
                title: "Vendor Governance",
                desc: "The system of record for every vendor relationship — from discovery through offboarding.",
                outcomes: ["Know every vendor", "Track ownership & contracts", "Manage lifecycle stages", "Govern renewals"],
                modules: ["Vendor Registry","Vendor Lifecycle","Contract Governance","Vendor Reviews","Vendor Contacts","Vendor Portal"],
              },
              {
                id: "trust-operations", icon: "🛡", n: "02",
                title: "Trust Operations",
                desc: "Operational workflows that validate and improve vendor trust through evidence and assessments.",
                outcomes: ["Standardize assessments", "Collect & manage evidence", "Track remediation", "Reduce manual work"],
                modules: ["Security Assessments","Questionnaires","Evidence Requests","Evidence Vault™","Remediation","Workflows"],
              },
              {
                id: "risk-compliance", icon: "◷", n: "03",
                title: "Risk & Compliance",
                desc: "Manage governance execution — risk, controls, audits, frameworks — at scale.",
                outcomes: ["Reduce risk exposure", "Maintain compliance", "Accelerate audits", "Track control health"],
                modules: ["Risk Register","Controls","Audit Management","Compliance Frameworks","Policy Governance","Findings & CAPAs"],
              },
              {
                id: "trust-intelligence", icon: "✦", n: "04",
                title: "Trust Intelligence",
                desc: "AI-powered governance insights that help teams prioritize, decide, and improve.",
                outcomes: ["Measure vendor trust", "Prioritize reviews", "Improve decisions", "Predict risk trends"],
                modules: ["Trust Score™","Governance Copilot™","Continuous Monitoring","Benchmarking","Executive Reporting","Analytics"],
              },
            ]).map(({ id, icon, n, title, desc, outcomes, modules }) => (
              <div key={id} id={id} className="reveal" style={{
                padding: "28px 32px", borderRadius: "18px",
                background: "#FFFFFF", border: "1px solid #E4E8EF",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem", alignItems: "start",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "26px" }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--blue)", marginBottom: "2px" }}>Pillar {n}</div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)" }}>{title}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.65 }}>{desc}</p>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-dim)", marginBottom: "12px" }}>Outcomes</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {outcomes.map((o) => (
                      <div key={o} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "var(--text-dim)" }}>
                        <span style={{ color: "var(--blue)", fontWeight: 700, marginTop: "1px", flexShrink: 0 }}>✓</span>{o}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-dim)", marginBottom: "12px" }}>Modules</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {modules.map((m) => (
                      <span key={m} style={{
                        padding: "4px 10px", borderRadius: "999px",
                        background: "#F8F9FB", border: "1px solid #E4E8EF",
                        fontSize: "11px", color: "var(--text-dim)", fontWeight: 500, whiteSpace: "nowrap",
                      }}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4B. TRUST OPERATIONS ENGINE™ ──────────── */}
      <section className="section section--alt" id="trust-operations-engine">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Trust Operations Engine&#8482;</span>
            <h2>Governance That Runs 24/7.</h2>
            <p>
              Most platforms record what happened. The Trust Operations Engine&#8482; orchestrates what happens next &#8212; connecting every governance event to the right workflow, approval, and AI decision automatically.
            </p>
          </div>

          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px", maxWidth: "860px", margin: "0 auto 2.5rem" }}>
            {([
              {
                icon: "&#9889;",
                title: "Event Engine",
                desc: "37 built-in event types capture every meaningful governance action &#8212; vendor status changes, evidence expiry, risk score drops, compliance gaps, CAPA breaches, and more.",
                stat: "37 event types",
              },
              {
                icon: "&#128260;",
                title: "Workflow Engine",
                desc: "6 built-in workflow templates plus custom workflows. Vendor Onboarding, Evidence Expiry Response, Trust Score Drop, Contract Renewal, Vendor Offboarding, Critical Risk Escalation.",
                stat: "6 built-in workflows",
              },
              {
                icon: "&#129302;",
                title: "Automation Engine",
                desc: "If-this-then-that governance automation. Define rules that connect any event to any action &#8212; create risk, assign task, request evidence, escalate for approval &#8212; with no code.",
                stat: "No-code automation",
              },
              {
                icon: "&#10022;",
                title: "AI Decision Engine",
                desc: "AI analyses each governance situation, generates recommendations with confidence scores, and queues proposed actions for human approval. Full audit trail on every decision.",
                stat: "Human-in-the-loop AI",
              },
            ] as { icon: string; title: string; desc: string; stat: string }[]).map(({ icon, title, desc, stat }) => (
              <div key={title} className="reveal" style={{
                padding: "28px", borderRadius: "16px",
                background: "#FFFFFF", border: "1px solid #E4E8EF",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ fontSize: "28px", flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: icon }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "12px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>{title}</div>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em",
                        textTransform: "uppercase" as const,
                        padding: "3px 10px", borderRadius: "999px",
                        background: "rgba(73,51,214,0.08)", border: "1px solid rgba(73,51,214,0.20)",
                        color: "#4933D6", whiteSpace: "nowrap" as const,
                        flexShrink: 0,
                      }}>{stat}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.65, margin: 0 }} dangerouslySetInnerHTML={{ __html: desc }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{
            maxWidth: "860px", margin: "0 auto", padding: "24px 32px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(73,51,214,0.06), rgba(0,184,217,0.04))",
            border: "1px solid rgba(73,51,214,0.18)",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "16px",
          }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
                Every signal &#8594; right workflow &#8594; right person &#8594; audit trail.
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
                No manual chasing. No missed events. Governance that closes the loop automatically.
              </div>
            </div>
            <a
              href="mailto:hello@audt.tech?subject=AUDT%20TOE%20Demo"
              className="btn btn--primary btn--sm"
              style={{ whiteSpace: "nowrap" as const, flexShrink: 0 }}
            >
              See It In Action
            </a>
          </div>
        </div>
      </section>

      {/* ─── 5. COVERAGE ─────────────────────────────── */}
      <section className="section" id="coverage">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Governance Coverage</span>
            <h2>Complete Governance Coverage.</h2>
            <p>Every governance domain your organization needs — in a single platform.</p>
          </div>
          <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", maxWidth: "840px", margin: "0 auto 2rem" }}>
            {["Vendor Governance","Trust Operations","Risk Management","Compliance Management","Audit Management","Policy Governance","Privacy & DPDP","Contract Governance","Asset Intelligence","AI Governance","Regulatory Intelligence","Trust Verification","Executive Reporting","Continuous Monitoring"].map((item) => (
              <div key={item} style={{
                padding: "10px 20px", borderRadius: "999px",
                border: "1px solid #E4E8EF", background: "#F8F9FB",
                fontSize: "14px", color: "var(--text-dim)", fontWeight: 500,
              }}>{item}</div>
            ))}
          </div>
          <p className="reveal" style={{ textAlign: "center", fontSize: "14px", color: "var(--text-faint)" }}>
            Powered by 32 integrated modules working together through a shared intelligence layer.
          </p>
        </div>
      </section>

      {/* ─── 6. TRUST SCORE™ ─────────────────────────── */}
      <section className="section section--alt" id="trust-score">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Trust Score™</span>
            <h2>The Universal Measure Of Vendor Trust.</h2>
            <p>Every vendor generates thousands of governance signals. AUDT converts those signals into a single Trust Score™ — so your team always knows where to focus.</p>
          </div>
          <div className="reveal" style={{
            display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "10px",
            padding: "28px", borderRadius: "16px",
            background: "#FFFFFF", border: "1px solid #E4E8EF",
            maxWidth: "780px", margin: "0 auto 3rem",
          }}>
            {["Evidence (20%)","Risk (20%)","Compliance (15%)","Assessment (15%)","Contract (10%)","Operational (10%)","Freshness (10%)"].map((item, i, arr) => (
              <span key={item} style={{ display: "contents" }}>
                <div style={{
                  padding: "10px 18px", borderRadius: "8px",
                  background: "rgba(73,51,214,0.07)", border: "1px solid rgba(73,51,214,0.18)",
                  fontSize: "13px", fontWeight: 600, color: "var(--text)",
                }}>{item}</div>
                {i < arr.length - 1 && <span style={{ color: "var(--blue)", fontWeight: 700, opacity: 0.5, fontSize: "18px" }}>+</span>}
              </span>
            ))}
            <span style={{ color: "var(--blue)", fontWeight: 700, fontSize: "22px", margin: "0 6px" }}>=</span>
            <div style={{
              padding: "12px 24px", borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(73,51,214,0.15), rgba(0,184,217,0.10))",
              border: "1px solid rgba(73,51,214,0.35)",
              fontSize: "15px", fontWeight: 800, color: "var(--text)",
            }}>Trust Score™</div>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", maxWidth: "680px", margin: "0 auto" }}>
            {[
              { label: "Prioritize reviews",        icon: "↑" },
              { label: "Identify risky vendors",     icon: "⚠" },
              { label: "Accelerate audits",          icon: "◎" },
              { label: "Improve renewal decisions",  icon: "🔄" },
            ].map(({ label, icon }) => (
              <div key={label} style={{
                padding: "20px 16px", borderRadius: "12px", textAlign: "center",
                background: "rgba(73,51,214,0.06)", border: "1px solid rgba(73,51,214,0.15)",
              }}>
                <div style={{ fontSize: "22px", marginBottom: "8px" }}>{icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-dim)", lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. COPILOT ──────────────────────────────── */}
      <section className="section" id="copilot">
        <div className="container ai-sec">
          <div className="ai-sec__copy reveal">
            <span className="eyebrow">Governance Copilot™</span>
            <h2>AI Built For Governance Teams.</h2>
            <p>The Governance Copilot™ is built into every module. Ask questions about your vendor data in plain English — get answers, not dashboards.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "2rem" }}>
              {["Vendor summaries & risk recommendations","Audit preparation & evidence discovery","Risk insights & trend analysis","Executive reporting & board narratives","Compliance guidance & gap analysis"].map((item) => (
                <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: "var(--text-dim)" }}>
                  <span style={{ color: "var(--blue)", fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
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
              <span>Ask about your governance posture...</span>
              <span className="chat__send">✦</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. ENTERPRISE ───────────────────────────── */}
      <section className="section section--alt" id="enterprise">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">Enterprise Readiness</span>
            <h2>Built For Enterprise Governance.</h2>
            <p>Designed for organizations where vendor governance is a strategic function — not a compliance checkbox.</p>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", maxWidth: "860px", margin: "0 auto" }}>
            {[
              { icon: "🏢", title: "Multi-Entity Governance",    desc: "Govern vendors across subsidiaries and business units from one platform." },
              { icon: "🌐", title: "Third-Party Risk Oversight", desc: "Map risk exposure across your entire third-party ecosystem." },
              { icon: "📡", title: "Continuous Assurance",       desc: "Always-on monitoring replaces point-in-time assessments." },
              { icon: "◎",  title: "Audit Readiness",            desc: "Maintain audit-ready evidence, controls, and documentation year-round." },
              { icon: "◻",  title: "Role-Based Access",          desc: "7 governance roles with granular permissions across every module." },
              { icon: "✦",  title: "Governance Intelligence",    desc: "AI-powered insights and Trust Score™ built into every workflow." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                padding: "24px 20px", borderRadius: "14px",
                background: "#FFFFFF", border: "1px solid #E4E8EF",
              }}>
                <div style={{ fontSize: "22px", marginBottom: "12px" }}>{icon}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{title}</div>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. COMPARISON ───────────────────────────── */}
      <section className="section" id="why-audt">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow">A Different Approach</span>
            <h2>A Different Approach To Governance.</h2>
            <p>Most platforms solve one governance problem. AUDT governs the complete vendor lifecycle while continuously measuring trust.</p>
          </div>
          <div className="reveal" style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "440px", maxWidth: "640px", margin: "0 auto", borderRadius: "14px", border: "1px solid #E4E8EF", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#F8F9FB", borderBottom: "1px solid #E4E8EF" }}>
                <div style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--text-dim)", textAlign: "center" as const }}>Traditional Platforms</div>
                <div style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--blue)", textAlign: "center" as const }}>AUDT</div>
              </div>
              {[
                ["Compliance First",    "Vendor First"],
                ["Audit Driven",        "Lifecycle Driven"],
                ["Point Solutions",     "Unified Platform"],
                ["Static Reviews",      "Continuous Monitoring"],
                ["Annual Audits",       "Continuous Trust"],
                ["Multiple Systems",    "Single System Of Record"],
              ].map(([left, right], ri, arr) => (
                <div key={left} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  borderBottom: ri < arr.length - 1 ? "1px solid #EEF2F7" : "none",
                }}>
                  <div style={{ padding: "13px 24px", fontSize: "13px", color: "var(--text-dim)", textAlign: "center" as const, borderRight: "1px solid #EEF2F7", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ color: "#f87171", fontSize: "10px" }}>✕</span>{left}
                  </div>
                  <div style={{ padding: "13px 24px", fontSize: "13px", fontWeight: 600, color: "#007A94", textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ color: "#0BA87A", fontSize: "10px" }}>✓</span>{right}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. CTA ─────────────────────────────────── */}
      <section className="cta-final">
        <div className="container cta-final__inner reveal">
          <div className="cta-final__badge">AI-Native Trust, Risk &amp; Compliance Platform</div>
          <h2>Governance Built on Proof.<br />Trust Every Decision.</h2>
          <p>See how AUDT helps modern organizations manage vendor governance, risk, compliance, audits, and trust from a single platform.</p>
          <div className="cta-final__btns">
            <a href="mailto:hello@audt.tech?subject=AUDT%20Demo%20Request" className="btn btn--primary btn--lg">Book Demo</a>
            <Link href="/signup" className="btn btn--ghost btn--lg">Start Free Trial →</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
