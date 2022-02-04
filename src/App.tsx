import { Stage } from '@inlet/react-pixi';
import './App.css';
import World from './components/World';
import createWorld from './createWorld';
import config from './config';

function App() {
  const stageWidth = 900;
  const stageHeight = 600;

  // TODO: Careful, stageWidth/height needs to be divisible by gridSize for now
  const worldWidth = 900 / config.gridSize;
  const worldHeight = 600 / config.gridSize;
  console.log('width/height', worldWidth, worldHeight);

  const world = createWorld(worldWidth, worldHeight, config.initialDirtPercent);

  return (
    <div className="App">
      <Stage width={stageWidth} height={stageHeight} options={{ backgroundColor: 0x87ceeb }}>
        <World {...world} />
      </Stage>
    </div>
  );
}

export default App;
