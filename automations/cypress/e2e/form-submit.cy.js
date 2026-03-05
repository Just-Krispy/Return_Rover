describe("Form Submission — Happy Path", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("completes all 4 steps and shows summary", () => {
    // Step 1: Name
    cy.get("#user-input").type("John Doe{enter}");
    cy.get(".msg.user").should("contain.text", "John Doe");
    cy.get(".step[data-step='1']").should("have.class", "done");

    // Step 2: Email
    cy.get("#user-input").type("john@example.com{enter}");
    cy.get(".step[data-step='2']").should("have.class", "done");

    // Step 3: Phone
    cy.get("#user-input").type("5551234567{enter}");
    cy.get(".step[data-step='3']").should("have.class", "done");

    // Step 4: File
    cy.get("#user-input").type("receipt.pdf{enter}");
    cy.get(".step[data-step='4']").should("have.class", "done");

    // Summary card appears
    cy.get(".summary-card").should("be.visible");
    cy.get(".summary-card").within(() => {
      cy.get(".field-value").eq(0).should("contain.text", "John Doe");
      cy.get(".field-value").eq(1).should("contain.text", "john@example.com");
      cy.get(".field-value").eq(2).should("contain.text", "(555) 123-4567");
      cy.get(".field-value").eq(3).should("contain.text", "receipt.pdf");
    });

    // Input disabled after completion
    cy.get("#user-input").should("be.disabled");

    // Success message
    cy.get(".msg.success").should("contain.text", "All set");
  });
});
