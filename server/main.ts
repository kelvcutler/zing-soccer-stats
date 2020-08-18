
/// <reference path="../../aaswZing/Zing/data/serverRefs.ts"/>
/// <reference path="../models/ZMake.ts"/>
/// <reference path="../SoccerStatsEnv.ts"/>
/// <reference path="../common/AllRightsManager.ts"/>
require("dotenv").config();

let env = new SoccerStatsEnv();
let dataSource = new MongoDataSource(
  env.mongoCredentials() + (env.mongoCredentials() ? "@" : "") + env.mongoHost(),
  env.mongoPort(),
  env.mongoDB(),
  false,
  true
);
let rightsManager = new AllRightsManager(dataSource);
dataSource.setRightsManager(rightsManager);

let app = new ZingExpress(dataSource, env);

env.serverStartNotice();
app.listen(env.serverPort());
