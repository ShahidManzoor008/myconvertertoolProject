/// <reference types="cypress" />
/// <reference types="cypress-image-snapshot" />

describe('Home Page Visual Regression', () => {
  it('should match the home page screenshot', () => {
    cy.visit('/');
    cy.get('#root').should('be.visible'); // Wait for the root element to be visible
    cy.document().toMatchImageSnapshot();
  });

  it('should match the sidebar open screenshot', () => {
    cy.visit('/');
    cy.get('[aria-label="Open sidebar"]').click(); // Assuming a button to open sidebar
    cy.get('.sidebar').should('be.visible'); // Wait for the sidebar to be visible
    cy.document().toMatchImageSnapshot({ blackout: ['.sidebar-dynamic-content'] }); // Blackout dynamic content if any
  });
});
