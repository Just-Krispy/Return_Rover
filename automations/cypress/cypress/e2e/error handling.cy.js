// cypress/integration/error-handling.spec.js
describe('Error Handling Test', () => {
  it('Should handle errors gracefully', () => {
    cy.visit('https://just-krispy.github.io/Return_Rover/');
    // Simulate an error scenario (modify the selector accordingly)
    cy.get('#nonexistent-element').should('not.exist');
    cy.contains('p', 'Thank you for stopping by').should('exist');
  });
});
