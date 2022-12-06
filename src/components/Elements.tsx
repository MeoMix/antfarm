import { memo } from "react";
import { isEqual } from 'lodash';
import type { ElementAssemblage } from '../createWorld';
import Dirt from './Dirt';
import Sand from './Sand';
import { ParticleContainer } from '@inlet/react-pixi';

type Props = {
  elements: ElementAssemblage[];
}

// Custom equality check because elements might not be reference equal but is functionally the same
function areEqual(previousProps: Props, nextProps: Props) {
  return isEqual(previousProps, nextProps);
}

function Elements({ elements }: Props) {
  return (
    <ParticleContainer maxSize={40000}>
      {
        elements.map(({ element, location: { x, y }}) => {
          if (element === 'dirt') {
            return <Dirt key={`${x}${y}`} x={x} y={y} />;
          }

          if (element === 'sand') {
            return <Sand key={`${x}${y}`} x={x} y={y} />;
          }

          return null;
        })
      }
    </ParticleContainer>

  );
}

export default memo(Elements, areEqual);
