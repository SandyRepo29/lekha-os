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

      {/* NAV */}
      <header className="nav" id="nav">
        <div className="container nav__inner">
          <a href="#top" className="logo" aria-label="Lekha OS home">
            <span className="logo__mark" aria-hidden="true">
              <span className="logo__dot" />
            </span>
            <span className="logo__text">LEKHA<span className="logo__os">OS</span></span>
          </a>

          <nav className="nav__menu" aria-label="Primary">
            <a href="#platform">Platform</a>
            <a href="#solutions">Lekha AI</a>
            <a href="#why-india">Why India</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="nav__actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <a href="/login" className="nav__signin" style={{ color: "var(--text-dim)", fontSize: "15px" }}>
              Sign in
            </a>
            <a href="/signup" className="btn btn--primary btn--sm">Get Started Free</a>
          </div>

          <button className="nav__toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
            <span /><span /><span />
          </button>
        </div>
        <div className="nav__mobile" id="navMobile">
          <a href="#platform">Platform</a>
          <a href="#solutions">Lekha AI</a>
          <a href="#why-india">Why India</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="/login">Sign in</a>
          <a href="/signup" className="btn btn--primary">Get Started Free</a>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__copy reveal">
              <div className="badge">
                <span className="badge__pulse" />
                3 Modules Live &nbsp;·&nbsp; Production Ready
              </div>
              <h1 className="hero__title">
                The <span className="grad-text">Trust, Governance &amp; Compliance</span> Operating
                System for Indian Businesses
              </h1>
              <p className="hero__sub">
                Vendor governance, compliance management, security and team administration —
                all in one AI-native platform built for India. Live today. Start in minutes.
              </p>
              <div className="hero__cta">
                <a href="/signup" className="btn btn--primary btn--lg">Get Started Free</a>
                <a href="#platform" className="btn btn--ghost btn--lg">
                  Explore Platform <span className="arrow">→</span>
                </a>
              </div>
              <div className="hero__trust">
                <span>Vendor Governance</span>
                <span className="dot">•</span>
                <span>Compliance</span>
                <span className="dot">•</span>
                <span>AI-Native</span>
                <span className="dot">•</span>
                <span>India Data Residency</span>
              </div>
            </div>

            <div className="hero__visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock__chrome">
                  <span className="mock__dot" /><span className="mock__dot" /><span className="mock__dot" />
                  <div className="mock__url">app.lekhaos.in</div>
                </div>
                <div className="mock__body">
                  <aside className="mock__side">
                    <div className="mock__brand"><span className="logo__dot" /> Lekha</div>
                    <div className="mock__nav active">▦ Dashboard</div>
                    <div className="mock__nav">▤ Vendors</div>
                    <div className="mock__nav">◷ Compliance</div>
                    <div className="mock__nav">⚙ Settings</div>
                    <div className="mock__nav">◎ Audits</div>
                    <div className="mock__nav copilot">✦ AI Officer</div>
                  </aside>
                  <div className="mock__main">
                    <div className="mock__row">
                      <div className="mcard mcard--score">
                        <div className="mcard__label">Compliance Score</div>
                        <div className="ring" data-ring="87">
                          <svg viewBox="0 0 120 120">
                            <circle className="ring__bg" cx="60" cy="60" r="52" />
                            <circle className="ring__fg" cx="60" cy="60" r="52" />
                          </svg>
                          <div className="ring__val">
                            <span className="counter" data-target="87">0</span>
                            <i>%</i>
                          </div>
                        </div>
                      </div>
                      <div className="mcard mcard--risk">
                        <div className="mcard__label">Vendor Risk</div>
                        <div className="bars">
                          <div className="bar"><span style={{ "--h": "40%" } as CSSVars} /><em>Low</em></div>
                          <div className="bar"><span style={{ "--h": "70%" } as CSSVars} /><em>Med</em></div>
                          <div className="bar"><span style={{ "--h": "30%" } as CSSVars} /><em>High</em></div>
                          <div className="bar"><span style={{ "--h": "88%" } as CSSVars} /><em>Ok</em></div>
                        </div>
                      </div>
                    </div>
                    <div className="mock__row">
                      <div className="mcard mcard--audit">
                        <div className="mcard__label">ISO 27001 Readiness</div>
                        <div className="mcard__big">
                          <span className="counter" data-target="74">0</span>%
                        </div>
                        <div className="progress"><span style={{ "--w": "74%" } as CSSVars} /></div>
                      </div>
                      <div className="mcard mcard--ai">
                        <div className="ai-chip">✦ Lekha AI</div>
                        <p className="ai-line">3 vendor certificates expire in 14 days.</p>
                        <p className="ai-line muted">12 controls need evidence mapping.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float-chip float-chip--1">✓ SOC 2 evidence mapped</div>
              <div className="float-chip float-chip--2">✦ AI extracted 48 fields</div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="proof">
          <div className="container">
            <p className="proof__head reveal">
              Production-grade GRC for India&apos;s leading enterprises
            </p>
            <div className="proof__logos reveal">
              <span>SaaS</span><span>Fintech</span><span>Healthcare</span>
              <span>Manufacturing</span><span>IT Services</span>
            </div>
            <div className="proof__metrics">
              <div className="metric reveal">
                <div className="metric__num"><span className="counter" data-target="174">0</span><i>+</i></div>
                <div className="metric__label">Pre-built Compliance Controls</div>
              </div>
              <div className="metric reveal" data-delay="80">
                <div className="metric__num"><span className="counter" data-target="5">0</span></div>
                <div className="metric__label">Frameworks — ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA</div>
              </div>
              <div className="metric reveal" data-delay="160">
                <div className="metric__num"><span className="counter" data-target="3">0</span></div>
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
              <h2>Compliance Is Still Broken</h2>
              <p>Indian enterprises manage critical GRC processes using spreadsheets, email threads and disconnected tools — creating risk, burning time and failing audits.</p>
            </div>
            <div className="pain-grid">
              <div className="pain reveal"><span className="pain__icon">🗂️</span>Vendor documents scattered across drives</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">🔍</span>Audit evidence impossible to find fast</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">🌫️</span>No real-time visibility into compliance risk</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">✍️</span>Manual tracking in spreadsheets fails at scale</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">📈</span>Regulatory requirements multiplying every year</div>
              <div className="pain reveal" data-delay="180"><span className="pain__icon">🔗</span>Third-party risk growing with every vendor added</div>
            </div>
          </div>
        </section>

        {/* VISION */}
        <section className="section section--alt" id="vision">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Vision</span>
              <h2>One Operating System. Complete Governance.</h2>
              <p>A single platform connecting every layer of trust, compliance and governance — not a point solution, an OS.</p>
            </div>
            <div className="map reveal">
              <div className="map__core">LEKHA OS</div>
              <div className="map__rail">
                <div className="map__node">Vendor Governance</div>
                <div className="map__node">Compliance Management</div>
                <div className="map__node">Audit Workspace</div>
                <div className="map__node">DPDP Privacy</div>
                <div className="map__node">Risk Management</div>
                <div className="map__node">Board Governance</div>
                <div className="map__node map__node--trust">Trust Center</div>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM MODULES */}
        <section className="section" id="platform">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Platform</span>
              <h2>Everything Needed To Build Trust</h2>
              <p>Three modules live and in production today. More shipping through 2026–2027.</p>
            </div>
            <div className="modules">

              {/* M1 — Vendor Governance */}
              <article className="module module--featured reveal">
                <div className="module__top">
                  <span className="module__icon">▤</span>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Vendor Governance</h3>
                <p>Complete vendor lifecycle management — from onboarding to expiry monitoring and AI-powered risk assessment.</p>
                <ul className="module__feats">
                  <li>Vendor Registry &amp; Profiles</li>
                  <li>Document Management + AI Extraction</li>
                  <li>Expiry Alerts &amp; Notifications</li>
                  <li>Security Assessments</li>
                  <li>AI Vendor Briefs &amp; Risk Scores</li>
                  <li>Executive PDF Reports</li>
                  <li>Vendor Self-Service Portal</li>
                  <li>Natural Language Search</li>
                </ul>
              </article>

              {/* M2 — Compliance Management */}
              <article className="module module--featured reveal" data-delay="60">
                <div className="module__top">
                  <span className="module__icon">◷</span>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Compliance Management</h3>
                <p>Full compliance framework management with AI insights, gap analysis and automated evidence collection.</p>
                <ul className="module__feats">
                  <li>ISO 27001 · SOC 2 · DPDP · PCI DSS · HIPAA</li>
                  <li>174 Pre-built Standard Controls</li>
                  <li>Evidence Repository + Auto-import</li>
                  <li>AI Compliance Officer (Chat)</li>
                  <li>Gap Analysis &amp; Readiness Scores</li>
                  <li>Policy Management + Version History</li>
                  <li>Compliance PDF &amp; CSV Reports</li>
                </ul>
              </article>

              {/* M3 — Settings & Org Management */}
              <article className="module module--featured reveal" data-delay="120">
                <div className="module__top">
                  <span className="module__icon">⚙</span>
                  <span className="status status--live">Live</span>
                </div>
                <h3>Organisation Management</h3>
                <p>Enterprise-grade administration — team RBAC, API access, audit trails and integration management.</p>
                <ul className="module__feats">
                  <li>7-Role RBAC (Owner → Viewer)</li>
                  <li>Full Audit Log with CSV Export</li>
                  <li>REST API + API Key Management</li>
                  <li>10 Integration Connectors</li>
                  <li>Billing &amp; Usage Metering</li>
                  <li>Branding &amp; Report Customisation</li>
                </ul>
              </article>

              {/* M4 — Audit Workspace */}
              <article className="module reveal">
                <div className="module__top">
                  <span className="module__icon">◎</span>
                  <span className="status status--soon">Coming 2026</span>
                </div>
                <h3>Audit Workspace</h3>
                <p>Centralised audit preparation, evidence collection and findings management.</p>
                <ul className="module__feats">
                  <li>Evidence Repository</li><li>Audit Request Workflows</li><li>Findings Management</li>
                </ul>
              </article>

              {/* M5 — DPDP */}
              <article className="module reveal" data-delay="60">
                <div className="module__top">
                  <span className="module__icon">🛡</span>
                  <span className="status status--soon">Coming 2026</span>
                </div>
                <h3>DPDP Privacy</h3>
                <p>Native compliance for India&apos;s Digital Personal Data Protection Act 2023.</p>
                <ul className="module__feats">
                  <li>Data Inventory</li><li>Consent Tracking</li><li>Retention Policies</li>
                </ul>
              </article>

              {/* M6 — Risk */}
              <article className="module reveal" data-delay="120">
                <div className="module__top">
                  <span className="module__icon">⚠</span>
                  <span className="status status--future">2027</span>
                </div>
                <h3>Risk Management</h3>
                <p>Enterprise risk register, heat maps and remediation tracking.</p>
                <ul className="module__feats">
                  <li>Risk Register</li><li>Risk Heat Maps</li><li>Remediation Tracking</li>
                </ul>
              </article>

            </div>
          </div>
        </section>

        {/* AI */}
        <section className="section section--alt" id="solutions">
          <div className="container ai-sec">
            <div className="ai-sec__copy reveal">
              <span className="eyebrow">Lekha AI</span>
              <h2>AI That Actually Works For Compliance</h2>
              <p>
                Not a chatbot bolted on. Lekha AI is woven through every module —
                extracting document fields, explaining risk scores, writing compliance
                narratives, detecting gaps, and answering questions about your exact
                compliance posture in plain English.
              </p>
              <a href="/signup" className="btn btn--primary">Get Started Free</a>
            </div>
            <div className="ai-caps reveal" data-delay="100">
              <div className="ai-cap">Document Field Extraction (10 fields per doc)</div>
              <div className="ai-cap">Vendor Risk Explanation</div>
              <div className="ai-cap">Compliance Score Breakdown</div>
              <div className="ai-cap">Gap Narrative Generation</div>
              <div className="ai-cap">Framework Readiness Summary</div>
              <div className="ai-cap">AI Compliance Officer Chat</div>
              <div className="ai-cap">Natural Language Vendor Search</div>
              <div className="ai-cap">Executive Board Reports</div>
              <div className="ai-cap">AI Weekly Digest</div>
            </div>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="section" id="demo">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">What You Get</span>
              <h2>A Complete Platform From Day One</h2>
              <p>No months of setup. No professional services. Sign up, connect Supabase, run the seed scripts. Live in an afternoon.</p>
            </div>
            <div className="screens">
              <div className="screen reveal"><span className="screen__tag">Vendor Dashboard</span><div className="screen__art art-dashboard" /></div>
              <div className="screen reveal" data-delay="60"><span className="screen__tag">Compliance Frameworks</span><div className="screen__art art-profile" /></div>
              <div className="screen reveal" data-delay="120"><span className="screen__tag">AI Document Extraction</span><div className="screen__art art-extract" /></div>
              <div className="screen reveal"><span className="screen__tag">Gap Analysis</span><div className="screen__art art-cscore" /></div>
              <div className="screen reveal" data-delay="60"><span className="screen__tag">AI Officer Chat</span><div className="screen__art art-copilot" /></div>
              <div className="screen reveal" data-delay="120"><span className="screen__tag">Audit Logs &amp; API</span><div className="screen__art art-upload" /></div>
            </div>
          </div>
        </section>

        {/* WHY INDIA */}
        <section className="section section--alt" id="why-india">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Built For India</span>
              <h2>Designed For India&apos;s Regulatory Reality</h2>
              <p>Not a global tool localised for India. An OS built ground-up for how Indian enterprises operate and what Indian regulations demand.</p>
            </div>
            <div className="why-grid">
              <div className="why reveal">
                <h3>India Data Residency</h3>
                <p>All data hosted in Supabase Mumbai (ap-south-1) and Vercel Mumbai (bom1). Your data never leaves India.</p>
              </div>
              <div className="why reveal" data-delay="60">
                <h3>DPDP Native</h3>
                <p>Built with India&apos;s Digital Personal Data Protection Act 2023 as a first-class framework — not an afterthought.</p>
              </div>
              <div className="why reveal" data-delay="120">
                <h3>Indian Supply Chain Complexity</h3>
                <p>Designed for the layered vendor ecosystems of Indian IT, fintech, healthcare and manufacturing enterprises.</p>
              </div>
              <div className="why reveal">
                <h3>Multi-Regulatory</h3>
                <p>ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA — all built in. One platform for a fast-evolving compliance landscape.</p>
              </div>
              <div className="why reveal" data-delay="60">
                <h3>Enterprise RBAC</h3>
                <p>Seven roles from Owner to Viewer. Compliance Managers, Security Managers, Procurement Managers — mapped to how Indian teams are structured.</p>
              </div>
              <div className="why reveal" data-delay="120">
                <h3>AI in Indian Context</h3>
                <p>AI features trained and tuned for Indian vendor documents, certifications and regulatory terminology. Not generic English.</p>
              </div>
            </div>
          </div>
        </section>

        {/* MARKET */}
        <section className="section" id="market">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Market</span>
              <h2>A Massive Untapped Opportunity</h2>
            </div>
            <div className="market">
              <div className="stat reveal">
                <div className="stat__num"><span className="counter" data-target="70">0</span><i>M+</i></div>
                <div className="stat__label">Indian Businesses</div>
              </div>
              <div className="stat reveal" data-delay="60">
                <div className="stat__num"><span className="counter" data-target="63">0</span><i>M+</i></div>
                <div className="stat__label">MSMEs Needing GRC</div>
              </div>
              <div className="stat reveal" data-delay="120">
                <div className="stat__num">₹1,000Cr+</div>
                <div className="stat__label">GRC Software Market India</div>
              </div>
              <div className="stat reveal" data-delay="180">
                <div className="stat__num stat__num--sm">Zero</div>
                <div className="stat__label">India-native GRC Operating Systems</div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="section section--alt" id="about">
          <div className="container founder">
            <div className="founder__copy reveal">
              <span className="eyebrow">The Team</span>
              <h2>Built By Enterprise Software Leaders</h2>
              <p>Lekha OS is built by experienced enterprise software leaders with deep expertise across SaaS platforms, security, compliance and AI systems.</p>
              <div className="founder__tags">
                <span>SaaS Platforms</span>
                <span>Security</span>
                <span>Compliance</span>
                <span>AI Systems</span>
                <span>Enterprise Operations</span>
              </div>
              <blockquote className="founder__mission">
                &ldquo;To become the operating system for trust and governance across every Indian business.&rdquo;
              </blockquote>
            </div>
            <div className="founder__visual reveal" data-delay="100">
              <div className="orbit">
                <div className="orbit__core">LEKHA<span>OS</span></div>
                <span className="orbit__ring orbit__ring--1" />
                <span className="orbit__ring orbit__ring--2" />
                <span className="orbit__ring orbit__ring--3" />
              </div>
            </div>
          </div>
        </section>

        {/* ROADMAP */}
        <section className="section" id="roadmap">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Roadmap</span>
              <h2>What&apos;s Shipped. What&apos;s Next.</h2>
            </div>
            <div className="timeline">
              <div className="tl reveal">
                <div className="tl__year" style={{ color: "#4ade80" }}>✓ Live</div>
                <div className="tl__dot" style={{ background: "#4ade80" }} />
                <div className="tl__label">Vendor Governance — 25 features</div>
              </div>
              <div className="tl reveal" data-delay="60">
                <div className="tl__year" style={{ color: "#4ade80" }}>✓ Live</div>
                <div className="tl__dot" style={{ background: "#4ade80" }} />
                <div className="tl__label">Compliance Management — ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA</div>
              </div>
              <div className="tl reveal" data-delay="120">
                <div className="tl__year" style={{ color: "#4ade80" }}>✓ Live</div>
                <div className="tl__dot" style={{ background: "#4ade80" }} />
                <div className="tl__label">Organisation Management — API, Audit Logs, Integrations, Billing</div>
              </div>
              <div className="tl reveal" data-delay="180">
                <div className="tl__year">2026</div>
                <div className="tl__dot" />
                <div className="tl__label">DPDP Privacy Module + Audit Workspace</div>
              </div>
              <div className="tl reveal tl--final" data-delay="240">
                <div className="tl__year">2027</div>
                <div className="tl__dot" />
                <div className="tl__label">Risk Management + Board Governance + Trust Center</div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cta-final" id="contact">
          <div className="container cta-final__inner reveal">
            <h2>Start Building Your Compliance OS Today</h2>
            <p>
              Three modules. Fully production-ready. India data residency.
              Get started in minutes — no credit card required.
            </p>
            <div className="cta-final__btns">
              <a href="/signup" className="btn btn--primary btn--lg">Get Started Free</a>
              <a
                href="mailto:hello@lekhaos.in?subject=Lekha%20OS%20Demo%20Request"
                className="btn btn--ghost btn--lg"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__brand">
            <a href="#top" className="logo">
              <span className="logo__mark" aria-hidden="true"><span className="logo__dot" /></span>
              <span className="logo__text">LEKHA<span className="logo__os">OS</span></span>
            </a>
            <p className="footer__tag">Trust. Governance. Compliance.</p>
          </div>
          <nav className="footer__links" aria-label="Footer">
            <a href="#platform">Platform</a>
            <a href="#why-india">Why India</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#contact">Privacy</a>
            <a href="mailto:hello@lekhaos.in">hello@lekhaos.in</a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </nav>
        </div>
        <div className="container footer__bottom">
          <span>© <span id="year" /> Lekha OS. All rights reserved.</span>
          <span>Built for India 🇮🇳 · Data hosted in Mumbai</span>
        </div>
      </footer>
    </>
  );
}
