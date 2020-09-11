
/// <reference path="../../../01/zui/PageManager.ts"/>
/// <reference path="../../../01/zui/refs.ts"/>
/// <reference path="../../models/Team.ts"/>
/// <reference path="../views/PersonCard.ts"/>
/// <reference path="../views/PersonSelector.ts"/>

class TeamPage extends Page {
  inEditMode: boolean = false
  teamKey: string
  team: Team

  constructor(pageState: PageState) {
    super(pageState);
    this.teamKey = pageState.teamKey;
    Team.GET(this.teamKey, (err: string, team: Team) => {
      this.team = team;
    });
    if (!this.team) {
      this.content = new DivUI([]);
      return;
    }
    this.content = new DivUI(() => ([
      new ClickWrapperUI([new TextUI("< Back")])
        .click(() => {
          history.back();
        }),
      new TextUI("Manage Team"),
      new TextFieldUI()
        .getF(() => this.getTeamName())
        .setF((newName: string) => { this.setTeamName(newName); })
        .placeHolder("Name of the team"),
      this.team.getCoach()
        ? new PersonCard(this.team.getCoach(), {
          onToggleEditMode: (mode: boolean) => { this.inEditMode = mode; this.notify() },
          inEditMode: () => this.inEditMode,
          onRemove: () => { this.team.setCoach(null); }
        })
        : new PersonSelector({
          getSelected: () => (this.team.getCoach()),
          onSelect: (personKey: string) => { this.setCoach(personKey); },
          allowAddNew: true
        })
    ]));
  }

  private getTeamName(): string {
    const team = Team.cGET(this.teamKey);
    if (team) {
      return team.getTeamName();
    }
    return '';
  }

  private setTeamName(newName: string): void {
    Team.GET(this.teamKey, (err: string, team: Team) => {
      team.setTeamName(newName);
    });
  }

  private setCoach(personKey: string) {
    Team.GET(this.teamKey, (err: string, team: Team) => {
      team.setCoach(personKey);
    });
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