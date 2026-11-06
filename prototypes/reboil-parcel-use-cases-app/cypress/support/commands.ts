declare global {
  namespace Cypress {
    interface Chainable {
      getByTestId(value: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('getByTestId', (value) => cy.get(`[data-testid="${value}"]`))

export {}
