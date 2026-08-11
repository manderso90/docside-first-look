import { labOpen, LabClosed } from "./lab-gate";

/** Phase 1 placeholder — becomes the primitives gallery in Phase 3. */
export default function UiLabIndex() {
  if (!labOpen()) return <LabClosed />;
  return (
    <div data-fl="">
      <p>First Look UI lab — boundary up.</p>
    </div>
  );
}
