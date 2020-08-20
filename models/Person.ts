/// <reference path="ZPerson.ts" />

class Person extends ZPerson {
  getFullName() {
    if (this.getFirstName() && this.getLastName()) {
      return `${this.getFirstName()} ${this.getLastName()}`
    }
    return '';
  }

  getDescription(includeEmail: boolean = false) {
    if (includeEmail && this.getEmail()) {
      return `${this.getFullName()} (${this.getEmail()})`;
    }
    return this.getFullName()
  }

  static allPersons(): string[] {
    return super.cFIND("P", Query.dict({}), false, false);
  }
}