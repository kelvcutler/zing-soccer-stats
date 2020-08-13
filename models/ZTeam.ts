/// <reference path="Person.ts"/>

class ZTeam extends DataObj{
   protected TeamName_:string;
   protected SeasonLabel_:string;
   protected Coach_:string;
   protected AssistantCoach_:string;
   protected TeamManager_:string;
   constructor(json:any){
      super(json);
      if (json.TeamName){
         this.TeamName_=json.TeamName;
      }
      if (json.SeasonLabel){
         this.SeasonLabel_=json.SeasonLabel;
      }
      if (json.Coach){
         this.Coach_=json.Coach;
      } else {
         this.Coach_=null;
      }
      if (json.AssistantCoach){
         this.AssistantCoach_=json.AssistantCoach;
      } else {
         this.AssistantCoach_=null;
      }
      if (json.TeamManager){
         this.TeamManager_=json.TeamManager;
      } else {
         this.TeamManager_=null;
      }
   }
   getTypeCode():string { return 'T';}
   getTeamName():string {
      return this.TeamName_;
   }
   setTeamName(newVal: string) {
      if (this.TeamName_ != newVal){
         this.TeamName_=newVal;
         this.touch();
      }
   }
   getSeasonLabel():string {
      return this.SeasonLabel_;
   }
   setSeasonLabel(newVal: string) {
      if (this.SeasonLabel_ != newVal){
         this.SeasonLabel_=newVal;
         this.touch();
      }
   }
   getCoach():string {
      return this.Coach_;
   }
   setCoach(newVal: string) {
      if (this.Coach_ != newVal){
         this.Coach_=newVal;
         this.touch();
      }
   }
   getAssistantCoach():string {
      return this.AssistantCoach_;
   }
   setAssistantCoach(newVal: string) {
      if (this.AssistantCoach_ != newVal){
         this.AssistantCoach_=newVal;
         this.touch();
      }
   }
   getTeamManager():string {
      return this.TeamManager_;
   }
   setTeamManager(newVal: string) {
      if (this.TeamManager_ != newVal){
         this.TeamManager_=newVal;
         this.touch();
      }
   }
   static GET(key:string,done:(err:string,data:Team)=>void,forceRequest?:boolean,serverContext?:ServerContext){
      let tc=DataSource.typeFromKey(key);
      if (!DataObj.checkTypeCode('T',tc)){ done("ERR wrong key "+key+" for Team.GET",null);return}
      super.GET(key,(err:string,data:DataObj)=>{
         if (err){
            done(err,null);
         } else {
            done(null,<Team>data);
         }
      },forceRequest,serverContext)
   }
   static cGET(key:string,forceRequest?:boolean):Team{
      let tc=DataSource.typeFromKey(key);
      if (!DataObj.checkTypeCode('T',tc)){ DB.msg("ERR wrong key "+key+" for Team.GET",null); return null}
      return <Team>(super.cGET(key,forceRequest));
   }
   static GETm(keys:string[],done:(err:string,data:Team[])=>void,forceRequest?:boolean,serverContext?:ServerContext){
      if (!keys || keys.length==0){
         done(null,[])
         return
      }
      let tc=DataSource.typeFromKey(keys[0]);
      if (!DataObj.checkTypeCode('T',tc)){ done("ERR wrong key "+keys[0]+" for Team.GETm",null); return}
      super.GETm(keys,(err:string,data:DataObj[])=>{
         if (err){
            done(err,null);
         } else {
            done(null,<Team[]>data);
         }
      },forceRequest,serverContext)
   }
   toJSON():any{
      let rslt:any = {};
      rslt._key=this._key
      rslt._t_="T";
      rslt.TeamName=this.getTeamName();
      rslt.SeasonLabel=this.getSeasonLabel();
      rslt.Coach=this.getCoach();
      rslt.AssistantCoach=this.getAssistantCoach();
      rslt.TeamManager=this.getTeamManager();
      return rslt;
   }
   
   static byName(TeamName:StringQuery,done:(err:string,keys:string[])=>void,keysOnly?:boolean,forceRequest?:boolean,serverContext?:ServerContext){
      super.FIND("T",Query.dict({TeamName:TeamName }),done,keysOnly,forceRequest,serverContext)
   }
   
   static byNameC(TeamName:StringQuery,keysOnly?:boolean,forceRequest?:boolean):string[]{
      let ds = DataObj.globalSource;
      return super.cFIND("T",Query.dict({TeamName:TeamName }),keysOnly,forceRequest)
   }
}
