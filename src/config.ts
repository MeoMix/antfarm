const config = {
  tickRateMs: 50,
  // Save the world once a minute because it's possible the browser could crash so saving on window unload isn't 100% reliable.
  autoSaveIntervalMs: 60 * 1000,
  compactSandDepth: 15, // sand turns to dirt when stacked this high
  initialDirtPercent: 3 / 4,
  initialAntCount: 20,
  antColor: '#9537DB', // purple!

  probabilities: {
    // TODO: if I set this to 1 and ant digs while climbing edge it gets stuck indefinitely
    randomDig: 0.003, // dig down while wandering
    randomDrop: 0.003, // drop while wandering
    randomTurn: 0.005, // turn while wandering
    belowSurfaceDig: 0.10, // chance to dig dirt when below surface level
    aboveSurfaceDrop: 0.10, // chance to randomly drop sand when at-or-above surface level
  },
};

export type Settings = typeof config;

export default config;