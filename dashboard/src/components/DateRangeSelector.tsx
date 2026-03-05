import { useDateRange } from "../context/DateRangeContext";
import { presets } from "../presets";

export default function DateRangeSelector() {
  const { activePreset, setPresetKey } = useDateRange();

  return (
    <div className="date-range-selector">
      <select
        aria-label="Date range"
        value={activePreset.key}
        onChange={(e) => setPresetKey(e.target.value)}
      >
        {presets.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>
      {activePreset.InputComponent && <activePreset.InputComponent />}
    </div>
  );
}
