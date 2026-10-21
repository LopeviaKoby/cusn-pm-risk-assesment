import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const srcPath = decodeURIComponent(new URL("./src", import.meta.url).pathname)
  .replace(/^\/(?=[A-Za-z]:)/, "");

export default defineConfig({
  resolve: {
    alias: { "@": srcPath },
  },
  plugins: [react(), tailwindcss()],
  build: { license: { fileName: "licenses/dependencies.txt" } },
});
