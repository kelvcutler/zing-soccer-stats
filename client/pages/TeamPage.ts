
/// <reference path="../../../aaswZing/Zing/zui/refs.ts"/>

class TeamPage extends Page {

  constructor(pageState: PageState) {
    super(pageState);
    const team = Team.cGET(pageState.teamKey);
    this.content = new DivUI([
      new ClickWrapperUI([new TextUI("< Back")])
        .click(() => {
          PageManager.BACK();
        }),
      new TextUI("Manage Team"),
      new TextFieldUI()
        .getF(() => { return team.getTeamName() })
        .setF((newName) => { team.setTeamName(newName) })
        .placeHolder("Name of the team"),
    ]);
  }

  pageName(): string {
    return "team";
  }

}
PageManager.registerPageFactory("team", (state: PageState) => {
  if (!state.teamKey) {
    PageManager.PUSHTO("home", { Message: "Team Id required to create or edit a team." });
  }
  return new TeamPage(state);
})