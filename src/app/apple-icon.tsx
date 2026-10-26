import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#0d0d10",
          borderRadius: 36,
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 130,
            fontWeight: 400,
            color: "#c8a96e",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          J.
        </span>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
