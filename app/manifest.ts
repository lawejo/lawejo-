import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "lawejo",
    short_name: "lawejo",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1129",
    theme_color: "#0b1129",
  };
}
