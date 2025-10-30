/// <reference types="vitest" />

declare module 'vitest' {
  interface Assertion<T> {
    toBeInTheDocument(): void;
    toBeVisible(): void;
    toHaveTextContent(text: string | RegExp): void;
    toHaveAttribute(attr: string, value?: string): void;
    toHaveClass(...classNames: string[]): void;
    toHaveStyle(css: string): void;
    toBeDisabled(): void;
    toBeEnabled(): void;
    toHaveValue(value: string | string[] | number): void;
  }
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (accounts: string[]) => void) => void
      removeListener: (event: string, callback: (accounts: string[]) => void) => void
    }
  }
}

export {}