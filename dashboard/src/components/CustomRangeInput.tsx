import { useState, useEffect } from "react";
import { today, earliestDate, daysBetween } from "../dateUtils";
import { useDateRange } from "../context/DateRangeContext";

const MAX_SPAN_DAYS = 365;

function validate(start: string, end: string): string | null {
  if (!start || !end) return "Both dates are required";
  if (end < start) return "End date must be after start date";
  if (daysBetween(start, end) > MAX_SPAN_DAYS) return "Range cannot exceed 365 days";
  return null;
}

export default function CustomRangeInput() {
  const { start, end, setCustomRange } = useDateRange();
  const [localStart, setLocalStart] = useState(start);
  const [localEnd, setLocalEnd] = useState(end);
  const maxDate = today();
  const minDate = earliestDate();
  const error = validate(localStart, localEnd);

  useEffect(() => {
    setLocalStart(start);
    setLocalEnd(end);
  }, [start, end]);

  useEffect(() => {
    if (!error && localStart && localEnd) {
      setCustomRange(localStart, localEnd);
    }
  }, [localStart, localEnd]);

  return (
    <>
      <input
        type="date"
        aria-label="Start date"
        value={localStart}
        min={minDate}
        max={maxDate}
        onChange={(e) => setLocalStart(e.target.value)}
      />
      <input
        type="date"
        aria-label="End date"
        value={localEnd}
        min={minDate}
        max={maxDate}
        onChange={(e) => setLocalEnd(e.target.value)}
      />
      {error && <span className="date-range-error" role="alert">{error}</span>}
    </>
  );
}
