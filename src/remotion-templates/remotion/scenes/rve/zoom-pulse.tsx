import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface ZoomPulseProps {
  imageUrl?: string;
  duration?: number;
  minScale?: number;
  maxScale?: number;
}

export const ZoomPulse: React.FC<ZoomPulseProps> = ({
  imageUrl = "https://images.pexels.com/photos/1726310/pexels-photo-1726310.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  duration = 4,
  minScale = 1,
  maxScale = 1.1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cycleFrames = (duration || 4) * fps;
  const cycleProgress = (frame % cycleFrames) / cycleFrames;
  // Sinusoidal pulse
  const scale = interpolate(
    Math.sin(cycleProgress * Math.PI * 2),
    [-1, 1],
    [minScale, maxScale]
  );

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
        alt="Zoom Pulse"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
};

export default ZoomPulse;
