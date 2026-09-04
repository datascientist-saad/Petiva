import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#F8F7F4",
          color: "#1F2421",
        }}
      >
        <div style={{ fontSize: 28, color: "#5B7C6B", marginBottom: 16 }}>{brand.name}</div>
        <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.1, maxWidth: 900 }}>
          {brand.tagline}
        </div>
        <div style={{ fontSize: 28, marginTop: 24, color: "#5C6560", maxWidth: 800 }}>
          {brand.subtitle}
        </div>
      </div>
    ),
    size
  );
}
