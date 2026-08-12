import { IconCheck } from "@/components/first-look-ui/icons";
import { OAKVIEW } from "@/lib/first-look-ui/scenario-oakview";
import { loadFixtureOffers } from "@/lib/first-look-ui/fixtures";
import { labOpen, LabClosed } from "../lab-gate";
import { ActionBar, ComparisonTable, DatasetSwitch, OfferHeroCard } from "./pieces";

/**
 * The offer dashboard — the ONE screen this round built (plan: ui-lab
 * Phase 4), now rendered in the chosen Docside token set (founder decision
 * 2026-08-11; the proposed palette and toggle are deleted).
 *
 * Datasets (review adjustment 1):
 *  - default: synthetic competing offers on 1248 Oakview Drive — the
 *    product's canonical scenario, terms deliberately awkward,
 *  - ?data=fixtures: the real 12_25 golden set from the sibling docside
 *    checkout (dev-machine only; see fixtures.ts privacy contract).
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!labOpen()) return <LabClosed />;
  const sp = await searchParams;
  const wantFixtures = sp.data === "fixtures";
  const fixtures = wantFixtures ? loadFixtureOffers() : null;
  const data = fixtures ?? OAKVIEW;
  const scaleDays = Math.max(
    0,
    ...data.offers.map((o) => (o.close.kind === "days" ? o.close.days : 0)),
  );

  return (
    <main>
      <div className="wrap">
        <div className="preview-eyebrow">
          <span className="caps">UI lab · offer dashboard</span>
          <span className="dotset" aria-hidden="true" title="Flow-position indicator (illustrative in the lab)">
            <span className="dot done" />
            <span className="dot done" />
            <span className="dot done" />
            <span className="dot" />
          </span>
        </div>
        <h1 className="display">{data.title}</h1>
        {data.singleProperty ? (
          <p className="subline">
            Three offers received. Your seller cares most about{" "}
            <b>net proceeds</b>, certainty, and a 30-day close. Every figure
            carries the reference that supports it.
          </p>
        ) : (
          <p className="subline">
            Four hand-labeled offers from the extraction golden set —{" "}
            <b>four different properties</b>. This stress mode exists to show
            where real documents collide with the layout, not to compare the
            offers against each other.
          </p>
        )}
        <div className="flatbadges">
          {data.flatBadges.map((badge, i) => (
            <span key={badge} className="flatbadge">
              {i === 0 ? <IconCheck size={13} strokeWidth={2.4} /> : null}
              {badge}
            </span>
          ))}
        </div>

        {wantFixtures && !fixtures ? (
          <p className="subline">
            Fixture stress mode needs DOCSIDE_FIXTURES_DIR in .env.local
            (pointing at the sibling docside checkout&rsquo;s tests/fixtures).
            Showing the synthetic scenario instead.
          </p>
        ) : null}

        <div className="offers">
          {data.offers.map((offer) => (
            <OfferHeroCard key={offer.id} offer={offer} scaleDays={scaleDays} />
          ))}
        </div>

        <ComparisonTable data={data} />

        <DatasetSwitch fixturesActive={Boolean(fixtures)} />

        <ActionBar
          message={`Comparison ready — ${data.offers.length} offers, every term carries its § reference`}
        />
      </div>
    </main>
  );
}
