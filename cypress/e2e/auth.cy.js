describe('Authentication Flow', () => {
  const testUser = {
    email: `cypress-test-${Date.now()}@example.com`,
    password: 'testpassword123',
    firstName: 'Cypress',
    lastName: 'Test',
    username: `cypresstest${Date.now()}`
  }

  beforeEach(() => {
    // Clear local storage and cookies
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('User Registration', () => {
    it('should display registration form', () => {
      cy.visit('/register')
      cy.contains('Create Your Account').should('be.visible')
      cy.get('[data-cy=email-input]').should('be.visible')
      cy.get('[data-cy=password-input]').should('be.visible')
      cy.get('[data-cy=firstName-input]').should('be.visible')
      cy.get('[data-cy=lastName-input]').should('be.visible')
      cy.get('[data-cy=username-input]').should('be.visible')
      cy.get('[data-cy=register-button]').should('be.visible')
    })

    it('should validate form fields', () => {
      cy.visit('/register')
      
      // Try to submit empty form
      cy.get('[data-cy=register-button]').click()
      
      // Check for validation errors
      cy.contains('Email is required').should('be.visible')
      cy.contains('Password is required').should('be.visible')
      cy.contains('First name is required').should('be.visible')
      cy.contains('Last name is required').should('be.visible')
      cy.contains('Username is required').should('be.visible')
    })

    it('should validate email format', () => {
      cy.visit('/register')
      
      cy.get('[data-cy=email-input]').type('invalid-email')
      cy.get('[data-cy=register-button]').click()
      
      cy.contains('Please enter a valid email address').should('be.visible')
    })

    it('should validate password strength', () => {
      cy.visit('/register')
      
      cy.get('[data-cy=password-input]').type('weak')
      cy.get('[data-cy=register-button]').click()
      
      cy.contains('Password must be at least 8 characters').should('be.visible')
    })

    it('should successfully register a new user', () => {
      cy.visit('/register')
      
      // Fill out the registration form
      cy.get('[data-cy=email-input]').type(testUser.email)
      cy.get('[data-cy=password-input]').type(testUser.password)
      cy.get('[data-cy=firstName-input]').type(testUser.firstName)
      cy.get('[data-cy=lastName-input]').type(testUser.lastName)
      cy.get('[data-cy=username-input]').type(testUser.username)
      cy.get('[data-cy=terms-checkbox]').check()
      
      // Submit the form
      cy.get('[data-cy=register-button]').click()
      
      // Check for success message or redirect
      cy.url().should('include', '/login')
      cy.contains('Registration successful').should('be.visible')
    })
  })

  describe('User Login', () => {
    it('should display login form', () => {
      cy.visit('/login')
      cy.contains('Welcome Back').should('be.visible')
      cy.get('[data-cy=email-input]').should('be.visible')
      cy.get('[data-cy=password-input]').should('be.visible')
      cy.get('[data-cy=login-button]').should('be.visible')
    })

    it('should validate login form', () => {
      cy.visit('/login')
      
      // Try to submit empty form
      cy.get('[data-cy=login-button]').click()
      
      // Check for validation errors
      cy.contains('Email is required').should('be.visible')
      cy.contains('Password is required').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      
      cy.get('[data-cy=email-input]').type('invalid@example.com')
      cy.get('[data-cy=password-input]').type('wrongpassword')
      cy.get('[data-cy=login-button]').click()
      
      cy.contains('Invalid email or password').should('be.visible')
    })

    it('should successfully login with valid credentials', () => {
      // First register the user
      cy.request('POST', `${Cypress.env('API_URL')}/api/auth/register`, testUser)
      
      cy.visit('/login')
      
      cy.get('[data-cy=email-input]').type(testUser.email)
      cy.get('[data-cy=password-input]').type(testUser.password)
      cy.get('[data-cy=login-button]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.contains('Welcome').should('be.visible')
    })

    it('should persist login state', () => {
      // Login first
      cy.request('POST', `${Cypress.env('API_URL')}/api/auth/register`, testUser)
      cy.request('POST', `${Cypress.env('API_URL')}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }).then((response) => {
        window.localStorage.setItem('authToken', response.body.data.token)
        window.localStorage.setItem('user', JSON.stringify(response.body.data.user))
      })
      
      // Visit dashboard
      cy.visit('/dashboard')
      cy.contains('Welcome').should('be.visible')
      
      // Refresh page
      cy.reload()
      cy.contains('Welcome').should('be.visible')
    })
  })

  describe('User Logout', () => {
    beforeEach(() => {
      // Register and login user
      cy.request('POST', `${Cypress.env('API_URL')}/api/auth/register`, testUser)
      cy.request('POST', `${Cypress.env('API_URL')}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }).then((response) => {
        window.localStorage.setItem('authToken', response.body.data.token)
        window.localStorage.setItem('user', JSON.stringify(response.body.data.user))
      })
    })

    it('should logout successfully', () => {
      cy.visit('/dashboard')
      
      // Click logout button
      cy.get('[data-cy=user-menu]').click()
      cy.get('[data-cy=logout-button]').click()
      
      // Should redirect to login page
      cy.url().should('include', '/login')
      
      // Local storage should be cleared
      cy.window().then((window) => {
        expect(window.localStorage.getItem('authToken')).to.be.null
        expect(window.localStorage.getItem('user')).to.be.null
      })
    })
  })

  describe('Password Reset', () => {
    it('should navigate to forgot password page', () => {
      cy.visit('/login')
      cy.contains('Forgot your password?').click()
      cy.url().should('include', '/forgot-password')
    })

    it('should validate email for password reset', () => {
      cy.visit('/forgot-password')
      
      cy.get('[data-cy=reset-button]').click()
      cy.contains('Email is required').should('be.visible')
      
      cy.get('[data-cy=email-input]').type('invalid-email')
      cy.get('[data-cy=reset-button]').click()
      cy.contains('Please enter a valid email address').should('be.visible')
    })

    it('should send password reset email', () => {
      cy.visit('/forgot-password')
      
      cy.get('[data-cy=email-input]').type(testUser.email)
      cy.get('[data-cy=reset-button]').click()
      
      cy.contains('Password reset email sent').should('be.visible')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
      
      cy.visit('/family-tree')
      cy.url().should('include', '/login')
    })

    it('should allow authenticated users to access protected routes', () => {
      // Login user
      cy.request('POST', `${Cypress.env('API_URL')}/api/auth/register`, testUser)
      cy.request('POST', `${Cypress.env('API_URL')}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }).then((response) => {
        window.localStorage.setItem('authToken', response.body.data.token)
        window.localStorage.setItem('user', JSON.stringify(response.body.data.user))
      })
      
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      cy.contains('Welcome').should('be.visible')
    })
  })
}) 