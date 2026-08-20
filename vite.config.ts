import { defineConfig } from "vite-plus";

export default defineConfig({
  // CLAUDE.md は手で整えた文書なので整形の対象にしない。
  fmt: { ignorePatterns: ["CLAUDE.md"] },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
});
