// ═══════════════════════════════════════════════════════════
//  E2E — Flujo completo TCS Dashboard (Playwright)
//  Cubre: login → HU → casos → tareas → comentarios →
//         usuarios (crear/eliminar) → navegación de tabs
//
//  Prerequisito: `pnpm dev` corriendo en localhost:3000
//                Datos semilla cargados (pnpm prisma db seed)
// ═══════════════════════════════════════════════════════════

import { test, expect, Page } from "@playwright/test"

// ── Credenciales seed ───────────────────────────────────────
const ADMIN_EMAIL    = "admin@empresa.com"
const ADMIN_PASSWORD = "admin123"

// ── Helpers ─────────────────────────────────────────────────

async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto("/")
  await page.getByPlaceholder("usuario@empresa.com").fill(email)
  await page.getByPlaceholder("••••••••").fill(password)
  await page.getByRole("button", { name: /ingresar/i }).click()
  // Esperar que el dashboard cargue (tab "Inicio" visible)
  await expect(page.getByRole("tab", { name: /inicio/i })).toBeVisible({ timeout: 20_000 })
}

async function goToTab(page: Page, name: string) {
  await page.getByRole("tab", { name: new RegExp(name, "i") }).click()
}

// ── Test suite ───────────────────────────────────────────────

test.describe("Flujo completo TCS Dashboard", () => {

  // Compartir estado de sesión entre tests del mismo worker
  test.use({ storageState: undefined })

  // ── 1. Login ──────────────────────────────────────────────
  test("1 · Login como admin", async ({ page }) => {
    await page.goto("/")
    // La pantalla de login debe aparecer
    await expect(page.getByPlaceholder("usuario@empresa.com")).toBeVisible()

    await page.getByPlaceholder("usuario@empresa.com").fill(ADMIN_EMAIL)
    await page.getByPlaceholder("••••••••").fill(ADMIN_PASSWORD)
    await page.getByRole("button", { name: /ingresar/i }).click()

    // Post-login: dashboard visible
    await expect(page.getByRole("tab", { name: /inicio/i })).toBeVisible({ timeout: 20_000 })
  })

  // ── 2. Navegación entre tabs ──────────────────────────────
  test("2 · Navegación entre todas las tabs", async ({ page }) => {
    await login(page)

    const tabs = ["Historias", "Analytics", "Carga", "Bloqueos", "Casos", "Admin"]
    for (const tab of tabs) {
      await goToTab(page, tab)
      // Esperar que el contenido de esa tab aparezca (sin error 500)
      await expect(page.locator("main, [role='tabpanel']").first()).toBeVisible()
      await expect(page.getByText(/error interno|500/i)).toHaveCount(0)
    }
  })

  // ── 3. Crear Historia de Usuario ──────────────────────────
  test("3 · Crear Historia de Usuario", async ({ page }) => {
    await login(page)
    await goToTab(page, "Historias")

    // Abrir formulario de nueva HU
    await page.getByRole("button", { name: /nueva hu/i }).click()
    await expect(page.getByPlaceholder("Título del cambio...")).toBeVisible()

    // Rellenar campos obligatorios
    const ts = Date.now()
    await page.getByPlaceholder("Título del cambio...").fill(`HU E2E Test ${ts}`)
    await page.getByPlaceholder("Nombre del solicitante").fill("QA Robot")
    await page.getByPlaceholder("Departamento/área").fill("Engineering")

    // QA Responsable — seleccionar el primer ítem del Select
    const qaSelect = page.locator("label", { hasText: /QA Responsable/i }).locator("..").locator("[role='combobox']")
    await qaSelect.click()
    await page.locator("[role='option']").first().click()

    // Aplicación / Sistema
    const appInput = page.getByPlaceholder("Nombre del sistema")
    if (await appInput.isVisible()) {
      await appInput.fill("Sistema E2E")
    }

    // Enviar
    await page.getByRole("button", { name: /crear historia de usuario/i }).click()

    // La HU debe aparecer en la tabla
    await expect(page.getByText(`HU E2E Test ${ts}`)).toBeVisible({ timeout: 15_000 })
  })

  // ── 4. Abrir HU y crear Caso de Prueba ───────────────────
  test("4 · Crear Caso de Prueba dentro de una HU", async ({ page }) => {
    await login(page)
    await goToTab(page, "Historias")

    // Abrir la primera HU disponible haciendo clic en su fila/nombre
    const firstHU = page.locator("table tbody tr, [data-hu]").first()
    await firstHU.click()

    // Esperar que el panel de detalle de la HU aparezca
    await expect(page.getByRole("button", { name: /nuevo caso/i })).toBeVisible({ timeout: 10_000 })

    // Crear nuevo caso de prueba
    await page.getByRole("button", { name: /nuevo caso/i }).click()
    await expect(page.getByPlaceholder("Título del caso de prueba *")).toBeVisible()

    const ts = Date.now()
    await page.getByPlaceholder("Título del caso de prueba *").fill(`CP E2E ${ts}`)
    await page.getByPlaceholder("Descripción...").fill("Caso generado por test E2E")

    // Guardar caso
    await page.getByRole("button", { name: /guardar/i }).first().click()

    // El caso debe aparecer en la lista
    await expect(page.getByText(`CP E2E ${ts}`)).toBeVisible({ timeout: 10_000 })
  })

  // ── 5. Agregar Tarea a un Caso ───────────────────────────
  test("5 · Agregar Tarea dentro de un Caso de Prueba", async ({ page }) => {
    await login(page)
    await goToTab(page, "Historias")

    // Abrir la primera HU
    await page.locator("table tbody tr, [data-hu]").first().click()
    await expect(page.getByRole("button", { name: /nuevo caso/i })).toBeVisible({ timeout: 10_000 })

    // Expandir el primer caso de prueba (clic en su cabecera/título)
    const firstCaso = page.locator("[data-caso], .caso-card, article").first()
    await firstCaso.click()

    // Botón "+ Tarea"
    const btnTarea = page.getByRole("button", { name: /\+ tarea/i }).first()
    await btnTarea.scrollIntoViewIfNeeded()
    await btnTarea.click()

    // Rellenar título de tarea
    const ts = Date.now()
    await page.getByPlaceholder("Título de la tarea *").fill(`Tarea E2E ${ts}`)

    // Crear
    await page.getByRole("button", { name: /crear/i }).first().click()

    // La tarea debe aparecer
    await expect(page.getByText(`Tarea E2E ${ts}`)).toBeVisible({ timeout: 10_000 })
  })

  // ── 6. Agregar Comentario a la HU ───────────────────────
  test("6 · Agregar Comentario a la Historia de Usuario", async ({ page }) => {
    await login(page)
    await goToTab(page, "Historias")

    // Abrir la primera HU
    await page.locator("table tbody tr, [data-hu]").first().click()

    // Escribir comentario
    const ts = Date.now()
    const textarea = page.getByPlaceholder(/escribe un comentario/i)
    await textarea.scrollIntoViewIfNeeded()
    await textarea.fill(`Comentario E2E ${ts}`)

    // Enviar
    await page.getByRole("button", { name: /enviar/i }).click()

    // El comentario debe aparecer
    await expect(page.getByText(`Comentario E2E ${ts}`)).toBeVisible({ timeout: 10_000 })
  })

  // ── 7. Tab Casos — listado global ───────────────────────
  test("7 · Tab Casos carga sin errores", async ({ page }) => {
    await login(page)
    await goToTab(page, "Casos")

    // La tabla de casos debe aparecer (o mensaje de vacío)
    await expect(
      page.locator("table, [data-empty]").first()
    ).toBeVisible({ timeout: 10_000 })

    await expect(page.getByText(/error interno|500/i)).toHaveCount(0)
  })

  // ── 8. Tab Analytics ─────────────────────────────────────
  test("8 · Tab Analytics muestra gráficas o métricas", async ({ page }) => {
    await login(page)
    await goToTab(page, "Analytics")

    // Algún elemento de KPIs o gráfica
    await expect(
      page.locator("h2, h3, [role='heading'], canvas, svg").first()
    ).toBeVisible({ timeout: 10_000 })

    await expect(page.getByText(/error interno|500/i)).toHaveCount(0)
  })

  // ── 9. Gestión de Usuarios — crear nuevo usuario ─────────
  test("9 · Crear nuevo usuario desde Gestión de Usuarios", async ({ page }) => {
    await login(page)
    await goToTab(page, "Admin")

    // El panel de admin puede tener sub-tabs o secciones — buscar "Gestión de Usuarios"
    const userMgmt = page.getByText(/gestión de usuarios/i)
    if (await userMgmt.isVisible()) {
      await userMgmt.click()
    }

    // Botón "Nuevo Usuario"
    await page.getByRole("button", { name: /nuevo usuario/i }).click()
    await expect(page.getByPlaceholder("Juan Pérez")).toBeVisible({ timeout: 5_000 })

    // Rellenar datos del nuevo usuario
    const ts = Date.now()
    await page.getByPlaceholder("Juan Pérez").fill(`Usuario E2E ${ts}`)
    await page.getByPlaceholder("juan@empresa.com").fill(`e2e_${ts}@empresa.com`)

    // Rol — seleccionar "viewer" (disponible para admin)
    const rolSelect = page.locator("[role='combobox']").filter({ hasText: /viewer|rol|select/i }).first()
    if (await rolSelect.isVisible()) {
      await rolSelect.click()
      await page.getByRole("option", { name: /viewer/i }).first().click()
    }

    // Crear usuario
    await page.getByRole("button", { name: /crear usuario/i }).click()

    // El nuevo usuario debe aparecer en la lista
    await expect(page.getByText(`Usuario E2E ${ts}`)).toBeVisible({ timeout: 10_000 })
  })

  // ── 10. Gestión de Usuarios — eliminar el usuario creado ─
  test("10 · Eliminar usuario creado en test anterior", async ({ page }) => {
    await login(page)
    await goToTab(page, "Admin")

    const userMgmt = page.getByText(/gestión de usuarios/i)
    if (await userMgmt.isVisible()) {
      await userMgmt.click()
    }

    // Buscar un usuario "E2E" y eliminar el primero
    const fila = page.locator("tr, [data-user-row]").filter({ hasText: /usuario e2e|e2e_.*@empresa/i }).first()
    await fila.scrollIntoViewIfNeeded()

    // Menú de acciones o botón eliminar
    const menuBtn = fila.locator("button[aria-label*='ciones'], button[aria-haspopup='menu'], [data-actions]").first()
    if (await menuBtn.isVisible()) {
      await menuBtn.click()
      await page.getByRole("menuitem", { name: /eliminar/i }).click()
    } else {
      // Botón eliminar directo
      await fila.getByRole("button", { name: /eliminar/i }).click()
    }

    // Confirmar si hay diálogo
    const confirmBtn = page.getByRole("button", { name: /confirmar|sí.*eliminar|eliminar/i }).first()
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    // El usuario ya no debe aparecer
    await expect(
      page.locator("tr, [data-user-row]").filter({ hasText: /e2e_.*@empresa/i })
    ).toHaveCount(0, { timeout: 10_000 })
  })

  // ── 11. Tab Bloqueos ─────────────────────────────────────
  test("11 · Tab Bloqueos carga sin errores", async ({ page }) => {
    await login(page)
    await goToTab(page, "Bloqueos")

    await expect(page.locator("main, [role='tabpanel']").first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/error interno|500/i)).toHaveCount(0)
  })

  // ── 12. Tab Carga Ocupacional ────────────────────────────
  test("12 · Tab Carga Ocupacional carga sin errores", async ({ page }) => {
    await login(page)
    await goToTab(page, "Carga")

    await expect(page.locator("main, [role='tabpanel']").first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/error interno|500/i)).toHaveCount(0)
  })

  // ── 13. Logout ───────────────────────────────────────────
  test("13 · Logout regresa a la pantalla de login", async ({ page }) => {
    await login(page)

    // El botón de logout puede estar en el header
    const logoutBtn = page.getByRole("button", { name: /cerrar sesión|logout|salir/i })
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    } else {
      // Menú de usuario en el header
      const userMenu = page.locator("header").getByRole("button").last()
      await userMenu.click()
      await page.getByRole("menuitem", { name: /cerrar sesión|logout|salir/i }).click()
    }

    // De regreso a login
    await expect(page.getByPlaceholder("usuario@empresa.com")).toBeVisible({ timeout: 10_000 })
  })

  // ── 14. Login fallido muestra error ─────────────────────
  test("14 · Credenciales incorrectas muestran mensaje de error", async ({ page }) => {
    await page.goto("/")
    await page.getByPlaceholder("usuario@empresa.com").fill("noexiste@empresa.com")
    await page.getByPlaceholder("••••••••").fill("wrongpassword")
    await page.getByRole("button", { name: /ingresar/i }).click()

    // Debe mostrar un mensaje de error
    await expect(
      page.getByText(/credenciales|contraseña|usuario|error/i)
    ).toBeVisible({ timeout: 10_000 })

    // Sigue en la pantalla de login
    await expect(page.getByPlaceholder("usuario@empresa.com")).toBeVisible()
  })

})
