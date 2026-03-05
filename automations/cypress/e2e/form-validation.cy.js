describe("Form Validation — Negative Cases", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("rejects a single-word name", () => {
    cy.get("#user-input").type("John{enter}");
    cy.get(".msg.error").should("contain.text", "first and last name");
    cy.get(".step[data-step='1']").should("not.have.class", "done");
  });

  it("rejects an empty submission", () => {
    cy.get("#user-input").type("{enter}");
    cy.get(".msg.user").should("not.exist");
  });

  it("rejects an invalid email", () => {
    cy.get("#user-input").type("John Doe{enter}");
    cy.get("#user-input").type("not-an-email{enter}");
    cy.get(".msg.error").should("contain.text", "valid email");
  });

  it("rejects a short phone number", () => {
    cy.get("#user-input").type("John Doe{enter}");
    cy.get("#user-input").type("john@example.com{enter}");
    cy.get("#user-input").type("12345{enter}");
    cy.get(".msg.error").should("contain.text", "10 digits");
  });

  it("rejects an unsupported file type", () => {
    cy.get("#user-input").type("John Doe{enter}");
    cy.get("#user-input").type("john@example.com{enter}");
    cy.get("#user-input").type("5551234567{enter}");
    cy.get("#user-input").type("photo.bmp{enter}");
    cy.get(".msg.error").should("contain.text", "Only .jpeg");
  });

  it("recovers from validation errors and continues", () => {
    // Bad name, then good name
    cy.get("#user-input").type("Madonna{enter}");
    cy.get(".msg.error").should("exist");
    cy.get("#user-input").type("Madonna Ciccone{enter}");
    cy.get(".step[data-step='1']").should("have.class", "done");

    // Bad email, then good email
    cy.get("#user-input").type("bad{enter}");
    cy.get("#user-input").type("madonna@music.com{enter}");
    cy.get(".step[data-step='2']").should("have.class", "done");
  });
});
