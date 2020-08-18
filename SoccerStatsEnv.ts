/// <reference path="../aaswZing/Zing/data/ZingEnv.ts"/>

class SoccerStatsEnv extends ZingEnv {
  indexHTML(): string {
    return `
      <html>
          <head>
              <script
                  src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
                  integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E="
                  crossorigin="anonymous">
              </script>
              <link rel="stylesheet" type="text/css" href="/main.css"/>
          </head>
          <body>
              <div id="content"></div>
              <script src="/client.js"></script>
              <div id="modaloverlay" class="hidden"></div>
          </body>
      </html>
      `
  }
  pageHTML(root: string, pageName: string): string {
    return this.indexHTML();
  }
  serverPort() {
    return parseInt(process.env.SERVER_PORT || "4000");
  }
  mongoDB(): string { return process.env.MONGO_DB_NAME; }
  mongoCredentials(): string { return process.env.MONGO_DB_CREDS; }
  mongoHost(): string { return process.env.MONGO_DB_HOST; }
  mongoPort(): number { return parseInt(process.env.MONGO_DB_PORT || "27017"); }
}