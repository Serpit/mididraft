/**
 * Product decisions from the 90-day plan, in one place.
 *
 * The launch flags matter: the plan is explicit that pages for unfinished
 * features must not be published or put in the sitemap. Flip a flag to false
 * and the page keeps working for you locally while disappearing from the nav,
 * the sitemap, and search engines.
 */
export const productConfig = {
  brand: 'MidiDraft',
  positioning:
    'Turn audio ideas into editable MIDI drafts, then clean and export them for your DAW.',

  /** Free-tier limits, stated on the page so nobody hits a surprise wall. */
  limits: {
    maxFileMb: 30,
    maxDurationMinutes: 3,
    maxSegmentSeconds: 60,
    recommendedSegmentSeconds: [15, 60] as const,
  },

  /**
   * Phase gating. Phase 1 (the free converter) is live; the paid workflow
   * pages stay unlisted until the features behind them actually work.
   */
  features: {
    /** Phase 1: free single-file converter. */
    converter: true,
    /** Phase 2: batch processing. Not built yet. */
    batch: false,
    /** Phase 2: cleanup presets applied across a batch. Not built yet. */
    cleanupPresets: false,
    /** Phase 3: import an existing .mid for cleanup. Not built yet. */
    midiImport: false,
    /** Paid plans go live with the phase 2 features, not before. */
    paidPlans: false,
  },

  /**
   * Prices from the plan. These are the numbers to test, not validated
   * optimal prices, and nothing is charged until the features exist.
   */
  pricing: {
    projectPass: { amountUsd: 7, days: 7 },
    pro: { amountUsd: 12, interval: 'month' as const },
    proYearly: { amountUsd: 89, interval: 'year' as const },
  },
} as const;

export type ProductFeature = keyof typeof productConfig.features;

export function isLaunched(feature: ProductFeature): boolean {
  return productConfig.features[feature];
}
