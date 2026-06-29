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
            <Link href="/docs/getting-started">Getting Started</Link>
            <Link href="/docs">Documentation</Link>
            <a href="/docs#api">API Reference</a>
            <Link href="/trust">Trust Center</Link>
            <Link href="/trust/ai">Responsible AI</Link>
            <Link href="/trust/contact">Security</Link>
            <a href="/#pricing">Pricing</a>
          </div>
          <div className="footer__col">
            <div className="footer__col-head">Legal</div>
            <Link href="/trust/terms">Terms of Service</Link>
            <Link href="/trust/privacy">Privacy Policy</Link>
            <Link href="/trust/dpa">Data Processing Agreement</Link>
            <Link href="/trust/contact">Responsible Disclosure</Link>
            <Link href="/trust/support">Support &amp; SLA</Link>
          </div>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© 2026 AUDT. All rights reserved.</span>
        <span className="flex items-center gap-3 flex-wrap">
          <Link href="/trust/terms" style={{ color: "inherit", opacity: 0.7 }}>Terms</Link>
          <span style={{ opacity: 0.3 }}>·</span>
          <Link href="/trust/privacy" style={{ color: "inherit", opacity: 0.7 }}>Privacy</Link>
          <span style={{ opacity: 0.3 }}>·</span>
          <Link href="/trust/dpa" style={{ color: "inherit", opacity: 0.7 }}>DPA</Link>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>audt.tech · Governance Built on Proof.</span>
        </span>
      </div>
    </footer>
  );
}
