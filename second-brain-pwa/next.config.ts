import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Turbopack is used in dev; webpack runs at build time for PWA.
  // The empty turbopack config tells Next.js the webpack config is intentional.
  turbopack: {
    root: __dirname,
  },
};

export default withPWA(nextConfig);
