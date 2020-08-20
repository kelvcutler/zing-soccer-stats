class ServerContext {
    constructor(request, response) {
        this.request = request;
        this.response = response;
        this.isLogin = false;
    }
    setUserKey(userKey) {
        this.response.cookie("currentUserKey", userKey);
    }
    getUserKey() {
        let key = this.request.cookies["currentUserKey"];
        return key;
    }
}
var DB;
(function (DB) {
    function quiet() {
        try {
            if (process.env.DB == "quiet")
                return true;
        }
        catch (e) {
            return false;
        }
        return false;
    }
    var level = 0;
    function start(message, obj) {
        if (quiet())
            return;
        if (dbon) {
            msg(">" + message, obj);
            level++;
        }
    }
    DB.start = start;
    function end(message, obj) {
        if (quiet())
            return;
        if (dbon) {
            level--;
            if (level < 0)
                level = 0;
            msg("<" + message, obj);
        }
    }
    DB.end = end;
    var dbop = false;
    function dbOnPage(db) {
        dbop = db;
    }
    DB.dbOnPage = dbOnPage;
    function msg(message, obj) {
        if (quiet())
            return;
        if (dbon) {
            var pre = "";
            for (var i = 0; i < level; i++) {
                pre += "   ";
            }
            if (obj)
                console.log(pre + message, obj);
            else
                console.log(pre + message);
            if (dbop) {
                let span = document.createElement("div");
                span.innerHTML = pre + message;
                span.style.cssText = "width:100%";
                let dbout = document.getElementById("dbout");
                if (dbout)
                    dbout.append(span);
            }
        }
    }
    DB.msg = msg;
    function stackTrace(message) {
        if (quiet())
            return;
        try {
            throw new Error(message);
        }
        catch (e) {
            console.log(e);
        }
    }
    DB.stackTrace = stackTrace;
    var dbon = true;
    function on(msg) {
        dbon = true;
        start("+++" + msg);
    }
    DB.on = on;
    function off(msg) {
        end("---" + msg);
        dbon = false;
    }
    DB.off = off;
    var dbCounts = {};
    function count(name) {
        let count = dbCounts[name];
        if (count)
            count++;
        else
            count = 1;
        dbCounts[name] = count;
    }
    DB.count = count;
    function showCount(name) {
        let count = dbCounts[name];
        if (!count)
            count = 0;
        DB.msg(name, count);
    }
    DB.showCount = showCount;
    function showCounts(msg) {
        let m = "counts ";
        if (msg)
            m += msg;
        DB.start(m);
        for (let name in dbCounts) {
            DB.showCount(name);
        }
        DB.end(m);
    }
    DB.showCounts = showCounts;
    function clearCounts(name) {
        if (name) {
            dbCounts[name] = 0;
        }
        else {
            for (let key in dbCounts) {
                DB.clearCounts(key);
            }
        }
    }
    DB.clearCounts = clearCounts;
    var autoInterval = null;
    function countsAutoShow(millis) {
        if (autoInterval)
            autoInterval.clearInterval();
        autoInterval = setInterval(() => {
            DB.showCounts();
        }, millis);
    }
    DB.countsAutoShow = countsAutoShow;
    function noCountsAutoShow() {
        clearInterval(autoInterval);
    }
    DB.noCountsAutoShow = noCountsAutoShow;
})(DB || (DB = {}));
class UserManager {
    constructor() {
        this.currentUserName = null;
        this.dataSource = null;
        this.currentUserKey = null;
    }
    get userName() { return this.currentUserName; }
    login(userName, password, done, serverContext) {
        if (this.dataSource.isRemote()) {
            this.dataSource.httpLogin(userName, password, (err, user) => {
                if (err) {
                    done(err, null);
                }
                else {
                    this.currentUserName = userName;
                    this.currentUserKey = user._key;
                    done(null, user);
                }
            });
        }
        else {
            this.currentUserName = userName;
            this.currentUserKey = null;
            done(null, null);
        }
    }
    logout(done) {
        if (this.dataSource.isRemote()) {
            this.dataSource.httpLogout((err) => {
                if (err) {
                    done(err);
                }
                else {
                    this.currentUserName = null;
                    this.currentUserKey = null;
                    done(null);
                }
            });
        }
        else {
            this.currentUserName = null;
            this.currentUserKey = null;
            done(null);
        }
    }
    createUser(userDesc, password, done, serverContext) {
        done(null);
    }
    getUserKey(serverContext) {
        if (serverContext) {
            return serverContext.getUserKey();
        }
        else {
            return this.currentUserKey;
        }
    }
    getUser(done, serverContext) {
        let userKey = this.getUserKey(serverContext);
        this.dataSource.GET(userKey, (err, user) => {
            done(user);
        }, false, serverContext);
    }
    serverSideLogin(userName, password, serverContext, done) {
        DB.msg("serverSideLogin not implemented for this ", this);
        done("no serverside login", null);
    }
    serverSideLogout(serverContext, done) {
        DB.msg("serverSideLogout not implemented for this ", this);
        done("no serverside logout");
    }
}
class RightsManager {
    constructor(dataSource, userManager) {
        this.dataSource = dataSource;
        this.userManager = userManager;
        this.userManager.dataSource = this.dataSource;
    }
    checkGETm(keys, serverContext, done) {
        this.checkAllGET(keys, 0, serverContext, done);
    }
    checkPUTm(objs, serverContext, done) {
        this.checkAllPUT(objs, 0, serverContext, done);
    }
    login(userId, password, done, serverContext) {
        if (this.userManager)
            this.userManager.login(userId, password, done, serverContext);
        else
            done("RightsManager has no UserManager to login", null);
    }
    createUser(userDesc, password, done, serverContext) {
        if (this.userManager)
            this.userManager.createUser(userDesc, password, done, serverContext);
        else
            done("RightsManager has no UserManager to create user");
    }
    checkAllGET(keys, idx, serverContext, done) {
        if (idx >= keys.length) {
            done(true);
        }
        else {
            let obj = keys[idx];
            this.checkGET(obj, serverContext, (granted) => {
                if (granted) {
                    this.checkAllGET(keys, idx + 1, serverContext, done);
                }
                else {
                    done(false);
                }
            });
        }
    }
    checkAllPUT(objs, idx, serverContext, done) {
        if (idx >= objs.length) {
            done(true);
        }
        else {
            let obj = objs[idx];
            this.checkPUT(obj, serverContext, (granted) => {
                if (granted) {
                    this.checkAllPUT(objs, idx + 1, serverContext, done);
                }
                else {
                    done(false);
                }
            });
        }
    }
}
class Query {
    constructor(exp) {
        this.exp = exp;
    }
    static OR(options) {
        let desc = { $$: "OR", options: options };
        return new Query(desc);
    }
    static AND(options) {
        return new Query({ $$: "AND", options: options });
    }
    static range(from, to) {
        return new Query({ $$: "RANGE", from: from, to: to });
    }
    static anything() {
        return new Query({ $$: "ANY" });
    }
    static dict(desc) {
        let d = { $$: "DICT" };
        for (let k in desc) {
            d[k] = desc[k];
        }
        return new Query(d);
    }
    static is(value) {
        return new Query({ $$: "IS", value: value });
    }
    static listContains(query) {
        return new Query({ $$: "LC", query: query });
    }
    static match(q1, q2) {
        if (!q1)
            if (!q2)
                return true;
            else
                return false;
        else if (!q2)
            return false;
        if (typeof q1 != typeof q2)
            return false;
        switch (typeof q1) {
            case "number":
            case "string":
            case "boolean":
                return q1 == q2;
            default: {
                return this.matchQuery(q1, q2);
            }
        }
    }
    matches(val) {
        if (val instanceof DataObj)
            return this.matchesDO(val);
        switch (this.exp.$$) {
            case "OR":
                for (let i in this.exp.options) {
                    let opt = this.exp.options[i];
                    if (Query.matchesQV(opt, val))
                        return true;
                }
                return false;
            case "AND":
                for (let i in this.exp.options) {
                    let opt = this.exp.options[i];
                    if (!Query.matchesQV(opt, val))
                        return false;
                }
                return true;
            case "RANGE":
                return this.rangeMatch(this.exp.from, this.exp.to, val);
            case "ANY":
                return true;
            case "DICT":
                return this.dictMatch(this.exp, val);
            case "IS":
                return this.exp.value == val;
            case "LC":
                for (let i in val) {
                    let v = val[i];
                    if (Query.matchesQV(this.exp.query, v))
                        return true;
                }
                return false;
        }
    }
    static matchesQV(qv, val) {
        switch (typeof qv) {
            case "number":
            case "string":
            case "boolean":
                return qv == val;
            default:
                return qv.matches(val);
        }
    }
    attribute(attName) {
        if (this.exp.$$ != "DICT")
            return null;
        let att = this.exp[attName];
        return att;
    }
    toJSON() {
        let src = this.exp;
        let rslt = { $$: src.$$ };
        switch (this.exp["$$"]) {
            case "OR":
            case "AND":
                rslt.options = this.queryValueListToJSON(src.options);
                break;
            case "RANGE":
                rslt.from = this.queryValueToJSON(src.from);
                rslt.to = this.queryValueToJSON(src.to);
                break;
            case "ANY":
                break;
            case "DICT":
                rslt = this.dictToJSON(src);
                break;
            case "IS":
                rslt.value = this.queryValueToJSON(src.value);
                break;
            case "LC":
                rslt.value = this.queryValueToJSON(src.query);
                break;
        }
        return rslt;
    }
    static fromJSON(json) {
        switch (typeof json) {
            case "number":
            case "string":
            case "boolean":
                return json;
            default:
                switch (json.$$) {
                    case "OR":
                        return Query.OR(Query.listFromJSON(json.options));
                    case "AND":
                        return Query.AND(Query.listFromJSON(json.options));
                    case "RANGE":
                        return Query.range(Query.fromJSON(json.from), Query.fromJSON(json.to));
                    case "ANY":
                        return Query.anything();
                    case "DICT":
                        let dict = {};
                        for (let i in json) {
                            if (i != "$$") {
                                dict[i] = Query.fromJSON(json[i]);
                            }
                        }
                        return Query.dict(dict);
                    case "IS":
                        return Query.is(json.value);
                    case "LC":
                        return Query.listContains(Query.fromJSON(json.query));
                }
        }
    }
    queryValueListToJSON(list) {
        let rslt = [];
        for (let i in list) {
            let item = list[i];
            rslt.push(this.queryValueToJSON(item));
        }
        return rslt;
    }
    queryValueToJSON(val) {
        switch (typeof val) {
            case "number":
            case "string":
            case "boolean":
                return val;
            default:
                return val.toJSON();
        }
    }
    dictToJSON(desc) {
        let rslt = { $$: "DICT" };
        for (let i in desc) {
            rslt[i] = this.queryValueToJSON(desc[i]);
        }
        return rslt;
    }
    static listFromJSON(list) {
        let rslt = [];
        for (let i in list) {
            let item = Query.fromJSON(list[i]);
            rslt.push(item);
        }
        return rslt;
    }
    toMongo() {
        let rslt = {};
        switch (this.exp.$$) {
            case "OR":
                let oList = this.mongoOptionsList(this.exp.options);
                return { $or: oList };
            case "AND":
                return { $and: this.mongoOptionsList(this.exp.options) };
            case "RANGE":
                if (this.exp.from) {
                    rslt.$gte = this.exp.from;
                }
                if (this.exp.to) {
                    rslt.$lte = this.exp.to;
                }
                return rslt;
            case "ANY":
                return { $exists: true };
            case "DICT":
                for (let i in this.exp) {
                    if (i != "$$") {
                        let v = this.exp[i];
                        if (v) {
                            if (v.exp && v.exp.$$ && v.exp.$$ == "DICT") {
                                Query.mongoCollapseDICT(rslt, i, v.exp);
                            }
                            else
                                rslt[i] = Query.toMongoValue(v);
                        }
                        else if (v == 0)
                            rslt[i] = Query.toMongoValue(v);
                    }
                }
                return rslt;
            case "IS":
                return this.exp.value;
            case "LC":
                return { $elemMatch: Query.toMongoValue(this.exp.query) };
            default:
                return { badoperator: this.exp.$$ };
        }
    }
    static mongoCollapseDICT(rslt, key, v) {
        for (let k in v) {
            if (k != "$$") {
                rslt[key + "." + k] = v[k];
            }
        }
    }
    mongoOptionsList(options) {
        let rslt = [];
        for (let i in options) {
            let option = options[i];
            let mongOpt = Query.toMongoValue(option);
            rslt.push(mongOpt);
        }
        return rslt;
    }
    static toMongoValue(val) {
        switch (typeof val) {
            case "number":
            case "string":
            case "boolean":
                return val;
            default:
                return val.toMongo();
        }
    }
    static matchQuery(q1, q2) {
        if (q1.exp.$$ != q2.exp.$$)
            return false;
        switch (q1.exp.$$) {
            case "OR":
            case "AND":
                return this.matchOptionLists(q1.exp.options, q2.exp.options);
            case "RANGE":
                return this.match(q1.exp.from, q2.exp.from) && this.match(q1.exp.to, q2.exp.to);
            case "ANY":
                return true;
            case "DICT":
                return this.matchDicts(q1.exp, q2.exp);
            case "IS":
                return q1.exp.value == q2.exp.value;
            case "LC":
                return this.match(q1.exp.query, q2.exp.query);
            default:
                DB.msg("matchQuery got invalid $$", q1.exp.$$);
                return false;
        }
    }
    static matchOptionLists(l1, l2) {
        if (l1.length != l2.length)
            return false;
        for (let i in l1) {
            let q = l1[i];
            if (!this.matchOptions(q, l2))
                return false;
        }
        for (let i in l2) {
            let q = l2[i];
            if (!this.matchOptions(q, l1))
                return false;
        }
        return true;
    }
    static matchOptions(q, list) {
        for (let i in list) {
            let lq = list[i];
            if (this.match(q, lq))
                return true;
        }
        return false;
    }
    static matchDicts(d1, d2) {
        for (let k in d1) {
            let a1 = d1[k];
            let a2 = d2[k];
            if (!this.match(a1, a2))
                return false;
        }
        for (let k in d2) {
            let a1 = d1[k];
            let a2 = d2[k];
            if (!this.match(a1, a2))
                return false;
        }
        return true;
    }
    rangeMatch(from, to, val) {
        let fromTrue = true;
        if (from) {
            switch (typeof from) {
                case "number":
                    fromTrue = from <= val;
                    break;
                case "string":
                    fromTrue = from.localeCompare(val) >= 0;
                    break;
                default:
                    fromTrue = false;
                    break;
            }
        }
        let toTrue = true;
        if (to) {
            switch (typeof to) {
                case "number":
                    toTrue = val <= to;
                    break;
                case "string":
                    toTrue = val.localeCompare(to) >= 0;
                    break;
                default:
                    toTrue = false;
                    break;
            }
        }
        return fromTrue && toTrue;
    }
    dictMatch(dict, val) {
        if (typeof val != "object")
            return false;
        for (let att in dict) {
            if (att != "$$") {
                let dVal = dict[att];
                let vVal = val[att];
                if (!Query.matchesQV(dVal, vVal))
                    return false;
            }
        }
        return true;
    }
    matchesDO(obj) {
        switch (this.exp.$$) {
            case "OR":
                for (let i in this.exp.options) {
                    let opt = this.exp.options[i];
                    if (Query.matchesQV(opt, obj))
                        return true;
                }
                return false;
            case "AND":
                for (let i in this.exp.options) {
                    let opt = this.exp.options[i];
                    if (!Query.matchesQV(opt, obj))
                        return false;
                }
                return true;
            case "RANGE":
                return false;
            case "ANY":
                return true;
            case "DICT":
                return this.dictMatchDO(this.exp, obj);
            case "IS":
                return false;
            case "LC":
                return false;
        }
    }
    dictMatchDO(dict, obj) {
        for (let att in dict) {
            if (att != "$$") {
                let dVal = dict[att];
                let oVal = obj["get" + att]();
                if (!Query.matchesQV(dVal, oVal))
                    return false;
            }
        }
        return true;
    }
}
class DataSource {
    constructor() {
        DataObj.globalSource = this;
    }
    setDataMonitor(dataMonitor) {
        this.dataMonitor = dataMonitor;
    }
    getRightsManager() {
        return this.rightsManager_;
    }
    setRightsManager(rm) {
        this.rightsManager_ = rm;
    }
    isRemote() { return false; }
    notify() {
        if (this.dataMonitor)
            this.dataMonitor.notify();
    }
    GET(key, done, forceRequest, serverContext) {
        done(null, null);
    }
    canGet(key, serverContext, done) {
        let rm = this.rightsManager_;
        if (rm) {
            rm.checkGET(key, serverContext, done);
        }
        else {
            done(false);
        }
    }
    cGET(key, forceRequest) {
        DB.msg("cGET This data source has no caching");
        return null;
    }
    GETm(keys, done, forceRequest, serverContext) {
        done(null, null);
    }
    canGETm(keys, serverContext, done) {
        let rm = this.rightsManager_;
        if (rm) {
            rm.checkGETm(keys, serverContext, done);
        }
        else {
            done(false);
        }
    }
    cGETm(keys, forceRequest) {
        DB.msg("cGETm This data source has no caching");
        return null;
    }
    PUT(obj, done, serverContext) {
        done(null, null);
    }
    canPUT(obj, serverContext, done) {
        let rm = this.rightsManager_;
        if (rm) {
            rm.checkPUT(obj, serverContext, done);
        }
        else {
            done(false);
        }
    }
    canGETBlob(blobKey, serverContext, done) {
        let rm = this.rightsManager_;
        if (rm) {
            rm.checkGETBlob(blobKey, serverContext, done);
        }
        else {
            done(false);
        }
    }
    GETBlob(blobKey, serverContext, done) {
        DB.msg("data source has no downloadFile", this);
    }
    canPUTBlob(serverContext, done) {
        let rm = this.rightsManager_;
        if (rm) {
            rm.checkPUTBlob(serverContext, done);
        }
        else {
            done(false);
        }
    }
    PUTBlob(blob, name, serverContext, done) {
        done(null, null);
    }
    PUTFileBlob(file, serverContext, done) {
        done(null, null);
    }
    PUTm(objs, done, serverContext) {
        done(null, null);
    }
    canPUTm(objs, serverContext, done) {
        let rm = this.rightsManager_;
        if (rm) {
            rm.checkPUTm(objs, serverContext, done);
        }
        else {
            done(false);
        }
    }
    DELETE(key, done) {
        done(null);
    }
    canDELETE(key, serverContext, done) {
        let rm = this.rightsManager_;
        if (rm) {
            rm.checkDELETE(key, serverContext, done);
        }
        else {
            done(false);
        }
    }
    FIND(typeCode, search, done, keysOnly, forceRequest, serverContext) {
        done(null, null, null);
    }
    getFromKeys(keys, idx, objs, done, serverContext) {
        if (idx >= keys.length) {
            done(objs);
        }
        else {
            this.GET(keys[idx], (err, data) => {
                if (!err) {
                    objs.push(data);
                    this.getFromKeys(keys, idx + 1, objs, done, serverContext);
                }
            }, false, serverContext);
        }
    }
    canFIND(typeCode, search, serverContext, done) {
        let rm = this.rightsManager_;
        if (rm) {
            rm.checkFIND(typeCode, search, serverContext, done);
        }
        else {
            done(false);
        }
    }
    cFIND(typeCode, search, keysOnly, forceRequest) {
        DB.msg("cFIND no caching on this data service");
        return null;
    }
    static collectionFromKey(key) {
        if (!key) {
            DB.msg("no key for collection");
            return "";
        }
        let parts = key.split("_");
        let typeCode = parts[0];
        let colCode = DataObj.typeToCollection(typeCode);
        return colCode;
    }
    static typeFromKey(key) {
        let parts = key.split("_");
        return parts[0];
    }
    static idFromKey(key) {
        let parts = key.split("_");
        return parts[1];
    }
    static generateKey(typeCode) {
        let id = Math.random() * 1000000;
        id = Math.floor(id);
        return typeCode + "_" + id;
    }
    static filterKeyList(expectedCode, keyList) {
        let rslt = [];
        for (let idx in keyList) {
            let key = keyList[idx];
            let ty = DataSource.typeFromKey(key);
            if (DataObj.checkTypeCode(expectedCode, ty)) {
                rslt.push(key);
            }
        }
        return rslt;
    }
    touched(obj) {
        this.notify();
        return true;
    }
    login(userId, password, done, serverContext) {
        if (this.getRightsManager())
            this.getRightsManager().login(userId, password, done, serverContext);
        else
            done("DataSource has no RightsManager to login");
    }
    httpLogin(userId, password, done) {
        done("No httpLogin for this data source", null);
    }
    httpLogout(done) {
        done("No httpLogin for this data source");
    }
    createUser(userDesc, password, done, serverContext) {
        if (this.getRightsManager())
            this.getRightsManager().createUser(userDesc, password, done, serverContext);
        else
            done("DataSource has no RightsManager to create user");
    }
}
class DataObj {
    constructor(json) {
        this.blockTouch_ = false;
        this._type = this.getTypeCode();
        this._key = json._key;
        if (!json._key && json._id) {
            this._key = this.getTypeCode() + "_" + json._id;
        }
        this.parent = null;
    }
    getTypeCode() {
        return null;
    }
    getDataSource() {
        if (this.dataSource)
            return this.dataSource;
        else if (this.parent)
            return this.parent.getDataSource();
        else if (DataObj.globalSource)
            return DataObj.globalSource;
        else
            return null;
    }
    getUserManager() {
        let ds = this.getDataSource();
        if (ds) {
            let rm = ds.getRightsManager();
            if (rm) {
                let um = rm.userManager;
                return um;
            }
        }
        return null;
    }
    touch() {
        if (this.blockTouch_)
            return true;
        if (this.dataSource) {
            if (this.dataSource.touched(this)) {
                if (this.parent)
                    return this.parent.touch();
            }
            else {
                return false;
            }
        }
        else {
            if (this.parent)
                return this.parent.touch();
            else
                return true;
        }
    }
    blockTouch(on) {
        this.blockTouch_ = on;
        if (!on)
            this.touch();
    }
    toJSON() {
        return null;
    }
    static GET(key, done, forceRequest, serverContext) {
        let ds = DataObj.globalSource;
        if (ds) {
            ds.canGet(key, serverContext, (granted) => {
                if (granted) {
                    ds.GET(key, done, forceRequest, serverContext);
                }
                else {
                    done(`ERR GET on ${key} had rights fail`, null);
                }
            });
        }
        else {
            done(`ERR GET on ${key} has no dataSource`, null);
        }
    }
    static cGET(key, forceRequest) {
        let ds = DataObj.globalSource;
        if (ds) {
            return ds.cGET(key, forceRequest);
        }
        else {
            return null;
        }
    }
    static GETm(keys, done, forceRequest, serverContext) {
        let ds = DataObj.globalSource;
        if (ds) {
            ds.canGETm(keys, serverContext, (granted) => {
                if (granted) {
                    ds.GETm(keys, done, forceRequest, serverContext);
                }
                else {
                    done(`ERR GETm  had rights fail`, null);
                }
            });
        }
        else {
            done(`ERR GETm has no dataSource`, null);
        }
    }
    static cGETm(keys, forceRequest) {
        let ds = DataObj.globalSource;
        if (ds) {
            return ds.cGETm(keys, forceRequest);
        }
        else {
            return null;
        }
    }
    GETFileBlob(blobKey, serverContext, done) {
        let ds = this.getDataSource();
        if (ds) {
            ds.canGETBlob(blobKey, serverContext, (granted) => {
                if (granted) {
                    ds.GETBlob(blobKey, serverContext, done);
                }
                else {
                    done("ERR GETBlobFile had rights fail", null);
                }
            });
        }
    }
    PUT(done, serverContext) {
        let ds = this.getDataSource();
        if (ds) {
            ds.canPUT(this, serverContext, (granted) => {
                if (granted) {
                    ds.PUT(this, done, serverContext);
                }
                else {
                    done(`ERR PUT on ${this._key} had rights fail`, null);
                }
            });
        }
        else {
            done(`ERR PUT on ${this._key} has no dataSource`, null);
        }
    }
    static PUTFileBlob(file, done, serverContext) {
        let ds = this.globalSource;
        if (ds) {
            ds.canPUTBlob(serverContext, (granted) => {
                if (granted) {
                    ds.PUTFileBlob(file, serverContext, done);
                }
                else {
                    done(`ERR PUTFileBlob  had rights fail`, null);
                }
            });
        }
        else {
            done(`ERR PUTFileBlob has no dataSource`, null);
        }
    }
    static PUTBlob(blob, name, done, serverContext) {
        let ds = this.globalSource;
        if (ds) {
            ds.canPUTBlob(serverContext, (granted) => {
                if (granted) {
                    ds.PUTBlob(blob, name, serverContext, done);
                }
                else {
                    done(`ERR PUTFileBlob  had rights fail`, null);
                }
            });
        }
        else {
            done(`ERR PUTBlob has no dataSource`, null);
        }
    }
    static GETBlob(blobKey, serverContext, done) {
        let ds = this.globalSource;
        if (ds) {
            ds.canGETBlob(blobKey, serverContext, (granted) => {
                if (granted) {
                    ds.GETBlob(blobKey, serverContext, done);
                }
                else {
                    done(`ERR getFileBlob had rights fail`, null);
                }
            });
        }
    }
    static PUTm(objs, done, serverContext) {
        let ds = this.globalSource;
        if (ds) {
            ds.canPUTm(objs, serverContext, (granted) => {
                if (granted) {
                    ds.PUTm(objs, done, serverContext);
                }
                else {
                    done(`ERR PUTm had rights fail`, null);
                }
            });
        }
        else {
            done(`ERR PUTm  has no DataObj.globalSource`, null);
        }
    }
    DELETE(done, serverContext) {
        let ds = this.getDataSource();
        if (ds) {
            ds.canDELETE(this._key, serverContext, (granted) => {
                if (granted) {
                    ds.DELETE(this._key, done);
                }
                else {
                    done(`ERR DELETE on ${this._key} has rights fail`);
                }
            });
        }
        else {
            done(`ERR DELETE on ${this._key} has no dataSource`);
        }
    }
    static FIND(typeCode, search, done, keysOnly, forceRequest, serverContext) {
        let ds = DataObj.globalSource;
        if (ds) {
            ds.canFIND(typeCode, search, serverContext, (granted) => {
                if (granted) {
                    ds.FIND(typeCode, search, done, keysOnly, forceRequest, serverContext);
                }
                else {
                    done(`ERR FIND on ${typeCode} had rights fail`, null);
                }
            });
        }
        else {
            done(`ERR FIND on ${typeCode} has no dataSource`, null);
        }
    }
    static cFIND(typeCode, search, keysOnly, forceRequest) {
        let ds = DataObj.globalSource;
        if (ds) {
            return ds.cFIND(typeCode, search, keysOnly, forceRequest);
        }
        else {
            return null;
        }
    }
    static checkTypeCode(expectedType, receivedType) {
        if (!expectedType)
            return true;
        if (!receivedType)
            return true;
        return DataObj.canA[expectedType][receivedType];
    }
    static set classInfo(info) {
        DataObj.classInfo_ = info;
        DataObj.buildTypeToCollection();
        DataObj.buildCanAssign();
    }
    static get classInfo() {
        return DataObj.classInfo_;
    }
    static buildTypeToCollection() {
        DataObj.tToC = {};
        DataObj.sRoots = {};
        for (let typeCode in DataObj.classInfo_) {
            DataObj.tToC[typeCode] = DataObj.topSuperCode(typeCode);
        }
    }
    static typeCodeToName(typeCode) {
        let ci = this.classInfo[typeCode];
        let cn = ci.className;
        return cn;
    }
    static typeToCollection(typeCode) {
        return DataObj.tToC[typeCode];
    }
    static collections() {
        return DataObj.sRoots;
    }
    static topSuperCode(typeCode) {
        let ci = DataObj.classInfo_[typeCode];
        if (ci && ci.superCode && ci.superCode.length > 0 && typeCode != ci.superCode) {
            return this.topSuperCode(ci.superCode);
        }
        else {
            DataObj.sRoots[typeCode] = true;
            return typeCode;
        }
    }
    static buildCanAssign() {
        DataObj.canA = {};
        for (let typeCode in DataObj.classInfo_) {
            DataObj.superCanAssign(typeCode, typeCode);
        }
    }
    static superCanAssign(superCode, typeCode) {
        let ca = DataObj.canA;
        if (!ca[superCode])
            ca[superCode] = {};
        ca[superCode][typeCode] = true;
        let ci = DataObj.classInfo_[superCode];
        if (ci) {
            let sc = ci.superCode;
            if (sc && sc.length > 0)
                this.superCanAssign(sc, typeCode);
        }
    }
}
DataObj.sRoots = null;
class MemDataSource extends DataSource {
    constructor() {
        super();
        this.datastore = {};
    }
    GET(key, done, forceRequest, serverContext) {
        let _this = this;
        let collectionKey = DataSource.collectionFromKey(key);
        let id = DataSource.idFromKey(key);
        let collection = this.datastore[collectionKey];
        if (!collection) {
            this.datastore[collectionKey] = {};
            collection = this.datastore[collectionKey];
        }
        let rec = collection[id];
        if (rec) {
            rec = DataObj.make(collectionKey, rec);
            rec.dataSource = _this;
            done(null, rec);
        }
        else
            done("key not found " + key, null);
    }
    cGET(key, forceRequest) {
        let collectionKey = DataSource.collectionFromKey(key);
        let id = DataSource.idFromKey(key);
        let collection = this.datastore[collectionKey];
        if (!collection) {
            this.datastore[collectionKey] = {};
            collection = this.datastore[collectionKey];
        }
        let rec = collection[id];
        if (rec) {
            rec = DataObj.make(collectionKey, rec);
            rec.dataSource = this;
            return rec;
        }
        else {
            return null;
        }
    }
    GETm(keys, done, forceRequest, serverContext) {
        this.multiGet(0, keys, [], done, forceRequest);
    }
    multiGet(idx, keys, rslt, done, forceRequest) {
        if (idx >= keys.length) {
            done(null, rslt);
        }
        else {
            this.GET(keys[idx], (err, data) => {
                if (err) {
                    done(err, rslt);
                }
                else {
                    rslt.push(data);
                    this.multiGet(idx + 1, keys, rslt, done, forceRequest);
                }
            }, forceRequest, null);
        }
    }
    GETBlob(blobKey, serverContext, done) {
        let collection = this.datastore["BLOB"];
        if (collection) {
            let file = collection[blobKey];
            DB.msg("downloadFile memdatasource not done", file);
        }
    }
    cGETm(keys, forceRequest) {
        let rslt = [];
        for (let i in keys) {
            let key = keys[i];
            let obj = this.cGET(key, forceRequest);
            if (obj)
                rslt.push(obj);
        }
        return rslt;
    }
    PUT(obj, done, serverContext) {
        let _this = this;
        let key = obj._key;
        if (!key) {
            let tc = obj.getTypeCode();
            key = DataSource.generateKey(tc);
            obj._key = key;
        }
        let collectionKey = obj.getTypeCode();
        let collection = this.datastore[collectionKey];
        if (!collection) {
            this.datastore[collectionKey] = {};
            collection = this.datastore[collectionKey];
        }
        let id = DataSource.idFromKey(key);
        collection[id] = obj.toJSON();
        obj.dataSource = _this;
        done(null, obj);
    }
    PUTm(objs, done, serverContext) {
        this.multiPut(0, objs, [], done, serverContext);
    }
    multiPut(idx, objs, rslt, done, serverContext) {
        if (idx >= objs.length) {
            done(null, rslt);
        }
        else {
            this.PUT(objs[idx], (err, data) => {
                if (err) {
                    done(err, rslt);
                }
                else {
                    rslt.push(data);
                    this.multiPut(idx + 1, objs, rslt, done, serverContext);
                }
            }, serverContext);
        }
    }
    PUTFileBlob(file, serverContext, done) {
        let key = DataSource.generateKey("BLOB");
        let collection = this.datastore["BLOB"];
        if (!collection) {
            this.datastore["BLOB"] = {};
            collection = this.datastore["BLOB"];
        }
        let id = DataSource.idFromKey(key);
        collection[id] = { _id: id, _key: key, file: file };
        done(null, key);
    }
    PUTBlob(blob, name, serverContext, done) {
        let key = DataSource.generateKey("BLOB");
        let collection = this.datastore["BLOB"];
        if (!collection) {
            this.datastore["BLOB"] = {};
            collection = this.datastore["BLOB"];
        }
        let id = DataSource.idFromKey(key);
        collection[id] = { _id: id, _key: key, blob: blob };
        done(null, key);
    }
    DELETE(key, done) {
        super.DELETE(key, (err) => {
            if (err) {
                if (done)
                    done(err);
            }
            else {
                let collectionKey = DataSource.collectionFromKey(key);
                let id = DataSource.idFromKey(key);
                let collection = this.datastore[collectionKey];
                if (collection) {
                    let rec = collection[id];
                    collection[id] = null;
                    if (!rec) {
                        if (done)
                            done("no such object " + key);
                    }
                    else {
                        if (done)
                            done(null);
                    }
                }
                else {
                    if (done)
                        done("no such object " + key);
                }
            }
        });
    }
    FIND(typeCode, search, done, keysOnly, forceRequest, serverContext) {
        let colCode = DataObj.typeToCollection(typeCode);
        let collection = this.datastore[colCode];
        let rslt = [];
        if (collection) {
            for (let id in collection) {
                let rec = collection[id];
                let match = true;
                for (let field in search) {
                    let srch = search[field];
                    let recVal = rec[field];
                    if (!this.matches(srch, recVal))
                        match = false;
                }
                if (match)
                    rslt.push(rec._t_ + "_" + id);
            }
            if (keysOnly) {
                done(null, rslt, []);
            }
            else {
                let dObjs = [];
                this.getFromKeys(rslt, 0, dObjs, (objs) => {
                    done(null, rslt, objs);
                }, serverContext);
            }
        }
        else {
            done(null, rslt, []);
        }
    }
    matches(srch, val) {
        return Query.matchesQV(srch, val);
    }
    cFIND(typeCode, search, forceRequest) {
        let colCode = DataObj.typeToCollection(typeCode);
        let collection = this.datastore[colCode];
        let rslt = [];
        if (collection) {
            for (let id in collection) {
                let rec = collection[id];
                let match = true;
                for (let field in search) {
                    let val = search[field];
                    let recVal = rec[field];
                    if (!recVal || recVal != val)
                        match = false;
                }
                if (match)
                    rslt.push(rec._t_ + "_" + id);
            }
            return rslt;
        }
        else {
            return null;
        }
    }
}
let mongo = require("mongodb");
const Binary = require('mongodb').Binary;
const fs = require('fs');
class MongoDataSource extends DataSource {
    constructor(dbHost, port, dbName, dropCollections) {
        super();
        this.dbName = dbName;
        this.port = port;
        let mongoClient = mongo.MongoClient;
        let url = "mongodb://" + dbHost + ":" + port + "/admin";
        DB.msg("mongodb url", url);
        this.collectionNames = null;
        mongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
            if (err) {
                throw err;
            }
            DB.msg("MONGO created ");
            this.db = db;
            if (dropCollections)
                this.dropCollections();
        });
    }
    dropCollections() {
        let dbo = this.db.db(this.dbName);
        let collections = DataObj.collections();
        if (collections) {
            for (let collCode in collections) {
                let ci = DataObj.classInfo[collCode];
                if (ci) {
                    let collName = ci.className;
                    dbo.collection(collName).drop(collName, (err, res) => {
                        if (err)
                            DB.msg("ERR Drop " + collName + " ", err);
                    });
                }
            }
        }
    }
    createCollections() {
        if (this.collectionNames)
            return;
        let dbo = this.db.db(this.dbName);
        let collections = DataObj.collections();
        if (collections) {
            this.collectionNames = {};
            for (let collCode in collections) {
                let ci = DataObj.classInfo[collCode];
                if (ci) {
                    let collName = DataObj.classInfo[collCode].className;
                    this.collectionNames[collCode] = collName;
                    dbo.createCollection(collName, (err, res) => {
                        if (err)
                            throw err;
                    });
                }
            }
        }
    }
    GET(key, done, forceRequest, serverContext) {
        let _this = this;
        if (!key) {
            done("GET null key", null);
            return;
        }
        let collectionKey = DataSource.collectionFromKey(key);
        let id = DataSource.idFromKey(key);
        let collectionName = DataObj.classInfo[collectionKey].className;
        let dbo = this.db.db(this.dbName);
        let idQuery = { _id: new mongo.ObjectID(id) };
        dbo.collection(collectionName).findOne(idQuery, (err, res) => {
            if (err) {
                done(err, null);
            }
            else if (res) {
                res._key = key;
                let typeCode = DataSource.typeFromKey(key);
                let dObj = DataObj.make(typeCode, res);
                dObj.dataSource = _this;
                done(null, dObj);
            }
            else {
                done("No such object for " + key, null);
            }
        });
    }
    GETm(keys, done, forceRequest, serverContext) {
        this.multiGet(0, keys, [], done, forceRequest, serverContext);
    }
    multiGet(idx, keys, rslt, done, forceRequest, serverContext) {
        let _this = this;
        if (idx >= keys.length) {
            done(null, rslt);
        }
        else {
            this.GET(keys[idx], (err, data) => {
                if (err) {
                    done(err, rslt);
                }
                else {
                    rslt.push(data);
                    data.dataSource = _this;
                    this.multiGet(idx + 1, keys, rslt, done, forceRequest, serverContext);
                }
            }, forceRequest, serverContext);
        }
    }
    PUT(obj, done, serverContext) {
        let key = obj._key;
        let dbo = this.db.db(this.dbName);
        let jsonObj = obj.toJSON();
        if (key) {
            let collCode = DataSource.collectionFromKey(key);
            let collName = DataObj.classInfo[collCode].className;
            let id = DataSource.idFromKey(key);
            let idQuery = { _id: new mongo.ObjectID(id) };
            try {
                dbo.collection(collName).replaceOne(idQuery, jsonObj, (err, res) => {
                    if (err) {
                        done(err, null);
                    }
                    else {
                        done(null, obj);
                    }
                });
            }
            catch (e) {
                done(e.toString(), null);
            }
        }
        else {
            let typeCode = obj.getTypeCode();
            let collCode = DataObj.typeToCollection(typeCode);
            let collName = DataObj.classInfo[collCode].className;
            dbo.collection(collName).insertOne(jsonObj, (err, res) => {
                if (err) {
                    done(err, null);
                }
                else {
                    let newId = res.insertedId;
                    obj._key = obj.getTypeCode() + "_" + newId;
                    obj.dataSource = this;
                    done(null, obj);
                }
            });
        }
    }
    PUTFileBlob(file, serverContext, done) {
        try {
            let data = fs.readFileSync(file.path);
            this.putDataBlob(data, file.name, file.type, (err, blobid) => {
                if (err) {
                    done(err, null);
                }
                else {
                    let fName = file.name;
                    let fNameParts = fName.split(".");
                    let key = "BLOB_" + blobid;
                    if (fNameParts.length > 1) {
                        key += "." + fNameParts[1];
                    }
                    done(null, key);
                }
            });
        }
        catch (e) { }
    }
    PUTBlob(blob, name, serverContext, done) {
        try {
            blob.arrayBuffer().then((buffer) => {
                this.putDataBlob(buffer, name, blob.type, (putDBErr, blobid) => {
                    if (putDBErr) {
                        done(putDBErr, null);
                    }
                    else {
                        let key = "BLOB_" + blobid;
                        done(null, key);
                    }
                });
            });
        }
        catch (e) { }
    }
    putDataBlob(data, fileName, fileType, done) {
        if (data.length > MongoDataSource.maxBlobSize) {
            let dataFirst = data.slice(0, MongoDataSource.maxBlobSize);
            let dataRest = data.slice(MongoDataSource.maxBlobSize);
            this.putDataBlob(dataRest, fileName, fileType, (err, restBlobId) => {
                if (err) {
                    done(err, null);
                }
                else {
                    this.doMongoBlobPut(dataFirst, fileName, fileType, restBlobId, done);
                }
            });
        }
        else {
            this.doMongoBlobPut(data, fileName, fileType, null, done);
        }
    }
    doMongoBlobPut(data, fileName, fileType, nextBlobId, done) {
        let dbo = this.db.db(this.dbName);
        let insertData = {
            name: fileName, type: fileType,
            nextBlob: nextBlobId,
            data: Binary(data)
        };
        dbo.collection("BLOB").insertOne(insertData, (err, rslt) => {
            if (err) {
                done(err, null);
            }
            else {
                let obj = rslt.ops[0];
                let blobId = obj._id.toString();
                done(null, blobId);
            }
        });
    }
    GETBlob(blobKey, serverContext, done) {
        let id = blobKey.split("_")[1];
        let idParts = id.split(".");
        if (idParts.length > 1)
            id = idParts[0];
        this.getMongoBlob(id, (err, fileName, fileType, buffers) => {
            if (err)
                done(err, null);
            else {
                let dataBuffer = Buffer.concat(buffers);
                let rsltData = {
                    name: fileName,
                    type: fileType,
                    data: new Binary(dataBuffer),
                    _key: blobKey
                };
                done(null, rsltData);
            }
        });
    }
    getMongoBlob(id, done) {
        let getObj = { _id: new mongo.ObjectID(id) };
        let dbo = this.db.db(this.dbName);
        dbo.collection("BLOB").findOne(getObj, (err, res) => {
            if (err) {
                done(err, null, null, null);
            }
            else if (res) {
                let firstData = res.data.buffer;
                if (res.nextBlob) {
                    this.getMongoBlob(res.nextBlob, (nErr, nFn, nFt, nBuffers) => {
                        if (nErr)
                            done(nErr, null, null, null);
                        else {
                            let newBuffers = [firstData].concat(nBuffers);
                            done(null, nFn, nFt, newBuffers);
                        }
                    });
                }
                else {
                    done(null, res.name, res.type, [firstData]);
                }
            }
            else {
                done("No such object for " + id, null, null, null);
            }
        });
    }
    PUTm(objs, done, serverContext) {
        this.multiPut(0, objs, [], done, serverContext);
    }
    multiPut(idx, objs, rslt, done, serverContext) {
        let _this = this;
        if (idx >= objs.length) {
            done(null, rslt);
        }
        else {
            this.PUT(objs[idx], (err, data) => {
                if (err) {
                    done(err, rslt);
                }
                else {
                    rslt.push(data);
                    data.dataSource = _this;
                    this.multiPut(idx + 1, objs, rslt, done, serverContext);
                }
            }, null);
        }
    }
    DELETE(key, done) {
        let collectionKey = DataSource.collectionFromKey(key);
        let collName = DataObj.classInfo[collectionKey].className;
        let id = DataSource.idFromKey(key);
        let dbo = this.db.db(this.dbName);
        let myQuery = { _id: mongo.ObjectID(id) };
        dbo.collection(collName).deleteOne(myQuery, (err, obj) => {
            if (err) {
                if (done)
                    done(err);
            }
            else {
                if (done)
                    done(null);
            }
        });
    }
    FIND(typeCode, search, done, keysOnly, forceRequest, serverContext) {
        let collCode = DataObj.typeToCollection(typeCode);
        let collName = DataObj.classInfo[collCode].className;
        let dbo = this.db.db(this.dbName);
        let mongoSearch = this.dataSearchToMongo(collCode, search);
        dbo.collection(collName).find(mongoSearch, { projection: { _id: 1, _t_: 1 } }).toArray((err, res) => {
            if (err) {
                done(err, null, null);
            }
            else {
                let rslt = [];
                for (let i in res) {
                    let key = res[i]._t_ + "_" + res[i]._id;
                    rslt.push(key);
                }
                if (keysOnly) {
                    done(null, rslt, []);
                }
                else {
                    let dObjs = [];
                    this.getFromKeys(rslt, 0, dObjs, (objs) => {
                        done(null, rslt, objs);
                    }, serverContext);
                }
            }
        });
    }
    dataSearchToMongo(collectionCode, ds) {
        return ds.toMongo();
    }
}
MongoDataSource.maxBlobSize = 1000000;
class ZingEnv {
    constructor() {
        this.env = {
            serverPort: process.env.serverPort,
            mongoHost: process.env.mongoHost,
            mongoCredentials: process.env.mongoCredentials,
            mongoPort: process.env.mongoPort,
            mongoDB: process.env.mongoDB,
            https: process.env.https
        };
    }
    serverPort() {
        return parseInt(this.env.serverPort);
    }
    mongoHost() {
        return this.env.mongoHost;
    }
    mongoCredentials() {
        return this.env.mongoCredentials;
    }
    mongoPort() {
        return parseInt(this.env.mongoPort);
    }
    mongoDB() {
        return this.env.mongoDB;
    }
    serverStartNotice() {
        DB.msg(`START SERVER @ ${this.serverPort()}`);
        let cred = this.mongoCredentials();
        if (!cred)
            cred = "";
        else
            cred = "user:pass@";
        DB.msg(`MONGO @ ${cred}${this.mongoHost()}:${this.mongoPort()}/${this.mongoDB()}`);
    }
    httpsServer() {
        return this.env.https;
    }
}
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const formidable = require('formidable');
const https = require('https');
class ZingExpress {
    constructor(dataSource, env) {
        this.doGetFilter_ = (obj) => { return obj; };
        this.dataSource = dataSource;
        this.env = env;
        this.setupServer();
    }
    extractQuery(query) {
        let rslt = {};
        for (let key in query) {
            if (key != "keysonly") {
                let val = decodeURI(query[key]);
                rslt[key] = JSON.parse(val);
            }
            else {
                rslt.keysonly = query.keysonly;
            }
        }
        return rslt;
    }
    parseRange(val) {
        let rslt = {};
        let str = val.substring(1, val.length - 1);
        let parts = str.split(",");
        let aParts = parts[0].split(":");
        rslt[aParts[0]] = this.queryVal(aParts[1]);
        if (parts.length > 1) {
            aParts = parts[1].trim().split(":");
            rslt[aParts[0]] = this.queryVal(aParts[1]);
        }
        return rslt;
    }
    queryVal(val) {
        if (val.indexOf(`"`) == 0) {
            return val.substring(1, val.length - 1);
        }
        else if (val == "true") {
            return true;
        }
        else if (val == "false") {
            return false;
        }
        else {
            return Number.parseInt(val);
        }
    }
    httpDebugMsg(req, res, next) {
        let request = `${req.method}: "${req.protocol}://${req.hostname}${req.originalUrl}" `;
        DB.msg(request);
        next();
    }
    noCache(req, res, next) {
        res.set('Cache-Control', 'public,max-age=0');
        next();
    }
    setupServer() {
        this.app = express();
        let ds = this.dataSource;
        this.app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(cookieParser());
        this.app.use(this.httpDebugMsg);
        this.app.use(this.noCache);
        this.app.get('/', (req, res) => {
            res.send(this.env.indexHTML());
        });
        this.app.get('/data/get/*', (req, res) => {
            let key = req.params[0];
            let sc = new ServerContext(req, res);
            ds.canGet(key, sc, (granted) => {
                if (granted) {
                    ds.GET(key, (err, data) => {
                        if (err) {
                            res.status(204).send();
                        }
                        else {
                            let fdata = this.doGetFilter(data);
                            let j = fdata.toJSON();
                            let js = JSON.stringify(j);
                            res.status(200).send(js);
                        }
                    }, false, sc);
                }
            });
        });
        this.app.post('/data/getm', (req, res) => {
            let rslt = req.body;
            let keys = req.body.keys;
            let sc = new ServerContext(req, res);
            ds.canGETm(keys, sc, (granted) => {
                if (granted) {
                    ds.GETm(keys, (err, data) => {
                        if (err) {
                            res.status(200).send("[]");
                        }
                        else {
                            let rslt = [];
                            for (let i in data) {
                                let obj = data[i];
                                let fobj = this.doGetFilter(obj);
                                rslt.push(fobj.toJSON());
                            }
                            let js = JSON.stringify(rslt);
                            res.status(200).send(js);
                        }
                    }, false, sc);
                }
            });
        });
        this.app.post('/data/put/*', (req, res) => {
            let key = req.params[0];
            let b = req.body;
            let tc = req.body._t_;
            let obj = DataObj.make(tc, req.body);
            let sc = new ServerContext(req, res);
            obj.PUT((err, newObj) => {
                if (err) {
                    this.sendErr(res, err);
                }
                else {
                    let j = newObj.toJSON();
                    let js = JSON.stringify(j);
                    res.status(200).send(js);
                }
            }, sc);
        });
        this.app.post("/createuser", (req, res) => {
            let q = this.extractQuery(req.query);
            let password = q.password;
            let userDesc = req.body;
            let rm = ds.getRightsManager();
            let um = rm.userManager;
            let sc = new ServerContext(req, res);
            um.createUser(userDesc, password, (err) => {
                if (err) {
                    this.sendErr(res, err);
                }
                else {
                    res.status(200).send("");
                }
            }, sc);
            console.log("createuser");
        });
        this.app.post('/data/putm', (req, res) => {
            let jsonObjs = req.body;
            let reqObjs = [];
            for (let i in jsonObjs) {
                let json = jsonObjs[i];
                let obj = DataObj.make(null, json);
                reqObjs.push(obj);
            }
            let sc = new ServerContext(req, res);
            ds.canPUTm(reqObjs, sc, (granted) => {
                if (granted) {
                    ds.PUTm(reqObjs, (err, newObjs) => {
                        if (err) {
                            this.sendErr(res, err);
                        }
                        else {
                            let rslt = [];
                            for (let i in newObjs) {
                                let obj = newObjs[i];
                                rslt.push(obj.toJSON());
                            }
                            let js = JSON.stringify(rslt);
                            res.status(200).send(js);
                        }
                    }, sc);
                }
            });
        });
        this.app.get('/data/find/*', (req, res) => {
            let collectionCode = DataObj.typeToCollection(req.params[0]);
            let search = this.extractQuery(req.query);
            let sc = new ServerContext(req, res);
            let keysOnly = false;
            if (req.query.keysonly) {
                keysOnly = true;
            }
            let searchQuery = Query.fromJSON(search.q);
            ds.canFIND(collectionCode, searchQuery, sc, (granted) => {
                if (granted) {
                    ds.FIND(collectionCode, searchQuery, (err, keys, objs) => {
                        let filteredKeys = DataSource.filterKeyList(collectionCode, keys);
                        if (err) {
                            this.sendErr(res, err);
                        }
                        else {
                            let rslt = { keys: filteredKeys, objs: objs };
                            let js = JSON.stringify(rslt);
                            res.status(200).send(js);
                        }
                    }, keysOnly, false, sc);
                }
                else {
                    this.sendErr(res, "Find failed rights check");
                }
            });
        });
        this.app.get('/login', (req, res) => {
            let rm = ds.getRightsManager();
            let um = rm.userManager;
            let q = this.extractQuery(req.query);
            let userName = q.userName;
            let password = q.password;
            console.log("login", userName);
            um.serverSideLogin(userName, password, new ServerContext(req, res), (err, user) => {
                if (err) {
                    this.sendErr(res, err);
                }
                else {
                    let json = user.toJSON();
                    let stJson = JSON.stringify(json);
                    res.status(200).send(stJson);
                }
            });
        });
        this.app.get('/logout', (req, res) => {
            let rm = ds.getRightsManager();
            let um = rm.userManager;
            console.log("logout");
            um.serverSideLogout(new ServerContext(req, res), (err) => {
                if (err) {
                    this.sendErr(res, err);
                }
                else {
                    res.status(200).send("logout");
                }
            });
        });
        this.app.get('/blob/:key', (req, res) => {
            let key = req.params.key;
            DB.msg("GET blob", key);
            let sc = new ServerContext(req, res);
            ds.canGETBlob(key, sc, (granted) => {
                if (granted) {
                    ds.GETBlob(key, sc, (err, blob) => {
                        if (err) {
                            this.sendErr(res, err);
                        }
                        else {
                            let type = blob.type;
                            res.set("Content-Type", type).send(blob.data.buffer);
                        }
                    });
                }
            });
        });
        this.app.post('/blob', (req, res) => {
            let form = new formidable.IncomingForm();
            form.parse(req, (err, fields, files) => {
                DB.msg("fields", fields);
                DB.msg("files", files);
                if (files) {
                    let sc = new ServerContext(req, res);
                    let data = null;
                    if (files.file) {
                        data = files.file;
                    }
                    else {
                        data = files.data;
                    }
                    if (data) {
                        ds.canPUTBlob(sc, (granted) => {
                            if (granted) {
                                ds.PUTFileBlob(data, sc, (err, blobKey) => {
                                    res.json({ blobKey: blobKey });
                                });
                            }
                            else {
                                this.sendErr(res, "PutFileBlob permission failure");
                            }
                        });
                    }
                    else {
                        this.sendErr(res, "PutFileBlob blob no data in files");
                    }
                }
                else {
                    this.sendErr(res, "No files present");
                }
            });
        });
        this.app.delete('/data/delete/*', (req, res) => {
            let parts = req.url.split("/delete/");
            let key = parts[1];
            let sc = new ServerContext(req, res);
            ds.canDELETE(key, sc, (granted) => {
                if (granted) {
                    ds.DELETE(key, (err) => {
                        if (err)
                            this.sendErr(res, err);
                        else {
                            res.status(200).send();
                        }
                    });
                }
            });
        });
        this.app.get('*/pg/*', (req, res) => {
            let parts = req.url.split("/pg/");
            let root = parts[0];
            if (root[0] == "/") {
                root = root.substring(1);
            }
            let page = parts[1];
            res.send(this.env.pageHTML(root, page));
        });
        this.app.use(express.static(__dirname + '/war'));
    }
    sendErr(res, msg) {
        res.status(400).send(msg);
    }
    doGetFilter(data) {
        return this.doGetFilter_(data);
    }
    set getFilter(filterFunction) {
        this.doGetFilter_ = filterFunction;
    }
    get(pattern, handler) {
        this.app.get(pattern, handler);
    }
    post(pattern, handler) {
        this.app.post(pattern, handler);
    }
    listen(portNumber) {
        let httpsServer = this.env.httpsServer();
        if (httpsServer) {
            let cert = {
                key: fs.readFileSync(`${httpsServer}.key`),
                cert: fs.readFileSync(`${httpsServer}.crt`)
            };
            let httpsApp = https.createServer(cert, this.app);
            httpsApp.listen(portNumber, () => {
                DB.msg("start https");
            });
        }
        else {
            this.app.listen(portNumber);
        }
    }
}
class ZPerson extends DataObj {
    constructor(json) {
        super(json);
        if (json.FirstName) {
            this.FirstName_ = json.FirstName;
        }
        if (json.LastName) {
            this.LastName_ = json.LastName;
        }
        if (json.Email) {
            this.Email_ = json.Email;
        }
        if (json.Phone) {
            this.Phone_ = json.Phone;
        }
    }
    getTypeCode() { return 'P'; }
    getFirstName() {
        return this.FirstName_;
    }
    setFirstName(newVal) {
        if (this.FirstName_ != newVal) {
            this.FirstName_ = newVal;
            this.touch();
        }
    }
    getLastName() {
        return this.LastName_;
    }
    setLastName(newVal) {
        if (this.LastName_ != newVal) {
            this.LastName_ = newVal;
            this.touch();
        }
    }
    getEmail() {
        return this.Email_;
    }
    setEmail(newVal) {
        if (this.Email_ != newVal) {
            this.Email_ = newVal;
            this.touch();
        }
    }
    getPhone() {
        return this.Phone_;
    }
    setPhone(newVal) {
        if (this.Phone_ != newVal) {
            this.Phone_ = newVal;
            this.touch();
        }
    }
    static GET(key, done, forceRequest, serverContext) {
        let tc = DataSource.typeFromKey(key);
        if (!DataObj.checkTypeCode('P', tc)) {
            done("ERR wrong key " + key + " for Person.GET", null);
            return;
        }
        super.GET(key, (err, data) => {
            if (err) {
                done(err, null);
            }
            else {
                done(null, data);
            }
        }, forceRequest, serverContext);
    }
    static cGET(key, forceRequest) {
        let tc = DataSource.typeFromKey(key);
        if (!DataObj.checkTypeCode('P', tc)) {
            DB.msg("ERR wrong key " + key + " for Person.GET", null);
            return null;
        }
        return (super.cGET(key, forceRequest));
    }
    static GETm(keys, done, forceRequest, serverContext) {
        if (!keys || keys.length == 0) {
            done(null, []);
            return;
        }
        let tc = DataSource.typeFromKey(keys[0]);
        if (!DataObj.checkTypeCode('P', tc)) {
            done("ERR wrong key " + keys[0] + " for Person.GETm", null);
            return;
        }
        super.GETm(keys, (err, data) => {
            if (err) {
                done(err, null);
            }
            else {
                done(null, data);
            }
        }, forceRequest, serverContext);
    }
    toJSON() {
        let rslt = {};
        rslt._key = this._key;
        rslt._t_ = "P";
        rslt.FirstName = this.getFirstName();
        rslt.LastName = this.getLastName();
        rslt.Email = this.getEmail();
        rslt.Phone = this.getPhone();
        return rslt;
    }
    static byName(FirstName, LastName, done, keysOnly, forceRequest, serverContext) {
        super.FIND("P", Query.dict({ FirstName: FirstName, LastName: LastName }), done, keysOnly, forceRequest, serverContext);
    }
    static byNameC(FirstName, LastName, keysOnly, forceRequest) {
        let ds = DataObj.globalSource;
        return super.cFIND("P", Query.dict({ FirstName: FirstName, LastName: LastName }), keysOnly, forceRequest);
    }
}
class Person extends ZPerson {
    getFullName() {
        if (this.getFirstName() && this.getLastName()) {
            return `${this.getFirstName()} ${this.getLastName()}`;
        }
    }
    getDescription(includeEmail = false) {
        if (includeEmail && this.getEmail()) {
            return `${this.getFullName()} (${this.getEmail()})`;
        }
        return this.getFullName();
    }
    static allPersons() {
        return super.cFIND("P", Query.dict({}), false, false);
    }
}
class ZTeam extends DataObj {
    constructor(json) {
        super(json);
        if (json.TeamName) {
            this.TeamName_ = json.TeamName;
        }
        if (json.SeasonLabel) {
            this.SeasonLabel_ = json.SeasonLabel;
        }
        if (json.Coach) {
            this.Coach_ = json.Coach;
        }
        else {
            this.Coach_ = null;
        }
        if (json.AssistantCoach) {
            this.AssistantCoach_ = json.AssistantCoach;
        }
        else {
            this.AssistantCoach_ = null;
        }
        if (json.TeamManager) {
            this.TeamManager_ = json.TeamManager;
        }
        else {
            this.TeamManager_ = null;
        }
    }
    getTypeCode() { return 'T'; }
    getTeamName() {
        return this.TeamName_;
    }
    setTeamName(newVal) {
        if (this.TeamName_ != newVal) {
            this.TeamName_ = newVal;
            this.touch();
        }
    }
    getSeasonLabel() {
        return this.SeasonLabel_;
    }
    setSeasonLabel(newVal) {
        if (this.SeasonLabel_ != newVal) {
            this.SeasonLabel_ = newVal;
            this.touch();
        }
    }
    getCoach() {
        return this.Coach_;
    }
    setCoach(newVal) {
        if (this.Coach_ != newVal) {
            this.Coach_ = newVal;
            this.touch();
        }
    }
    getAssistantCoach() {
        return this.AssistantCoach_;
    }
    setAssistantCoach(newVal) {
        if (this.AssistantCoach_ != newVal) {
            this.AssistantCoach_ = newVal;
            this.touch();
        }
    }
    getTeamManager() {
        return this.TeamManager_;
    }
    setTeamManager(newVal) {
        if (this.TeamManager_ != newVal) {
            this.TeamManager_ = newVal;
            this.touch();
        }
    }
    static GET(key, done, forceRequest, serverContext) {
        let tc = DataSource.typeFromKey(key);
        if (!DataObj.checkTypeCode('T', tc)) {
            done("ERR wrong key " + key + " for Team.GET", null);
            return;
        }
        super.GET(key, (err, data) => {
            if (err) {
                done(err, null);
            }
            else {
                done(null, data);
            }
        }, forceRequest, serverContext);
    }
    static cGET(key, forceRequest) {
        let tc = DataSource.typeFromKey(key);
        if (!DataObj.checkTypeCode('T', tc)) {
            DB.msg("ERR wrong key " + key + " for Team.GET", null);
            return null;
        }
        return (super.cGET(key, forceRequest));
    }
    static GETm(keys, done, forceRequest, serverContext) {
        if (!keys || keys.length == 0) {
            done(null, []);
            return;
        }
        let tc = DataSource.typeFromKey(keys[0]);
        if (!DataObj.checkTypeCode('T', tc)) {
            done("ERR wrong key " + keys[0] + " for Team.GETm", null);
            return;
        }
        super.GETm(keys, (err, data) => {
            if (err) {
                done(err, null);
            }
            else {
                done(null, data);
            }
        }, forceRequest, serverContext);
    }
    toJSON() {
        let rslt = {};
        rslt._key = this._key;
        rslt._t_ = "T";
        rslt.TeamName = this.getTeamName();
        rslt.SeasonLabel = this.getSeasonLabel();
        rslt.Coach = this.getCoach();
        rslt.AssistantCoach = this.getAssistantCoach();
        rslt.TeamManager = this.getTeamManager();
        return rslt;
    }
    static byName(TeamName, done, keysOnly, forceRequest, serverContext) {
        super.FIND("T", Query.dict({ TeamName: TeamName }), done, keysOnly, forceRequest, serverContext);
    }
    static byNameC(TeamName, keysOnly, forceRequest) {
        let ds = DataObj.globalSource;
        return super.cFIND("T", Query.dict({ TeamName: TeamName }), keysOnly, forceRequest);
    }
}
class Team extends ZTeam {
    static makeNew(name, done) {
        let newTeam = new Team({ TeamName: name });
        newTeam.PUT((err, team) => {
            done(err, team);
        });
    }
    static allTeams() {
        return super.cFIND("T", Query.dict({}), false, false);
    }
}
class ZPlayer extends DataObj {
    constructor(json) {
        super(json);
        if (json.Person) {
            this.Person_ = json.Person;
        }
        else {
            this.Person_ = null;
        }
        if (json.JerseyNumber) {
            this.JerseyNumber_ = json.JerseyNumber;
        }
        else {
            this.JerseyNumber_ = 0;
        }
        if (json.Position) {
            this.Position_ = json.Position;
        }
        if (json.SecondaryPosition) {
            this.SecondaryPosition_ = json.SecondaryPosition;
        }
    }
    getTypeCode() { return 'PL'; }
    getPerson() {
        return this.Person_;
    }
    setPerson(newVal) {
        if (this.Person_ != newVal) {
            this.Person_ = newVal;
            this.touch();
        }
    }
    getJerseyNumber() {
        return this.JerseyNumber_;
    }
    setJerseyNumber(newVal) {
        if (this.JerseyNumber_ != newVal) {
            this.JerseyNumber_ = newVal;
            this.touch();
        }
    }
    getPosition() {
        return this.Position_;
    }
    setPosition(newVal) {
        if (this.Position_ != newVal) {
            this.Position_ = newVal;
            this.touch();
        }
    }
    getSecondaryPosition() {
        return this.SecondaryPosition_;
    }
    setSecondaryPosition(newVal) {
        if (this.SecondaryPosition_ != newVal) {
            this.SecondaryPosition_ = newVal;
            this.touch();
        }
    }
    static GET(key, done, forceRequest, serverContext) {
        let tc = DataSource.typeFromKey(key);
        if (!DataObj.checkTypeCode('PL', tc)) {
            done("ERR wrong key " + key + " for Player.GET", null);
            return;
        }
        super.GET(key, (err, data) => {
            if (err) {
                done(err, null);
            }
            else {
                done(null, data);
            }
        }, forceRequest, serverContext);
    }
    static cGET(key, forceRequest) {
        let tc = DataSource.typeFromKey(key);
        if (!DataObj.checkTypeCode('PL', tc)) {
            DB.msg("ERR wrong key " + key + " for Player.GET", null);
            return null;
        }
        return (super.cGET(key, forceRequest));
    }
    static GETm(keys, done, forceRequest, serverContext) {
        if (!keys || keys.length == 0) {
            done(null, []);
            return;
        }
        let tc = DataSource.typeFromKey(keys[0]);
        if (!DataObj.checkTypeCode('PL', tc)) {
            done("ERR wrong key " + keys[0] + " for Player.GETm", null);
            return;
        }
        super.GETm(keys, (err, data) => {
            if (err) {
                done(err, null);
            }
            else {
                done(null, data);
            }
        }, forceRequest, serverContext);
    }
    toJSON() {
        let rslt = {};
        rslt._key = this._key;
        rslt._t_ = "PL";
        rslt.Person = this.getPerson();
        rslt.JerseyNumber = this.getJerseyNumber();
        rslt.Position = this.getPosition();
        rslt.SecondaryPosition = this.getSecondaryPosition();
        return rslt;
    }
    static byPerson(Person, done, keysOnly, forceRequest, serverContext) {
        super.FIND("PL", Query.dict({ Person: Person }), done, keysOnly, forceRequest, serverContext);
    }
    static byPersonC(Person, keysOnly, forceRequest) {
        let ds = DataObj.globalSource;
        return super.cFIND("PL", Query.dict({ Person: Person }), keysOnly, forceRequest);
    }
    static byNumber(JerseyNumber, done, keysOnly, forceRequest, serverContext) {
        super.FIND("PL", Query.dict({ JerseyNumber: JerseyNumber }), done, keysOnly, forceRequest, serverContext);
    }
    static byNumberC(JerseyNumber, keysOnly, forceRequest) {
        let ds = DataObj.globalSource;
        return super.cFIND("PL", Query.dict({ JerseyNumber: JerseyNumber }), keysOnly, forceRequest);
    }
}
class Player extends ZPlayer {
}
class ZGameEvent extends DataObj {
    constructor(json) {
        super(json);
        if (json.EventType) {
            this.EventType_ = json.EventType;
        }
        if (json.Time) {
            this.Time_ = json.Time;
        }
        else {
            this.Time_ = 0;
        }
        if (json.Player) {
            this.Player_ = json.Player;
        }
        else {
            this.Player_ = null;
        }
        this.HomeScoreIncreased_ = json.HomeScoreIncreased;
        this.AwayScoreIncreased_ = json.AwayScoreIncreased;
    }
    getTypeCode() { return 'GE'; }
    getEventType() {
        return this.EventType_;
    }
    setEventType(newVal) {
        if (this.EventType_ != newVal) {
            this.EventType_ = newVal;
            this.touch();
        }
    }
    getTime() {
        return this.Time_;
    }
    setTime(newVal) {
        if (this.Time_ != newVal) {
            this.Time_ = newVal;
            this.touch();
        }
    }
    getPlayer() {
        return this.Player_;
    }
    setPlayer(newVal) {
        if (this.Player_ != newVal) {
            this.Player_ = newVal;
            this.touch();
        }
    }
    getHomeScoreIncreased() {
        return this.HomeScoreIncreased_;
    }
    setHomeScoreIncreased(newVal) {
        if (this.HomeScoreIncreased_ != newVal) {
            this.HomeScoreIncreased_ = newVal;
            this.touch();
        }
    }
    getAwayScoreIncreased() {
        return this.AwayScoreIncreased_;
    }
    setAwayScoreIncreased(newVal) {
        if (this.AwayScoreIncreased_ != newVal) {
            this.AwayScoreIncreased_ = newVal;
            this.touch();
        }
    }
    toJSON() {
        let rslt = {};
        rslt._t_ = "GE";
        rslt.EventType = this.getEventType();
        rslt.Time = this.getTime();
        rslt.Player = this.getPlayer();
        rslt.HomeScoreIncreased = this.getHomeScoreIncreased();
        rslt.AwayScoreIncreased = this.getAwayScoreIncreased();
        return rslt;
    }
}
class GameEvent extends ZGameEvent {
}
class ZGame extends DataObj {
    constructor(json) {
        super(json);
        if (json.Team) {
            this.Team_ = json.Team;
        }
        else {
            this.Team_ = null;
        }
        this.HomeGame_ = json.HomeGame;
        if (json.Date) {
            this.Date_ = json.Date;
        }
        if (json.StartTime) {
            this.StartTime_ = json.StartTime;
        }
        else {
            this.StartTime_ = 0;
        }
        if (json.EndTime) {
            this.EndTime_ = json.EndTime;
        }
        else {
            this.EndTime_ = 0;
        }
        if (json.WinResult) {
            this.WinResult_ = json.WinResult;
        }
        if (json.GameEvents) {
            this.GameEvents_ = (DataObj.makeList('GE', json.GameEvents, this));
        }
        else {
            this.GameEvents_ = [];
        }
    }
    getTypeCode() { return 'G'; }
    getTeam() {
        return this.Team_;
    }
    setTeam(newVal) {
        if (this.Team_ != newVal) {
            this.Team_ = newVal;
            this.touch();
        }
    }
    getHomeGame() {
        return this.HomeGame_;
    }
    setHomeGame(newVal) {
        if (this.HomeGame_ != newVal) {
            this.HomeGame_ = newVal;
            this.touch();
        }
    }
    getDate() {
        return this.Date_;
    }
    setDate(newVal) {
        if (this.Date_ != newVal) {
            this.Date_ = newVal;
            this.touch();
        }
    }
    getStartTime() {
        return this.StartTime_;
    }
    setStartTime(newVal) {
        if (this.StartTime_ != newVal) {
            this.StartTime_ = newVal;
            this.touch();
        }
    }
    getEndTime() {
        return this.EndTime_;
    }
    setEndTime(newVal) {
        if (this.EndTime_ != newVal) {
            this.EndTime_ = newVal;
            this.touch();
        }
    }
    getWinResult() {
        return this.WinResult_;
    }
    setWinResult(newVal) {
        if (this.WinResult_ != newVal) {
            this.WinResult_ = newVal;
            this.touch();
        }
    }
    getGameEvents() {
        let tmp = [];
        for (let i in this.GameEvents_) {
            tmp.push(this.GameEvents_[i]);
        }
        return tmp;
    }
    setGameEvents(val) {
        let tmp = [];
        for (let i in val) {
            tmp.push(val[i]);
            val[i].parent = this;
        }
        this.GameEvents_ = tmp;
        this.touch();
    }
    static GET(key, done, forceRequest, serverContext) {
        let tc = DataSource.typeFromKey(key);
        if (!DataObj.checkTypeCode('G', tc)) {
            done("ERR wrong key " + key + " for Game.GET", null);
            return;
        }
        super.GET(key, (err, data) => {
            if (err) {
                done(err, null);
            }
            else {
                done(null, data);
            }
        }, forceRequest, serverContext);
    }
    static cGET(key, forceRequest) {
        let tc = DataSource.typeFromKey(key);
        if (!DataObj.checkTypeCode('G', tc)) {
            DB.msg("ERR wrong key " + key + " for Game.GET", null);
            return null;
        }
        return (super.cGET(key, forceRequest));
    }
    static GETm(keys, done, forceRequest, serverContext) {
        if (!keys || keys.length == 0) {
            done(null, []);
            return;
        }
        let tc = DataSource.typeFromKey(keys[0]);
        if (!DataObj.checkTypeCode('G', tc)) {
            done("ERR wrong key " + keys[0] + " for Game.GETm", null);
            return;
        }
        super.GETm(keys, (err, data) => {
            if (err) {
                done(err, null);
            }
            else {
                done(null, data);
            }
        }, forceRequest, serverContext);
    }
    toJSON() {
        let rslt = {};
        rslt._key = this._key;
        rslt._t_ = "G";
        rslt.Team = this.getTeam();
        rslt.HomeGame = this.getHomeGame();
        rslt.Date = this.getDate();
        rslt.StartTime = this.getStartTime();
        rslt.EndTime = this.getEndTime();
        rslt.WinResult = this.getWinResult();
        rslt.GameEvents = [];
        let tmp_GameEvents = this.getGameEvents();
        for (let i in tmp_GameEvents) {
            rslt.GameEvents.push((tmp_GameEvents[i]).toJSON());
        }
        return rslt;
    }
    static byDate(Date, done, keysOnly, forceRequest, serverContext) {
        super.FIND("G", Query.dict({ Date: Date }), done, keysOnly, forceRequest, serverContext);
    }
    static byDateC(Date, keysOnly, forceRequest) {
        let ds = DataObj.globalSource;
        return super.cFIND("G", Query.dict({ Date: Date }), keysOnly, forceRequest);
    }
    static byHome(HomeGame, done, keysOnly, forceRequest, serverContext) {
        super.FIND("G", Query.dict({ HomeGame: HomeGame }), done, keysOnly, forceRequest, serverContext);
    }
    static byHomeC(HomeGame, keysOnly, forceRequest) {
        let ds = DataObj.globalSource;
        return super.cFIND("G", Query.dict({ HomeGame: HomeGame }), keysOnly, forceRequest);
    }
    static byWinResult(WinResult, done, keysOnly, forceRequest, serverContext) {
        super.FIND("G", Query.dict({ WinResult: WinResult }), done, keysOnly, forceRequest, serverContext);
    }
    static byWinResultC(WinResult, keysOnly, forceRequest) {
        let ds = DataObj.globalSource;
        return super.cFIND("G", Query.dict({ WinResult: WinResult }), keysOnly, forceRequest);
    }
}
class Game extends ZGame {
}
function ZMake(expectedType, json) {
    let type = json._t_;
    if (!DataObj.checkTypeCode(expectedType, type)) {
        console.log('ERR expecting ' + expectedType + ' got ' + type, json);
        return null;
    }
    if (!type) {
        type = expectedType;
    }
    switch (type) {
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
            console.log('ERR bad typeCode ' + type + ' on', json);
            return null;
    }
    return null;
}
DataObj.make = ZMake;
function ZMakeList(expectedType, json, parent) {
    let rslt = [];
    for (let i in json) {
        let obj = ZMake(expectedType, json[i]);
        obj.parent = parent;
        rslt.push(obj);
    }
    return rslt;
}
DataObj.makeList = ZMakeList;
function ZMakeDict(expectedType, json, parent) {
    let rslt = {};
    for (let k in json) {
        let obj = ZMake(expectedType, json[k]);
        obj.parent = parent;
        rslt[k] = obj;
    }
    return rslt;
}
DataObj.makeDict = ZMakeDict;
DataObj.classInfo = {
    "T": { "className": "Team", "superCode": "", "keyed": true,
        fields: {
            TeamName: { type: "string", isList: false, isDict: false },
            SeasonLabel: { type: "string", isList: false, isDict: false },
            Coach: { type: "Person", isList: false, isDict: false },
            AssistantCoach: { type: "Person", isList: false, isDict: false },
            TeamManager: { type: "Person", isList: false, isDict: false },
        },
    },
    "P": { "className": "Person", "superCode": "", "keyed": true,
        fields: {
            FirstName: { type: "string", isList: false, isDict: false },
            LastName: { type: "string", isList: false, isDict: false },
            Email: { type: "string", isList: false, isDict: false },
            Phone: { type: "string", isList: false, isDict: false },
        },
    },
    "PL": { "className": "Player", "superCode": "", "keyed": true,
        fields: {
            Person: { type: "Person", isList: false, isDict: false },
            JerseyNumber: { type: "number", isList: false, isDict: false },
            Position: { type: "string", isList: false, isDict: false },
            SecondaryPosition: { type: "string", isList: false, isDict: false },
        },
    },
    "G": { "className": "Game", "superCode": "", "keyed": true,
        fields: {
            Team: { type: "Team", isList: false, isDict: false },
            HomeGame: { type: "boolean", isList: false, isDict: false },
            Date: { type: "string", isList: false, isDict: false },
            StartTime: { type: "number", isList: false, isDict: false },
            EndTime: { type: "number", isList: false, isDict: false },
            WinResult: { type: "string", isList: false, isDict: false },
            GameEvents: { type: "GameEvent", isList: true, isDict: false },
        },
    },
    "GE": { "className": "GameEvent", "superCode": "", "keyed": false,
        fields: {
            EventType: { type: "string", isList: false, isDict: false },
            Time: { type: "number", isList: false, isDict: false },
            Player: { type: "Player", isList: false, isDict: false },
            HomeScoreIncreased: { type: "boolean", isList: false, isDict: false },
            AwayScoreIncreased: { type: "boolean", isList: false, isDict: false },
        },
    },
};
class SoccerStatsEnv extends ZingEnv {
    indexHTML() {
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
      `;
    }
    pageHTML(root, pageName) {
        return this.indexHTML();
    }
    serverPort() {
        return parseInt(process.env.SERVER_PORT || "4000");
    }
    mongoDB() { return process.env.MONGO_DB_NAME; }
    mongoCredentials() { return process.env.MONGO_DB_CREDS; }
    mongoHost() { return process.env.MONGO_DB_HOST; }
    mongoPort() { return parseInt(process.env.MONGO_DB_PORT || "27017"); }
}
class AllRightsManager extends RightsManager {
    constructor(dataSource, userManager = new NoUserManager()) {
        super(dataSource, userManager);
    }
    checkGET(key, serverContext, done) {
        done(true);
    }
    checkGETBlob(blobKey, serverContext, done) {
        done(true);
    }
    checkPUT(obj, serverContext, done) {
        done(true);
    }
    checkPUTBlob(serverContext, done) {
        done(true);
    }
    checkDELETE(key, serverContext, done) {
        done(true);
    }
    checkFIND(typeCode, search, serverContext, done) {
        done(true);
    }
}
class NoUserManager extends UserManager {
    login(userName, password, done, serverContext) {
        done(null, null);
    }
    getUserKey(serverContext) {
        return "anonymous";
    }
}
require("dotenv").config();
let env = new SoccerStatsEnv();
let dataSource = new MongoDataSource(env.mongoCredentials() + (env.mongoCredentials() ? "@" : "") + env.mongoHost(), env.mongoPort(), env.mongoDB(), false);
let rightsManager = new AllRightsManager(dataSource);
dataSource.setRightsManager(rightsManager);
let app = new ZingExpress(dataSource, env);
env.serverStartNotice();
app.listen(env.serverPort());

//# sourceMappingURL=server.js.map
