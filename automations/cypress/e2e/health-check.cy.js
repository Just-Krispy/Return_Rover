// cypress/integration/health-check.spec.js
describe('Health Check Test', () => {
  it('Should check for healthy status', () => {
    cy.visit('https://just-krispy.github.io/Return_Rover/');
    // Add more health check assertions as needed
    cy.get('h1').should('contain.text', 'Welcome to Return Rover');
  });
});
