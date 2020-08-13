/// <reference path="Team.ts"/>
/// <reference path="GameEvent.ts"/>

class ZGame extends DataObj{
   protected Team_:string;
   protected HomeGame_:boolean;
   protected Date_:string;
   protected StartTime_:number;
   protected EndTime_:number;
   protected WinResult_:string;
   protected GameEvents_:GameEvent[];
   constructor(json:any){
      super(json);
      if (json.Team){
         this.Team_=json.Team;
      } else {
         this.Team_=null;
      }
      this.HomeGame_=json.HomeGame;
      if (json.Date){
         this.Date_=json.Date;
      }
      if (json.StartTime){
         this.StartTime_=json.StartTime;
      } else {
         this.StartTime_=0;
      }
      if (json.EndTime){
         this.EndTime_=json.EndTime;
      } else {
         this.EndTime_=0;
      }
      if (json.WinResult){
         this.WinResult_=json.WinResult;
      }
      if (json.GameEvents){
         this.GameEvents_=<GameEvent[]>(DataObj.makeList('GE',json.GameEvents,this));
      } else {
         this.GameEvents_=[];
      }
   }
   getTypeCode():string { return 'G';}
   getTeam():string {
      return this.Team_;
   }
   setTeam(newVal: string) {
      if (this.Team_ != newVal){
         this.Team_=newVal;
         this.touch();
      }
   }
   getHomeGame():boolean {
      return this.HomeGame_;
   }
   setHomeGame(newVal: boolean) {
      if (this.HomeGame_ != newVal){
         this.HomeGame_=newVal;
         this.touch();
      }
   }
   getDate():string {
      return this.Date_;
   }
   setDate(newVal: string) {
      if (this.Date_ != newVal){
         this.Date_=newVal;
         this.touch();
      }
   }
   getStartTime():number {
      return this.StartTime_;
   }
   setStartTime(newVal: number) {
      if (this.StartTime_ != newVal){
         this.StartTime_=newVal;
         this.touch();
      }
   }
   getEndTime():number {
      return this.EndTime_;
   }
   setEndTime(newVal: number) {
      if (this.EndTime_ != newVal){
         this.EndTime_=newVal;
         this.touch();
      }
   }
   getWinResult():string {
      return this.WinResult_;
   }
   setWinResult(newVal: string) {
      if (this.WinResult_ != newVal){
         this.WinResult_=newVal;
         this.touch();
      }
   }
   getGameEvents():GameEvent[] {
      let tmp:GameEvent[] = [];
      for (let i in this.GameEvents_){
         tmp.push(this.GameEvents_[i]);
      }
      return tmp;
   }
   setGameEvents(val: GameEvent[]) {
      let tmp:GameEvent[] = [];
      for (let i in val){
         tmp.push(val[i]);
         val[i].parent=this;
      }
      this.GameEvents_ = tmp;
      this.touch();
   }
   static GET(key:string,done:(err:string,data:Game)=>void,forceRequest?:boolean,serverContext?:ServerContext){
      let tc=DataSource.typeFromKey(key);
      if (!DataObj.checkTypeCode('G',tc)){ done("ERR wrong key "+key+" for Game.GET",null);return}
      super.GET(key,(err:string,data:DataObj)=>{
         if (err){
            done(err,null);
         } else {
            done(null,<Game>data);
         }
      },forceRequest,serverContext)
   }
   static cGET(key:string,forceRequest?:boolean):Game{
      let tc=DataSource.typeFromKey(key);
      if (!DataObj.checkTypeCode('G',tc)){ DB.msg("ERR wrong key "+key+" for Game.GET",null); return null}
      return <Game>(super.cGET(key,forceRequest));
   }
   static GETm(keys:string[],done:(err:string,data:Game[])=>void,forceRequest?:boolean,serverContext?:ServerContext){
      if (!keys || keys.length==0){
         done(null,[])
         return
      }
      let tc=DataSource.typeFromKey(keys[0]);
      if (!DataObj.checkTypeCode('G',tc)){ done("ERR wrong key "+keys[0]+" for Game.GETm",null); return}
      super.GETm(keys,(err:string,data:DataObj[])=>{
         if (err){
            done(err,null);
         } else {
            done(null,<Game[]>data);
         }
      },forceRequest,serverContext)
   }
   toJSON():any{
      let rslt:any = {};
      rslt._key=this._key
      rslt._t_="G";
      rslt.Team=this.getTeam();
      rslt.HomeGame=this.getHomeGame();
      rslt.Date=this.getDate();
      rslt.StartTime=this.getStartTime();
      rslt.EndTime=this.getEndTime();
      rslt.WinResult=this.getWinResult();
      rslt.GameEvents=[];
      let tmp_GameEvents=this.getGameEvents()
      for (let i in tmp_GameEvents){
         rslt.GameEvents.push((tmp_GameEvents[i]).toJSON());
      }
      return rslt;
   }
   
   static byDate(Date:StringQuery,done:(err:string,keys:string[])=>void,keysOnly?:boolean,forceRequest?:boolean,serverContext?:ServerContext){
      super.FIND("G",Query.dict({Date:Date }),done,keysOnly,forceRequest,serverContext)
   }
   
   static byDateC(Date:StringQuery,keysOnly?:boolean,forceRequest?:boolean):string[]{
      let ds = DataObj.globalSource;
      return super.cFIND("G",Query.dict({Date:Date }),keysOnly,forceRequest)
   }
   
   static byHome(HomeGame:boolean,done:(err:string,keys:string[])=>void,keysOnly?:boolean,forceRequest?:boolean,serverContext?:ServerContext){
      super.FIND("G",Query.dict({HomeGame:HomeGame }),done,keysOnly,forceRequest,serverContext)
   }
   
   static byHomeC(HomeGame:boolean,keysOnly?:boolean,forceRequest?:boolean):string[]{
      let ds = DataObj.globalSource;
      return super.cFIND("G",Query.dict({HomeGame:HomeGame }),keysOnly,forceRequest)
   }
   
   static byWinResult(WinResult:StringQuery,done:(err:string,keys:string[])=>void,keysOnly?:boolean,forceRequest?:boolean,serverContext?:ServerContext){
      super.FIND("G",Query.dict({WinResult:WinResult }),done,keysOnly,forceRequest,serverContext)
   }
   
   static byWinResultC(WinResult:StringQuery,keysOnly?:boolean,forceRequest?:boolean):string[]{
      let ds = DataObj.globalSource;
      return super.cFIND("G",Query.dict({WinResult:WinResult }),keysOnly,forceRequest)
   }
}
