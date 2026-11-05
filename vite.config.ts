import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const srcPath = decodeURIComponent(new URL("./app/src", import.meta.url).pathname)
  .replace(/^\/(?=[A-Za-z]:)/, "");

const proxy = {
  "/api": {
    target: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:3001",
    changeOrigin: false,
  },
};

export default defineConfig({
  resolve: {
    alias: { "@": srcPath },
  },
  plugins: [react(), tailwindcss()],
  build: { license: { fileName: "licenses/dependencies.txt" } },
  server: { proxy },
  preview: { proxy },
});
