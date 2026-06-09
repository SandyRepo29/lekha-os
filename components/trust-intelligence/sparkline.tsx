"use client";

import { useMemo } from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
};

export function Sparkline({
  data,
  width = 120,
  height = 40,
  color = "#6366f1",
  fill = true,
  strokeWidth = 1.5,
}: SparklineProps) {
  const { path, fillPath } = useMemo(() => {
    if (data.length < 2) return { path: "", fillPath: "" };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = strokeWidth;

    const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (width - pad * 2));
    const ys = data.map((v) => pad + ((max - v) / range) * (height - pad * 2));

    const points = xs.map((x, i) => `${x},${ys[i]}`);
    const linePath = `M ${points.join(" L ")}`;
    const areaPath = `M ${xs[0]},${height} L ${points.join(" L ")} L ${xs[xs.length - 1]},${height} Z`;

    return { path: linePath, fillPath: areaPath };
  }, [data, width, height, strokeWidth]);

  if (!path) return null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {fill && (
        <path d={fillPath} fill={color} fillOpacity={0.12} />
      )}
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
