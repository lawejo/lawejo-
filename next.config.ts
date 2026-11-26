import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Navigation og server actions venter, mens der ikke er net, og prøver igen, når det er tilbage.
  experimental: {
    useOffline: true,
  },
  // Service workeren må ikke caches, så en ny version altid bliver hentet.
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};

export default nextConfig;
