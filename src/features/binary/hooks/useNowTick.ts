import { useEffect, useState } from "react";

// Re-renders the consumer on a fixed cadence so countdown timers and
// progress bars advance smoothly. One shared interval per consumer; cheap
// at 1Hz for the handful of active binaries on screen.
export function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
