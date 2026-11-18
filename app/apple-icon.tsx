import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ikonet på iPhone-hjemmeskærmen.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1129",
          color: "#f2dfa7",
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        L
      </div>
    ),
    size,
  );
}
