/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../../components/ui/button'
import React from 'react'

describe('Button', () => {
  it('renders correctly with default props', () => {
    const { getByRole } = render(<Button>Click me</Button>)
    expect(getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies the correct variant classes', () => {
    const { rerender, getByRole } = render(<Button variant="default">Default</Button>)
    // default variant has a background class
    expect(getByRole('button')).toHaveClass('bg-background')

    rerender(<Button variant="outline">Outline</Button>)
    expect(getByRole('button')).toHaveClass('bg-transparent')

    rerender(<Button variant="ghost">Ghost</Button>)
    // ghost variant uses transparent bg and a hover primary background
    expect(getByRole('button')).toHaveClass('bg-transparent')
    expect(getByRole('button')).toHaveClass('hover:bg-primary/5')
  })

  it('applies the correct size classes', () => {
    const { rerender, getByRole } = render(<Button size="default">Default</Button>)
    // default size in this project maps to h-16
    expect(getByRole('button')).toHaveClass('h-16')

    rerender(<Button size="sm">Small</Button>)
    expect(getByRole('button')).toHaveClass('h-14')

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>)

    await userEvent.click(getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>)
    const button = getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Disabled')
    // also test that clicking the button does not fire onClick
    const handleClick = vi.fn()
    // Since this is not an async test, remove await and use userEvent.click with then(), or make the parent test async.
    // Use userEvent.click as a Promise and check expectation in .then()
    // Make the test async and await the userEvent.click, then check expectation.
    // This part of the test must be async to await userEvent.click.
    // Move handleClick up before render, and click the rendered button.
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await userEvent.click(getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();