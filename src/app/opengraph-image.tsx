import { ImageResponse } from "next/og";

export const alt = "Jun.fragrance — More than just a fragrance.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #0d0d10 0%, #1a1612 60%, #12100d 100%)",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#c8a96e",
          }}
        />

        {/* Wordmark */}
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 72,
            fontWeight: 400,
            color: "#f0ece4",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          Jun.fragrance
        </span>

        {/* Tagline */}
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 32,
            fontWeight: 400,
            color: "#c8a96e",
            marginTop: 20,
            letterSpacing: "0.02em",
          }}
        >
          More than just a fragrance.
        </span>

        {/* Origin tag */}
        <span
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: "#6b6560",
            marginTop: 28,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
          }}
        >
          Crafted in Pakistan
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
