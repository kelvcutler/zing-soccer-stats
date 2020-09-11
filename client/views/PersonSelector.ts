
/// <reference path="../../../../github.com/sparxteq/Zing/zui/refs.ts"/>
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
  persons: Person[]
  options: PersonSelectorOptions
  constructor(options: PersonSelectorOptions = defaultPersonSelectorOptions) {
    super();
    this.options = { ...defaultPersonSelectorOptions, ...options };

    this.content = new DivUI(() => {
      return [this.makeDropDown()];
    });
  }

  makeDropDown(): ZUI {
    const personKeys = Person.allPersons();
    const personList = Person.cGETm(personKeys);
    const dropdown = new DropDownChoiceUI()
      .getF(this.options.getSelected)
      .setF(this.handleSelect(this.options));
    const duplicateNames = {}
    personList.forEach((person: Person) => {
      if (person.getFullName() in duplicateNames) {
        duplicateNames[person.getFullName()] = true;
      } else {
        duplicateNames[person.getFullName()] = false;
      }
    });
    if (this.options.nullable) {
      dropdown.choice('', '-- Select a Person --');
    }
    personList.forEach((person: Person) => dropdown.choice(person._key, person.getDescription(duplicateNames[person.getFullName()])));
    if (this.options.allowAddNew) {
      dropdown.choice('add-new-person', this.options.addNewLabel);
    }
    return dropdown;
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