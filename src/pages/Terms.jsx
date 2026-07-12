import { useEffect } from "react";
import { LegalShell } from "./Privacy";

export default function Terms() {
  useEffect(() => { document.title = "Terms of Service | BrandMD"; }, []);
  return (
    <LegalShell title="Terms of Service" updated="July 12, 2026">
      <p>
        By using brandmd.space ("BrandMD," the "Service") you agree to these terms. If you're
        using the Service for a company, you're agreeing on its behalf.
      </p>

      <h2>The service</h2>
      <p>
        BrandMD analyzes, builds, and monitors brand systems: website scans, AI-assisted brand
        boards, Gravity Scores, brand checks, drift reports, generated content, and a public
        library of brand profiles. Features gated by credits may change as the product evolves.
      </p>

      <h2>Your content</h2>
      <p>
        You own what you put in and what the Service generates for your board. You grant us the
        license needed to store, process, and display it to operate the Service. Publishing a
        Brand Certificate makes that profile page public until you ask us to remove it. You're
        responsible for having the rights to anything you submit.
      </p>

      <h2>AI output</h2>
      <p>
        Scores, syntheses, rewrites, and rationales are automated analysis — a starting position,
        not professional advice, and not a factual claim about any company. Review AI output
        before you rely on it or publish it.
      </p>

      <h2>The public library</h2>
      <p>
        Library profiles describe well-known brands for reference and education, built from public
        information and automated analysis. Trademarks and logos belong to their owners; their
        presence is identification, not affiliation or endorsement. Voice-styled score
        explanations are clearly labeled as written by BrandMD, not by the company. Brand owners
        can claim, correct, or remove a profile by contacting us.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>No scraping, bulk-harvesting, or reselling of the Service or library.</li>
        <li>No abuse of free features (rate limits are enforced server-side).</li>
        <li>No submitting content you lack rights to, or content that's unlawful.</li>
      </ul>

      <h2>Credits & payments</h2>
      <p>
        Credits are a usage meter, not stored value; they have no cash value and may be granted,
        adjusted, or expired as the product evolves. Paid packs, when available, are covered by
        the purchase terms shown at checkout.
      </p>

      <h2>Disclaimers</h2>
      <p>
        The Service is provided "as is." To the fullest extent permitted by law we disclaim
        implied warranties and limit our aggregate liability to the greater of $100 or what you
        paid us in the prior 12 months.
      </p>

      <h2>Changes & contact</h2>
      <p>
        We may update these terms; continued use is acceptance. Questions:{" "}
        <a href="mailto:ryan@ryantwedt.com">ryan@ryantwedt.com</a>.
      </p>
    </LegalShell>
  );
}
