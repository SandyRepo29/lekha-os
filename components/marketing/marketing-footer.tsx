export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="/" className="logo">
            <span className="logo__mark" aria-hidden="true"><span className="logo__icon">A</span></span>
            <span className="logo__text">AUDT</span>
          </a>
          <p className="footer__tag">Governance Built on Proof.</p>
          <p className="footer__sub">The Vendor Governance Platform for modern organizations.</p>
        </div>
        <div className="footer__cols">
          <div className="footer__col">
            <div className="footer__col-head">Platform</div>
            <a href="/platform">Platform Overview</a>
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
            <a href="/docs">Documentation</a>
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
        <span>© <span id="year" /> AUDT. All rights reserved.</span>
        <span>audt.tech · Vendor Governance Platform</span>
      </div>
    </footer>
  );
}
