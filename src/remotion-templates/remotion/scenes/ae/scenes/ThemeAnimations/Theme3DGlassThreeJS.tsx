/**
 * Theme3DGlass - Procedural 3D Glass Morphism Scene (Pure Remotion)
 */

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, font } from "../../common";

export const Theme3DGlassThreeJS: React.FC<{
  title?: string;
  subtitle?: string;
  startDelay?: number;
}> = ({
  title = "3D GLASS MORPHISM",
  subtitle = "Interactive Procedural Depth & Lighting",
  startDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - startDelay,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const rotateX = interpolate(Math.sin(frame / 18), [-1, 1], [-8, 8]);
  const rotateY = interpolate(Math.cos(frame / 15), [-1, 1], [-12, 12]);
  const orb1Y = interpolate(Math.sin(frame / 20), [-1, 1], [-30, 30]);
  const orb2Y = interpolate(Math.cos(frame / 25), [-1, 1], [-40, 40]);

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 60%, #020617 100%)",
        perspective: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: font,
      }}
    >
      {/* Floating 3D Glowing Spheres behind glass */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "25%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, #ec4899 0%, #a855f7 60%, transparent 80%)",
          filter: "blur(40px)",
          transform: `translateY(${orb1Y}px)`,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "25%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, #38bdf8 0%, #6366f1 60%, transparent 80%)",
          filter: "blur(50px)",
          transform: `translateY(${orb2Y}px)`,
          opacity: 0.65,
        }}
      />

      {/* Main 3D Frosted Glass Panel */}
      <div
        style={{
          width: 820,
          padding: "60px 80px",
          borderRadius: 36,
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
          transform: `scale(${entrance}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          textAlign: "center",
          color: C.white,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.15em",
            marginBottom: 24,
            textTransform: "uppercase",
            color: "#e2e8f0",
          }}
        >
          Remotion Scene Master
        </div>
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            margin: "0 0 16px 0",
            letterSpacing: "-0.02em",
            textShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 24,
            color: "#94a3b8",
            margin: 0,
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Theme3DGlassThreeJS;
