/**
 * Card primitive (plan: ui-lab Phase 3): head / divider / body,
 * --shadow-card at rest, --shadow-pop + translateY(-2px) on hover
 * (the .offer-card treatment from the exploration).
 */
export function Card({ children }: { children: React.ReactNode }) {
  return <article className="offer-card">{children}</article>;
}

/** Card head — the divider below it is the head's border-bottom. */
export function CardHead({ children }: { children: React.ReactNode }) {
  return <div className="offer-head">{children}</div>;
}

/** Card body — the exploration's stacked term-row region. */
export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="offer-terms">{children}</div>;
}
