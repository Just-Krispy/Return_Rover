describe("Health Check", () => {
  it("loads the page and displays the heading", () => {
    cy.visit("/");
    cy.get("h1").should("contain.text", "Return Rover");
  });

  it("renders essential UI elements", () => {
    cy.visit("/");
    cy.get("#chat-container").should("be.visible");
    cy.get("#user-input").should("be.visible");
    cy.get("#progress-bar").should("be.visible");
    cy.get(".logo").should("be.visible");
    cy.get("#dark-toggle").should("exist");
  });

  it("starts with the first question", () => {
    cy.visit("/");
    cy.get("#chat-messages .msg.system").should("contain.text", "full name");
  });
});
