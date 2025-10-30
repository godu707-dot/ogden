import '@testing-library/jest-dom'
import { expect, vi } from 'vitest'

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeDisabled(): void;
    toBeEnabled(): void;
    toBeEmptyDOMElement(): void;
    toBeInTheDocument(): void;
    toBeInvalid(): void;
    toBeRequired(): void;
    toBeValid(): void;
    toBeVisible(): void;
    toContainElement(element: HTMLElement | null): void;
    toContainHTML(html: string): void;
    toHaveAttribute(attr: string, value?: string): void;
    toHaveClass(...classNames: string[]): void;
    toHaveFocus(): void;
    toHaveFormValues(expectedValues: { [key: string]: any }): void;
    toHaveStyle(css: string): void;
    toHaveTextContent(text: string | RegExp): void;
    toHaveValue(value: string | string[] | number): void;
    toBeChecked(): void;
    toBePartiallyChecked(): void;
    toHaveDescription(text: string | RegExp): void;
  }
}

// Set up Jest globals needed by tests
const mockJest = {
  ...vi,
  fn: vi.fn,
  mock: vi.mock,
  spyOn: vi.spyOn,
  resetModules: vi.resetModules,
}

// @ts-ignore -- We only need a subset of Jest functionality
global.jest = mockJest

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
class IntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserver,
})

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserver,
})