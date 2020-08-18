declare class ServerContext {
    request: any;
    response: any;
    isLogin: boolean;
    constructor(request: any, response: any);
    setUserKey(userKey: string): void;
    getUserKey(): string;
}
declare module DB {
    function start(message: string, obj?: any): void;
    function end(message: string, obj?: any): void;
    function dbOnPage(db: boolean): void;
    function msg(message: string, obj?: any): void;
    function stackTrace(message: string): void;
    function on(msg: string): void;
    function off(msg: string): void;
    function count(name: string): void;
    function showCount(name: string): void;
    function showCounts(msg?: string): void;
    function clearCounts(name?: string): void;
    function countsAutoShow(millis: number): void;
    function noCountsAutoShow(): void;
}
declare class UserManager {
    protected currentUserName: string;
    dataSource: DataSource;
    protected currentUserKey: string;
    constructor();
    get userName(): string;
    login(userName: string, password: string, done: (err: string, user: DataObj) => void, serverContext: ServerContext): void;
    logout(done: (err: string) => void): void;
    createUser(userDesc: any, password: string, done: (err: string) => void, serverContext: ServerContext): void;
    getUserKey(serverContext?: ServerContext): string;
    getUser(done: (user: DataObj) => void, serverContext?: ServerContext): void;
    serverSideLogin(userName: string, password: string, serverContext: ServerContext, done: (err: string, user: DataObj) => void): void;
    serverSideLogout(serverContext: ServerContext, done: (err: string) => void): void;
}
declare abstract class RightsManager {
    dataSource: DataSource;
    userManager: UserManager;
    constructor(dataSource: DataSource, userManager: UserManager);
    abstract checkGET(key: string, serverContext: ServerContext, done: (granted: boolean) => void): any;
    checkGETm(keys: string[], serverContext: ServerContext, done: (granted: boolean) => void): void;
    abstract checkGETBlob(blobKey: string, serverContext: any, done: (granted: boolean) => void): any;
    abstract checkPUT(obj: DataObj, serverContext: ServerContext, done: (granted: boolean) => void): any;
    checkPUTm(objs: DataObj[], serverContext: ServerContext, done: (granted: boolean) => void): void;
    abstract checkPUTBlob(serverContext: ServerContext, done: (granted: boolean) => void): any;
    abstract checkDELETE(key: string, serverContext: ServerContext, done: (granted: boolean) => void): any;
    abstract checkFIND(typeCode: string, search: Query, serverContext: ServerContext, done: (granted: boolean) => void): any;
    login(userId: string, password: string, done: (err: string, user: DataObj) => void, serverContext: ServerContext): void;
    createUser(userDesc: any, password: string, done: (err: string) => void, serverContext: ServerContext): void;
    protected checkAllGET(keys: string[], idx: number, serverContext: ServerContext, done: (granted: boolean) => void): void;
    protected checkAllPUT(objs: DataObj[], idx: number, serverContext: ServerContext, done: (granted: boolean) => void): void;
}
declare type QueryValue = number | string | boolean | Query;
declare type NumberQuery = number | Query;
declare type StringQuery = string | Query;
declare type BooleanQuery = boolean | Query;
declare class Query {
    exp: any;
    private constructor();
    static OR(options: QueryValue[]): Query;
    static AND(options: QueryValue[]): Query;
    static range(from: QueryValue, to: QueryValue): Query;
    static anything(): Query;
    static dict(desc: {
        [attName: string]: QueryValue;
    }): Query;
    static is(value: number | string | boolean): Query;
    static listContains(query: QueryValue): Query;
    static match(q1: QueryValue, q2: QueryValue): boolean;
    matches(val: any): boolean;
    static matchesQV(qv: QueryValue, val: any): boolean;
    attribute(attName: string): number | string | boolean | Query;
    toJSON(): any;
    static fromJSON(json: any): QueryValue;
    private queryValueListToJSON;
    private queryValueToJSON;
    private dictToJSON;
    private static listFromJSON;
    toMongo(): any;
    private static mongoCollapseDICT;
    private mongoOptionsList;
    private static toMongoValue;
    private static matchQuery;
    private static matchOptionLists;
    private static matchOptions;
    private static matchDicts;
    private rangeMatch;
    private dictMatch;
    matchesDO(obj: DataObj): boolean;
    private dictMatchDO;
}
interface DataMonitor {
    notify(): any;
}
declare class DataSource {
    private rightsManager_;
    private dataMonitor;
    constructor();
    setDataMonitor(dataMonitor: DataMonitor): void;
    getRightsManager(): RightsManager;
    setRightsManager(rm: RightsManager): void;
    isRemote(): boolean;
    notify(): void;
    GET(key: string, done: (err: string, data: DataObj) => void, forceRequest: boolean, serverContext: ServerContext): void;
    canGet(key: string, serverContext: ServerContext, done: (granted: boolean) => void): void;
    cGET(key: string, forceRequest?: boolean): DataObj;
    GETm(keys: string[], done: (err: string, data: DataObj[]) => void, forceRequest: boolean, serverContext: ServerContext): void;
    canGETm(keys: string[], serverContext: ServerContext, done: (granted: boolean) => void): void;
    cGETm(keys: string[], forceRequest?: boolean): DataObj[];
    PUT(obj: DataObj, done: (err: string, newObj: DataObj) => void, serverContext: ServerContext): void;
    canPUT(obj: DataObj, serverContext: ServerContext, done: (granted: boolean) => void): void;
    canGETBlob(blobKey: string, serverContext: ServerContext, done: (granted: boolean) => void): void;
    GETBlob(blobKey: string, serverContext: ServerContext, done: (err: string, blob: BlobStoreRec) => void): void;
    canPUTBlob(serverContext: ServerContext, done: (granted: boolean) => void): void;
    PUTBlob(blob: Blob, name: string, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    PUTFileBlob(file: File, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    PUTm(objs: DataObj[], done: (err: string, newObjs: DataObj[]) => void, serverContext: ServerContext): void;
    canPUTm(objs: DataObj[], serverContext: ServerContext, done: (granted: boolean) => void): void;
    DELETE(key: string, done?: (err: string) => void): void;
    canDELETE(key: string, serverContext: ServerContext, done: (granted: boolean) => void): void;
    FIND(typeCode: string, search: Query, done: (err: string, keys: string[], objs: DataObj[]) => void, keysOnly: boolean, forceRequest: boolean, serverContext: ServerContext): void;
    protected getFromKeys(keys: string[], idx: number, objs: DataObj[], done: (objs: DataObj[]) => void, serverContext: ServerContext): void;
    canFIND(typeCode: string, search: Query, serverContext: ServerContext, done: (granted: boolean) => void): void;
    cFIND(typeCode: string, search: Query, keysOnly: boolean, forceRequest: boolean): string[];
    static collectionFromKey(key: string): string;
    static typeFromKey(key: string): string;
    static idFromKey(key: string): string;
    static generateKey(typeCode: string): string;
    static filterKeyList(expectedCode: string, keyList: string[]): string[];
    touched(obj: DataObj): boolean;
    login(userId: string, password: string, done: (err: string) => void, serverContext?: ServerContext): void;
    httpLogin(userId: string, password: string, done: (err: string, user: DataObj) => void): void;
    httpLogout(done: (err: string) => void): void;
    createUser(userDesc: any, password: string, done: (err: string) => void, serverContext?: ServerContext): void;
}
declare class DataObj {
    protected _type: string;
    _key: string;
    parent: DataObj;
    dataSource: DataSource;
    static globalSource: DataSource;
    private blockTouch_;
    constructor(json: any);
    getTypeCode(): string;
    getDataSource(): DataSource;
    getUserManager(): UserManager;
    touch(): boolean;
    blockTouch(on: boolean): void;
    toJSON(): any;
    static GET(key: string, done: (err: string, newObj: DataObj) => void, forceRequest: boolean, serverContext: ServerContext): void;
    static cGET(key: string, forceRequest: boolean): DataObj;
    static GETm(keys: string[], done: (err: string, newObjs: DataObj[]) => void, forceRequest: boolean, serverContext: ServerContext): void;
    static cGETm(keys: string[], forceRequest?: boolean): DataObj[];
    GETFileBlob(blobKey: string, serverContext: ServerContext, done: (err: string, blob: BlobStoreRec) => void): void;
    PUT(done: (err: string, newObj: DataObj) => void, serverContext?: ServerContext): void;
    static PUTFileBlob(file: File, done: (err: string, blobKey: string) => void, serverContext?: ServerContext): void;
    static PUTBlob(blob: Blob, name: string, done: (err: string, blobKey: string) => void, serverContext?: ServerContext): void;
    static GETBlob(blobKey: string, serverContext: ServerContext, done: (err: string, blob: BlobStoreRec) => void): void;
    static PUTm(objs: DataObj[], done: (err: string, newObjs: DataObj[]) => void, serverContext: ServerContext): void;
    DELETE(done?: (err: string) => void, serverContext?: ServerContext): void;
    static FIND(typeCode: string, search: Query, done: (err: string, keys: string[]) => void, keysOnly: boolean, forceRequest: boolean, serverContext: ServerContext): void;
    static cFIND(typeCode: string, search: Query, keysOnly: boolean, forceRequest: boolean): string[];
    static checkTypeCode(expectedType: string, receivedType: string): boolean;
    static make: (expectedType: string, json: any) => DataObj;
    static makeList: (expectedType: string, json: any[], parent: DataObj) => DataObj[];
    static makeDict: (expectedType: string, json: any, parent: DataObj) => {
        [k: string]: DataObj;
    };
    private static classInfo_;
    static set classInfo(info: DataObjClassInfo);
    static get classInfo(): DataObjClassInfo;
    private static tToC;
    private static canA;
    private static sRoots;
    private static buildTypeToCollection;
    static typeCodeToName(typeCode: string): string;
    static typeToCollection(typeCode: string): string;
    static collections(): {
        [rootClassName: string]: boolean;
    };
    private static topSuperCode;
    private static buildCanAssign;
    private static superCanAssign;
}
declare type DataObjClassInfo = {
    [typeCode: string]: {
        className: string;
        superCode?: string;
        keyed: boolean;
        fields: {
            [fieldName: string]: {
                type: string;
                isList: boolean;
                isDict: boolean;
            };
        };
    };
};
declare type MongoBinary = any;
declare type BlobStoreRec = {
    _key?: string;
    name: string;
    type: string;
    nextBlob?: string;
    data: MongoBinary;
};
declare class MemDataSource extends DataSource {
    datastore: any;
    constructor();
    GET(key: string, done: (err: string, data: DataObj) => void, forceRequest: boolean, serverContext: ServerContext): void;
    cGET(key: string, forceRequest?: boolean): DataObj;
    GETm(keys: string[], done: (err: string, data: DataObj[]) => void, forceRequest: boolean, serverContext: ServerContext): void;
    private multiGet;
    GETBlob(blobKey: string, serverContext: ServerContext, done: (err: string, blob: BlobStoreRec) => void): void;
    cGETm(keys: string[], forceRequest?: boolean): DataObj[];
    PUT(obj: DataObj, done: (err: string, newObj: DataObj) => void, serverContext: ServerContext): void;
    PUTm(objs: DataObj[], done: (err: string, newObjs: DataObj[]) => void, serverContext: ServerContext): void;
    private multiPut;
    PUTFileBlob(file: File, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    PUTBlob(blob: Blob, name: string, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    DELETE(key: string, done?: (err: string) => void): void;
    FIND(typeCode: string, search: Query, done: (err: string, keys: string[], objs: DataObj[]) => void, keysOnly: boolean, forceRequest: boolean, serverContext: ServerContext): void;
    matches(srch: QueryValue, val: any): boolean;
    cFIND(typeCode: string, search: Query, forceRequest?: boolean): string[];
}
declare let mongo: any;
declare const Binary: any;
declare const fs: any;
declare class MongoDataSource extends DataSource {
    private db;
    private dbName;
    private port;
    private collectionNames;
    constructor(dbHost: string, port: number, dbName: string, dropCollections?: boolean, skipCreateCollections?: boolean);
    private dropCollections;
    private createCollections;
    GET(key: string, done: (err: string, data: DataObj) => void, forceRequest: boolean, serverContext: ServerContext): void;
    GETm(keys: string[], done: (err: string, data: DataObj[]) => void, forceRequest: boolean, serverContext: ServerContext): void;
    private multiGet;
    PUT(obj: DataObj, done: (err: string, newObj: DataObj) => void, serverContext: ServerContext): void;
    private static maxBlobSize;
    PUTFileBlob(file: File, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    PUTBlob(blob: Blob, name: string, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    private putDataBlob;
    private doMongoBlobPut;
    GETBlob(blobKey: string, serverContext: ServerContext, done: (err: string, blobData: BlobStoreRec) => void): void;
    private getMongoBlob;
    PUTm(objs: DataObj[], done: (err: string, newObjs: DataObj[]) => void, serverContext: ServerContext): void;
    private multiPut;
    DELETE(key: string, done?: (err: string) => void): void;
    FIND(typeCode: string, search: Query, done: (err: string, keys: string[], obj: DataObj[]) => void, keysOnly: boolean, forceRequest: boolean, serverContext: ServerContext): void;
    dataSearchToMongo(collectionCode: string, ds: Query): {};
}
declare type MongoRangeSearchSpec = {
    $gte?: number | string;
    $lte?: number | string;
};
declare type MongoItemEqual = {
    $eq: string | number | boolean;
};
declare type MongoListSearchSpec = {
    $elemMatch: MongoItemEqual | MongoRangeSearchSpec;
};
declare type MongoSearchSpec = {
    [fieldName: string]: string | number | boolean | MongoListSearchSpec | MongoRangeSearchSpec;
};
declare abstract class ZingEnv {
    env: any;
    constructor();
    abstract indexHTML(): string;
    abstract pageHTML(root: string, pageName: string): string;
    serverPort(): number;
    mongoHost(): string;
    mongoCredentials(): string;
    mongoPort(): number;
    mongoDB(): string;
    serverStartNotice(): void;
    httpsServer(): string;
}
declare const express: any;
declare const bodyParser: any;
declare const cookieParser: any;
declare const formidable: any;
declare const https: any;
declare class ZingExpress {
    app: any;
    express: any;
    dataSource: DataSource;
    env: ZingEnv;
    constructor(dataSource: DataSource, env: ZingEnv);
    extractQuery(query: any): any;
    private parseRange;
    private queryVal;
    private httpDebugMsg;
    private noCache;
    private setupServer;
    private sendErr;
    private doGetFilter_;
    private doGetFilter;
    set getFilter(filterFunction: (obj: DataObj) => DataObj);
    get(pattern: string, handler: (req: any, res: any) => void): void;
    post(pattern: string, handler: (req: any, res: any) => void): void;
    listen(portNumber: any): void;
}
declare class ZPerson extends DataObj {
    protected FirstName_: string;
    protected LastName_: string;
    protected Email_: string;
    protected Phone_: string;
    constructor(json: any);
    getTypeCode(): string;
    getFirstName(): string;
    setFirstName(newVal: string): void;
    getLastName(): string;
    setLastName(newVal: string): void;
    getEmail(): string;
    setEmail(newVal: string): void;
    getPhone(): string;
    setPhone(newVal: string): void;
    static GET(key: string, done: (err: string, data: Person) => void, forceRequest?: boolean, serverContext?: ServerContext): void;
    static cGET(key: string, forceRequest?: boolean): Person;
    static GETm(keys: string[], done: (err: string, data: Person[]) => void, forceRequest?: boolean, serverContext?: ServerContext): void;
    toJSON(): any;
    static byName(FirstName: StringQuery, LastName: StringQuery, done: (err: string, keys: string[]) => void, keysOnly?: boolean, forceRequest?: boolean, serverContext?: ServerContext): void;
    static byNameC(FirstName: StringQuery, LastName: StringQuery, keysOnly?: boolean, forceRequest?: boolean): string[];
}
declare class Person extends ZPerson {
}
declare class ZTeam extends DataObj {
    protected TeamName_: string;
    protected SeasonLabel_: string;
    protected Coach_: string;
    protected AssistantCoach_: string;
    protected TeamManager_: string;
    constructor(json: any);
    getTypeCode(): string;
    getTeamName(): string;
    setTeamName(newVal: string): void;
    getSeasonLabel(): string;
    setSeasonLabel(newVal: string): void;
    getCoach(): string;
    setCoach(newVal: string): void;
    getAssistantCoach(): string;
    setAssistantCoach(newVal: string): void;
    getTeamManager(): string;
    setTeamManager(newVal: string): void;
    static GET(key: string, done: (err: string, data: Team) => void, forceRequest?: boolean, serverContext?: ServerContext): void;
    static cGET(key: string, forceRequest?: boolean): Team;
    static GETm(keys: string[], done: (err: string, data: Team[]) => void, forceRequest?: boolean, serverContext?: ServerContext): void;
    toJSON(): any;
    static byName(TeamName: StringQuery, done: (err: string, keys: string[]) => void, keysOnly?: boolean, forceRequest?: boolean, serverContext?: ServerContext): void;
    static byNameC(TeamName: StringQuery, keysOnly?: boolean, forceRequest?: boolean): string[];
}
declare class Team extends ZTeam {
    static makeNew(name: string, done: (err: string, team: Team) => void): void;
    static allTeams(): string[];
}
declare class ZPlayer extends DataObj {
    protected Person_: string;
    protected JerseyNumber_: number;
    protected Position_: string;
    protected SecondaryPosition_: string;
    constructor(json: any);
    getTypeCode(): string;
    getPerson(): string;
    setPerson(newVal: string): void;
    getJerseyNumber(): number;
    setJerseyNumber(newVal: number): void;
    getPosition(): string;
    setPosition(newVal: string): void;
    getSecondaryPosition(): string;
    setSecondaryPosition(newVal: string): void;
    static GET(key: string, done: (err: string, data: Player) => void, forceRequest?: boolean, serverContext?: ServerContext): void;
    static cGET(key: string, forceRequest?: boolean): Player;
    static GETm(keys: string[], done: (err: string, data: Player[]) => void, forceRequest?: boolean, serverContext?: ServerContext): void;
    toJSON(): any;
    static byPerson(Person: string, done: (err: string, keys: string[]) => void, keysOnly?: boolean, forceRequest?: boolean, serverContext?: ServerContext): void;
    static byPersonC(Person: string, keysOnly?: boolean, forceRequest?: boolean): string[];
    static byNumber(JerseyNumber: NumberQuery, done: (err: string, keys: string[]) => void, keysOnly?: boolean, forceRequest?: boolean, serverContext?: ServerContext): void;
    static byNumberC(JerseyNumber: NumberQuery, keysOnly?: boolean, forceRequest?: boolean): string[];
}
declare class Player extends ZPlayer {
}
declare class ZGameEvent extends DataObj {
    protected EventType_: string;
    protected Time_: number;
    protected Player_: string;
    protected HomeScoreIncreased_: boolean;
    protected AwayScoreIncreased_: boolean;
    constructor(json: any);
    getTypeCode(): string;
    getEventType(): string;
    setEventType(newVal: string): void;
    getTime(): number;
    setTime(newVal: number): void;
    getPlayer(): string;
    setPlayer(newVal: string): void;
    getHomeScoreIncreased(): boolean;
    setHomeScoreIncreased(newVal: boolean): void;
    getAwayScoreIncreased(): boolean;
    setAwayScoreIncreased(newVal: boolean): void;
    toJSON(): any;
}
declare class GameEvent extends ZGameEvent {
}
declare class ZGame extends DataObj {
    protected Team_: string;
    protected HomeGame_: boolean;
    protected Date_: string;
    protected StartTime_: number;
    protected EndTime_: number;
    protected WinResult_: string;
    protected GameEvents_: GameEvent[];
    constructor(json: any);
    getTypeCode(): string;
    getTeam(): string;
    setTeam(newVal: string): void;
    getHomeGame(): boolean;
    setHomeGame(newVal: boolean): void;
    getDate(): string;
    setDate(newVal: string): void;
    getStartTime(): number;
    setStartTime(newVal: number): void;
    getEndTime(): number;
    setEndTime(newVal: number): void;
    getWinResult(): string;
    setWinResult(newVal: string): void;
    getGameEvents(): GameEvent[];
    setGameEvents(val: GameEvent[]): void;
    static GET(key: string, done: (err: string, data: Game) => void, forceRequest?: boolean, serverContext?: ServerContext): void;
    static cGET(key: string, forceRequest?: boolean): Game;
    static GETm(keys: string[], done: (err: string, data: Game[]) => void, forceRequest?: boolean, serverContext?: ServerContext): void;
    toJSON(): any;
    static byDate(Date: StringQuery, done: (err: string, keys: string[]) => void, keysOnly?: boolean, forceRequest?: boolean, serverContext?: ServerContext): void;
    static byDateC(Date: StringQuery, keysOnly?: boolean, forceRequest?: boolean): string[];
    static byHome(HomeGame: boolean, done: (err: string, keys: string[]) => void, keysOnly?: boolean, forceRequest?: boolean, serverContext?: ServerContext): void;
    static byHomeC(HomeGame: boolean, keysOnly?: boolean, forceRequest?: boolean): string[];
    static byWinResult(WinResult: StringQuery, done: (err: string, keys: string[]) => void, keysOnly?: boolean, forceRequest?: boolean, serverContext?: ServerContext): void;
    static byWinResultC(WinResult: StringQuery, keysOnly?: boolean, forceRequest?: boolean): string[];
}
declare class Game extends ZGame {
}
declare function ZMake(expectedType: string, json: any): DataObj;
declare function ZMakeList(expectedType: string, json: any[], parent: DataObj): DataObj[];
declare function ZMakeDict(expectedType: string, json: any, parent: DataObj): {
    [k: string]: DataObj;
};
declare class SoccerStatsEnv extends ZingEnv {
    indexHTML(): string;
    pageHTML(root: string, pageName: string): string;
    serverPort(): number;
    mongoDB(): string;
    mongoCredentials(): string;
    mongoHost(): string;
    mongoPort(): number;
}
declare class AllRightsManager extends RightsManager {
    constructor(dataSource: DataSource, userManager?: NoUserManager);
    checkGET(key: string, serverContext: ServerContext, done: (granted: boolean) => void): void;
    checkGETBlob(blobKey: string, serverContext: any, done: (granted: boolean) => void): void;
    checkPUT(obj: DataObj, serverContext: ServerContext, done: (granted: boolean) => void): void;
    checkPUTBlob(serverContext: ServerContext, done: (granted: boolean) => void): void;
    checkDELETE(key: string, serverContext: ServerContext, done: (granted: boolean) => void): void;
    checkFIND(typeCode: string, search: Query, serverContext: ServerContext, done: (granted: boolean) => void): void;
}
declare class NoUserManager extends UserManager {
    login(userName: string, password: string, done: (err: string, user: DataObj) => void, serverContext: ServerContext): void;
    getUserKey(serverContext?: ServerContext): string;
}
declare let env: SoccerStatsEnv;
declare let dataSource: MongoDataSource;
declare let rightsManager: AllRightsManager;
declare let app: ZingExpress;
