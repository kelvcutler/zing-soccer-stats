/// <reference path="Player.ts"/>

class ZGameEvent extends DataObj{
   protected EventType_:string;
   protected Time_:number;
   protected Player_:string;
   protected HomeScoreIncreased_:boolean;
   protected AwayScoreIncreased_:boolean;
   constructor(json:any){
      super(json);
      if (json.EventType){
         this.EventType_=json.EventType;
      }
      if (json.Time){
         this.Time_=json.Time;
      } else {
         this.Time_=0;
      }
      if (json.Player){
         this.Player_=json.Player;
      } else {
         this.Player_=null;
      }
      this.HomeScoreIncreased_=json.HomeScoreIncreased;
      this.AwayScoreIncreased_=json.AwayScoreIncreased;
   }
   getTypeCode():string { return 'GE';}
   getEventType():string {
      return this.EventType_;
   }
   setEventType(newVal: string) {
      if (this.EventType_ != newVal){
         this.EventType_=newVal;
         this.touch();
      }
   }
   getTime():number {
      return this.Time_;
   }
   setTime(newVal: number) {
      if (this.Time_ != newVal){
         this.Time_=newVal;
         this.touch();
      }
   }
   getPlayer():string {
      return this.Player_;
   }
   setPlayer(newVal: string) {
      if (this.Player_ != newVal){
         this.Player_=newVal;
         this.touch();
      }
   }
   getHomeScoreIncreased():boolean {
      return this.HomeScoreIncreased_;
   }
   setHomeScoreIncreased(newVal: boolean) {
      if (this.HomeScoreIncreased_ != newVal){
         this.HomeScoreIncreased_=newVal;
         this.touch();
      }
   }
   getAwayScoreIncreased():boolean {
      return this.AwayScoreIncreased_;
   }
   setAwayScoreIncreased(newVal: boolean) {
      if (this.AwayScoreIncreased_ != newVal){
         this.AwayScoreIncreased_=newVal;
         this.touch();
      }
   }
   toJSON():any{
      let rslt:any = {};
      rslt._t_="GE";
      rslt.EventType=this.getEventType();
      rslt.Time=this.getTime();
      rslt.Player=this.getPlayer();
      rslt.HomeScoreIncreased=this.getHomeScoreIncreased();
      rslt.AwayScoreIncreased=this.getAwayScoreIncreased();
      return rslt;
   }
}
