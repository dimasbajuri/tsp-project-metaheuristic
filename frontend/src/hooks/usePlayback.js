import { useCallback, useEffect, useRef, useState } from "react";

// Pemutar frame: indeks, play/pause, dan kecepatan (frame per detik).
export function usePlayback(total, fps) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fpsRef = useRef(fps);
  const totalRef = useRef(total);
  fpsRef.current = fps;
  totalRef.current = total;

  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (ts) => {
      acc += Math.min((ts - last) / 1000, 0.25) * fpsRef.current;
      last = ts;
      const steps = Math.floor(acc);
      if (steps > 0) {
        acc -= steps;
        setIdx((i) => Math.min(i + steps, totalRef.current - 1));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    if (playing && idx >= total - 1) setPlaying(false);
  }, [playing, idx, total]);

  const safeIdx = Math.min(idx, Math.max(0, total - 1));

  const play = useCallback(() => {
    if (!totalRef.current) return;
    setIdx((i) => (i >= totalRef.current - 1 ? 0 : i));
    setPlaying(true);
  }, []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(
    () => (playing ? setPlaying(false) : play()),
    [playing, play],
  );
  const seek = useCallback((i) => {
    setPlaying(false);
    setIdx(Math.min(Math.max(0, Math.round(i)), totalRef.current - 1));
  }, []);
  const step = useCallback((delta) => {
    setPlaying(false);
    setIdx((i) => Math.min(Math.max(0, i + delta), totalRef.current - 1));
  }, []);
  const restart = useCallback(() => {
    setIdx(0);
    setPlaying(true);
  }, []);
  const reset = useCallback(() => {
    setIdx(0);
    setPlaying(false);
  }, []);

  return {
    idx: safeIdx,
    playing,
    play,
    pause,
    toggle,
    seek,
    step,
    restart,
    reset,
  };
}
