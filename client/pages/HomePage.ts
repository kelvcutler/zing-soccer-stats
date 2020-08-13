
/// <reference path="../../../aaswZing/Zing/zui/refs.ts"/>

class HomePage extends Page {

  constructor(pageState: PageState) {
    super(pageState);
    this.content = new DivUI([
      new TextUI("Home Page"),
      new ButtonUI("Create Team")
        .click(() => {
          PageManager.PUSHTO("team");
        })
    ]);
  }

  pageName(): string {
    return "Home";
  }

}
PageManager.registerPageFactory("home", (state: PageState) => {
  return new HomePage(state);
})