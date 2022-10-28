import * as PIXI from "pixi.js";
import { PixiComponent, useApp } from "@inlet/react-pixi";
import { Viewport as PixiViewport } from "pixi-viewport";

type Props = {
  width: number;
  height: number;
  children?: React.ReactNode;
}

type PixiComponentProps = {
  width: number;
  height: number;
  app: PIXI.Application;
}

const PixiComponentViewport = PixiComponent('Viewport', {
  create: (props: PixiComponentProps) => {
    const viewport = new PixiViewport({
      screenWidth: props.width,
      screenHeight: props.height,
      worldWidth: props.width,
      worldHeight: props.height,
      ticker: props.app.ticker,
      interaction: props.app.renderer.plugins.interaction
    });

    viewport
      .drag()
      .pinch()
      .wheel()
      .clamp({ direction: 'all' })
      .clampZoom({ minScale: 1.0, maxScale: 3.0 });

    return viewport;
  },

  applyProps: (instance, _oldProps, newProps) => {
    instance.resize(newProps.width, newProps.height, newProps.width, newProps.height);
  },
});

const Viewport = (props: Props) => {
  const app = useApp();
  return <PixiComponentViewport app={app} {...props} />;
};

export default Viewport;