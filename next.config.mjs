/** @type {import('next').NextConfig} */
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
  // Política de fuentes de contenido: restringe orígenes permitidos
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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

export default nextConfig
