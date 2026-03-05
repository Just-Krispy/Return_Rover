describe("Element Interaction", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("accepts text input and retains value", () => {
    cy.get("#user-input").type("Hello, Cypress!");
    cy.get("#user-input").should("have.value", "Hello, Cypress!");
  });

  it("clears input after submission", () => {
    cy.get("#user-input").type("John Doe{enter}");
    cy.get("#user-input").should("have.value", "");
  });

  it("submits via the send button", () => {
    cy.get("#user-input").type("John Doe");
    cy.get("#send-btn").click();
    cy.get(".msg.user").should("contain.text", "John Doe");
  });

  it("toggles dark mode", () => {
    cy.get("#dark-toggle").click();
    cy.get("html").should("have.attr", "data-theme", "dark");
    cy.get("#dark-toggle").click();
    cy.get("html").should("have.attr", "data-theme", "light");
  });

  it("shows progress bar with numbered steps", () => {
    cy.get(".step").should("have.length", 4);
    cy.get(".step").eq(0).find(".step-num").should("contain.text", "1");
    cy.get(".step").eq(0).should("have.class", "active");
  });
});
