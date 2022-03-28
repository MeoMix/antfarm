import { memo } from "react";
import { isEqual } from 'lodash';
import type { Element } from '../createWorld';
import Dirt from './Dirt';
import Sand from './Sand';
import Food from './Food';

type Props = {
  elements: Element[][];
}

// Custom equality check because elements might not be reference equal but is functionally the same
function areEqual(previousProps: Props, nextProps: Props) {
  return isEqual(previousProps, nextProps);
}

function Elements({ elements }: Props) {
  return (
    <>
      {
        elements.map((elementRow, y) => elementRow.map((element, x) => {
          const elementProps = { x, y, width: 1, height: 1 };
    
          if (element === 'dirt') {
            return <Dirt key={`${element}-${x}${y}`} {...elementProps} />;
          }
    
          if (element === 'sand') {
            return <Sand key={`${element}-${x}${y}`} {...elementProps} />;
          }
    
          if (element === 'food') {
            return <Food key={`${element}-${x}${y}`} {...elementProps} />;
          }
    
          return null;
        }))
      }
    </>

  );
}

export default memo(Elements, areEqual);