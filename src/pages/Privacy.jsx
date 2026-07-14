import { useEffect } from "react";
import SiteNav from "../components/SiteNav";

const TITANIUM = "#8E8E93";
const SANS = "'Inter', -apple-system, sans-serif";

export function LegalShell({ title, updated, children }) {
  return (
    <div style={{ background: "#000", color: "#F5F5F7", minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 28px 100px" }}>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-1px", marginBottom: 8 }}>{title}</h1>
        <div style={{ fontSize: 13, color: TITANIUM, marginBottom: 40 }}>Last updated {updated}</div>
        <div className="bmd-legal" style={{ fontSize: 15, lineHeight: 1.75, color: "#C7C7CC" }}>
          {children}
          <style>{`
            .bmd-legal h2 { font-size: 18px; font-weight: 700; color: #F5F5F7; margin: 34px 0 10px; letter-spacing: -0.3px; }
            .bmd-legal p { margin: 0 0 14px; }
            .bmd-legal ul { margin: 0 0 14px; padding-left: 22px; }
            .bmd-legal li { margin-bottom: 8px; }
            .bmd-legal a { color: #0071E3; text-decoration: none; }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export default function Privacy() {
  useEffect(() => { document.title = "Privacy Policy | BrandMD"; }, []);
  return (
    <LegalShell title="Privacy Policy" updated="July 12, 2026">
      <p>
        BrandMD ("we," "us") operates brandmd.space, a brand intelligence tool. This policy
        explains what we collect, why, and the choices you have. The short version: we collect
        what the product needs to work, we don't sell it, and you can ask us to delete it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Email address</strong> — when you save a board, register for credits, or use gated features. Used to identify your boards and credits, and to send product emails you can unsubscribe from at any time.</li>
        <li><strong>Brand board content</strong> — everything you enter or generate in the Builder. Boards are private by default and reachable only through their unguessable link; publishing a Brand Certificate makes that profile page public by your explicit action.</li>
        <li><strong>Content you submit for analysis</strong> — URLs you scan, drafts you run through Brand Check, and files you upload are processed to produce your results.</li>
        <li><strong>Usage analytics</strong> — page views and product events (e.g. "board saved," "check run"), plus anonymized client errors, stored in our own database to improve the product.</li>
        <li><strong>Visitor tracking</strong> — we use LeadConnector (HighLevel) tracking to understand visits and attribute form fills.</li>
      </ul>

      <h2>How AI processing works</h2>
      <p>
        Scans, syntheses, checks, and generated copy are produced using Anthropic's Claude models.
        The content you submit for those features is sent to Anthropic for processing under their
        commercial terms; we don't use your content to train models.
      </p>

      <h2>Service providers</h2>
      <p>
        We run on Supabase (database, storage, functions), Cloudflare (hosting, CDN), Anthropic
        (AI processing), and LeadConnector/HighLevel (email and visitor analytics). Brand logos in
        our public library are displayed for identification via logo services or our own cache.
      </p>

      <h2>Rate limiting</h2>
      <p>We record IP-derived counters solely to rate-limit expensive features; they expire on a rolling basis.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Unsubscribe from emails via the link in any message.</li>
        <li>Request access to or deletion of your data — including boards and published certificates — by emailing us.</li>
        <li>Block our analytics with standard browser tools; the product still works.</li>
      </ul>

      <h2>Retention & security</h2>
      <p>
        Boards persist until you ask us to delete them. Credentials and API keys are never stored
        in your browser beyond a per-board edit token and a credit token. Transport is HTTPS
        everywhere; write access to boards requires the edit token minted at save time.
      </p>

      <h2>Contact</h2>
      <p>Privacy requests: <a href="mailto:ryan@ryantwedt.com">ryan@ryantwedt.com</a>.</p>
    </LegalShell>
  );
}
