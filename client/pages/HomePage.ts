
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
				.enable(() => !this.creatingTeam),
			new DivUI(() => { return this.teamList() }),
		]);
	}

	private teamList(): ZUI[] {
		let tKeys: string[] = Team.allTeams();
		if (tKeys) {
			let teams: Team[] = <Team[]>Team.cGETm(tKeys);
			if (teams) {
				return teams.map((team) => (new ClickWrapperUI([
					new TextUI(team.getTeamName())
				]).click(() => {
					DB.msg(`edit ${team.getTeamName()}`)
					PageManager.PUSHTO("team", { teamKey: team._key })
				}).style("team-list-item")
				));
			}
		}
		return [];
	}

	pageName(): string {
		return "home";
	}

}
PageManager.registerPageFactory("home", (state: PageState) => {
	return new HomePage(state);
})