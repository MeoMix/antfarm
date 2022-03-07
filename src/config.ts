const config = {
  compactSandDepth: 15, // sand turns to dirt when stacked this high
  initialDirtPercent: 2 / 3,
  initialAntCount: 20,

  probabilities: {
    // TODO: if I set this to 1 and ant digs while climbing edge it gets stuck indefinitely
    randomDig: 0.003, // dig down while wandering
    randomDrop: 0.003, // drop while wandering
    randomTurn: 0.005, // turn while wandering
    concaveBelowDirtDig: 0.10, // dig concave dirt below ground
    convexAboveDirtDrop: 0.10, // drop at convex corner above ground
  },
};

export default config;