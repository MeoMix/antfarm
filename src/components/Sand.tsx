import { Sprite } from "@inlet/react-pixi";
import { Texture } from "pixi.js";

type Props = {
  width: number;
  height: number;
  x: number;
  y: number;
}

function Sand({ width, height, x, y }: Props) {
  return (
    <Sprite
      x={x}
      y={y}
      width={width}
      height={height}
      texture={Texture.WHITE}
      tint={0xC2B280}
    />
  )
}

export default Sand;