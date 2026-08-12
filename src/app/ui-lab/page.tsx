import { SourceChip } from "@/components/first-look-ui/source-chip";
import { Chip } from "@/components/first-look-ui/chip";
import { TierBadge } from "@/components/first-look-ui/tier-badge";
import { FlButton } from "@/components/first-look-ui/button";
import { Card, CardHead, CardBody } from "@/components/first-look-ui/card";
import { MicroTimeline } from "@/components/first-look-ui/micro-timeline";
import { labOpen, LabClosed } from "./lab-gate";

/**
 * The primitives gallery (plan: ui-lab Phase 3): every fence primitive in
 * isolation, plus the promotion decision checkpoint. This page never
 * promotes.
 *
 * PALETTE DECISION (founder, 2026-08-11): the Docside token set won; the
 * proposed set, the ?palette= switch, and the PaletteToggle are deleted.
 * Remaining checkpoint steps below reflect that.
 */

const TOKEN_NAMES = [
  "color-paper", "color-surface", "color-surface-2", "color-ink", "color-ink-2",
  "color-ink-soft", "color-line-soft", "color-line",
  "color-deep-ocean", "color-midnight-slate", "color-ocean-50", "color-ocean-200",
  "color-success", "color-success-deep", "color-success-soft", "color-success-line",
  "color-attention", "color-attention-soft", "color-attention-line",
];

const CHECKPOINT: ReadonlyArray<{ step: string; state: "done" | "open" }> = [
  { step: "Choose the palette — DONE 2026-08-11: Docside tokens.", state: "done" },
  { step: "Delete the losing palette and the toggle — DONE (grep data-palette|palette-toggle → empty).", state: "done" },
  { step: "Choose where components promote — DONE 2026-08-11: shell first (founder sign-off); app gated per docs/PROMOTION.md.", state: "done" },
  { step: "Delete or archive the lab-only data loading (fixtures.ts stress mode) — DONE 2026-08-12 (A5): fixtures.ts, the dashboard mock, and DOCSIDE_FIXTURES_DIR are gone.", state: "done" },
  { step: "Write the promotion/migration plan — DONE 2026-08-11: docs/PROMOTION.md.", state: "done" },
];

export default function UiLabIndex() {
  if (!labOpen()) return <LabClosed />;

  return (
    <main>
      <div className="wrap">
        <div className="preview-eyebrow">
          <span className="caps">First Look · UI lab</span>
        </div>
        <h1 className="display">Component vocabulary</h1>
        <p className="subline">
          The exploration&rsquo;s primitives under the chosen Docside token
          set. Dev-only; gated by FL_UI_LAB. The offer-dashboard mock and its
          fixture stress mode were decommissioned at Stage A5 — the real
          screen is Stage B work in the docside repo.
        </p>

        <section className="lab-section">
          <h2>Tokens</h2>
          <p className="lab-note">
            Promoted at Stage A2: tokens live in globals.css @theme; the
            fence and its duplication register are collapsed (mapping in the
            header of first-look-ui.css).
          </p>
          <div className="lab-swatches">
            {TOKEN_NAMES.map((name) => (
              <div key={name} className="lab-swatch">
                <div className="well" style={{ background: `var(--${name})` }} />
                <div className="meta">--{name}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="lab-section">
          <h2>SourceChip</h2>
          <p className="lab-note">
            The signature element: summary → extracted value → source language.
            1.5px --color-ocean-200 border (founder request 2026-08-11). Honestly
            inert in the lab (aria-disabled; the source view is app-side
            product work).
          </p>
          <div className="lab-row">
            <SourceChip refText="§3A − §3G" note="net = §3A price − §3G(1) credit − §3G(3) comp" />
            <SourceChip refText="§3L(2) → ¶8B" />
            <SourceChip refText="§3B" />
          </div>
        </section>

        <section className="lab-section">
          <h2>Chips</h2>
          <div className="lab-row">
            <Chip variant="good">No loan contingency</Chip>
            <Chip variant="warn">Appraisal at price</Chip>
            <Chip variant="flat">17-day loan</Chip>
          </div>
        </section>

        <section className="lab-section">
          <h2>Tier badges</h2>
          <div className="lab-row">
            <TierBadge variant="success" icon="up">Highest estimated net</TierBadge>
            <TierBadge variant="primary" icon="zap">All-cash</TierBadge>
            <TierBadge variant="neutral">FHA financing</TierBadge>
          </div>
        </section>

        <section className="lab-section">
          <h2>Buttons</h2>
          <div className="lab-row">
            <FlButton variant="primary">Share with seller</FlButton>
            <FlButton variant="outline">Copy link</FlButton>
            <FlButton variant="ghost">Export PDF</FlButton>
            <FlButton variant="primary" disabled title="Disabled sample">
              Disabled primary
            </FlButton>
          </div>
        </section>

        <section className="lab-section">
          <h2>Card</h2>
          <div style={{ maxWidth: 360 }}>
            <Card>
              <CardHead>
                <div className="offer-head-top">
                  <TierBadge variant="success" icon="up">Highest estimated net</TierBadge>
                  <span className="offer-no">OFFER 01</span>
                </div>
                <p className="offer-buyer">Chen</p>
                <div className="offer-price">$1,205,437.50</div>
                <div className="offer-price-label">
                  Estimated net to seller <SourceChip refText="§3A − §3G" />
                </div>
              </CardHead>
              <CardBody>
                <div className="term-row">
                  <div className="term-label">Contingencies</div>
                  <div className="chips">
                    <Chip variant="flat">17-day loan</Chip>
                    <SourceChip refText="§3L(1) → ¶8A" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="lab-section">
          <h2>Micro-timeline</h2>
          <div style={{ maxWidth: 360, display: "grid", gap: 18 }}>
            <MicroTimeline pct={100} endLabel="30-day close" />
            <MicroTimeline pct={47} endLabel="14-day close" />
            <MicroTimeline notStated />
          </div>
        </section>

        <section className="lab-section">
          <h2>Typography</h2>
          <h1 className="display" style={{ fontSize: 34 }}>Display 34 — 1248 Oakview Drive</h1>
          <h2 className="display" style={{ fontSize: 23, marginTop: 10 }}>Display 23 — Term-by-term comparison</h2>
          <h3 className="display" style={{ fontSize: 19, marginTop: 10 }}>Display 19 — Section head</h3>
          <p className="caps" style={{ marginTop: 14 }}>Caps eyebrow · your preview</p>
          <p className="mono" style={{ marginTop: 8 }}>mono tabular: $1,242,500 · $347,000 · 21 days</p>
        </section>

        <section className="lab-section">
          <h2>Promotion decision checkpoint</h2>
          <p className="lab-note">
            The lab does not quietly become the product: the remaining steps
            run before any production screen changes.
          </p>
          <ol className="lab-list">
            {CHECKPOINT.map(({ step, state }) => (
              <li key={step}>
                {state === "done" ? <b>✓ </b> : null}
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
