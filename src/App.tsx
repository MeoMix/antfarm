import './App.css';
import { useEffect, useState } from 'react';
import World from './components/World';
import createWorld from './createWorld';
import { Stage } from '@inlet/react-pixi';
import config from './config';
import createAnt from './createAnt';
import { footFacingDirections, moveAnts, sandFall } from './util';

const TICK_MS = 50;

function App() {
  useEffect(() => {
    let lastVisibleTimeMs = 0;

    function handleVisibilityChange() {
      if (document.hidden) {
        lastVisibleTimeMs = performance.now();
      } else {
        const delta = performance.now() - lastVisibleTimeMs;
        const elapsedTicks = delta / TICK_MS;

        let updatingAnts = [...ants];
        for (let tickCount = 0; tickCount < elapsedTicks; tickCount++) {
          updatingAnts = moveAnts(updatingAnts, world);
          sandFall(world);
        }

        setAnts(updatingAnts);
        setWorld(world);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, false);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange, false);
    }
  }, []);

  const [world, setWorld] = useState(() => {
    // TODO: width/height needs to be divisible by gridSize for now
    return createWorld(90, 60, config.initialDirtPercent);
  });

  const [ants, setAnts] = useState(() => {
    return Array.from({ length: config.initialAntCount }, () => {
      // Put the ant at a random location along the x-axis that fits within the bounds of the world.
      const x = Math.round(Math.random() * 1000) % world.width;
      // Put the ant on the dirt.
      const y = world.height - (world.height * config.initialDirtPercent);

      const groundLevelDirections = footFacingDirections.filter(({ footDirection }) => footDirection === 'south');
      const randomDirection = groundLevelDirections[Math.floor(Math.random() * groundLevelDirections.length)];
  
      return createAnt(x, y, 'wandering', randomDirection.facingDirection, randomDirection.footDirection);
    });
  });

  useEffect(() => {
    let animationFrameId = 0;
    let lastTickTimeMs = 0;

    function handleAnimationFrame(timestamp: number) {
      const delta = timestamp - lastTickTimeMs;

      if (delta > TICK_MS) {
        lastTickTimeMs = timestamp;
        setAnts(ants => moveAnts(ants, world));
        sandFall(world);
        setWorld(world);
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
      <Stage width={world.width * config.gridSize} height={world.height * config.gridSize} options={{ backgroundColor: 0x87ceeb }}>
        <World elements={world.elements} ants={ants} gridSize={config.gridSize} />
      </Stage>
    </div>
  );
}

export default App;
