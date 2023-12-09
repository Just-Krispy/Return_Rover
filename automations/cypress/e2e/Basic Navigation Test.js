// cypress/integration/navigation.spec.js
describe('Navigation Test', () => {
  it('Should navigate to the Return Rover page', () => {
    cy.visit('https://just-krispy.github.io/Return_Rover/');
    cy.url().should('include', 'Return_Rover');
  });
});
