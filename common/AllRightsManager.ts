
/// <reference path="../../01/data/RightsManager.ts"/>
/// <reference path="../../01/data/UserManager.ts"/>

class AllRightsManager extends RightsManager {
  constructor(dataSource: DataSource, userManager = new NoUserManager()) {
    super(dataSource, userManager);
  }
  checkGET(key: string, serverContext: ServerContext, done: (granted: boolean) => void) {
    done(true);
  }

  checkGETBlob(blobKey: string, serverContext, done: (granted: boolean) => void) {
    done(true);
  }
  checkPUT(obj: DataObj, serverContext: ServerContext, done: (granted: boolean) => void) {
    done(true);
  }

  checkPUTBlob(serverContext: ServerContext, done: (granted: boolean) => void) {
    done(true);
  }
  checkDELETE(key: string, serverContext: ServerContext, done: (granted: boolean) => void) {
    done(true);
  }
  checkFIND(typeCode: string, search: Query, serverContext: ServerContext, done: (granted: boolean) => void) {
    done(true);
  }
}

class NoUserManager extends UserManager {
  login(userName: string, password: string, done: (err: string, user: DataObj) => void,
    serverContext: ServerContext) {
    done(null, null);
  }

  getUserKey(serverContext?: ServerContext): string {
    return "anonymous";
  }

}