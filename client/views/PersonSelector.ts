
/// <reference path="../../../aaswZing/Zing/zui/refs.ts"/>
/// <reference path="../../models/Person.ts"/>

type PersonSelectorOptions = {
  getSelected: () => string
  onSelect: (personKey: string) => void
  nullable?: boolean,
  allowAddNew?: boolean
  addNewLabel?: string
}

const defaultPersonSelectorOptions: PersonSelectorOptions = {
  getSelected: () => (''),
  onSelect: () => { },
  nullable: true,
  allowAddNew: true,
  addNewLabel: 'Add New Person'
}

class PersonSelector extends ZUI {

  constructor(options: PersonSelectorOptions = defaultPersonSelectorOptions) {
    super();
    const opts = { ...defaultPersonSelectorOptions, ...options };
    const personKeys = Person.allPersons();
    const personList = Person.cGETm(personKeys) as Person[];
    const dropdown = new DropDownChoiceUI()
      .getF(opts.getSelected)
      .setF(this.handleSelect(opts));
    const duplicateNames = {}
    personList.forEach((person: Person) => {
      if (person.getFullName() in duplicateNames) {
        duplicateNames[person.getFullName()] = true;
      } else {
        duplicateNames[person.getFullName()] = false;
      }
    });
    if (opts.nullable) {
      dropdown.choice('', '-- Select a Person --');
    }
    personList.forEach((person) => dropdown.choice(person._key, person.getDescription(duplicateNames[person.getFullName()])));
    if (opts.allowAddNew) {
      dropdown.choice('add-new-person', opts.addNewLabel);
    }
    this.content = dropdown;
  }

  handleSelect(opts: PersonSelectorOptions) {
    return (personKey: string) => {
      if (personKey === 'add-new-person') {
        const newPerson = new Person({});
        newPerson.PUT((err: string, person: Person) => {
          opts.onSelect(person._key);
        });
        return;
      }
      opts.onSelect(personKey);
    }
  }
}