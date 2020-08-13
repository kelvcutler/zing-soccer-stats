/// <reference path="Team.ts"/>
/// <reference path="Person.ts"/>
/// <reference path="Player.ts"/>
/// <reference path="Game.ts"/>
/// <reference path="GameEvent.ts"/>

function ZMake(expectedType:string,json:any):DataObj {
   let type:string=json._t_;
   if (!DataObj.checkTypeCode(expectedType,type)){
      console.log('ERR expecting '+expectedType+' got '+type,json);
      return null
   }
   if (!type){
      type=expectedType;
   }
   switch(type){
      
      case "T":
         return new Team(json);
      case "P":
         return new Person(json);
      case "PL":
         return new Player(json);
      case "G":
         return new Game(json);
      case "GE":
         return new GameEvent(json);
      default:
         console.log('ERR bad typeCode '+type+' on',json);
         return null
      
   }
   return null;
}
DataObj.make=ZMake;
function ZMakeList(expectedType:string,json:any[],parent:DataObj):DataObj[] {
   let rslt:DataObj[] = [];
   for (let i in json){
      let obj:DataObj = ZMake(expectedType,json[i]);
      obj.parent=parent;
      rslt.push(obj); 
   }
   return rslt;
}
DataObj.makeList=ZMakeList;
function ZMakeDict(expectedType:string,json:any,parent:DataObj):{[k:string]:DataObj} {
   let rslt:{[k:string]:DataObj}={};
   for (let k in json){
      let obj:DataObj = ZMake(expectedType,json[k]);
      obj.parent=parent;
      rslt[k]=obj; 
   }
   return rslt;
}
DataObj.makeDict=ZMakeDict;

DataObj.classInfo={
   "T":{ "className":"Team","superCode":"", "keyed":true,
      fields: {
         TeamName:{ type:"string", isList:false, isDict:false},
         SeasonLabel:{ type:"string", isList:false, isDict:false},
         Coach:{ type:"Person", isList:false, isDict:false},
         AssistantCoach:{ type:"Person", isList:false, isDict:false},
         TeamManager:{ type:"Person", isList:false, isDict:false},
      },
   },
   "P":{ "className":"Person","superCode":"", "keyed":true,
      fields: {
         FirstName:{ type:"string", isList:false, isDict:false},
         LastName:{ type:"string", isList:false, isDict:false},
         Email:{ type:"string", isList:false, isDict:false},
         Phone:{ type:"string", isList:false, isDict:false},
      },
   },
   "PL":{ "className":"Player","superCode":"", "keyed":true,
      fields: {
         Person:{ type:"Person", isList:false, isDict:false},
         JerseyNumber:{ type:"number", isList:false, isDict:false},
         Position:{ type:"string", isList:false, isDict:false},
         SecondaryPosition:{ type:"string", isList:false, isDict:false},
      },
   },
   "G":{ "className":"Game","superCode":"", "keyed":true,
      fields: {
         Team:{ type:"Team", isList:false, isDict:false},
         HomeGame:{ type:"boolean", isList:false, isDict:false},
         Date:{ type:"string", isList:false, isDict:false},
         StartTime:{ type:"number", isList:false, isDict:false},
         EndTime:{ type:"number", isList:false, isDict:false},
         WinResult:{ type:"string", isList:false, isDict:false},
         GameEvents:{ type:"GameEvent", isList:true, isDict:false},
      },
   },
   "GE":{ "className":"GameEvent","superCode":"", "keyed":false,
      fields: {
         EventType:{ type:"string", isList:false, isDict:false},
         Time:{ type:"number", isList:false, isDict:false},
         Player:{ type:"Player", isList:false, isDict:false},
         HomeScoreIncreased:{ type:"boolean", isList:false, isDict:false},
         AwayScoreIncreased:{ type:"boolean", isList:false, isDict:false},
      },
   },
}
