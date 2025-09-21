/// <reference types="cypress" />
/// <reference types="cypress-axe" />

describe('Accessibility tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('Has no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  it('Has no detectable accessibility violations on the login page', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.checkA11y();
  });

  // Example of testing a specific component or interaction
  it('Has no detectable accessibility violations after opening sidebar', () => {
    cy.get('[aria-label="Open sidebar"]').click();
    cy.checkA11y();
  });
});
