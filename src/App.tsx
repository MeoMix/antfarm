import './App.css';
import { useEffect, useState } from 'react';
import { Stage } from '@inlet/react-pixi';
import World from './components/World';
import createWorld from './createWorld';
import config from './config';
import { moveAnts, sandFall } from './util';

const TICK_MS = 50;
// 16:9 aspect ratio to favor widescreen monitors, letterboxing will occur on all other sizes.
const WORLD_WIDTH = 96;
const WORLD_HEIGHT = 54;

// Figure out the width/height of the browser, get the smaller value, determine max stage size that fits in that dimension.
function getScale() {
  return Math.min(window.innerHeight / WORLD_HEIGHT, window.innerWidth / WORLD_WIDTH);
}

function App() {
  const [scale, setScale] = useState(() => getScale());

  useEffect(() => {
    function onWindowResize() {
      setScale(getScale());
    }

    window.addEventListener('resize', onWindowResize, true);

    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, []);

  useEffect(() => {
    let lastVisibleTimeMs = 0;

    function handleVisibilityChange() {
      if (document.hidden) {
        lastVisibleTimeMs = performance.now();
      } else {
        const delta = performance.now() - lastVisibleTimeMs;
        const elapsedTicks = delta / TICK_MS;

        setWorld(world => {
          let updatingAnts = [...world.ants];
          for (let tickCount = 0; tickCount < elapsedTicks; tickCount++) {
            updatingAnts = moveAnts(updatingAnts, world);
            sandFall(world);
          }

          world.ants = updatingAnts;

          return { ...world };
        });
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
    }
  }, []);

  const [world, setWorld] = useState(() => {
    return createWorld(WORLD_WIDTH, WORLD_HEIGHT, config.initialDirtPercent, config.initialAntCount);
  });

  useEffect(() => {
    let animationFrameId = 0;
    let lastTickTimeMs = 0;

    function handleAnimationFrame(timestamp: number) {
      const delta = timestamp - lastTickTimeMs;

      if (delta > TICK_MS) {
        lastTickTimeMs = timestamp;
        setWorld(world => {
          world.ants = moveAnts(world.ants, world);
          sandFall(world);
          return { ...world };
        });
      }

      animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
    }

    animationFrameId = window.requestAnimationFrame(handleAnimationFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="App">
      <Stage
        width={world.width * scale}
        height={world.height * scale}
        options={{
          resolution: window.devicePixelRatio,
        }}
      >
        <World elements={world.elements} ants={world.ants} gridSize={scale} surfaceLevel={world.surfaceLevel} />
      </Stage>
    </div>
  );
}

export default App;
