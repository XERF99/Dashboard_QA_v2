"use client"

import { Component, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"

interface Props {
  tabName: string
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class TabErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Error en {this.props.tabName}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {this.state.error?.message ?? "Ocurrió un error inesperado"}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
