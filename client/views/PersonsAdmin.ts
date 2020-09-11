
/// <reference path="../../../github.com/sparxteq/Zing/zui/refs.ts"/>
/// <reference path="../../models/Person.ts"/>

class PersonsAdmin extends ZUI {
  editingPersonKey: string | null
  constructor() {
    super();
    this.content = new DivUI(() => {
      return [
        new ButtonUI("Create Person")
          .click(() => {
            const newPerson = new Person({});
            newPerson.PUT((err: string, person: Person) => {
              this.editingPersonKey = person._key;
              ZUI.notify();
            });
          }),
        new DivUI(() => { return this.personList() }),];
    });
  }


  private personList(): ZUI[] {
    return [new KeyListUI(() => (Person.allPersons()))
      .itemView((personKey: string) => (new PersonCard(personKey, {
        inEditMode: () => (this.editingPersonKey === personKey),
        onToggleEditMode: (editMode: boolean) => {
          if (editMode) {
            this.editingPersonKey = personKey;
          } else {
            this.editingPersonKey = null
          }
          ZUI.notify();
        },
        onRemove: () => {
          Person.GET(personKey, (err: string, person) => {
            if (!err) {
              person.DELETE((err: string) => {
                ZUI.notify();
              });
            }
          })
        }
      })))
      .sort((key1: string, key2: string) => {
        const p1 = Person.cGET(key1);
        const p2 = Person.cGET(key2);
        if (!p1) return 1;
        if (!p2) return -1;
        return p1.getDescription().localeCompare(p2.getDescription());
      })];
  }
}