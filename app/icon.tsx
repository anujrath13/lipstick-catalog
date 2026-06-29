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
          background: "linear-gradient(135deg, #fda4af, #fb7185)",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 10,
            height: 22,
            background: "#e11d48",
            borderRadius: 4,
            marginTop: 4,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
