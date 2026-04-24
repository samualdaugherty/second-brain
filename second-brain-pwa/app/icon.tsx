import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
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
          background: "#141414",
          borderRadius: "40px",
        }}
      >
        <span
          style={{
            fontSize: 286,
            fontWeight: 600,
            color: "#c9933a",
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          G
        </span>
      </div>
    ),
    { ...size }
  );
}
