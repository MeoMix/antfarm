import './App.css';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { Settings as SettingsIcon, TouchApp as TouchAppIcon } from '@mui/icons-material';
import createWorld from './createWorld';
import type { Element } from './createWorld';
import config, { Settings } from './config';
import { moveAnts, sandFall } from './util';
import SettingsDialog from './components/SettingsDialog';
import WorldContainer from './components/WorldContainer';
import PendingTickCountDialog from './components/PendingTickCountDialog';
import TouchAppDialog from './components/TouchAppDialog';
import type { Action } from './components/TouchAppDialog';
import type { Point } from './Point';
import type { Ant } from './createAnt';
import SelectedAntDialog from './components/SelectedAntDialog';

const VERSION = '0.0.4';

// 16:9 aspect ratio to favor widescreen monitors, letterboxing will occur on all other sizes.
const WORLD_WIDTH = 144;
const WORLD_HEIGHT = 81;
const TICK_COUNT_BATCH_SIZE = 500;

function App() {
  const [selectedAction, setSelectedAction] = useState<Action>('default');
  const [selectedAntId, setSelectedAntId] = useState<Ant['id']>();
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isTouchAppDialogOpen, setIsTouchAppDialogOpen] = useState(false);
  const lastWorldUpdateTimeMsRef = useRef(0);
  const [pendingTickCount, setPendingTickCount] = useState(0);

  const [settings, setSettings] = useState(() => {
    const savedSettingsJson = localStorage.getItem('antfarm-settings');
    const savedSettings = savedSettingsJson ? JSON.parse(savedSettingsJson) as (typeof config & { version: string }) : null;

    if (!savedSettings) {
      return config;
    }

    const { version, ...settings } = savedSettings;
    return version === VERSION ? settings : config;
  });

  const createNewWorld = useCallback(() => {
    return createWorld(WORLD_WIDTH, WORLD_HEIGHT, settings.initialDirtPercent, settings.initialAntCount);
  }, [settings.initialDirtPercent, settings.initialAntCount])

  const [world, setWorld] = useState(() => {
    const savedWorldJson = localStorage.getItem('antfarm-world');
    const savedWorld = savedWorldJson ? JSON.parse(savedWorldJson) as (ReturnType<typeof createNewWorld> & { version: string }) : null;

    if (!savedWorld) {
      return createNewWorld();
    }

    const { version, ...world } = savedWorld;
    return version === VERSION ? world : createNewWorld();
  });

  // TODO: this still isn't implemented well. would be better to pause a brief period of time between runs
  useEffect(() => {
    if (pendingTickCount === 0) {
      return;
    }

    setWorld(world => {
      if (pendingTickCount === 0) {
        return;
      }

      // TODO: Prefer immutable world instead of breaking world reference (it's too expensive)
      let updatedWorld = JSON.parse(JSON.stringify(world));
      let tickCount = 0;
      while (tickCount < pendingTickCount && tickCount < TICK_COUNT_BATCH_SIZE) {
        updatedWorld.ants = moveAnts(updatedWorld, settings.probabilities);
        sandFall(updatedWorld, settings.compactSandDepth);
        tickCount++
      }
      setPendingTickCount(pendingTickCount => pendingTickCount - tickCount);

      return updatedWorld;
    });
  }, [pendingTickCount, settings.probabilities, settings.compactSandDepth])

  // Main loop for updating world state. Try to run every N ms (configurable), play catch-up if multiple
  // ticks are pending. This can occur in various scenarios. For example, if configured tick rate is very low,
  // or if browser tab is inactive then setInterval will slow to once-per-second.
  useEffect(() => {
    let intervalId = 0;

    function handleInterval() {
      const timestamp = performance.now();
      const deltaMs = timestamp - lastWorldUpdateTimeMsRef.current;
      if (deltaMs > settings.tickRateMs) {
        lastWorldUpdateTimeMsRef.current = timestamp;

        const elapsedTickCount = Math.floor(deltaMs / settings.tickRateMs);
        setPendingTickCount(pendingTickCount => pendingTickCount + elapsedTickCount);
      }
    }

    intervalId = window.setInterval(handleInterval, 60 / 1000);

    return () => {
      window.clearInterval(intervalId);
    }
  }, [settings.tickRateMs]);

  // TODO: idk how to write this properly just yet. it's wrong that setInterval would get set/cleared frequently,
  // but world is updated a lot and it's no good if a stale world is saved
  useEffect(() => {
    function saveWorld() {
      localStorage.setItem('antfarm-world', JSON.stringify({ ...world, version: VERSION }));
    }

    function onWindowUnload() {
      saveWorld();
    }

    window.addEventListener('unload', onWindowUnload, true);

    const intervalId = window.setInterval(() => {
      saveWorld();
    }, settings.autoSaveIntervalMs);

    return () => {
      window.removeEventListener('unload', onWindowUnload);
      window.clearInterval(intervalId);
    };
  }, [world, settings.autoSaveIntervalMs]);

  useEffect(() => {
    function saveSettings() {
      localStorage.setItem('antfarm-settings', JSON.stringify({ ...settings, version: VERSION }));
    }

    saveSettings();
  }, [settings]);

  const handleElementClick = useCallback((element: Element, location: Point) => {
    setSelectedAntId(undefined);

    if (element === 'air' && selectedAction === 'food') {
      setWorld(world => {
        let updatedWorld = JSON.parse(JSON.stringify(world));
        updatedWorld.elements[location.y][location.x] = 'food' as const;

        return updatedWorld;
      });
    }
  }, [selectedAction]);

  const handleAntClick = useCallback((ant: Ant) => {
    setSelectedAntId(ant.id);
  }, []);

  const handleTouchAppClick = useCallback(() => {
    setIsTouchAppDialogOpen(true);
  }, []);

  const handleTouchAppDialogClose = useCallback(() => {
    setIsTouchAppDialogOpen(false);
  }, []);

  const handleSelectAction = useCallback((selectedAction: Action) => {
    setSelectedAction(selectedAction);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsDialogOpen(true);
  }, []);

  const handleSettingsDialogClose = useCallback(() => {
    setIsSettingsDialogOpen(false);
  }, []);

  const handleSettingsChange = useCallback((updatedSettings: Settings) => {
    setSettings(settings => ({ ...settings, ...updatedSettings }));
  }, []);

  const handleResetWorld = useCallback(() => {
    localStorage.removeItem('antfarm-world');
    setWorld(createNewWorld());
    setIsSettingsDialogOpen(false);
  }, [createNewWorld]);

  const handleResetSettings = useCallback(() => {
    localStorage.removeItem('antfarm-settings');
    setSettings(config);
    setIsSettingsDialogOpen(false);
  }, []);

  const handlePendingTickDialogCancel = useCallback(() => {
    setPendingTickCount(0);
  }, []);

  return (
    <div className="App">
      <AppBar color="transparent" elevation={0}>
        <Toolbar variant="dense">
          <Typography sx={{ flexGrow: 1 }} color="primary">
            Ant Farm
          </Typography>
          <IconButton onClick={handleTouchAppClick}>
            <TouchAppIcon />
          </IconButton>
          <IconButton onClick={handleSettingsClick}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <SettingsDialog
        open={isSettingsDialogOpen}
        onClose={handleSettingsDialogClose}
        onResetWorld={handleResetWorld}
        onResetSettings={handleResetSettings}
        onSettingsChange={handleSettingsChange}
        settings={settings}
      />

      <TouchAppDialog
        open={isTouchAppDialogOpen}
        selectedAction={selectedAction}
        onClose={handleTouchAppDialogClose}
        onSelectAction={handleSelectAction}
      />

      <SelectedAntDialog
        open={!!world.ants.find(ant => ant.id === selectedAntId)}
        selectedAnt={world.ants.find(ant => ant.id === selectedAntId)}
      />

      {
        pendingTickCount > TICK_COUNT_BATCH_SIZE * 5 ? (
          <PendingTickCountDialog
            open
            handleCancel={handlePendingTickDialogCancel}
            pendingTickCount={pendingTickCount}
          />
        ) : null
      }

      <WorldContainer world={world} antColor={settings.antColor} onElementClick={handleElementClick} onAntClick={handleAntClick} />
    </div>
  );
}

export default App;