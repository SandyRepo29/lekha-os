"use client";

import { useEffect } from "react";

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

export default function LandingPage() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Year */
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    /* Nav scrolled state */
    const nav = document.getElementById("nav");
    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle("scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* Mobile menu */
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

    /* Counters */
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
              if (!c.dataset.done) {
                c.dataset.done = "1";
                animateCounter(c);
              }
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

    /* Parallax tilt */
    const mock = document.querySelector<HTMLElement>(".mock");
    const visual = document.querySelector<HTMLElement>(".hero__visual");
    const onMove = (e: MouseEvent) => {
      if (!mock || !visual) return;
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      mock.style.transform = `rotateY(${-9 + x * 6}deg) rotateX(${4 - y * 6}deg)`;
    };
    const onLeave = () => {
      if (mock) mock.style.transform = "";
    };
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
            <span className="logo__text">
              LEKHA<span className="logo__os">OS</span>
            </span>
          </a>

          <nav className="nav__menu" aria-label="Primary">
            <a href="#platform">Platform</a>
            <a href="#solutions">Solutions</a>
            <a href="#vision">Vision</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="nav__actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <a href="/login" className="nav__signin" style={{ color: "var(--text-dim)", fontSize: "15px" }}>
              Sign in
            </a>
            <a href="/signup" className="btn btn--primary btn--sm">
              Request Demo
            </a>
          </div>

          <button className="nav__toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
            <span /><span /><span />
          </button>
        </div>
        <div className="nav__mobile" id="navMobile">
          <a href="#platform">Platform</a>
          <a href="#solutions">Solutions</a>
          <a href="#vision">Vision</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="/login">Sign in</a>
          <a href="/signup" className="btn btn--primary">Request Demo</a>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__copy reveal">
              <div className="badge">
                <span className="badge__pulse" />
                Building India&apos;s Governance Operating System
              </div>
              <h1 className="hero__title">
                The <span className="grad-text">Trust, Governance &amp; Compliance</span> Operating
                System for Indian Businesses
              </h1>
              <p className="hero__sub">
                Manage vendors, compliance, audits, risks and governance from a single AI-powered
                platform built for India.
              </p>
              <div className="hero__cta">
                <a href="/signup" className="btn btn--primary btn--lg">
                  Request Demo
                </a>
                <a href="#vision" className="btn btn--ghost btn--lg">
                  View Product Vision <span className="arrow">→</span>
                </a>
              </div>
              <div className="hero__trust">
                <span>Trust</span>
                <span className="dot">•</span>
                <span>Governance</span>
                <span className="dot">•</span>
                <span>Compliance</span>
              </div>
            </div>

            <div className="hero__visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock__chrome">
                  <span className="mock__dot" />
                  <span className="mock__dot" />
                  <span className="mock__dot" />
                  <div className="mock__url">app.lekhaos.in</div>
                </div>
                <div className="mock__body">
                  <aside className="mock__side">
                    <div className="mock__brand">
                      <span className="logo__dot" /> Lekha
                    </div>
                    <div className="mock__nav active">▦ Dashboard</div>
                    <div className="mock__nav">▤ Vendors</div>
                    <div className="mock__nav">◷ Compliance</div>
                    <div className="mock__nav">◎ Audits</div>
                    <div className="mock__nav">⚠ Risks</div>
                    <div className="mock__nav copilot">✦ AI Copilot</div>
                  </aside>
                  <div className="mock__main">
                    <div className="mock__row">
                      <div className="mcard mcard--score">
                        <div className="mcard__label">Compliance Score</div>
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
                        <div className="mcard__label">Audit Readiness</div>
                        <div className="mcard__big">
                          <span className="counter" data-target="95">0</span>%
                        </div>
                        <div className="progress"><span style={{ "--w": "95%" } as CSSVars} /></div>
                      </div>
                      <div className="mcard mcard--ai">
                        <div className="ai-chip">✦ Lekha AI</div>
                        <p className="ai-line">3 vendor certificates expire in 14 days.</p>
                        <p className="ai-line muted">Auto-flagged 2 missing ISO 27001 docs.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float-chip float-chip--1">✓ SOC 2 evidence ready</div>
              <div className="float-chip float-chip--2">✦ AI extracted 48 fields</div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="proof">
          <div className="container">
            <p className="proof__head reveal">Built for the Next Generation of Indian Enterprises</p>
            <div className="proof__logos reveal">
              <span>SaaS</span><span>Fintech</span><span>Healthcare</span><span>Manufacturing</span><span>IT Services</span>
            </div>
            <div className="proof__metrics">
              <div className="metric reveal">
                <div className="metric__num"><span className="counter" data-target="1000">0</span><i>+</i></div>
                <div className="metric__label">Vendors Tracked</div>
              </div>
              <div className="metric reveal" data-delay="80">
                <div className="metric__num"><span className="counter" data-target="5000">0</span><i>+</i></div>
                <div className="metric__label">Documents Managed</div>
              </div>
              <div className="metric reveal" data-delay="160">
                <div className="metric__num"><span className="counter" data-target="95">0</span><i>%</i></div>
                <div className="metric__label">Audit Readiness</div>
              </div>
            </div>
            <p className="proof__note">Illustrative demo metrics</p>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="section" id="problem">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Problem</span>
              <h2>Compliance is Broken</h2>
              <p>Most organizations still manage critical compliance processes using spreadsheets, emails and disconnected tools.</p>
            </div>
            <div className="pain-grid">
              <div className="pain reveal"><span className="pain__icon">🗂️</span>Vendor Documents Scattered</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">🔍</span>Audit Evidence Difficult to Find</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">🌫️</span>No Visibility Into Compliance Risk</div>
              <div className="pain reveal" data-delay="60"><span className="pain__icon">✍️</span>Manual Compliance Tracking</div>
              <div className="pain reveal" data-delay="120"><span className="pain__icon">📈</span>Regulatory Requirements Increasing</div>
              <div className="pain reveal" data-delay="180"><span className="pain__icon">🔗</span>Third-Party Risk Growing</div>
            </div>
          </div>
        </section>

        {/* VISION */}
        <section className="section section--alt" id="vision">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">The Vision</span>
              <h2>One Platform. Complete Governance.</h2>
              <p>A single operating system connecting every layer of trust and governance.</p>
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
              <p>Six interconnected modules. One operating system for governance.</p>
            </div>
            <div className="modules">
              <article className="module module--featured reveal">
                <div className="module__top">
                  <span className="module__icon">▤</span>
                  <span className="status status--live">Available</span>
                </div>
                <h3>Vendor Governance</h3>
                <p>Manage vendor onboarding, documents, certifications and compliance.</p>
                <ul className="module__feats">
                  <li>Vendor Registry</li><li>Document Tracking</li><li>Expiry Monitoring</li><li>Vendor Risk</li><li>AI Reviews</li>
                </ul>
              </article>
              <article className="module reveal" data-delay="60">
                <div className="module__top"><span className="module__icon">◷</span><span className="status status--soon">Coming Soon</span></div>
                <h3>Compliance Management</h3>
                <p>Track compliance frameworks and readiness.</p>
                <ul className="module__feats"><li>Controls</li><li>Policies</li><li>Evidence</li><li>Compliance Scores</li></ul>
              </article>
              <article className="module reveal" data-delay="120">
                <div className="module__top"><span className="module__icon">◎</span><span className="status status--soon">Coming Soon</span></div>
                <h3>Audit Workspace</h3>
                <p>Centralize audit preparation and evidence collection.</p>
                <ul className="module__feats"><li>Evidence Repository</li><li>Audit Requests</li><li>Findings Management</li></ul>
              </article>
              <article className="module reveal">
                <div className="module__top"><span className="module__icon">🛡</span><span className="status status--soon">Coming Soon</span></div>
                <h3>DPDP Compliance</h3>
                <p>Manage privacy obligations under India&apos;s Digital Personal Data Protection Act.</p>
                <ul className="module__feats"><li>Data Inventory</li><li>Consent Tracking</li><li>Retention Policies</li></ul>
              </article>
              <article className="module reveal" data-delay="60">
                <div className="module__top"><span className="module__icon">⚠</span><span className="status status--soon">Coming Soon</span></div>
                <h3>Risk Management</h3>
                <p>Identify, assess and mitigate organizational risk.</p>
                <ul className="module__feats"><li>Risk Register</li><li>Risk Assessments</li><li>Remediation Tracking</li></ul>
              </article>
              <article className="module reveal" data-delay="120">
                <div className="module__top"><span className="module__icon">⚖</span><span className="status status--future">Future</span></div>
                <h3>Board Governance</h3>
                <p>Governance workflows for modern enterprises.</p>
                <ul className="module__feats"><li>Board Meetings</li><li>Resolutions</li><li>Governance Calendar</li></ul>
              </article>
            </div>
          </div>
        </section>

        {/* AI */}
        <section className="section section--alt" id="solutions">
          <div className="container ai-sec">
            <div className="ai-sec__copy reveal">
              <span className="eyebrow">Lekha AI</span>
              <h2>AI-Native From Day One</h2>
              <p>Lekha AI understands compliance documents, identifies risks and helps teams stay audit-ready.</p>
              <a href="/signup" className="btn btn--primary">Request Demo</a>
            </div>
            <div className="ai-caps reveal" data-delay="100">
              <div className="ai-cap">Document Understanding</div>
              <div className="ai-cap">Risk Detection</div>
              <div className="ai-cap">Compliance Recommendations</div>
              <div className="ai-cap">Policy Generation</div>
              <div className="ai-cap">Vendor Reviews</div>
              <div className="ai-cap">Audit Preparation</div>
              <div className="ai-cap">Regulatory Q&amp;A</div>
            </div>
          </div>
        </section>

        {/* PRODUCT DEMO */}
        <section className="section" id="demo">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Product</span>
              <h2>See Vendor Governance In Action</h2>
              <p>The first module — live today and shipping to design partners.</p>
            </div>
            <div className="screens">
              <div className="screen reveal"><span className="screen__tag">Dashboard</span><div className="screen__art art-dashboard" /></div>
              <div className="screen reveal" data-delay="60"><span className="screen__tag">Vendor Profile</span><div className="screen__art art-profile" /></div>
              <div className="screen reveal" data-delay="120"><span className="screen__tag">Document Upload</span><div className="screen__art art-upload" /></div>
              <div className="screen reveal"><span className="screen__tag">AI Extraction</span><div className="screen__art art-extract" /></div>
              <div className="screen reveal" data-delay="60"><span className="screen__tag">Compliance Score</span><div className="screen__art art-cscore" /></div>
              <div className="screen reveal" data-delay="120"><span className="screen__tag">AI Copilot</span><div className="screen__art art-copilot" /></div>
            </div>
          </div>
        </section>

        {/* WHY INDIA */}
        <section className="section section--alt" id="why-india">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Why India</span>
              <h2>Built Specifically For India</h2>
              <p>A governance OS designed for India&apos;s regulatory reality and digital ambition.</p>
            </div>
            <div className="why-grid">
              <div className="why reveal"><h3>DPDP Compliance</h3><p>Native to India&apos;s Digital Personal Data Protection Act.</p></div>
              <div className="why reveal" data-delay="60"><h3>Vendor Governance</h3><p>Built for the complexity of Indian supply chains.</p></div>
              <div className="why reveal" data-delay="120"><h3>MSME Ecosystem</h3><p>Designed to scale across India&apos;s MSME backbone.</p></div>
              <div className="why reveal"><h3>Regulatory Complexity</h3><p>One platform for a fast-evolving compliance landscape.</p></div>
              <div className="why reveal" data-delay="60"><h3>Growing Digital Economy</h3><p>Trust infrastructure for India&apos;s digital decade.</p></div>
              <div className="why reveal" data-delay="120"><h3>AI-First Compliance</h3><p>Automation built in, not bolted on.</p></div>
            </div>
          </div>
        </section>

        {/* MARKET */}
        <section className="section" id="market">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Market</span>
              <h2>A Massive Untapped Opportunity</h2>
            </div>
            <div className="market">
              <div className="stat reveal">
                <div className="stat__num"><span className="counter" data-target="70">0</span><i>M+</i></div>
                <div className="stat__label">Indian Businesses</div>
              </div>
              <div className="stat reveal" data-delay="60">
                <div className="stat__num"><span className="counter" data-target="63">0</span><i>M+</i></div>
                <div className="stat__label">MSMEs</div>
              </div>
              <div className="stat reveal" data-delay="120">
                <div className="stat__num">Millions</div>
                <div className="stat__label">Enterprise Vendors</div>
              </div>
              <div className="stat reveal" data-delay="180">
                <div className="stat__num stat__num--sm">Multi-Billion $</div>
                <div className="stat__label">Compliance Market Opportunity</div>
              </div>
            </div>
            <p className="market__note reveal">Third-party risk growing every year.</p>
          </div>
        </section>

        {/* FOUNDER */}
        <section className="section section--alt" id="about">
          <div className="container founder">
            <div className="founder__copy reveal">
              <span className="eyebrow">The Team</span>
              <h2>Built By Enterprise Software Leaders</h2>
              <p>Lekha OS is founded by experienced enterprise software builders with deep expertise across the stack.</p>
              <div className="founder__tags">
                <span>SaaS Platforms</span><span>Security</span><span>Compliance</span><span>AI Systems</span><span>Enterprise Operations</span>
              </div>
              <blockquote className="founder__mission">
                “To become the operating system for trust and governance across Indian businesses.”
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
              <h2>The Road Ahead</h2>
            </div>
            <div className="timeline">
              <div className="tl reveal"><div className="tl__year">2026</div><div className="tl__dot" /><div className="tl__label">Vendor Governance</div></div>
              <div className="tl reveal" data-delay="60"><div className="tl__year">2027</div><div className="tl__dot" /><div className="tl__label">Compliance Management</div></div>
              <div className="tl reveal" data-delay="120"><div className="tl__year">2028</div><div className="tl__dot" /><div className="tl__label">DPDP &amp; Audit Workspace</div></div>
              <div className="tl reveal" data-delay="180"><div className="tl__year">2029</div><div className="tl__dot" /><div className="tl__label">Risk Management</div></div>
              <div className="tl reveal tl--final" data-delay="240"><div className="tl__year">2030</div><div className="tl__dot" /><div className="tl__label">India&apos;s Governance Operating System</div></div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cta-final" id="contact">
          <div className="container cta-final__inner reveal">
            <h2>The Future Of Compliance Starts Here</h2>
            <p>Join us as we build the operating system for trust, governance and compliance in India.</p>
            <div className="cta-final__btns">
              <a href="/signup" className="btn btn--primary btn--lg">Request Demo</a>
              <a href="mailto:hello@lekhaos.in?subject=Become%20a%20Design%20Partner%20—%20Lekha%20OS" className="btn btn--ghost btn--lg">Become a Design Partner</a>
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
            <a href="#vision">Vision</a>
            <a href="#contact">Privacy</a>
            <a href="#contact">Contact</a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="mailto:hello@lekhaos.in">Email</a>
          </nav>
        </div>
        <div className="container footer__bottom">
          <span>© <span id="year" /> Lekha OS</span>
          <span>Built for India 🇮🇳</span>
        </div>
      </footer>
    </>
  );
}
