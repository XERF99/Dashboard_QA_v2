/**
 * axe-core helper for vitest accessibility testing.
 * Wraps axe-core's run() for use with jsdom containers.
 */

import { run, type AxeResults, type Result } from "axe-core"

export async function axe(container: Element): Promise<AxeResults> {
  return run(container, {
    rules: {
      // Disable color-contrast in jsdom (no real rendering)
      "color-contrast": { enabled: false },
    },
  })
}

/**
 * Custom matcher: expect(results).toHaveNoViolations()
 */
export const toHaveNoViolations = {
  toHaveNoViolations(results: AxeResults) {
    const violations = results.violations
    const pass = violations.length === 0

    const message = pass
      ? () => "Expected accessibility violations but found none"
      : () => {
          const msgs = violations.map(
            (v: Result) =>
              `  [${v.impact}] ${v.id}: ${v.description}\n    ${v.nodes.length} element(s) affected\n    Help: ${v.helpUrl}`
          )
          return `Found ${violations.length} accessibility violation(s):\n${msgs.join("\n\n")}`
        }

    return { pass, message }
  },
}
