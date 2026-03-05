describe("Health Check", () => {
  it("loads the page and displays the heading", () => {
    cy.visit("/");
    cy.get("h1").should("contain.text", "Return");
    cy.get("h1").should("contain.text", "Rover");
  });

  it("renders essential UI elements", () => {
    cy.visit("/");
    cy.get("#chat-container").should("be.visible");
    cy.get("#user-input").should("be.visible");
    cy.get("#progress-bar").should("be.visible");
    cy.get(".logo").should("be.visible");
    cy.get("#dark-toggle").should("exist");
    cy.get("#chat-header").should("be.visible");
    cy.get(".features").should("be.visible");
    cy.get(".social-proof").should("be.visible");
  });

  it("starts with the first question", () => {
    cy.visit("/");
    cy.get("#chat-messages .msg.system").should("contain.text", "full name");
  });

  it("shows feature pills", () => {
    cy.visit("/");
    cy.get(".pill").should("have.length", 3);
    cy.get(".pill").eq(0).should("contain.text", "Instant");
    cy.get(".pill").eq(1).should("contain.text", "Secure");
    cy.get(".pill").eq(2).should("contain.text", "Easy");
  });
});
