import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 22,
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
    { width: 32, height: 32 }
  );
}
