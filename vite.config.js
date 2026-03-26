import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(() => {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const isGithubPagesBuild =
    process.env.GITHUB_ACTIONS === "true" && Boolean(repositoryName);

  return {
    base: isGithubPagesBuild ? `/${repositoryName}/` : "/",
    plugins: [vue()],
    server: {
      host: "0.0.0.0",
      port: 5173
    }
  };
});
