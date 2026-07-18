import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  turbopack: {},
  // Lets the dev server be reached from another device on the LAN (e.g.
  // testing on a phone) without the cross-origin HMR warning/block.
  allowedDevOrigins: ["192.168.178.21"],
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

export default withPWA(nextConfig);
