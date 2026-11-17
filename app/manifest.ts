import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "lawejo",
    short_name: "lawejo",
    start_url: "/",
    display: "standalone",
    background_color: "#111214",
    theme_color: "#111214",
  };
}
