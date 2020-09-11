/// <reference path="../github.com/sparxteq/Zing/data/ZingEnv.ts"/>
const aws = require('aws-sdk');

class SoccerStatsEnv extends ZingEnv {
  readyPromise: Promise<boolean>
  dbCredentials: string | null

  constructor() {
    super();
    if (process.env.AWS_REGION && process.env.AWS_DB_CRED_SECRET_ID) {
      let client = new aws.SecretsManager({
        region: process.env.AWS_REGION
      });
      this.readyPromise = new Promise((resolve, reject) => {
        client.getSecretValue({ SecretId: process.env.AWS_DB_CRED_SECRET_ID }, function (err, data) {
          if (err) {
            reject(err);
          } else {
            if ('SecretString' in data) {
              this.dbCredentials = data.SecretString;
            } else {
              let buff = new Buffer(data.SecretBinary, 'base64');
              this.dbCredentials = buff.toString('ascii');
            }
            resolve(true);
          }
        });
      });
    } else {
      this.dbCredentials = process.env.MONGO_DB_CREDS;
      this.readyPromise = Promise.resolve(true);
    }
  }

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
  mongoCredentials(): string { return this.dbCredentials; }
  mongoHost(): string { return process.env.MONGO_DB_HOST; }
  mongoPort(): number { return parseInt(process.env.MONGO_DB_PORT || "27017"); }
}