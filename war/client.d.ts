/// <reference path="../aaswZing/Zing/zui/typings/jquery.d.ts" />
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
declare class ServerContext {
    request: any;
    response: any;
    isLogin: boolean;
    constructor(request: any, response: any);
    setUserKey(userKey: string): void;
    getUserKey(): string;
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
declare class HTTPDataSource extends DataSource {
    urlRoot: string;
    constructor(urlRoot?: string);
    isRemote(): boolean;
    GET(key: string, done: (err: string, data: DataObj) => void, forceRequest: boolean, serverContext: ServerContext): void;
    httpLogin(userName: string, password: string, done: (err: string, user: DataObj) => void): void;
    httpLogout(done: (err: string) => void): void;
    getCurrentUserKey(done: (userKey: string) => void, request?: any, response?: any): void;
    GETm(keys: string[], done: (err: string, data: DataObj[]) => void, forceRequest: boolean, serverContext: ServerContext): void;
    GETBlob(blobKey: string, serverContext: ServerContext, done: (err: string, blob: BlobStoreRec) => void): void;
    static urlFromBlobKey(blobKey: string): string;
    PUT(obj: DataObj, done: (err: string, newObj: DataObj) => void, serverContext: ServerContext): void;
    createUser(userDesc: any, password: string, done: (err: string) => void): void;
    PUTm(objs: DataObj[], done: (err: string, newObjs: DataObj[]) => void, serverContext: ServerContext): void;
    PUTFileBlob(file: File, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    PUTBlob(blob: Blob, name: string, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    DELETE(key: string, done?: (err: string) => void): void;
    FIND(typeCode: string, search: Query, done: (err: string, keys: string[], objs: DataObj[]) => void, keysOnly: boolean, forceRequest: boolean, serverContext: ServerContext): void;
    private buildSearchQuery;
}
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
declare class CacheDataSource extends DataSource {
    actualSource: DataSource;
    static objLeaseTime: number;
    static updateLatency: number;
    constructor(actualSource: DataSource, dataMonitor?: DataMonitor);
    setDataMonitor(dataMonitor: DataMonitor): void;
    setRightsManager(rm: RightsManager): void;
    isRemote(): boolean;
    GET(key: string, done: (err: string, data: DataObj) => void, forceRequest: boolean, serverContext: ServerContext): void;
    cGET(key: string, forceRequest?: boolean): DataObj;
    GETm(keys: string[], done: (err: string, data: DataObj[]) => void, forceRequest: boolean, serverContext: ServerContext): void;
    private getMActual;
    cGETm(keys: string[], forceRequest?: boolean): DataObj[];
    GETBlob(blobKey: string, serverContext: ServerContext, done: (err: string, blob: BlobStoreRec) => void): void;
    PUT(obj: DataObj, done: (err: string, newObj: DataObj) => void, serverContext: ServerContext): void;
    PUTm(objs: DataObj[], done: (err: string, newObjs: DataObj[]) => void, serverContext: ServerContext): void;
    PUTFileBlob(file: File, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    PUTBlob(blob: Blob, name: string, serverContext: ServerContext, done: (err: string, blobKey: string) => void): void;
    DELETE(key: string, done?: (err: string) => void): void;
    FIND(typeCode: string, search: Query, done: (err: string, keys: string[], objs: DataObj[]) => void, keysOnly: boolean, forceRequest: boolean, serverContext: ServerContext): void;
    private doFind;
    private registerInProgress;
    cFIND(typeCode: string, search: Query, keysOnly: boolean, forceRequest: boolean): string[];
    touched(obj: DataObj): boolean;
    login(userId: string, password: string, done: (err: string) => void, serverContext: ServerContext): void;
    httpLogin(userName: string, password: string, done: (err: string, user: DataObj) => void): void;
    createUser(userDesc: any, password: string, done: (err: string) => void, serverContext: ServerContext): void;
    private MAX_CACHE;
    private cacheCount;
    private recentCache;
    private prevCache;
    private checkCacheSize;
    private cacheObj;
    private cacheObjs;
    private getCachedObj;
    private cacheRequestInProgress;
    private getCachedObjs;
    private delObjCache;
    private MAX_FIND_CACHE;
    private findCacheCount;
    private recentFindCache;
    private prevFindCache;
    private checkFindCacheSize;
    private cacheFind;
    private getCachedFind;
    private locateFind;
    private purgeFind;
    private clearFindCache;
    private superTypeCodes;
    private pendingUpdates;
    private pendingUpdateTimerStarted;
    private scheduleUpdate;
}
declare class CacheObj {
    timeCached: number;
    requestInProgress: boolean;
    obj: DataObj;
    constructor(obj: DataObj);
    expired(): boolean;
}
declare class FindCacheObj extends CacheObj {
    search: Query;
    private keys_;
    private keyMap;
    setKeys(newKeys: string[]): void;
    getKeys(): string[];
    constructor(search: Query, keys: string[]);
    setData(search: Query, keys: string[]): void;
    checkDelete(key: string): void;
    checkForUpdate(obj: DataObj): void;
    private rebuildKeysFromMap;
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
    getFullName(): string;
    getDescription(includeEmail?: boolean): string;
    static allPersons(): string[];
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
declare type KeyString = string;
declare type ZUIVal = DataObj | string | number | boolean | DataObj[] | string[] | number[] | boolean[];
declare type Fstring = () => string;
declare type StringF = string | Fstring;
declare type StringSetF = (val: string) => void;
declare type Fnumber = () => number;
declare type NumberF = number | Fnumber;
declare type NumberSetF = (val: number) => void;
declare type Fboolean = () => boolean;
declare type BooleanF = boolean | Fboolean;
declare type BooleanSetF = (val: boolean) => void;
declare type EventF = (event: Event) => void;
declare type FZUI = () => ZUI;
declare type ZUIF = ZUI | FZUI;
declare type FZUIList = () => ZUI[];
declare type ZUIListF = ZUI[] | FZUIList;
declare class ZUI {
    protected content: ZUI;
    renderJQ(): JQuery;
    static pageManager: PageManager;
    constructor();
    static notifyCount: number;
    static notify(): void;
    protected css_: StringF;
    css(c: StringF): ZUI;
    protected applyCSS(jq: JQuery): void;
    protected field_: string;
    field(f: string): ZUI;
    protected style_: StringF;
    style(s: StringF): ZUI;
    protected hideShow_: BooleanF;
    hideShow(hs: BooleanF): ZUI;
    hide(): boolean;
    static stringVal(content: StringF): string;
    static numberVal(content: NumberF): number;
    classStr(): string;
    uniqueId(): string;
    waiting(): JQuery;
    error(msg: string): JQuery;
    static setState(fieldName: string, newVal: any): void;
    static getState(fieldName: string): any;
    static getUserKey(): string;
}
declare class TextUI extends ZUI {
    private textS;
    constructor(text: StringF);
    renderJQ(): JQuery;
}
declare class ButtonUI extends ZUI {
    title: StringF;
    onclick: (event: Event) => void;
    enabled: () => boolean;
    constructor(title: StringF);
    click(onclick: (event: Event) => void): ButtonUI;
    enable(enabled: () => boolean): ButtonUI;
    renderJQ(): JQuery;
}
declare class InputUI extends ZUI {
    getF_: Fstring;
    setF_: StringSetF;
    phF: StringF;
    fieldType: string;
    constructor(fieldType?: string);
    getF(getFF: Fstring): InputUI;
    setF(setFF: StringSetF): InputUI;
    placeHolder(phF: StringF): InputUI;
    renderJQ(): JQuery;
}
declare class TextFieldUI extends InputUI {
    getF_: Fstring;
    setF_: StringSetF;
    phF: StringF;
    constructor(fieldType?: "text" | "password" | "number" | "email" | "url");
}
declare type PageState = {
    [stateVarName: string]: string;
};
declare type PageMap = {
    [pageName: string]: (state: PageState) => Page;
};
declare class PageManager implements DataMonitor {
    dataSource: DataSource;
    pageContentSelector: string;
    homePage: Page;
    private static pageMap;
    private static curManager;
    curPage: Page;
    private root;
    constructor(dataSource: DataSource, homePage: Page, pageContentSelector: string);
    getPageState(): PageState;
    private static GETPageState;
    static GOTO(pageName: string, newState?: PageState): void;
    goto(pageName: string, newState?: PageState): void;
    static PUSHTO(pageName: string, newState?: PageState): void;
    pushto(pageName: string, newState?: PageState): void;
    private setupNextPage;
    private static queryFromState;
    getUserManager(): UserManager;
    getUser(done: (user: DataObj) => void): void;
    getUserKey(): string;
    notify(): void;
    static BACK(): void;
    back(): void;
    static registerPageFactory(pageName: string, factory: (state: PageState) => Page): void;
    private doPopState;
    private pageFromURLPath;
    private stateFromQuery;
    private static afterDOMList;
    static addAfterDOMNotice(noticeF: () => void): void;
    private static afterDOMNotify;
}
declare abstract class Page extends ZUI {
    pageState: PageState;
    pageManager: PageManager;
    constructor(pageState: PageState);
    notify(): void;
    getUserManager(): UserManager;
    getUserKey(): string;
    abstract pageName(): string;
}
declare class TabUI extends ZUI {
    items: TabUIDesc[];
    selectedTabIdx: number;
    constructor();
    tab(tabTitle: string, tabView: ZUIF): TabUI;
    renderJQ(): JQuery;
    protected renderTabBar(): JQuery;
    protected renderTabBtn(i: any, desc: TabUIDesc): JQuery;
}
declare type TabUIDesc = {
    tabTitle: string;
    tabView: ZUIF;
    renderTabView: ZUI;
};
declare class DivUI extends ZUI {
    items: ZUIListF;
    constructor(items: ZUIListF);
    renderJQ(): JQuery;
}
declare type TypeSwitchUIChoice = {
    typeCode: string;
    zui: ZUI;
};
declare class TypeSwitchUI extends ZUI {
    choices: TypeSwitchUIChoice[];
    model: DataObj;
    constructor();
    choice(typeCode: string, controller: ZUI): TypeSwitchUI;
    renderJQ(): JQuery;
}
declare class OpenCloseUI extends ZUI {
    headerZ: ZUI;
    hideShowFZ: FZUI;
    hideShowZ: ZUI;
    hidden: boolean;
    hideShowJQ: JQuery;
    arrowBoxJQ: JQuery;
    constructor(headerUI: ZUI, hideShowUI: FZUI, initialOpen?: boolean);
    renderJQ(): JQuery;
    protected arrowBox(): JQuery;
    protected openCloseClick(): void;
    protected refreshArrow(): void;
}
declare class KeyListUI extends DivUI {
    protected keyListF: () => KeyString[];
    protected itemViewF: (objKey: string) => ZUI;
    protected keyMap: {
        [objKey: string]: ZUI;
    };
    protected sortF: (key1: string, key2: string) => number;
    constructor(keyListF: () => KeyString[]);
    itemView(itemViewF: (objKey: string) => ZUI): KeyListUI;
    sort(sortF: (key1: string, key2: string) => number): KeyListUI;
    protected buildKeyViewList(): void;
    renderJQ(): JQuery;
}
declare type MessageUIContent = {
    msgType: "error" | "inform";
    msg: string;
};
declare class Messages extends ZUI {
    messageList: MessageUIContent[];
    static curMessages: Messages;
    constructor();
    renderJQ(): JQuery;
    private newMessage;
    static error(msg: string): void;
    static inform(msg: string): void;
    static clear(): void;
    static hasMessages(): boolean;
}
declare class SelectUI extends ZUI {
    selectF: () => string;
    choices: {
        [selectCode: string]: ZUIF;
    };
    constructor(selectF: () => string);
    choice(selectCode: string, ui: ZUIF): SelectUI;
    renderJQ(): JQuery;
}
declare class Modal {
    static alert(message: string): void;
    static confirm(message: string, answer: (yes: boolean) => void): void;
    private static saveDisplay;
    private static actions;
    private static lastShowMillis;
    static show(display: ZUI, actions: {
        [text: string]: () => void;
    }): void;
    static notify(): void;
    static hide(): void;
    private static makeActions;
    private static btnAction;
    private static savedSelection;
    private static saveSelection;
    private static restoreSelection;
}
declare class HTMLEditUI extends ZUI {
    private htmlDiv;
    private saveStatusBar;
    private isMin;
    getF_: Fstring;
    setF_: StringSetF;
    constructor();
    getF(getFF: Fstring): HTMLEditUI;
    setF(setFF: StringSetF): HTMLEditUI;
    toolBar(): ZUI;
    renderJQ(): JQuery;
    private saveTimerStarted;
    private saveContent;
    scheduleSave(): void;
}
declare class HTMLEditSaveStatusBar extends ZUI {
    div: JQuery;
    constructor();
    set(saveOn: boolean): void;
    renderJQ(): JQuery;
}
declare class HTMLEditControl extends ButtonUI {
    parent: HTMLEditUI;
    cls: string;
    cmnd: string;
    st: string;
    btn: JQuery;
    constructor(parent: HTMLEditUI, cmnd: string, cap?: string, style?: string);
    private validURL;
}
declare class HTMLImageDropControl extends ZUI {
    parent: HTMLEditUI;
    cls: string;
    cmnd: string;
    st: string;
    btn: JQuery;
    id: string;
    constructor(parent: HTMLEditUI, cmnd: string, cap?: string, style?: string);
    private processDroppedFiles;
    renderJQ(): JQuery;
}
declare class HTMLBlockControl extends ButtonUI {
    cls: string;
    parent: HTMLEditUI;
    constructor(parent: HTMLEditUI, param: string, text: string, cap?: string);
}
declare class ClickWrapperUI extends DivUI {
    onclick: (event: Event) => void;
    id: string;
    constructor(items: ZUIListF);
    click(onclick: (event: Event) => void): ClickWrapperUI;
    renderJQ(): JQuery;
}
declare class BreakUI extends ZUI {
    private textS;
    constructor(text?: StringF);
    renderJQ(): JQuery;
}
declare type ObjZUI = {
    obj: DataObj;
    zui: ZUI;
};
declare class ObjListUI extends DivUI {
    protected objListF: () => DataObj[];
    protected itemViewF: (obj: DataObj) => ZUI;
    protected objMap: ObjZUI[];
    protected sortF: (o1: DataObj, o2: DataObj) => number;
    constructor(objListF: () => DataObj[]);
    itemView(itemViewF: (obj: DataObj) => ZUI): ObjListUI;
    sort(sortF: (obj1: DataObj, obj2: DataObj) => number): ObjListUI;
    protected buildKeyViewList(): void;
    protected findZUI(obj: DataObj): ZUI;
    renderJQ(): JQuery;
}
declare class FileDropTargetUI extends ZUI {
    onDrop: (files: File[]) => void;
    content: ZUI;
    hoverStyle_: string;
    id: string;
    constructor(content: ZUI);
    drop(onDrop: (files: File[]) => void): FileDropTargetUI;
    hoverStyle(hStyle: string): FileDropTargetUI;
    renderJQ(): JQuery;
}
declare class IconButtonUI extends ZUI {
    private url;
    private onclick;
    private iconName;
    private selected_;
    private jq;
    constructor(iconName: string, url: string);
    click(onclick: (event: Event) => void): IconButtonUI;
    selected(selectedF: () => boolean): IconButtonUI;
    getIconName(): string;
    renderJQ(): JQuery;
}
declare class ColorPickerUI extends ZUI {
    getF_: Fstring;
    setF_: StringSetF;
    constructor();
    getF(getFF: Fstring): ColorPickerUI;
    setF(setFF: StringSetF): ColorPickerUI;
    renderJQ(): JQuery;
}
declare class SliderUI extends ZUI {
    getF_: Fnumber;
    setF_: NumberSetF;
    minF_: NumberF;
    maxF_: NumberF;
    constructor(min: NumberF, max: NumberF);
    getF(getFF: Fnumber): SliderUI;
    setF(setFF: NumberSetF): SliderUI;
    renderJQ(): JQuery;
}
declare class StyleCheckUI extends ZUI {
    checkVal: () => boolean;
    checkedStyle_: string;
    clickF: () => void;
    constructor(checkVal: () => boolean);
    click(clickF: () => void): StyleCheckUI;
    checkedStyle(checkedStyle: string): StyleCheckUI;
    renderJQ(): JQuery;
}
declare class DoneIndicatorUI extends ZUI {
    getF_: Fnumber;
    barStyle_: string;
    clickF: () => void;
    constructor(getF: Fnumber);
    barStyle(barStyle_: string): DoneIndicatorUI;
    click(clickF: () => void): DoneIndicatorUI;
    renderJQ(): JQuery;
}
declare class DropDownChoiceUI extends ZUI {
    getF_: () => string;
    setF_: (val: string) => void;
    choices: {
        selectCode: string;
        label: string;
    }[];
    constructor();
    getF(f: () => string): DropDownChoiceUI;
    setF(f: (val: string) => void): DropDownChoiceUI;
    choice(selectCode: string, label: string): DropDownChoiceUI;
    renderJQ(): JQuery;
}
declare class DateTimeUI extends InputUI {
    constructor(fieldType: "date" | "datetime-local" | "month" | "time" | "week");
}
declare class DragDropWrapperUI extends ZUI {
    id: string;
    hoverStyle: string;
    hoverHighStyle: string;
    hoverLowStyle: string;
    payload: any;
    doDrop: (payload: any, where: null | "high" | "low") => void;
    constructor(content: ZUI);
    protected dragEnter(e: JQueryEventObject): void;
    protected dragOver(e: any): void;
    private eventPayload;
    protected dragLeave(e: JQueryEventObject): void;
    protected dropEvent(e: any): void;
    protected dragStart(e: any): void;
    hover(hvStyle: string): DragDropWrapperUI;
    high(hStyle: string): DragDropWrapperUI;
    low(hStyle: string): DragDropWrapperUI;
    private getPayload;
    dragPayload(payload: any): DragDropWrapperUI;
    drop(doDrop: (payload: any, where?: null | "high" | "low") => void): DragDropWrapperUI;
    renderJQ(): JQuery;
}
declare type StringSource = string | StringF | string[];
declare class ImageUI extends ZUI {
    private urlSource;
    constructor(urlSource: StringSource);
    private url;
    renderJQ(): JQuery;
}
declare class ProcessLogUI extends ZUI {
    title: string;
    private log;
    private indent;
    private n;
    private outOf;
    private timingOn;
    private startTimeStack;
    private lastOverWrite;
    constructor();
    timing(timeOn?: boolean): ProcessLogUI;
    clear(): void;
    msg(msg: string): void;
    overWrite(msg: string): void;
    start(msg: string): void;
    end(msg: string): void;
    renderJQ(): JQuery;
}
declare abstract class DataTableUIAbs extends ZUI {
    protected maxColumns: number;
    protected maxRows: number;
    protected firstRow: number;
    protected lastRow: number;
    protected firstCol: number;
    protected lastCol: number;
    protected nCols: number;
    protected nRows: number;
    protected cellEnter: (row: number, col: number) => void;
    protected rowInc: number;
    protected colInc: number;
    constructor(maxRows?: number, maxColumns?: number, cellEnter?: (row: number, col: number) => void);
    setMaxes(maxRows: number, maxColumns: number): void;
    setFirstCol(firstCol: number): void;
    setFirstRow(firstRow: number): void;
    protected tableStyle(): string;
    abstract hasData(): boolean;
    protected abstract colHeaderList(): string[];
    protected abstract rowLabelList(): string[];
    protected abstract rowData(row: number, firstCol: number, lastCol: number): any[];
    renderJQ(): JQuery;
    protected columnHeaderRow(colHeaderList: string[]): JQuery;
    protected tableRow(rowIdx: number, rowLabel: string, rowData: any[]): JQuery;
    protected leftBtn(): JQuery;
    protected rightBtn(): JQuery;
    protected upRow(): JQuery;
    protected upBtn(): JQuery;
    protected downRow(): JQuery;
    protected downBtn(): JQuery;
    protected ellipsis(): JQuery;
    private resolveRowsCols;
}
declare abstract class DataTableAbs {
    abstract hasCol(ColName: string): boolean;
    abstract colName(colIdx: number): string;
    abstract colIdx(colName: string): number;
    abstract nRows(): number;
    abstract columnHeaders(): string[];
    abstract nCols(): number;
    abstract get(row: number, col: string): string | number;
    abstract sortRows(colName: string, descending: boolean): any;
    toJSON(): DataTableJSON;
    getRow(row: number): DataRow;
    getColumn(col: string): DataColumn;
    copy(): DataTable;
    toCSVStr(): string;
    private toCSVHead;
    private toCSVRow;
    valueDensity(): number;
    columnDensityCount(density: number): void;
    sum(): number;
    count(): number;
    countNumbers(): number;
    max(): number;
    min(): number;
    db(msg?: string, maxColumns?: number, maxRows?: number): void;
}
declare type RowTableJSON = {
    [colName: string]: number | string;
};
declare abstract class DataRowAbs {
    abstract hasCol(colName: string): boolean;
    abstract colIdx(colName: string): number;
    abstract colName(colIndex: number): string;
    abstract columnHeaders(): string[];
    abstract nCols(): number;
    abstract get(col: string): string | number;
    abstract sort(descending?: boolean): any;
    abstract renameColumns(newNames: {
        [oldName: string]: string;
    }): any;
    toJSON(): RowTableJSON;
    copy(): DataRow;
    sum(): number;
    sumSquares(): number;
    pairProduct(row2: DataRowAbs): DataRow;
    dotProduct(row2: DataRowAbs): number;
    count(): number;
    countNumbers(): number;
    max(): number;
    min(): number;
    subSet(startIdx: number, endIdx: number): DataRow;
    db(msg?: string, maxColumns?: number): void;
}
declare class DataRow extends DataRowAbs {
    protected contents: any[];
    protected columnHeaderIdxs: {
        [columnHeader: string]: number;
    };
    protected orderedColumnHeaders: string[];
    constructor(headerIdxs?: {
        [columnHeader: string]: number;
    }, contents?: any[]);
    hasCol(colName: string): boolean;
    colIdx(colName: string): number;
    colName(colIndex: number): string;
    columnHeaders(): string[];
    protected rebuildOrderedColumnHeaders(): void;
    nCols(): number;
    getI(col: number): any;
    protected setI(col: number, newVal: any): void;
    get(col: string): string | number;
    set(col: string, newVal: any): void;
    addTo(col: string, newVal: number): void;
    static fromJSON(json: RowTableJSON): DataRow;
    scalerMult(scaler: number): void;
    renameColumns(newNames: {
        [oldName: string]: string;
    }): void;
    sort(descending?: boolean): void;
}
declare abstract class DataColumnAbs {
    protected columnName: string;
    constructor(columnName: string);
    abstract nValues(): number;
    abstract get(row: number): string | number;
    name(): string;
    toJSON(): (string | number)[];
    copy(): DataColumn;
    sum(): number;
    sumSquares(): number;
    pairProduct(col2: DataColumn): DataColumn;
    dotProduct(col2: DataColumn): number;
    count(): number;
    countNumbers(): number;
    max(): number;
    min(): number;
    db(msg?: string, maxRows?: number): void;
}
declare class DataColumn extends DataColumnAbs {
    protected contents: any[];
    constructor(columnName: string, contents?: any[]);
    nValues(): number;
    static fromJSON(colName: string, json: (string | number)[]): DataColumn;
    get(row: number): string | number;
    set(row: number, newVal: string | number): void;
    addTo(row: number, newVal: number): void;
    scalerMult(scaler: number): void;
}
declare type DataTableJSON = {
    [colName: string]: string | number;
}[];
declare class DataTable extends DataTableAbs {
    protected contents: any[][];
    columnHeaderIdxs: {
        [columnHeader: string]: number;
    };
    protected orderedColumnHeaders: string[];
    constructor(contents?: any[][], headers?: string[]);
    fromCSVStr(str: string, noHeaders?: boolean): DataTable;
    hasCol(colName: string): boolean;
    colName(colIdx: number): string;
    colIdx(colName: string): number;
    columnIndex(): {
        [colname: string]: number;
    };
    nRows(): number;
    columnHeaders(): string[];
    nCols(): number;
    static fromJSON(json: DataTableJSON): DataTable;
    private csvHeadFromStr;
    private csvNoHeadFromStr;
    private trimReturnChars;
    private splitRow;
    private buildColumnHeaders;
    getI(row: number, col: number): any;
    protected setI(row: number, col: number, newVal: any): void;
    get(row: number, col: string): string | number;
    set(row: number, col: string, newVal: string | number): void;
    addTo(row: number, col: string, newVal: number): void;
    renameColumns(newNames: {
        [oldName: string]: string;
    }): void;
    sortRows(colName: string, descending?: boolean): void;
    protected rebuildOrderedColumnHeaders(): void;
    replaceNulls(fractionOfColumnMin?: number): void;
    parseNumbers(): void;
    averageNormalizeByRow(): DataTable;
    scalerMult(scaler: number): void;
}
declare class DataTableUI extends DataTableUIAbs {
    protected dataTable: DataTableAbs;
    constructor(maxRows?: number, maxCols?: number, cellEnter?: (row: number, col: number) => void);
    setData(dataTable: DataTableAbs): void;
    getData(): DataTableAbs;
    hasData(): boolean;
    protected colHeaderList(): string[];
    protected rowLabelList(): string[];
    protected rowData(row: number, firstCol: number, lastCol: number): any[];
}
declare type DataTableRowLabeledJSON = {
    [rowLabel: string]: {
        [colLabel: string]: (string | number);
    };
};
declare abstract class DataTableRowLabeledAbs {
    abstract hasCol(colName: string): boolean;
    abstract hasRow(rowName: string): boolean;
    abstract nRows(): number;
    abstract rowLabel(rowIdx: number): string;
    abstract rowIdx(rowLabel: string): number;
    abstract rowLabels(): string[];
    abstract columnHeaders(): string[];
    abstract nCols(): number;
    abstract colName(colIdx: number): string;
    abstract colIdx(colName: string): number;
    abstract get(row: string, col: string): string | number;
    abstract renameColumns(newNames: {
        [oldName: string]: string;
    }): any;
    abstract relabelRows(newLabels: {
        [oldLabel: string]: string;
    }): any;
    copy(): DataTableRowLabeled;
    toJSON(): DataTableRowLabeledJSON;
    sum(): number;
    count(): number;
    countNumbers(): number;
    max(): number;
    min(): number;
    db(msg?: string, maxColumns?: number, maxRows?: number): void;
}
declare class DataTableRowLabeled extends DataTableRowLabeledAbs {
    protected contents: any[][];
    protected columnHeaderIdxs: {
        [columnHeader: string]: number;
    };
    protected orderedColumnHeaders: string[];
    protected rowLabelIdxs: {
        [rowHeader: string]: number;
    };
    protected orderedRowLabels: string[];
    constructor();
    rowIndexes(): {
        [rowHeader: string]: number;
    };
    colIndexes(): {
        [colName: string]: number;
    };
    hasCol(colName: string): boolean;
    hasRow(rowName: string): boolean;
    nRows(): number;
    rowLabels(): string[];
    rowLabel(rowIdx: number): string;
    rowIdx(rowLabel: string): number;
    columnHeaders(): string[];
    nCols(): number;
    colName(colIdx: number): string;
    colIdx(colName: string): number;
    static fromJSON(json: DataTableRowLabeledJSON): DataTableRowLabeled;
    getI(row: number, col: number): any;
    protected setI(row: number, col: number, newVal: any): void;
    get(row: string, col: string): string | number;
    set(row: string, col: string, newVal: string | number): void;
    addTo(row: string, col: string, newVal: number): void;
    getRow(row: string): DataRow;
    getCol(col: string): DataColumn;
    renameColumns(newNames: {
        [oldName: string]: string;
    }): void;
    relabelRows(newNames: {
        [oldName: string]: string;
    }): void;
    protected rebuildOrderedColumnHeaders(): void;
    protected rebuildOrderedRowLabels(): void;
    scalerMult(scaler: number): void;
}
declare class DataTableRowLabeledUI extends DataTableUIAbs {
    protected dataTable: DataTableRowLabeled;
    private rowLabels;
    constructor(maxRows?: number, maxCols?: number, cellEnter?: (row: number, col: number) => void);
    setData(dataTable: DataTableRowLabeled): void;
    hasData(): boolean;
    protected colHeaderList(): string[];
    protected rowLabelList(): string[];
    protected rowData(row: number, firstCol: number, lastCol: number): any[];
}
declare class ChartUI extends ZUI {
    private width;
    private height;
    private setWidth;
    private setHeight;
    private canvas;
    private chartLeft;
    private chartRight;
    private chartTop;
    private chartBottom;
    private yAxisWidth;
    private xAxisHeight;
    protected xMax: number;
    protected yMax: number;
    protected xMin: number;
    protected yMin: number;
    private nYTicks;
    private nXTicks;
    private showYAxis;
    private showXAxis;
    private drawLineColor;
    private drawLineWidth;
    private graphics;
    private dataType;
    private dataRow;
    private eventsSetup;
    private colHoverCallback;
    private lastHoverIdx;
    private downX;
    private startColRange;
    private endColRange;
    private colRangeCallback;
    private onClick;
    constructor();
    size(width: number, height: number): ChartUI;
    gridSize(nXTicks: number, nYTicks: number): ChartUI;
    setDataRow(dataRow: DataRowAbs): void;
    colHover(colHoverCallback: (colName: string) => void): ChartUI;
    colRangeSelect(colRangeCallback: (colStart: number, colEnd: number) => void): ChartUI;
    click(onClick: (colIdx: number) => void): ChartUI;
    xAxis(show?: boolean): ChartUI;
    yAxis(show?: boolean): ChartUI;
    line(lc: string, width?: number): ChartUI;
    private toX;
    private fromX;
    private eventX;
    private eventToChartX;
    private toY;
    private fromY;
    private eventY;
    private eventToChartY;
    private mouseMove;
    expandRange(x: number): void;
    private mouseDown;
    private mouseUp;
    private mouseEnter;
    private mouseLeave;
    private calculateChartArea;
    private calculateAxesSpace;
    protected calculateDataBounds(): void;
    private paint;
    private paintGrid;
    private paintAxes;
    private paintSelection;
    private paintRow;
    private static yLabelOffset;
    private static labelFont;
    private paintRowAxes;
    private rowBounds;
    private computeRowAxes;
    private computeRowYAxis;
    private computeRowXAxis;
    private estimateDecimals;
    setupEventListeners(): void;
    renderJQ(): JQuery;
}
declare type DiffEditCode = "start" | "match" | "replace" | "skipFrom" | "addTo";
declare class LineDiff {
    private lFrom;
    private lTo;
    private heap;
    private addMemory;
    private patch;
    private fromLineReplaced_;
    private fromLineSkipped_;
    private toLineDeleted_;
    constructor(from: string, to: string);
    getPatch(): DiffEdit[];
    fromLineReplaced(fromLine: number): boolean;
    fromLineSkipped(fromLine: number): boolean;
    toLineDeleted(fromLine: number): boolean;
    protected indexPatch(): void;
    private editsForS1IntoS2;
    protected matchCost(fromIdx: number, toIdx: number): number;
    private reverseEdits;
    private add;
    private exchange;
    private get;
    applyEditFromTo(edits: DiffEdit[]): string;
    private addLine;
}
declare class DiffEdit {
    fromIdx: number;
    toIdx: number;
    edit: DiffEditCode;
    totalCost: number;
    prevState: DiffEdit;
    constructor(fromIdx: number, toIdx: number, edit: DiffEditCode, totalCost: number, prevState?: DiffEdit);
    hash(): number;
}
declare class StringDiff {
    private lFrom;
    private lTo;
    private heap;
    private addMemory;
    private patch;
    private fromCharReplaced_;
    private fromCharSkipped_;
    private toCharDeleted_;
    constructor(from: string, to: string);
    getPatch(): DiffEdit[];
    fromCharReplaced(fromLine: number): boolean;
    fromCharSkipped(fromLine: number): boolean;
    toCharDeleted(fromLine: number): boolean;
    protected indexPatch(): void;
    private editsForS1IntoS2;
    protected matchCost(fromIdx: number, toIdx: number): number;
    private reverseEdits;
    private add;
    private exchange;
    private get;
    applyEditFromTo(edits: DiffEdit[]): string;
}
declare class TextEditUI extends ZUI {
    private editType;
    private getF_;
    private getBaseF_;
    private setF_;
    private jq;
    private sourceText;
    private baseText;
    private beforeSel;
    private afterSel;
    private nLines;
    private keyCode;
    private majorEventInput;
    constructor(editType?: "text" | "html" | "code");
    setText(text: string): void;
    getText(): string;
    setBase(text: string): void;
    setF(eif: (text: string) => void): TextEditUI;
    private renderTextIntoHTML;
    private extractSelection;
    private renderHTMLIntoText;
    renderJQ(): JQuery;
    private handleMajorEventChange;
    private handleTab;
    private handleReturn;
}
declare class HomePage extends Page {
    creatingTeam: any;
    constructor(pageState: PageState);
    private teamList;
    pageName(): string;
}
declare type PersonCardOptions = {
    size?: string;
    inEditMode?: () => boolean;
    onToggleEditMode?: (editMode: boolean) => void;
    onRemove?: () => void;
};
declare const defaultPersonCardOptions: PersonCardOptions;
declare class PersonCard extends ZUI {
    constructor(personKey: string, options?: PersonCardOptions);
}
declare type PersonSelectorOptions = {
    getSelected: () => string;
    onSelect: (personKey: string) => void;
    nullable?: boolean;
    allowAddNew?: boolean;
    addNewLabel?: string;
};
declare const defaultPersonSelectorOptions: PersonSelectorOptions;
declare class PersonSelector extends ZUI {
    constructor(options?: PersonSelectorOptions);
    handleSelect(opts: PersonSelectorOptions): (personKey: string) => void;
}
declare class TeamPage extends Page {
    inEditMode: boolean;
    teamKey: string;
    constructor(pageState: PageState);
    private setCoach;
    pageName(): string;
}
declare let httpSource: HTTPDataSource;
declare let source: CacheDataSource;
declare let rm: RightsManager;
