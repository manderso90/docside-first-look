import { Card, CardHead, CardBody } from "@/components/first-look-ui/card";
import { Chip } from "@/components/first-look-ui/chip";
import { SourceChip } from "@/components/first-look-ui/source-chip";
import { TierBadge } from "@/components/first-look-ui/tier-badge";
import { FlButton } from "@/components/first-look-ui/button";
import { MicroTimeline } from "@/components/first-look-ui/micro-timeline";
import { IconCircleCheck, IconCopy, IconShare, IconUp } from "@/components/first-look-ui/icons";
import { RPA_REF } from "@/lib/first-look-ui/rpa-map";
import { closeLabel, usd, type DashboardData, type OfferView } from "@/lib/first-look-ui/types";

/**
 * Offer-dashboard screen pieces (plan: ui-lab Phase 4). Screen-level
 * composition lives here, next to the route; only the primitives are meant
 * to move out of the fence at promotion.
 */

const INERT = "Not wired in this lab";

function CloseTermRow({ offer, scaleDays }: { offer: OfferView; scaleDays: number }) {
  const { close } = offer;
  if (close.kind === "not_stated") {
    return <MicroTimeline notStated />;
  }
  if (close.kind === "date") {
    // A date-type close does not fit a days-based track — the honest render
    // is the stated date, not an invented duration (anticipated collision 4).
    return (
      <p className="tl-caption" style={{ marginTop: 4 }}>
        <span>Acceptance → {closeLabel(close)} (stated as a date, not days)</span>
      </p>
    );
  }
  const pct = scaleDays > 0 ? (close.days / scaleDays) * 100 : 100;
  return <MicroTimeline pct={pct} endLabel={`${close.days}-day close`} />;
}

