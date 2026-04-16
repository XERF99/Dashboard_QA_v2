// ═══════════════════════════════════════════════════════════
//  ACCESSIBILITY TESTS — axe-core automated WCAG validation
//  Validates key components render without accessibility violations.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { axe, toHaveNoViolations } from "./helpers/axe-helper"

expect.extend(toHaveNoViolations)

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}))

// Mock auth context
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { id: "1", nombre: "Test User", email: "test@test.com", rol: "admin" },
    isAuthenticated: true,
    sessionLoading: false,
    canManageUsers: true,
    verSoloPropios: false,
    isAdmin: true,
    isQALead: false,
    isQA: false,
    canCreateHU: true,
    isOwner: false,
    users: [],
    roles: [],
    pendingBlockEvents: [],
    clearBlockEvents: vi.fn(),
    logout: vi.fn(),
  }),
}))

describe("Accessibility (axe-core)", () => {
  it("login screen has no critical violations", async () => {
    const { LoginScreen } = await import("@/components/auth/login-screen")
    const { container } = render(<LoginScreen />)
    const results = await axe(container)
    // Filter to critical/serious only — minor issues are tracked but not blocking
    const critical = results.violations.filter(
      v => v.impact === "critical" || v.impact === "serious"
    )
    expect(critical).toHaveLength(0)
  })

  it("tab skeleton renders accessibly", async () => {
    const { TabSkeleton } = await import("@/components/dashboard/shared/tab-skeleton")
    const { container } = render(<TabSkeleton />)
    const results = await axe(container)
    const critical = results.violations.filter(
      v => v.impact === "critical" || v.impact === "serious"
    )
    expect(critical).toHaveLength(0)
  })

  it("confirm delete modal has no critical violations", async () => {
    const { ConfirmDeleteModal } = await import("@/components/dashboard/shared/confirm-delete-modal")
    const { container } = render(
      <ConfirmDeleteModal
        open={true}
        titulo="Eliminar elemento"
        subtitulo="¿Estás seguro?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    const results = await axe(container)
    const critical = results.violations.filter(
      v => v.impact === "critical" || v.impact === "serious"
    )
    expect(critical).toHaveLength(0)
  })
})
