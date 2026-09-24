import { useEffect, useRef } from 'react';

/**
 * The moving set around the converter.
 *
 * Left of the tool is the recording — tall blue level bars. Right of it is
 * the result — orange notes sliding along a piano roll. The converter card
 * sits over the middle, so on a wide screen the page reads left to right as
 * "sound goes in here, notes come out there". No illustrations here: those
 * live in the guides.
 *
 * All of it is decoration: aria-hidden, pointer-events none, behind the card.
 * Every loop pauses while the hero is off screen, and reduced motion freezes
 * it in place.
 */
const BAR_COUNT = 56;
// A fixed, loosely musical envelope so server and client markup match.
const BARS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const t = i / (BAR_COUNT - 1);
  const swell = Math.sin(t * Math.PI * 3.2) * 0.35 + 0.55;
  const jitter = ((i * 37) % 11) / 22;
  return (
    Math.round(Math.min(1, Math.max(0.12, swell * 0.8 + jitter * 0.4)) * 100) /
    100
  );
});

/** lane (0–7), start %, length % within one loop of the roll */
const ROLL_NOTES: [number, number, number][] = [
  [5, 0, 7],
  [3, 9, 5],
  [2, 15, 9],
  [4, 26, 4],
  [1, 32, 11],
  [3, 45, 6],
  [6, 53, 8],
  [4, 63, 5],
  [2, 70, 10],
  [0, 82, 6],
  [3, 90, 7],
];

export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    const section = stage?.parentElement;
    if (!stage || !section) return;

    // Pause every loop while the hero is off screen.
    const io = new IntersectionObserver(([entry]) => {
      stage.classList.toggle('is-paused', !entry.isIntersecting);
    });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="hero-stage">
      <div className="hero-glow hero-glow-audio" />
      <div className="hero-glow hero-glow-midi" />

      <div className="hero-bars">
        {BARS.map((height, index) => (
          <span
            key={index}
            style={{ '--h': height, '--i': index } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="hero-roll">
        <div className="hero-roll-track">
          {[0, 1].map((copy) =>
            ROLL_NOTES.map(([lane, start, length], index) => (
              <span
                key={`${copy}-${index}`}
                style={
                  {
                    left: `${copy * 50 + start / 2}%`,
                    width: `${length / 2}%`,
                    top: `${lane * 12.5 + 3}%`,
                    '--i': index,
                  } as React.CSSProperties
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
