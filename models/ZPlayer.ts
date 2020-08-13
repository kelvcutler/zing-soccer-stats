/// <reference path="Person.ts"/>

class ZPlayer extends DataObj{
   protected Person_:string;
   protected JerseyNumber_:number;
   protected Position_:string;
   protected SecondaryPosition_:string;
   constructor(json:any){
      super(json);
      if (json.Person){
         this.Person_=json.Person;
      } else {
         this.Person_=null;
      }
      if (json.JerseyNumber){
         this.JerseyNumber_=json.JerseyNumber;
      } else {
         this.JerseyNumber_=0;
      }
      if (json.Position){
         this.Position_=json.Position;
      }
      if (json.SecondaryPosition){
         this.SecondaryPosition_=json.SecondaryPosition;
      }
   }
   getTypeCode():string { return 'PL';}
   getPerson():string {
      return this.Person_;
   }
   setPerson(newVal: string) {
      if (this.Person_ != newVal){
         this.Person_=newVal;
         this.touch();
      }
   }
   getJerseyNumber():number {
      return this.JerseyNumber_;
   }
   setJerseyNumber(newVal: number) {
      if (this.JerseyNumber_ != newVal){
         this.JerseyNumber_=newVal;
         this.touch();
      }
   }
   getPosition():string {
      return this.Position_;
   }
   setPosition(newVal: string) {
      if (this.Position_ != newVal){
         this.Position_=newVal;
         this.touch();
      }
   }
   getSecondaryPosition():string {
      return this.SecondaryPosition_;
   }
   setSecondaryPosition(newVal: string) {
      if (this.SecondaryPosition_ != newVal){
         this.SecondaryPosition_=newVal;
         this.touch();
      }
   }
   static GET(key:string,done:(err:string,data:Player)=>void,forceRequest?:boolean,serverContext?:ServerContext){
      let tc=DataSource.typeFromKey(key);
      if (!DataObj.checkTypeCode('PL',tc)){ done("ERR wrong key "+key+" for Player.GET",null);return}
      super.GET(key,(err:string,data:DataObj)=>{
         if (err){
            done(err,null);
         } else {
            done(null,<Player>data);
         }
      },forceRequest,serverContext)
   }
   static cGET(key:string,forceRequest?:boolean):Player{
      let tc=DataSource.typeFromKey(key);
      if (!DataObj.checkTypeCode('PL',tc)){ DB.msg("ERR wrong key "+key+" for Player.GET",null); return null}
      return <Player>(super.cGET(key,forceRequest));
   }
   static GETm(keys:string[],done:(err:string,data:Player[])=>void,forceRequest?:boolean,serverContext?:ServerContext){
      if (!keys || keys.length==0){
         done(null,[])
         return
      }
      let tc=DataSource.typeFromKey(keys[0]);
      if (!DataObj.checkTypeCode('PL',tc)){ done("ERR wrong key "+keys[0]+" for Player.GETm",null); return}
      super.GETm(keys,(err:string,data:DataObj[])=>{
         if (err){
            done(err,null);
         } else {
            done(null,<Player[]>data);
         }
      },forceRequest,serverContext)
   }
   toJSON():any{
      let rslt:any = {};
      rslt._key=this._key
      rslt._t_="PL";
      rslt.Person=this.getPerson();
      rslt.JerseyNumber=this.getJerseyNumber();
      rslt.Position=this.getPosition();
      rslt.SecondaryPosition=this.getSecondaryPosition();
      return rslt;
   }
   
   static byPerson(Person:string,done:(err:string,keys:string[])=>void,keysOnly?:boolean,forceRequest?:boolean,serverContext?:ServerContext){
      super.FIND("PL",Query.dict({Person:Person }),done,keysOnly,forceRequest,serverContext)
   }
   
   static byPersonC(Person:string,keysOnly?:boolean,forceRequest?:boolean):string[]{
      let ds = DataObj.globalSource;
      return super.cFIND("PL",Query.dict({Person:Person }),keysOnly,forceRequest)
   }
   
   static byNumber(JerseyNumber:NumberQuery,done:(err:string,keys:string[])=>void,keysOnly?:boolean,forceRequest?:boolean,serverContext?:ServerContext){
      super.FIND("PL",Query.dict({JerseyNumber:JerseyNumber }),done,keysOnly,forceRequest,serverContext)
   }
   
   static byNumberC(JerseyNumber:NumberQuery,keysOnly?:boolean,forceRequest?:boolean):string[]{
      let ds = DataObj.globalSource;
      return super.cFIND("PL",Query.dict({JerseyNumber:JerseyNumber }),keysOnly,forceRequest)
   }
}
