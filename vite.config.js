import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // Relative asset paths make the build work reliably on GitHub Pages
  // whether it is deployed via Actions or uploaded manually.
  base: "./",
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
