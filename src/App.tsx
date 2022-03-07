import './App.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage } from '@inlet/react-pixi';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import World from './components/World';
import createWorld from './createWorld';
import config from './config';
import { moveAnts, sandFall } from './util';
import SettingsDialog from './components/SettingsDialog';

// Save the world once a minute because it's possible the browser could crash so saving on window unload isn't 100% reliable.
const AUTO_SAVE_INTERVAL_MS = 60 * 1000;
const TICK_MS = 50;
// 16:9 aspect ratio to favor widescreen monitors, letterboxing will occur on all other sizes.
const WORLD_WIDTH = 96;
const WORLD_HEIGHT = 54;

function createNewWorld() {
  return createWorld(WORLD_WIDTH, WORLD_HEIGHT, config.initialDirtPercent, config.initialAntCount);
}

function App() {
  const [scale, setScale] = useState(0);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const stageBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function getScale() {
      const width =  stageBoxRef.current?.offsetWidth ?? 0;
      const height = stageBoxRef.current?.offsetHeight ?? 0;
      return Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    }

    setScale(getScale())

    function onWindowResize() {
      setScale(getScale());
    }

    window.addEventListener('resize', onWindowResize, true);

    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, []);

  const updateWorld = useCallback((delta: number) => {
    const elapsedTicks = Math.floor(delta / TICK_MS);
    if (elapsedTicks === 0) {
      return;
    }

    setWorld(world => {
      // TODO: Pretty sure I want to break references entirely here, but it's too expensive to call JSON.parse(JSON.stringify(world))
      // I think I need to rewrite utils to treat world as immutable instead?
      const updatedWorld = { ...world };
      let updatingAnts = [...updatedWorld.ants];
      for (let tickCount = 0; tickCount < elapsedTicks; tickCount++) {
        updatingAnts = moveAnts(updatingAnts, updatedWorld);
        sandFall(updatedWorld);
      }

      updatedWorld.ants = updatingAnts;

      return updatedWorld;
    });
  }, []);

  useEffect(() => {
    let animationFrameId = 0;
    let lastVisibleTimeMs = 0;
    let lastWorldUpdateTimeMs = 0;

    function handleAnimationFrame(timestamp: number) {
      const delta = timestamp - lastWorldUpdateTimeMs;
      if (delta > TICK_MS) {
        lastWorldUpdateTimeMs = timestamp;
        updateWorld(delta);
      }

      animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrameId);
        lastVisibleTimeMs = performance.now();
      } else {
        // It's important to set lastTickTime
        lastWorldUpdateTimeMs = performance.now();
        const delta = lastWorldUpdateTimeMs - lastVisibleTimeMs;
        updateWorld(delta);

        animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
      }
    }
    
    animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      window.cancelAnimationFrame(animationFrameId);
    }
  }, [updateWorld]);

  const [world, setWorld] = useState(() => {
    const savedWorldJson = localStorage.getItem('antfarm-world');
    const savedWorld = savedWorldJson ? JSON.parse(savedWorldJson) as ReturnType<typeof createWorld> : null;

    return savedWorld ?? createNewWorld();
  });

  // TODO: idk how to write this properly just yet. it's wrong that setInterval would get set/cleared frequently,
  // but world is updated a lot and it's no good if a stale world is saved
  useEffect(() => {
    function saveWorld() {
      localStorage.setItem('antfarm-world', JSON.stringify(world));
    }

    function onWindowUnload() {
      saveWorld();
    }

    window.addEventListener('unload', onWindowUnload, true);

    const intervalId = window.setInterval(() => {
      saveWorld();
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      window.removeEventListener('unload', onWindowUnload);
      window.clearInterval(intervalId);
    };
  }, [world]);

  function handleSettingsClick(){
    setIsSettingsDialogOpen(true);
  }

  function handleSettingsDialogClose() {
    setIsSettingsDialogOpen(false);
  }

  function handleDeleteSave() {
    localStorage.removeItem('antfarm-world');
    setWorld(createNewWorld());
  }

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography sx={{ flexGrow: 1 }}>
            Ant Farm
          </Typography>
          <IconButton onClick={handleSettingsClick} color="inherit">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <SettingsDialog
        open={isSettingsDialogOpen}
        onClose={handleSettingsDialogClose}
        onDeleteSave={handleDeleteSave}
      />

      <Box position="relative" width="100%" flex={1}>
        <Box position="absolute" width="100%" height="100%" display="flex" justifyContent="center" ref={stageBoxRef} >
          <Stage
            width={world.width * scale}
            height={world.height * scale}
            options={{
              resolution: window.devicePixelRatio,
            }}
          >
            <World elements={world.elements} ants={world.ants} gridSize={scale} surfaceLevel={world.surfaceLevel} />
          </Stage>
        </Box>
      </Box>
    </div>
  );
}

export default App;
