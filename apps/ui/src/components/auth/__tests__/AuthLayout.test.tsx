// @ts-nocheck
/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react'
import { AuthLayout } from '../AuthLayout'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('AuthLayout', () => {
  const defaultProps = {
    title: 'Test Title',
    children: <div>Test Content</div>
  }

  it('renders with required props', () => {
    render(<AuthLayout {...defaultProps} />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('Niazi Tribe')).toBeInTheDocument()
  })

  it('renders with subtitle when provided', () => {
    render(
      <AuthLayout {...defaultProps} subtitle="Test Subtitle" />
    )
    
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(<AuthLayout {...defaultProps} />)
    
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument()
  })

  it('renders logo as link to home page', () => {
    render(<AuthLayout {...defaultProps} />)
    
    const logoLink = screen.getByRole('link')
    expect(logoLink).toHaveAttribute('href', '/')
    expect(logoLink).toContainElement(screen.getByText('Niazi Tribe'))
  })

  it('has proper CSS classes for styling', () => {
    render(<AuthLayout {...defaultProps} />)
    
    const container = screen.getByText('Test Title').closest('.sm\\:mx-auto')
    expect(container).toBeInTheDocument()
  })

  it('renders children within card layout', () => {
    render(
      <AuthLayout {...defaultProps}>
        <button>Custom Button</button>
      </AuthLayout>
    )
    
    const button = screen.getByRole('button', { name: 'Custom Button' })
    expect(button).toBeInTheDocument()
    
    // Check if button is within the card structure
    const cardBody = button.closest('.card-body')
    expect(cardBody).toBeInTheDocument()
  })

  it('maintains proper heading hierarchy', () => {
    render(<AuthLayout {...defaultProps} />)
    
    const logoHeading = screen.getByRole('heading', { level: 1 })
    const titleHeading = screen.getByRole('heading', { level: 2 })
    
    expect(logoHeading).toHaveTextContent('Niazi Tribe')
    expect(titleHeading).toHaveTextContent('Test Title')
  })

  it('applies responsive design classes', () => {
    const { container } = render(<AuthLayout {...defaultProps} />)
    
    // Check for mobile-responsive classes
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
    expect(container.querySelector('.sm\\:px-6')).toBeInTheDocument()
    expect(container.querySelector('.lg\\:px-8')).toBeInTheDocument()
  })

  it('renders children with title', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Test Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Niazi Tribe')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <AuthLayout title="Test Title" subtitle="Test Subtitle">
        <div>Test Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Test Content</div>
      </AuthLayout>
    );

    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
  });

  it('renders logo with correct link', () => {
    render(
      <AuthLayout title="Test Title">
        <div>Test Content</div>
      </AuthLayout>
    );

    const logoLink = screen.getByRole('link', { name: /niazi tribe/i });
    expect(logoLink).toHaveAttribute('href', '/');
    expect(logoLink).toContainElement(screen.getByText('Niazi Tribe'));
  });
}) 