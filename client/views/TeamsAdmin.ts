
/// <reference path="../../../../github.com/sparxteq/Zing/zui/refs.ts"/>
/// <reference path="../../models/Team.ts"/>

class TeamsAdmin extends ZUI {
  teams: Team[]
  creatingTeam: boolean
  constructor() {
    super();
    this.content = new DivUI(() => {
      return [
        new ButtonUI("Create Team")
          .click(() => {
            this.creatingTeam = true;
            Team.makeNew("New Team", (err, team) => {
              if (err) {
                console.error(err);
              } else {
                PageManager.PUSHTO("team", { teamKey: team._key });
              }
              this.creatingTeam = false;
            });
          })
          .enable(() => !this.creatingTeam),
        new DivUI(() => { return this.teamList() }),];
    });
  }


  private teamList(): ZUI[] {
    return [new KeyListUI(() => Team.allTeams())
      .itemView((teamKey: string) => {
        const team = Team.cGET(teamKey);
        if (!team) {
          return new TextUI('');
        }
        return new ClickWrapperUI([
          new TextUI(team.getTeamName())
        ]).click(() => {
          DB.msg(`edit ${team.getTeamName()}`)
          PageManager.PUSHTO("team", { teamKey: team._key })
        }).style("TeamListItem");
      })
      .sort((key1: string, key2: string) => {
        const t1 = Team.cGET(key1);
        const t2 = Team.cGET(key2);
        if (!t1) return 1;
        if (!t2) return -1;
        return t1.getTeamName().localeCompare(t2.getTeamName());
      })];
  }
}