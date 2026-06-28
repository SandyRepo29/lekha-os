import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link href="/" className="logo">
            <span className="logo__mark" aria-hidden="true"><span className="logo__icon">A</span></span>
            <span className="logo__text">AUDT</span>
          </Link>
          <p className="footer__tag">Governance Built on Proof.</p>
          <p className="footer__sub">The AI-Native Trust, Risk &amp; Compliance Platform for modern organizations.</p>
        </div>
        <div className="footer__cols">
          <div className="footer__col">
            <div className="footer__col-head">Platform</div>
            <Link href="/platform">Platform Overview</Link>
            <a href="/platform#vendor-governance">Vendor Governance</a>
            <a href="/platform#trust-operations">Trust Operations</a>
            <a href="/platform#risk-compliance">Risk &amp; Compliance</a>
            <a href="/platform#trust-intelligence">Trust Intelligence</a>
          </div>
          <div className="footer__col">
            <div className="footer__col-head">Solutions</div>
            <a href="/#solutions">Security Teams</a>
            <a href="/#solutions">Compliance Teams</a>
            <a href="/#solutions">Procurement Teams</a>
            <a href="/#solutions">Risk Teams</a>
          </div>
          <div className="footer__col">
            <div className="footer__col-head">Resources</div>
            <Link href="/docs">Documentation</Link>
            <a href="/#pricing">Pricing</a>
            <a href="/#vision">Vision</a>
            <a href="mailto:hello@audt.tech">Contact</a>
          </div>
          <div className="footer__col">
            <div className="footer__col-head">Differentiators</div>
            <a href="/platform#trust-score">Trust Score™</a>
            <a href="/#copilot">Governance Copilot™</a>
            <a href="/#agents">AI Agents</a>
            <a href="/#lifecycle">Vendor Lifecycle</a>
          </div>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© 2026 AUDT. All rights reserved.</span>
        <span>audt.tech · Governance Built on Proof.</span>
      </div>
    </footer>
  );
}
