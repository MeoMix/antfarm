const config = {
  compactSandDepth: 15, // sand turns to dirt when stacked this high
  initialDirtPercent: 2 / 3,
  initialAntCount: 5,

  probabilities: {
    randomDig: 0.03, // dig down while wandering
    randomDrop: 0.03, // drop while wandering
    randomTurn: 0.05, // turn while wandering
    concaveBelowDirtDig: 0.0100, // dig concave dirt below ground
    convexAboveDirtDrop: 0.0100, // drop at convex corner above ground
    sandExclusion: 0.050, // reduce chance to drop at undesirable sand/dirt edge
  },
};

export default config;