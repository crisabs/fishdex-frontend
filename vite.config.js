import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const githubRepository = process.env.GITHUB_REPOSITORY;
const repositoryName = githubRepository?.split("/")[1] || "fishdex-frontend";
const githubPagesBase = `/${repositoryName}/`;

export default defineConfig({
  // GitHub Pages serves project sites from /<repo>/, while local dev uses /.
  base: process.env.GITHUB_ACTIONS === "true" ? githubPagesBase : "/",
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
