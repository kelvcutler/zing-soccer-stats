
/// <reference path="../../../aaswZing/Zing/zui/refs.ts"/>
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

  constructor(personKey: string, options: PersonCardOptions = {}) {
    super();
    const opts = { ...defaultPersonCardOptions, ...options };
    const person = Person.cGET(personKey)
    if (!person) {
      this.content = new DivUI(() => ([
        new TextUI('Loading...').style('LoadingText')
      ])).style('ShadowedCard');
      return;
    }
    if (opts.size === 'full') {
      this.content = new DivUI(() => ([
        new TextUI('First Name:').style('Label'),
        opts.inEditMode()
          ? new TextFieldUI().getF(() => person.getFirstName()).setF((newName => { person.setFirstName(newName) })).placeHolder('Bob')
          : new TextUI(person.getFirstName()).style('Value'),
        new TextUI('Last Name:').style('Label'),
        opts.inEditMode()
          ? new TextFieldUI().getF(() => person.getLastName()).setF((newName => { person.setLastName(newName) })).placeHolder('Smith')
          : new TextUI(person.getLastName()).style('Value'),
        new TextUI('Email:').style('Label'),
        opts.inEditMode()
          ? new TextFieldUI().getF(() => person.getEmail()).setF((newEmail => { person.setEmail(newEmail) })).placeHolder('name@example.com')
          : new TextUI(person.getEmail()).style('Value'),
        new TextUI('Phone:').style('Label'),
        opts.inEditMode()
          ? new TextFieldUI().getF(() => person.getPhone()).setF((newPhone => { person.setPhone(newPhone) })).placeHolder('888-333-4444')
          : new TextUI(person.getPhone()).style('Value'),
        opts.onToggleEditMode && new ClickWrapperUI([
          new TextUI('✎')
        ]).click(() => { opts.onToggleEditMode(!opts.inEditMode()) }).style('LinkText'),
        opts.onRemove && new ClickWrapperUI([
          new TextUI('✕')
        ]).click(() => { opts.onRemove() }).style('LinkText')
      ])).style('ShadowedCard');
    } else { // if (opts.size === 'mini') {
      this.content = new DivUI(() => ([
        new TextUI('No one').style('EmptyText')
      ])).style('ShadowedCard');
    }
  }

}