/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Pill } from '../../components/pill'
import React from 'react'

describe('Pill', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Pill>Status</Pill>)
    const pill = getByText('Status')
    expect(pill).toBeInTheDocument()
    // Pill uses inline-flex and font-mono by default
    expect(pill).toHaveClass('inline-flex')
    expect(pill).toHaveClass('font-mono')
  })
  })

  it('applies custom className', () => {
    const { getByText } = render(<Pill className="custom-class">Status</Pill>)
    const pill = getByText('Status')
    expect(pill).toHaveClass('custom-class')
  })

  it('forwards additional props', () => {
    const { getByTestId } = render(<Pill data-testid="test-pill">Status</Pill>)
    expect(getByTestId('test-pill')).toBeInTheDocument()
  })