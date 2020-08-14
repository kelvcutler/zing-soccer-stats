
/// <reference path="../../../aaswZing/Zing/zui/refs.ts"/>

class HomePage extends Page {
  creatingTeam

  constructor(pageState: PageState) {
    super(pageState);
    this.content = new DivUI([
      new TextUI("Home Page"),
      new ButtonUI("Create Team")
        .click(() => {
          this.creatingTeam = true;
          this.notify();
          Team.makeNew("New Team", (err, team) => {
            if (err) {
              console.error(err);
            } else {
              PageManager.PUSHTO("team", { teamKey: team._key });
            }
            this.creatingTeam = false;
            this.notify();
          });
        })
        .enable(() => !this.creatingTeam)
    ]);
  }

  pageName(): string {
    return "Home";
  }

}
PageManager.registerPageFactory("home", (state: PageState) => {
  return new HomePage(state);
})