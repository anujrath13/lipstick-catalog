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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #fff7fb, #fda4af)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 18,
            background: "#fda4af",
            borderRadius: 8,
            marginBottom: 4,
          }}
        />
        <div
          style={{
            width: 56,
            height: 96,
            background: "#fb7185",
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 28,
              height: 56,
              background: "#e11d48",
              borderRadius: 8,
              opacity: 0.7,
            }}
          />
        </div>
        <div
          style={{
            width: 72,
            height: 24,
            background: "#fda4af",
            borderRadius: 999,
            marginTop: -6,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
