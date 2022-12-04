import * as PIXI from "pixi.js";
import { Simple } from "pixi-cull";
import { PixiComponent, useApp } from "@inlet/react-pixi";
import { Viewport as PixiViewport } from "pixi-viewport";

type Props = {
  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  children?: React.ReactNode;
}

type PixiComponentProps = {
  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  app: PIXI.Application;
}

const PixiComponentViewport = PixiComponent('Viewport', {
  create: ({ screenWidth, screenHeight, worldWidth, worldHeight, app }: PixiComponentProps) => {
    const viewport = new PixiViewport({
      screenWidth,
      screenHeight,
      worldWidth,
      worldHeight,
      ticker: app.ticker,
      interaction: app.renderer.plugins.interaction
    });

    viewport
      .drag()
      .pinch()
      .wheel()
      .clamp({ direction: 'all' })
      .clampZoom({ minScale: 1.0, maxScale: 3.0 });

    const cull = new Simple();
    cull.addList(
      (viewport.children as PIXI.Container[])
        .map((layer) => {
          return layer.children;
        })
        .flat()
    );
    cull.cull(viewport.getVisibleBounds());

    viewport.on("moved", () => {
      if (viewport.dirty) {
        cull.cull(viewport.getVisibleBounds());
        viewport.dirty = false;
      }
    });

    return viewport;
  },

  applyProps: (instance, oldProps, newProps) => {
    if (
      oldProps.screenWidth !== newProps.screenWidth ||
      oldProps.screenHeight !== newProps.screenHeight ||
      oldProps.worldWidth !== newProps.screenWidth ||
      oldProps.worldHeight !== newProps.worldHeight
    ) {
      instance.resize(newProps.screenWidth, newProps.screenHeight, newProps.worldWidth, newProps.worldHeight);
    }
  },
});

const Viewport = (props: Props) => {
  const app = useApp();
  return <PixiComponentViewport app={app} {...props} />;
};

export default Viewport;
