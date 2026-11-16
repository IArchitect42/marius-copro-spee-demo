import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  base: process.env.BASE || "/",
  plugins: [react()],
  resolve: { alias: { "@dust/react-hooks": path.resolve(__dirname, "src/dust-shim.ts") } },
});
