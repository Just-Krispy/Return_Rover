describe('Form Submission', () => {
  it('Should successfully submit user information', () => {
    cy.visit('https://just-krispy.github.io/Return_Rover/');

    // Mock user inputs
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      proofOfPurchase: 'proof.pdf'
    };

    // Fill out the form
    cy.get('#user-input').type(userData.name).type('{enter}');
    cy.get('#user-input').type(userData.email).type('{enter}');
    cy.get('#user-input').type(userData.phone).type('{enter}');
    cy.get('#user-input').type(userData.proofOfPurchase).type('{enter}');

    // Verify the gathered information is displayed
    cy.get('#chat-container > p.system-message')
    .should('exist')
    .should('be.visible')
    .should('have.text', 'Thank you! Here is the information we gathered:');
  });
});
