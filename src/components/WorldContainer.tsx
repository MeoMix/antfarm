
import { memo, useState, useRef, useEffect } from 'react';
import { Stage, Container } from '@inlet/react-pixi';
import { Box } from '@mui/material';
import World from './World';
import type { World as WorldModel } from '../createWorld';

type Props = {
  world: WorldModel;
  // TODO: don't pass this in like this.. should live on the ants which should be "view state" ants not "model state" ants
  antColor: string;
}

function WorldContainer({ world, antColor }: Props) {
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
          <Container scale={scale}>
            <World elements={world.elements} ants={world.ants} surfaceLevel={world.surfaceLevel} antColor={antColor} />
          </Container>
        </Stage>
      </Box>
    </Box>
  );
}

export default memo(WorldContainer);