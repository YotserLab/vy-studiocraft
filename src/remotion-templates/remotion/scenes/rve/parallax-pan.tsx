import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface ParallaxPanProps {
  imageUrl?: string;
  duration?: number;
  direction?: "left-right" | "right-left" | "top-bottom" | "bottom-top";
  scale?: number;
}

export const ParallaxPan: React.FC<ParallaxPanProps> = ({
  imageUrl = "https://images.pexels.com/photos/1644724/pexels-photo-1644724.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  duration = 15,
  direction = "left-right",
  scale = 1.2,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const totalFrames = duration ? duration * fps : durationInFrames;
  const progress = interpolate(frame, [0, totalFrames], [0, 1], { extrapolateRight: "clamp" });

  let translateX = 0;
  let translateY = 0;

  if (direction === "left-right") translateX = -progress * 20;
  if (direction === "right-left") translateX = -(1 - progress) * 20;
  if (direction === "top-bottom") translateY = -progress * 20;
  if (direction === "bottom-top") translateY = -(1 - progress) * 20;

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
        overflow: "hidden",
      }}
    >
      <img
        src={imageUrl}
        alt="Parallax Pan"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
        }}
      />
    </div>
  );
};

export default ParallaxPan;
