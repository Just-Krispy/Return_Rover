// cypress/integration/element-interaction.spec.js
describe('Element Interaction Test', () => {
  it('Should interact with the user input field', () => {
    cy.visit('https://just-krispy.github.io/Return_Rover/');
    cy.get('#user-input').type('Hello, Cypress!');
    cy.get('#user-input').should('have.value', 'Hello, Cypress!');
  });
});
