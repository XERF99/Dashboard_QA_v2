import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

/** @type {import('next').NextConfig} */

// 'unsafe-eval' solo es necesario en desarrollo para el hot-reload de Next.js.
// En producción se omite para reducir la superficie de ataque XSS.
const isDev = process.env.NODE_ENV !== "production"

const securityHeaders = [
  // Evita que la app sea embebida en iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Impide que el browser interprete archivos con tipo MIME incorrecto
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla qué información se envía en el header Referer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva acceso a hardware no necesario
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Fuerza HTTPS por 2 años (solo activo en producción)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Política de fuentes de contenido: restringe orígenes permitidos.
  // En producción se elimina 'unsafe-eval' (solo necesario para el hot-reload de Next.js).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  images: {
    // En producción Vercel optimiza imágenes automáticamente (mejor performance y ancho de banda).
    // Solo desactivar en desarrollo para evitar el daemon de optimización local.
    unoptimized: process.env.NODE_ENV !== "production",
  },
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
