describe('Reboil state lab', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage()
    cy.reload()
  })

  it('renders simple, nested, and lazy store scenarios', () => {
    cy.contains('Simple').should('be.visible')
    cy.contains('Nested').should('be.visible')
    cy.contains('Lazy').should('be.visible')
    cy.getByTestId('count-value').should('have.text', '0')
    cy.getByTestId('state-inspector').should('contain', '"displayName": "Avery"')
  })

  it('gets the most recent value inside a normal function call', () => {
    cy.getByTestId('set-store').click().click()
    cy.getByTestId('read-current').click()
    cy.getByTestId('function-read').should('have.text', '2')
  })

  it('updates state through setStore and store.set and notifies count subscriptions', () => {
    cy.getByTestId('set-store').click()
    cy.getByTestId('store-set').click()
    cy.getByTestId('count-value').should('have.text', '6')
    cy.getByTestId('count-events').should('have.text', '2')
    cy.getByTestId('latest-event').should('contain', 'count: 1 → 6')
  })

  it('notifies a deep subscription only when its selected leaf changes', () => {
    cy.getByTestId('parent-runtime-change').click()
    cy.getByTestId('runtime-value').should('contain', '2.0.0')
    cy.getByTestId('runtime-events').should('have.text', '1')
    cy.getByTestId('parent-same-runtime').click()
    cy.getByTestId('runtime-events').should('have.text', '1')
  })

  it('resets a path and the complete store tree', () => {
    cy.getByTestId('store-set').click()
    cy.getByTestId('reset-count').click()
    cy.getByTestId('count-value').should('have.text', '0')
    cy.getByTestId('set-store').click()
    cy.getByTestId('parent-runtime-change').click()
    cy.getByTestId('reset-all').click()
    cy.getByTestId('count-value').should('have.text', '0')
    cy.getByTestId('runtime-value').should('contain', '1.0.0')
  })

  it('loads the code-split store through React Suspense', () => {
    cy.getByTestId('show-suspense').click()
    cy.getByTestId('suspense-fallback').should('be.visible')
    cy.getByTestId('reports-result').should('contain', '12 visits')
  })

  it('loads the code-split store before a vanilla synchronous get', () => {
    cy.getByTestId('vanilla-load').click()
    cy.getByTestId('vanilla-status').should('contain', 'Loaded — 12 visits read with store.get()')
  })

  it('persists normal fields and restores the default for an excluded field', () => {
    cy.getByTestId('parent-same-runtime').click()
    cy.getByTestId('set-transient').click()
    cy.getByTestId('transient-value').should('contain', 'Checked at count 0')
    cy.reload()
    cy.getByTestId('state-inspector').should('contain', '"theme": "daylight"')
    cy.getByTestId('transient-value').should('have.text', 'Not checked')
  })
})
