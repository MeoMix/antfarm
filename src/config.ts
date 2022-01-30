const config = {
  compactSandDepth: 15, // sand turns to dirt when stacked this high
  initialDirtPercent: 2 / 3,
  initialAntCount: 1,
  gridSize: 4,

  probabilities: {
    randomDig: 0.003, // dig down while wandering
    randomDrop: 0.003, // drop while wandering
    randomTurn: 0.005, // turn while wandering
    concaveBelowDirtDig: 0.10, // dig concave dirt below ground
    convexAboveDirtDrop: 0.10, // drop at convex corner above ground
    sandExclusion: 0.05, // reduce chance to drop at undesirable sand/dirt edge
  },
};

export default config;