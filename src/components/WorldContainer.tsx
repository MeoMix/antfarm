
import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { InteractionEvent } from 'pixi.js';
import { Stage, Container } from '@inlet/react-pixi';
import { Box } from '@mui/material';
import { isEqual } from 'lodash';
import World from './World';
import type { World as WorldModel, Element } from '../createWorld';
import type { Point } from '../Point';
import type { Ant } from '../createAnt';

type Props = {
  world: WorldModel;
  // TODO: don't pass this in like this.. should live on the ants which should be "view state" ants not "model state" ants
  antColor: string;
  onElementClick: (element: Element, location: Point) => void;
  onAntClick: (ant: Ant) => void;
}

// Custom equality check because world might not be reference equal but is functionally the same
function areEqual(previousProps: Props, nextProps: Props) {
  return isEqual(previousProps, nextProps);
}

function WorldContainer({ world, antColor, onElementClick, onAntClick }: Props) {
  const [scale, setScale] = useState(0);
  const stageBoxRef = useRef<HTMLDivElement>(null);
  
  // Ensure the main canvas fills as much of the browser's available space as possible and handle resizing.
  useEffect(() => {
    function getScale() {
      const width = stageBoxRef.current?.offsetWidth ?? 0;
      const height = stageBoxRef.current?.offsetHeight ?? 0;
      return Math.min(width / world.width, height / world.height);
    }

    setScale(getScale())

    function onWindowResize() {
      setScale(getScale());
    }

    window.addEventListener('resize', onWindowResize, true);

    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, [world.width, world.height]);

  const handleWorldClick = useCallback((event: InteractionEvent) => {
    const localPosition = event.data.getLocalPosition(event.target.parent);
    const x = Math.floor(localPosition.x / scale);
    const y = Math.floor(localPosition.y / scale);

    const ant = world.ants.find(ant => ant.location.x === x && ant.location.y === y);

    if (ant) {
      onAntClick(ant)
    } else {
      onElementClick(world.elements[y][x], { x, y });
    }

  }, [scale, world.elements, world.ants, onElementClick, onAntClick]);

  return (
    <Box position="relative" width="100%" flex={1}>
      <Box position="absolute" width="100%" height="100%" display="flex" justifyContent="center" ref={stageBoxRef} >
        <Stage
          width={world.width * scale}
          height={world.height * scale}
          options={{
            resolution: window.devicePixelRatio,
          }}
        >
          <Container scale={scale} interactive click={handleWorldClick}>
            <World 
              elements={world.elements}
              ants={world.ants}
              surfaceLevel={world.surfaceLevel}
              antColor={antColor}
            />
          </Container>
        </Stage>
      </Box>
    </Box>
  );
}

export default memo(WorldContainer, areEqual);