context('Edit Topic', () => {
  beforeEach(() => {
    cy.visit('/editor.html');
    cy.reload();
    cy.get('[test-id=1]').click();
  });

  it('Change Main Topic Text', () => {
    cy.get('body').type('New Title Main Topic{enter}');
    cy.get('[test-id=1] > text > tspan').should('have.text', 'New Title Main Topic');
    cy.matchImageSnapshot('changeMainTopicText');
  });

  it('Change Font Size', () => {
    cy.get('#fontSizeTip').click();
    cy.get('#small').click();

    cy.get('[test-id=1] > text').invoke('attr', 'font-size').should('eq', '8.0625');

    cy.matchImageSnapshot('changeFontSizeSmall');

    cy.get('#fontSizeTip').click();
    // TODO: The parameter {force: true} was placed because it does not detect that the element is visible
    cy.get('.popover #normal').click({ force: true });

    cy.get('[test-id=1] > text').invoke('attr', 'font-size').should('eq', '10.75');

    cy.matchImageSnapshot('changeFontSizeNormal');

    cy.get('#fontSizeTip').click();
    // TODO: The parameter {force: true} was placed because it does not detect that the element is visible
    cy.get('#large').click({ force: true });

    cy.get('[test-id=1] > text').invoke('attr', 'font-size').should('eq', '13.4375');

    cy.matchImageSnapshot('changeFontSizeNormal');

    cy.get('#fontSizeTip').click();
    // TODO: The parameter {force: true} was placed because it does not detect that the element is visible
    cy.get('#huge').click({ force: true });

    cy.get('[test-id=1] > text').invoke('attr', 'font-size').should('eq', '20.15625');

    cy.matchImageSnapshot('changeFontSizeHuge');
  });

  it('Change Font type', () => {
    cy.get('#fontFamilyTip').click();
    // TODO: The parameter {force: true} was placed because it does not detect that the element is visible
    cy.get('[model="Times"]').click({ force: true });

    cy.get('[test-id=1] > text').invoke('attr', 'font-family').should('eq', 'Times');

    cy.matchImageSnapshot('changeFontType');
  });

  it('Change Font Italic', () => {
    cy.get('#fontItalicTip').click();

    cy.get('[test-id=1] > text').invoke('attr', 'font-style').should('eq', 'italic');

    cy.matchImageSnapshot('changeFontItalic');
  });

  it('Change Font color', () => {
    cy.get('#fontColorTip').click();
    // TODO: The parameter {force: true} was placed because it does not detect that the element is visible
    cy.get('[title="RGB (153, 0, 255)"]').click({ force: true });

    cy.get('[test-id=1] > text').invoke('attr', 'fill').should('eq', 'rgb(153, 0, 255)');

    cy.matchImageSnapshot('changeFontColor');
  });
});