export function OfferHeroCard({ offer, scaleDays }: { offer: OfferView; scaleDays: number }) {
  return (
    <Card>
      <CardHead>
        <div className="offer-head-top">
          {offer.tier ? (
            <TierBadge variant={offer.tier.variant} icon={offer.tier.icon}>
              {offer.tier.label}
            </TierBadge>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="offer-no">OFFER {String(offer.index).padStart(2, "0")}</span>
        </div>
        <p className="offer-buyer">{offer.buyer}</p>
        {offer.address ? <p className="offer-addr">{offer.address}</p> : null}
        <div className="offer-price">{usd(offer.netEstimate)}</div>
        <div className="offer-price-label">
          Estimated net to seller <SourceChip refText={RPA_REF.net_inputs} note={offer.netNote} />
        </div>
      </CardHead>
      <CardBody>
        <div className="term-row">
          <div className="term-label">Contingencies</div>
          <div className="chips">
            {offer.contingencies.map((c) => (
              <Chip key={c.label} variant={c.variant}>
                {c.label}
              </Chip>
            ))}
            <SourceChip refText={RPA_REF.contingencies} />
          </div>
        </div>
        <div className="term-row">
          <div className="term-label">Financing</div>
          <div className="chips">
            {offer.financing.map((c) => (
              <Chip key={c.label} variant={c.variant}>
                {c.label}
              </Chip>
            ))}
            <SourceChip refText={RPA_REF.financing} />
          </div>
        </div>
        <div className="term-row">
          <div className="term-label">Timeline to close</div>
          <CloseTermRow offer={offer} scaleDays={scaleDays} />
          <div className="chips" style={{ marginTop: 8 }}>
            <SourceChip refText={RPA_REF.close_of_escrow} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function LeadMark() {
  return (
    <span className="leadmark">
      <IconUp size={10} strokeWidth={3} /> leads
    </span>
  );
}

export function ComparisonTable({ data }: { data: DashboardData }) {
  const { offers, singleProperty } = data;
  // Crowns are computed only where the comparison is honest: numeric rows,
  // single property. Across unrelated listings a "leads" mark is numerically
  // true but semantically hollow — suppressed in stress mode.
  const bestNet = singleProperty
    ? Math.max(...offers.map((o) => o.netEstimate))
    : null;
  const statedDays = offers.filter((o) => o.close.kind === "days");
  const bestClose =
    singleProperty && statedDays.length >= 2
      ? Math.min(...statedDays.map((o) => (o.close.kind === "days" ? o.close.days : Infinity)))
      : null;

  return (
    <section className="gridcard" aria-label="Term-by-term comparison">
      <div className="gridcard-head">
        <h2>Term-by-term comparison</h2>
        <span className="hint">
          Hover a row to hold your place · each § reference names the language that supports it
        </span>
      </div>
      <div className="cmp-scroll">
        <table className="cmp">
          <thead>
            <tr>
              <th scope="col">Term</th>
              {offers.map((o) => (
                <th key={o.id} scope="col">
                  Offer {String(o.index).padStart(2, "0")}
                  <span className="buyer">{o.buyer}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="dim">Estimated net to seller</td>
              {offers.map((o) => (
                <td key={o.id} className={`val${o.netEstimate === bestNet ? " lead" : ""}`}>
                  <span className="mono-val">{usd(o.netEstimate)}</span>
                  {o.netEstimate === bestNet ? <LeadMark /> : null}
                  <div className="src">
                    <SourceChip refText={RPA_REF.net_inputs} note={o.netNote} />
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="dim">Contingencies</td>
              {offers.map((o) => (
                <td key={o.id} className="val">
                  <span className="chips">
                    {o.contingencies.map((c) => (
                      <Chip key={c.label} variant={c.variant}>
                        {c.label}
                      </Chip>
                    ))}
                  </span>
                  <div className="src">
                    <SourceChip refText={RPA_REF.contingencies} />
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="dim">Financing</td>
              {offers.map((o) => (
                <td key={o.id} className="val">
                  <span className="chips">
                    {o.financing.map((c) => (
                      <Chip key={c.label} variant={c.variant}>
                        {c.label}
                      </Chip>
                    ))}
                  </span>
                  <div className="src">
                    <SourceChip refText={RPA_REF.financing} />
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="dim">Close of escrow</td>
              {offers.map((o) => {
                const leads = bestClose !== null && o.close.kind === "days" && o.close.days === bestClose;
                return (
                  <td key={o.id} className={`val${leads ? " lead" : ""}`}>
                    <span className="mono-val">{closeLabel(o.close)}</span>
                    {leads ? <LeadMark /> : null}
                    <div className="src">
                      <SourceChip refText={RPA_REF.close_of_escrow} />
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ActionBar({ message }: { message: string }) {
  return (
    <div className="actionbar-slot">
      <div className="actionbar">
        <span className="msg">
          <IconCircleCheck size={15} strokeWidth={2.4} />
          {message}
        </span>
        <span className="grow" />
        <FlButton variant="ghost" disabled title={INERT}>
          Export PDF
        </FlButton>
        <FlButton variant="outline" disabled title={INERT}>
          <IconCopy size={13} strokeWidth={2.2} />
          Copy link
        </FlButton>
        <FlButton variant="primary" disabled title={INERT}>
          <IconShare size={13} strokeWidth={2.2} />
          Share with seller
        </FlButton>
      </div>
    </div>
  );
}

/** Lab-only dataset switch (synthetic scenario ↔ fixture stress mode). */
export function DatasetSwitch({ fixturesActive }: { fixturesActive: boolean }) {
  return (
    <div className="lab-row">
      <a
        className={`btn ${fixturesActive ? "btn-ghost" : "btn-outline"}`}
        href="?"
      >
        Synthetic scenario
      </a>
      <a
        className={`btn ${fixturesActive ? "btn-outline" : "btn-ghost"}`}
        href="?data=fixtures"
      >
        Fixture stress mode (local only)
      </a>
    </div>
  );
}
