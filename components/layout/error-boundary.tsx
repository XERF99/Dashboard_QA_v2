"use client"

import { Component, type ReactNode, type ErrorInfo } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { clientError } from "@/lib/client-logger"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    clientError("ErrorBoundary", error.message, {
      ...error,
      componentStack: info.componentStack ?? "",
    })
  }

  private handleRetry = () => this.setState({ hasError: false, error: undefined })

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 bg-background">
          <div className="flex flex-col items-center gap-3 max-w-md text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Algo salió mal</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message ?? "Error inesperado en la aplicación."}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
