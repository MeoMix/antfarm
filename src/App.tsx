import React from 'react';
import { Stage } from '@inlet/react-pixi';
import './App.css';
import World from './World';

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

  return (
    <div className="App">
      <Stage width={stageWidth} height={stageHeight} options={{ backgroundColor: 0xeef1f5 }}>
        <World width={stageWidth} height={stageHeight} />
      </Stage>
    </div>
  );
}

export default App;
