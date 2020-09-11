/// <reference path="../../01/Zing/data/clientRefs.ts"/>
/// <reference path="../models/ZMake.ts"/>
/// <reference path="../common/AllRightsManager.ts"/>
/// <reference path="pages/package.ts"/>

let httpSource = new HTTPDataSource(window.location.origin + "/");
let source = new CacheDataSource(httpSource);

DataObj.globalSource = source;
let rm: RightsManager = new AllRightsManager(source);
source.setRightsManager(rm);
ZUI.pageManager = new PageManager(source,
  new HomePage(null), "#content");