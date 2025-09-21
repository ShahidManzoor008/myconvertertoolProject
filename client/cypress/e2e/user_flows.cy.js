/// <reference types="cypress" />

describe('User Workflow: Login, PDF Operation, Logout', () => {
  beforeEach(() => {
    cy.visit('/login');
    // Assuming a test user exists in your database
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/'); // Should redirect to home or dashboard after login
  });

  it('should allow a user to login, upload a PDF, perform a merge operation, and logout', () => {
    // Navigate to a tool that accepts PDF uploads, e.g., the main PDF operations page
    cy.visit('/tools/pdf-operations'); // Adjust this URL if your PDF tool is elsewhere

    // Simulate file upload
    const fileName = 'sample.pdf';
    cy.fixture(fileName, 'base64').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent,
        fileName,
        mimeType: 'application/pdf',
      });
    });

    // Wait for upload to complete and operations to be visible
    cy.contains('PDF Operations').should('be.visible');

    // Select a PDF operation, e.g., Merge PDFs
    cy.contains('Merge PDFs').click();

    // Assert that the operation is active or some indicator is present
    cy.contains('Merge PDFs').should('have.class', 'bg-blue-50'); // Assuming active class

    // Perform logout
    cy.get('[aria-label="User menu"]').click(); // Assuming a user menu button
    cy.contains('Logout').click();
    cy.url().should('include', '/login'); // Should redirect to login page after logout
  });
});
