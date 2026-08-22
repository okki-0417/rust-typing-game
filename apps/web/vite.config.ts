import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react()],
  run: {
    tasks: {
      dev: {
        command: "vp dev",
        dependsOn: [{ task: "build", from: "dependencies" }],
        cache: false,
      },
      build: {
        command: "vp build",
        dependsOn: [{ task: "build", from: "dependencies" }],
      },
    },
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
});
