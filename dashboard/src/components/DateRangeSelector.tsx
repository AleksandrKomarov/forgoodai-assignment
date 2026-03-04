import { useDateRange, presetLabels } from "../context/DateRangeContext";

export default function DateRangeSelector() {
  const { preset, setPreset } = useDateRange();

  return (
    <select
      value={preset}
      onChange={(e) => setPreset(e.target.value as typeof preset)}
    >
      {Object.entries(presetLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
