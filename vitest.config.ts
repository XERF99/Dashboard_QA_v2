import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Scope del gate: backend + APIs (lo testeado hoy). Los componentes
      // entrarán en Fase 4 (split de componentes > 500 LOC) cuando se
      // añadan tests unitarios por sub-componente.
      include: ["lib/backend/**", "app/api/**"],
      exclude: ["**/node_modules/**", "tests/**", "prisma/**", "scripts/**"],
      // Gate anti-regresión. Current baseline v2.72: lines/statements ~73 %,
      // branches ~87 %, functions ~77 %. Umbrales fijados ~3 puntos por
      // debajo para tolerar ruido. Subir en cada fase al añadir tests.
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 80,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
