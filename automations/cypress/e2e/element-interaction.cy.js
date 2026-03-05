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
});
