describe('Family Tree Functionality', () => {
  const testUser = {
    email: `cypress-tree-${Date.now()}@example.com`,
    password: 'testpassword123',
    firstName: 'Tree',
    lastName: 'Test',
    username: `treetest${Date.now()}`
  }

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

  describe('Family Tree View', () => {
    it('should display family tree page', () => {
      cy.visit('/family-tree')
      cy.contains('Family Tree').should('be.visible')
      cy.get('[data-cy=tree-canvas]').should('be.visible')
      cy.get('[data-cy=tree-toolbar]').should('be.visible')
    })

    it('should show tree controls', () => {
      cy.visit('/family-tree')
      
      // Check for zoom controls
      cy.get('[data-cy=zoom-in]').should('be.visible')
      cy.get('[data-cy=zoom-out]').should('be.visible')
      cy.get('[data-cy=center-view]').should('be.visible')
      
      // Check for add person button
      cy.get('[data-cy=add-person]').should('be.visible')
    })

    it('should be able to zoom in and out', () => {
      cy.visit('/family-tree')
      
      // Test zoom in
      cy.get('[data-cy=zoom-in]').click()
      cy.get('[data-cy=tree-canvas]').should('have.attr', 'style').and('include', 'transform')
      
      // Test zoom out
      cy.get('[data-cy=zoom-out]').click()
      cy.get('[data-cy=tree-canvas]').should('be.visible')
      
      // Test center view
      cy.get('[data-cy=center-view]').click()
      cy.get('[data-cy=tree-canvas]').should('be.visible')
    })
  })

  describe('Person Management', () => {
    it('should open add person modal', () => {
      cy.visit('/family-tree')
      
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=person-modal]').should('be.visible')
      cy.contains('Add New Person').should('be.visible')
    })

    it('should validate person form', () => {
      cy.visit('/family-tree')
      
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=save-person]').click()
      
      // Check for validation errors
      cy.contains('First name is required').should('be.visible')
      cy.contains('Last name is required').should('be.visible')
      cy.contains('Gender is required').should('be.visible')
    })

    it('should create a new person', () => {
      cy.visit('/family-tree')
      
      cy.get('[data-cy=add-person]').click()
      
      // Fill out person form
      cy.get('[data-cy=person-firstName]').type('John')
      cy.get('[data-cy=person-lastName]').type('Doe')
      cy.get('[data-cy=person-gender]').select('male')
      cy.get('[data-cy=person-birthDate]').type('1990-01-01')
      cy.get('[data-cy=person-birthPlace]').type('New York, NY')
      
      cy.get('[data-cy=save-person]').click()
      
      // Should close modal and show person in tree
      cy.get('[data-cy=person-modal]').should('not.exist')
      cy.get('[data-cy=person-node]').should('contain', 'John Doe')
    })

    it('should edit existing person', () => {
      // First create a person
      cy.visit('/family-tree')
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=person-firstName]').type('Jane')
      cy.get('[data-cy=person-lastName]').type('Smith')
      cy.get('[data-cy=person-gender]').select('female')
      cy.get('[data-cy=save-person]').click()
      
      // Now edit the person
      cy.get('[data-cy=person-node]').contains('Jane Smith').click()
      cy.get('[data-cy=edit-person]').click()
      
      cy.get('[data-cy=person-modal]').should('be.visible')
      cy.get('[data-cy=person-firstName]').clear().type('Janet')
      cy.get('[data-cy=save-person]').click()
      
      // Should show updated name
      cy.get('[data-cy=person-node]').should('contain', 'Janet Smith')
    })
  })

  describe('Relationship Management', () => {
    beforeEach(() => {
      // Create test persons
      cy.visit('/family-tree')
      
      // Create father
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=person-firstName]').type('Father')
      cy.get('[data-cy=person-lastName]').type('Test')
      cy.get('[data-cy=person-gender]').select('male')
      cy.get('[data-cy=save-person]').click()
      
      // Create mother
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=person-firstName]').type('Mother')
      cy.get('[data-cy=person-lastName]').type('Test')
      cy.get('[data-cy=person-gender]').select('female')
      cy.get('[data-cy=save-person]').click()
      
      // Create child
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=person-firstName]').type('Child')
      cy.get('[data-cy=person-lastName]').type('Test')
      cy.get('[data-cy=person-gender]').select('male')
      cy.get('[data-cy=save-person]').click()
    })

    it('should add parent relationship', () => {
      cy.get('[data-cy=person-node]').contains('Child Test').click()
      cy.get('[data-cy=add-parent]').click()
      
      cy.get('[data-cy=relationship-modal]').should('be.visible')
      cy.get('[data-cy=select-person]').select('Father Test')
      cy.get('[data-cy=relationship-type]').select('father')
      cy.get('[data-cy=save-relationship]').click()
      
      // Should show relationship line
      cy.get('[data-cy=relationship-line]').should('be.visible')
    })

    it('should add spouse relationship', () => {
      cy.get('[data-cy=person-node]').contains('Father Test').click()
      cy.get('[data-cy=add-spouse]').click()
      
      cy.get('[data-cy=relationship-modal]').should('be.visible')
      cy.get('[data-cy=select-person]').select('Mother Test')
      cy.get('[data-cy=marriage-date]').type('1980-06-15')
      cy.get('[data-cy=save-relationship]').click()
      
      // Should show spouse connection
      cy.get('[data-cy=spouse-line]').should('be.visible')
    })

    it('should delete relationship', () => {
      // First add a relationship
      cy.get('[data-cy=person-node]').contains('Child Test').click()
      cy.get('[data-cy=add-parent]').click()
      cy.get('[data-cy=select-person]').select('Father Test')
      cy.get('[data-cy=relationship-type]').select('father')
      cy.get('[data-cy=save-relationship]').click()
      
      // Then delete it
      cy.get('[data-cy=relationship-line]').rightclick()
      cy.get('[data-cy=delete-relationship]').click()
      cy.get('[data-cy=confirm-delete]').click()
      
      // Should not show relationship line
      cy.get('[data-cy=relationship-line]').should('not.exist')
    })
  })

  describe('Tree Navigation', () => {
    it('should center on person when clicked', () => {
      cy.visit('/family-tree')
      
      // Add person first
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=person-firstName]').type('Center')
      cy.get('[data-cy=person-lastName]').type('Test')
      cy.get('[data-cy=person-gender]').select('male')
      cy.get('[data-cy=save-person]').click()
      
      // Click on person
      cy.get('[data-cy=person-node]').contains('Center Test').click()
      
      // Should center the view on the person
      cy.get('[data-cy=tree-canvas]').should('have.attr', 'style').and('include', 'transform')
    })

    it('should show person details on hover', () => {
      cy.visit('/family-tree')
      
      // Add person with details
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=person-firstName]').type('Hover')
      cy.get('[data-cy=person-lastName]').type('Test')
      cy.get('[data-cy=person-gender]').select('male')
      cy.get('[data-cy=person-birthDate]').type('1990-01-01')
      cy.get('[data-cy=save-person]').click()
      
      // Hover over person
      cy.get('[data-cy=person-node]').contains('Hover Test').trigger('mouseover')
      
      // Should show tooltip
      cy.get('[data-cy=person-tooltip]').should('be.visible')
      cy.get('[data-cy=person-tooltip]').should('contain', 'Born: January 1, 1990')
    })
  })

  describe('Search and Filter', () => {
    beforeEach(() => {
      // Create multiple test persons
      const people = [
        { firstName: 'John', lastName: 'Smith', gender: 'male' },
        { firstName: 'Jane', lastName: 'Smith', gender: 'female' },
        { firstName: 'Bob', lastName: 'Johnson', gender: 'male' },
        { firstName: 'Alice', lastName: 'Johnson', gender: 'female' }
      ]
      
      cy.visit('/family-tree')
      
      people.forEach(person => {
        cy.get('[data-cy=add-person]').click()
        cy.get('[data-cy=person-firstName]').type(person.firstName)
        cy.get('[data-cy=person-lastName]').type(person.lastName)
        cy.get('[data-cy=person-gender]').select(person.gender)
        cy.get('[data-cy=save-person]').click()
      })
    })

    it('should search for persons by name', () => {
      cy.get('[data-cy=search-input]').type('John')
      cy.get('[data-cy=search-button]').click()
      
      // Should highlight matching persons
      cy.get('[data-cy=person-node]').contains('John Smith').should('have.class', 'highlighted')
      cy.get('[data-cy=person-node]').contains('Bob Johnson').should('have.class', 'highlighted')
      cy.get('[data-cy=person-node]').contains('Jane Smith').should('not.have.class', 'highlighted')
    })

    it('should filter by gender', () => {
      cy.get('[data-cy=gender-filter]').select('male')
      
      // Should only show male persons
      cy.get('[data-cy=person-node]').contains('John Smith').should('be.visible')
      cy.get('[data-cy=person-node]').contains('Bob Johnson').should('be.visible')
      cy.get('[data-cy=person-node]').contains('Jane Smith').should('not.be.visible')
      cy.get('[data-cy=person-node]').contains('Alice Johnson').should('not.be.visible')
    })

    it('should clear filters', () => {
      cy.get('[data-cy=gender-filter]').select('male')
      cy.get('[data-cy=clear-filters]').click()
      
      // Should show all persons again
      cy.get('[data-cy=person-node]').should('have.length', 4)
    })
  })

  describe('Data Persistence', () => {
    it('should save tree state on refresh', () => {
      cy.visit('/family-tree')
      
      // Add a person
      cy.get('[data-cy=add-person]').click()
      cy.get('[data-cy=person-firstName]').type('Persistent')
      cy.get('[data-cy=person-lastName]').type('Test')
      cy.get('[data-cy=person-gender]').select('male')
      cy.get('[data-cy=save-person]').click()
      
      // Refresh page
      cy.reload()
      
      // Should still show the person
      cy.get('[data-cy=person-node]').should('contain', 'Persistent Test')
    })

    it('should maintain zoom level on refresh', () => {
      cy.visit('/family-tree')
      
      // Zoom in
      cy.get('[data-cy=zoom-in]').click()
      cy.get('[data-cy=zoom-in]').click()
      
      // Get current transform
      cy.get('[data-cy=tree-canvas]').should('have.attr', 'style').then((style) => {
        const transform = style
        
        // Refresh page
        cy.reload()
        
        // Should maintain zoom level
        cy.get('[data-cy=tree-canvas]').should('have.attr', 'style', transform)
      })
    })
  })
}) 