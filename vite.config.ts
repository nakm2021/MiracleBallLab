import { defineConfig } from "vite";

export default defineConfig({
  base: "/MiracleBallLab/",
  server: {
    proxy: {
      "/MiracleBallLab/remote-miracle-assets": {
        target: "https://pub-53a4b50cc39c4d7882f67fc9340fe6e8.r2.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/MiracleBallLab\/remote-miracle-assets/, ""),
      },
    },
  },
});
