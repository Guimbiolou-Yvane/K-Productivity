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
    runtimeCaching: [
      // Cache les requêtes REST de Supabase (habitudes, logs, todos...)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-rest-cache",
          networkTimeoutSeconds: 8,
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24, // 24 heures
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache les requêtes d'auth Supabase
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/v1\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-auth-cache",
          networkTimeoutSeconds: 8,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60, // 1 heure
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache les requêtes de stockage Supabase (avatars)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "supabase-storage-cache",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default withPWA(nextConfig);
