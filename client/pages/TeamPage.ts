
/// <reference path="../../../aaswZing/Zing/zui/PageManager.ts"/>
/// <reference path="../../../aaswZing/Zing/zui/refs.ts"/>
/// <reference path="../../models/Team.ts"/>
/// <reference path="../views/PersonCard.ts"/>
/// <reference path="../views/PersonSelector.ts"/>

class TeamPage extends Page {
  inEditMode: boolean = false
  teamKey: string

  constructor(pageState: PageState) {
    super(pageState);
    this.teamKey = pageState.teamKey;
    const team = Team.cGET(this.teamKey);
    if (!team) {
      this.content = new DivUI([]);
      return;
    }
    this.content = new DivUI([
      new ClickWrapperUI([new TextUI("< Back")])
        .click(() => {
          history.back();
        }),
      new TextUI("Manage Team"),
      new TextFieldUI()
        .getF(() => { return team.getTeamName() })
        .setF((newName) => { team.setTeamName(newName) })
        .placeHolder("Name of the team"),
      team.getCoach()
        ? new PersonCard(team.getCoach(), {
          onToggleEditMode: (mode: boolean) => { this.inEditMode = mode; this.notify() },
          inEditMode: () => this.inEditMode,
          onRemove: () => { team.setCoach(null); }
        })
        : new PersonSelector({
          getSelected: () => (team.getCoach()),
          onSelect: (personKey: string) => { this.setCoach(personKey); },
          allowAddNew: true
        })
    ]);
  }

  private setCoach(personKey: string) {
    const team = Team.cGET(this.teamKey);
    if (team) {
      team.setCoach(personKey);
    }
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