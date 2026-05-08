import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Auth route consolidation — canonical URLs are /login and /signup.
      // /auth/otp carried OTP step query params; preserve them via wildcard.
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/signup", destination: "/signup", permanent: true },
      {
        source: "/auth/otp",
        destination: "/login?step=otp",
        permanent: true,
        has: [{ type: "query", key: "phone" }],
      },
      { source: "/auth/otp", destination: "/login", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.production.linktr.ee",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "autolokate.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.worldvectorlogo.com",
        pathname: "/logos/**",
      },
      {
        protocol: "https",
        hostname: "**.scene7.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
