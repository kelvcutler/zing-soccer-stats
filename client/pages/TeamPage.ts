
/// <reference path="../../../aaswZing/Zing/zui/refs.ts"/>

class TeamPage extends Page {

  constructor(pageState: PageState) {
    super(pageState);
    this.content = new DivUI([
      new TextUI("Manage Team"),
    ]);
  }

  pageName(): string {
    return "Home";
  }

}
PageManager.registerPageFactory("team", (state: PageState) => {
  if (!state.teamKey) {
    PageManager.PUSHTO("home", { Message: "Team Id required to create or edit a team." });
  }
  return new TeamPage(state);
})