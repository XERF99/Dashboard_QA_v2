# Encender Redis en producción (rate-limit pluggable)

Guía paso a paso para activar el backend Redis del rate-limiter. La infraestructura ya está lista desde v2.73; desde v2.77 `@upstash/redis` es dep oficial. Este documento cubre el provisioning y el flip del env flag.

## Cuándo vale la pena

El `MemoryRateLimitStore` (default) funciona en un solo proceso: el contador vive en un `Map` en memoria. En serverless con N réplicas (Vercel, Lambda), cada instancia tiene su propio contador → el límite efectivo es `N × limit` configurado, no el configurado.

Encender Redis es recomendable cuando:

- Tienes **más de una réplica** en producción (Vercel detecta tráfico y escala).
- El rate-limit es **crítico** para protección contra fuerza bruta (login, refresh).
- Necesitas contadores compartidos entre regiones/edges.

Para un dashboard interno con una sola instancia, el default in-memory es suficiente y simplifica el stack.

## Paso 1 — Crear la instancia Upstash

1. Entra a [upstash.com](https://upstash.com) y haz login.
2. **Create Database** → tipo **Regional** (más rápido) o **Global** (multi-región, ~2× más caro).
3. Región: elige la más cercana al hosting de tu app (para Vercel en us-east-1, usa `us-east-1`).
4. Habilita **TLS** (ON por defecto).
5. Plan:
   - **Free**: 10k comandos/día — suficiente para un dashboard de equipo pequeño.
   - **Pay as you go**: $0.2 por 100k comandos, sin mínimo.
6. Tras crear, copia desde la pestaña **REST API**:
   - `UPSTASH_REDIS_REST_URL` — algo como `https://us1-mega-gnu-12345.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` — empieza con `AX...`

## Paso 2 — Configurar las env vars

### En Vercel

```
Settings → Environment Variables → Add
```

| Variable | Valor | Environment |
|---|---|---|
| `RATE_LIMIT_BACKEND` | `redis` | Production, Preview |
| `UPSTASH_REDIS_REST_URL` | (copiado de Upstash) | Production, Preview |
| `UPSTASH_REDIS_REST_TOKEN` | (copiado de Upstash) | Production (encrypted) |

Después de guardar, **redeploya** el proyecto para que los nuevos env vars apliquen.

### En Docker / self-hosted

Añade al `.env.production`:

```env
RATE_LIMIT_BACKEND=redis
UPSTASH_REDIS_REST_URL=https://us1-mega-gnu-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
```

Reinicia el contenedor / proceso.

## Paso 3 — Verificar el flip

### Buscar en los logs al arranque

El primer request después del redeploy dispara la inicialización del store. Deberías ver en los logs:

```
INFO [rate-limit-store] Backend seleccionado: redis
```

Si ves:

```
WARN [rate-limit-store] RATE_LIMIT_BACKEND=redis pero faltan credenciales UPSTASH_REDIS_REST_*
WARN [rate-limit-store] Fallback a memory (Redis no disponible)
```

→ las env vars no se cargaron. Verifica que el redeploy incluyó el environment correcto.

### Probar el flujo

Método rápido: dispara el rate-limit intencionadamente y comprueba que funciona entre dos instancias.

```bash
# Dispara 61 peticiones a /api/metricas (límite 60/min).
for i in {1..61}; do
  curl -s -o /dev/null -w "%{http_code} " \
    -H "Authorization: Bearer $TOKEN" \
    https://tu-app.vercel.app/api/metricas
done
echo
```

Salida esperada con Redis correctamente encendido:

```
200 200 200 ... 200 429
```

El `429` aparece a partir del request 61 **incluso si Vercel ruteó las peticiones a instancias distintas** — prueba de que el contador es compartido. Con memory, verías más de 60 × 200s cuando hay múltiples réplicas.

### Panel de Upstash

En [console.upstash.com](https://console.upstash.com), tu instancia muestra:

- **Commands**: cuenta cada `INCR` + `PEXPIRE` + `PTTL`. Con ~60 peticiones/min del test → ~180 comandos (3 por petición).
- **Data Browser**: busca keys con prefijo `<ip>:<route>`. Cada una con TTL en ms.

Si ves comandos llegando, Redis está recibiendo tráfico correctamente.

## Rollback — si algo sale mal

El fallback automático te protege, pero si quieres forzar vuelta a memory:

1. En Vercel: cambia `RATE_LIMIT_BACKEND` a `memory` (o elimínalo).
2. Redeploya.
3. Los logs mostrarán el store por defecto nuevamente.

El código **no cambia** — el flip es 100 % por env var. No hace falta rollback de commits.

## Coste estimado

| Tráfico | Comandos Redis/día | Plan recomendado | Coste/mes |
|---|---|---|---|
| ~10 req/s pico, 1k usuarios | ~2M | Free (10M/mes gratis) | $0 |
| ~50 req/s pico, 10k usuarios | ~10M | Pay as you go | ~$2 |
| ~500 req/s sostenido | ~100M | Pro tier | ~$25 |

Cada request autenticado consume 3 comandos Redis (`INCR` + `PTTL` + eventualmente `PEXPIRE`), más los 1–2 comandos si tiene rate-limit extra (ej. `requireRateLimit` con `keyExtra` por usuario).

## Monitoreo recomendado

- Alertas en Upstash para **connection errors** → si Redis cae, el fallback a memory te mantiene vivo pero perdés el scope cross-réplica.
- En tu APM / Vercel Analytics: rate de **429s** → picos anómalos indican intentos de abuso (valioso para ajustar límites).

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| Siempre caes a memory aunque `RATE_LIMIT_BACKEND=redis` | Env var no se cargó al build | Redeploy forzado (no cache) |
| Comandos fallan con "Unauthorized" | Token inválido/expirado | Rotar token en Upstash + actualizar env |
| Latencia de auth sube 50+ ms | Región Upstash lejos del host | Crear instancia en la misma región que el deploy |
| Comandos explotan (millones por hora) | Misma ventana, muchas IPs | Normal. Si es DoS, sube `limit` o añade captcha antes del rate-limit |

## Referencias

- [@upstash/redis SDK](https://github.com/upstash/upstash-redis)
- [lib/backend/middleware/rate-limit-store.ts](../lib/backend/middleware/rate-limit-store.ts) — implementación del store
- [lib/backend/middleware/guards.ts](../lib/backend/middleware/guards.ts) — `requireRateLimit` que consume el store
- [.env.example](../.env.example) — plantilla de env vars
