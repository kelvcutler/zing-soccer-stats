
/// <reference path="../../../01/Zing/zui/refs.ts"/>
/// <reference path="../../models/Person.ts"/>

type PersonCardOptions = {
  size?: string
  inEditMode?: () => boolean
  onToggleEditMode?: (editMode: boolean) => void
  onRemove?: () => void
}

const defaultPersonCardOptions: PersonCardOptions = {
  size: 'full',
  inEditMode: () => false,
  onToggleEditMode: null,
  onRemove: null,
}

class PersonCard extends ZUI {
  person: Person
  err: string

  constructor(personKey: string, options: PersonCardOptions = {}) {
    super();
    const opts = { ...defaultPersonCardOptions, ...options };
    Person.GET(personKey, (err: string, person: Person) => {
      this.err = err;
      this.person = person;
    })
    if (opts.size === 'full') {
      this.content = new DivUI(() => {
        if (this.err) {
          return [new DivUI([
            new TextUI(`Error: ${this.err}`).style('LoadingText'),
            opts.onRemove && new ClickWrapperUI([
              new TextUI('✕')
            ]).click(() => { opts.onRemove() }).style('LinkText')
          ]).style('ShadowedCard')];
        }
        if (!this.person) {
          return [new DivUI([
            new TextUI('Loading...').style('LoadingText')
          ]).style('ShadowedCard')];
        }
        return ([
          new DivUI([
            new TextUI('First Name:').style('Label'),
            opts.inEditMode()
              ? new TextFieldUI().getF(() => this.person.getFirstName()).setF((newName => { this.person.setFirstName(newName) })).placeHolder('Bob').style('Value')
              : new TextUI(this.person.getFirstName()).style('Value'),
            new TextUI('Email:').style('Label'),
            opts.inEditMode()
              ? new TextFieldUI().getF(() => this.person.getEmail()).setF((newEmail => { this.person.setEmail(newEmail) })).placeHolder('name@example.com').style('Value')
              : new TextUI(this.person.getEmail()).style('Value'),
          ]).style('Row'),
          new DivUI([
            new TextUI('Last Name:').style('Label'),
            opts.inEditMode()
              ? new TextFieldUI().getF(() => this.person.getLastName()).setF((newName => { this.person.setLastName(newName) })).placeHolder('Smith').style('Value')
              : new TextUI(this.person.getLastName()).style('Value'),
            new TextUI('Phone:').style('Label'),
            opts.inEditMode()
              ? new TextFieldUI().getF(() => this.person.getPhone()).setF((newPhone => { this.person.setPhone(newPhone) })).placeHolder('888-333-4444').style('Value')
              : new TextUI(this.person.getPhone()).style('Value'),
          ]).style('Row'),
          new DivUI([
            opts.onToggleEditMode
              ? new ClickWrapperUI([
                new TextUI('✎')
              ]).click(() => { opts.onToggleEditMode(!opts.inEditMode()) }).style('LinkText')
              : new DivUI([]),
            opts.onRemove
              ? new ClickWrapperUI([
                new TextUI('✕')
              ]).click(() => { opts.onRemove() }).style('LinkText')
              : new DivUI([])
          ]).style('UpperRightActions')
        ]);
      }).style('ShadowedCard');
    } else { // if (opts.size === 'mini') {
      this.content = new DivUI(() => ([
        new TextUI('No one').style('EmptyText')
      ])).style('ShadowedCard');
    }
  }

}