import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface KenBurnsProps {
  imageUrl?: string;
  duration?: number;
  scale?: number;
  translateX?: number;
  translateY?: number;
}

export const KenBurns: React.FC<KenBurnsProps> = ({
  imageUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80",
  duration = 5,
  scale = 1.15,
  translateX = -20,
  translateY = -10,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const totalFrames = duration ? duration * fps : durationInFrames;
  const currentScale = interpolate(frame, [0, totalFrames], [1, scale], { extrapolateRight: "clamp" });
  const currentX = interpolate(frame, [0, totalFrames], [0, translateX], { extrapolateRight: "clamp" });
  const currentY = interpolate(frame, [0, totalFrames], [0, translateY], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <img
        src={imageUrl}
        alt="Ken Burns"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${currentScale}) translate(${currentX}px, ${currentY}px)`,
        }}
      />
    </div>
  );
};

export default KenBurns;
