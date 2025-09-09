import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import AuthForm from '../AuthForm'

// Mock the supabase auth
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
    }
  }
}))

describe('AuthForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Sign Up Flow', () => {
    it('renders signup form by default', () => {
      render(<AuthForm />)
      
      expect(screen.getByText('Join FlowPay')).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/i am a/i)).toBeInTheDocument()
    })

    it('shows role selection for signup', () => {
      render(<AuthForm />)
      
      const roleSelect = screen.getByLabelText(/i am a/i)
      expect(roleSelect).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      render(<AuthForm />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      render(<AuthForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('shows password strength indicator', async () => {
      render(<AuthForm />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, 'weak')
      
      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument()
      })
    })

    it('submits valid signup form', async () => {
      mockSignUp.mockResolvedValueOnce({ 
        data: { user: { id: '123' } }, 
        error: null 
      })
      
      render(<AuthForm />)
      
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!')
      
      const roleSelect = screen.getByLabelText(/i am a/i)
      await user.click(roleSelect)
      await user.click(screen.getByText('Creator'))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'StrongPassword123!',
          options: {
            data: {
              first_name: 'John',
              last_name: 'Doe',
              role: 'CREATOR'
            }
          }
        })
      })
    })
  })

  describe('Sign In Flow', () => {
    it('switches to signin mode', async () => {
      render(<AuthForm />)
      
      const signinLink = screen.getByText(/already have an account/i)
      await user.click(signinLink)
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument()
    })

    it('submits valid signin form', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '123' } },
        error: null
      })
      
      render(<AuthForm />)
      
      // Switch to signin
      await user.click(screen.getByText(/already have an account/i))
      
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123'
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('displays signup error', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already registered' }
      })
      
      render(<AuthForm />)
      
      // Fill form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!')
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
      })
    })

    it('displays signin error', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' }
      })
      
      render(<AuthForm />)
      
      // Switch to signin
      await user.click(screen.getByText(/already have an account/i))
      
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<AuthForm />)
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('has proper ARIA attributes', () => {
      render(<AuthForm />)
      
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      render(<AuthForm />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      firstNameInput.focus()
      expect(document.activeElement).toBe(firstNameInput)
      
      await user.tab()
      expect(document.activeElement).toBe(screen.getByLabelText(/last name/i))
    })
  })
})