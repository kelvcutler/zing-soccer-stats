/// <reference path="ZTeam.ts" />

class Team extends ZTeam {

  static makeNew(name: string,
    done: (err: string, team: Team) => void) {
    let newTeam = new Team({ TeamName: name });
    newTeam.PUT((err: string, team: Team) => {
      done(err, team);
    })
  }


  static allTeams(): string[] {
    return super.cFIND("T", Query.dict({}), false, false);
  }
}