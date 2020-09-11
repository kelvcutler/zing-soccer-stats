
/// <reference path="../../github.com/sparxteq/Zing/data/serverRefs.ts"/>
/// <reference path="../models/ZMake.ts"/>
/// <reference path="../SoccerStatsEnv.ts"/>
/// <reference path="../common/AllRightsManager.ts"/>
require("dotenv").config();

let env = new SoccerStatsEnv();

env.readyPromise.then(() => {
  let dataSource = new MongoDataSource(
    env.mongoCredentials() + (env.mongoCredentials() ? "@" : "") + env.mongoHost(),
    env.mongoPort(),
    env.mongoDB(),
    false
  );
  let rightsManager = new AllRightsManager(dataSource);
  dataSource.setRightsManager(rightsManager);

  let app = new ZingExpress(dataSource, env);

  env.serverStartNotice();
  app.listen(env.serverPort());
})
  .catch((err) => {
    console.log("Could not start up server due to: ", err);
  });
