
/// <reference path="../../../github.com/sparxteq/Zing/zui/refs.ts"/>
/// <reference path="../views/TeamsAdmin.ts"/>
/// <reference path="../views/PersonsAdmin.ts"/>

class HomePage extends Page {
  constructor(pageState: PageState) {
    super(pageState);

    this.content = new DivUI([
      new TextUI("Home Page"),
      new TabUI()
        .tab('Teams', new TeamsAdmin())
        .tab('People', new PersonsAdmin())
    ]);
  }

  pageName(): string {
    return "home";
  }

}
PageManager.registerPageFactory("home", (state: PageState) => {
  return new HomePage(state);
})