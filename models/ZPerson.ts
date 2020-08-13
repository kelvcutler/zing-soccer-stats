
class ZPerson extends DataObj{
   protected FirstName_:string;
   protected LastName_:string;
   protected Email_:string;
   protected Phone_:string;
   constructor(json:any){
      super(json);
      if (json.FirstName){
         this.FirstName_=json.FirstName;
      }
      if (json.LastName){
         this.LastName_=json.LastName;
      }
      if (json.Email){
         this.Email_=json.Email;
      }
      if (json.Phone){
         this.Phone_=json.Phone;
      }
   }
   getTypeCode():string { return 'P';}
   getFirstName():string {
      return this.FirstName_;
   }
   setFirstName(newVal: string) {
      if (this.FirstName_ != newVal){
         this.FirstName_=newVal;
         this.touch();
      }
   }
   getLastName():string {
      return this.LastName_;
   }
   setLastName(newVal: string) {
      if (this.LastName_ != newVal){
         this.LastName_=newVal;
         this.touch();
      }
   }
   getEmail():string {
      return this.Email_;
   }
   setEmail(newVal: string) {
      if (this.Email_ != newVal){
         this.Email_=newVal;
         this.touch();
      }
   }
   getPhone():string {
      return this.Phone_;
   }
   setPhone(newVal: string) {
      if (this.Phone_ != newVal){
         this.Phone_=newVal;
         this.touch();
      }
   }
   static GET(key:string,done:(err:string,data:Person)=>void,forceRequest?:boolean,serverContext?:ServerContext){
      let tc=DataSource.typeFromKey(key);
      if (!DataObj.checkTypeCode('P',tc)){ done("ERR wrong key "+key+" for Person.GET",null);return}
      super.GET(key,(err:string,data:DataObj)=>{
         if (err){
            done(err,null);
         } else {
            done(null,<Person>data);
         }
      },forceRequest,serverContext)
   }
   static cGET(key:string,forceRequest?:boolean):Person{
      let tc=DataSource.typeFromKey(key);
      if (!DataObj.checkTypeCode('P',tc)){ DB.msg("ERR wrong key "+key+" for Person.GET",null); return null}
      return <Person>(super.cGET(key,forceRequest));
   }
   static GETm(keys:string[],done:(err:string,data:Person[])=>void,forceRequest?:boolean,serverContext?:ServerContext){
      if (!keys || keys.length==0){
         done(null,[])
         return
      }
      let tc=DataSource.typeFromKey(keys[0]);
      if (!DataObj.checkTypeCode('P',tc)){ done("ERR wrong key "+keys[0]+" for Person.GETm",null); return}
      super.GETm(keys,(err:string,data:DataObj[])=>{
         if (err){
            done(err,null);
         } else {
            done(null,<Person[]>data);
         }
      },forceRequest,serverContext)
   }
   toJSON():any{
      let rslt:any = {};
      rslt._key=this._key
      rslt._t_="P";
      rslt.FirstName=this.getFirstName();
      rslt.LastName=this.getLastName();
      rslt.Email=this.getEmail();
      rslt.Phone=this.getPhone();
      return rslt;
   }
   
   static byName(FirstName:StringQuery,LastName:StringQuery,done:(err:string,keys:string[])=>void,keysOnly?:boolean,forceRequest?:boolean,serverContext?:ServerContext){
      super.FIND("P",Query.dict({FirstName:FirstName ,LastName:LastName }),done,keysOnly,forceRequest,serverContext)
   }
   
   static byNameC(FirstName:StringQuery,LastName:StringQuery,keysOnly?:boolean,forceRequest?:boolean):string[]{
      let ds = DataObj.globalSource;
      return super.cFIND("P",Query.dict({FirstName:FirstName ,LastName:LastName }),keysOnly,forceRequest)
   }
}
