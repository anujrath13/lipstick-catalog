import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Lipstick Library",
    short_name: "Lipsticks",
    description: "Organize your lipstick shades, favorites, and collection.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7fb",
    theme_color: "#fb7185",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
