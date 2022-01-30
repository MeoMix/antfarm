import { Stage } from '@inlet/react-pixi';
import './App.css';
import World from './components/World';
import createWorld from './createWorld';
import config from './config';

function App() {

  /**
   * Functionality:
   *
   *  - Setup using configuration file.
   *  - Create a grid layout that fills responsive-sized container
   *  - Create a bunch of ants on the top of the dirt
   *  - Play forward for an arbitrary number of cycles
   *  -
   */

  const stageWidth = 900;
  const stageHeight = 600;

  // TODO: Careful, stageWidth/height needs to be divisible by gridSize for now
  const world = createWorld(900 / config.gridSize, 600 / config.gridSize, config.initialDirtPercent);

  return (
    <div className="App">
      <Stage width={stageWidth} height={stageHeight} options={{ backgroundColor: 0xeef1f5 }}>
        <World {...world} />
      </Stage>
    </div>
  );
}

export default App;
