import { Sprite } from "@inlet/react-pixi";
import { Texture } from "pixi.js";
import { memo } from "react";

type Props = {
  width: number;
  height: number;
  x: number;
  y: number;
}

function Dirt({ width, height, x, y }: Props) {
  return (
    <Sprite
      x={x} 
      y={y}
      width={width}
      height={height}
      texture={Texture.WHITE}
      tint={0x836539}
    />
  )
}

export default memo(Dirt);