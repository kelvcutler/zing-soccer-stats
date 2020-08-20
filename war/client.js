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
class HTTPDataSource extends DataSource {
    constructor(urlRoot) {
        super();
        this.urlRoot = urlRoot;
    }
    isRemote() { return true; }
    GET(key, done, forceRequest, serverContext) {
        let _this = this;
        if (!key) {
            done(null, null);
            return;
        }
        let url = `${this.urlRoot}data/get/${key}`;
        let typeCode = DataSource.collectionFromKey(key);
        DB.msg("HTTP GET ", url);
        let http = new XMLHttpRequest();
        http.open("GET", url);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let json = JSON.parse(http.responseText);
                    let obj = DataObj.make(typeCode, json);
                    obj.dataSource = _this;
                    done(null, obj);
                    _this.notify();
                }
                else
                    done("" + this.status + " " + this.statusText, null);
            }
        };
        http.send();
    }
    httpLogin(userName, password, done) {
        DB.msg("http login", userName);
        let http = new XMLHttpRequest();
        let url = `${this.urlRoot}login?userName="${userName}"&password="${password}"`;
        http.open("GET", url);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let userJSONStr = this.responseText;
                    let userJSON = JSON.parse(userJSONStr);
                    let user = DataObj.make(null, userJSON);
                    done(null, user);
                }
                else {
                    done(`${this.status} ${this.responseText}`, null);
                }
            }
        };
        http.send();
    }
    httpLogout(done) {
        DB.msg("http logout");
        let http = new XMLHttpRequest();
        let url = `${this.urlRoot}logout`;
        http.open("GET", url);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    done(null);
                }
                else {
                    done(`${this.status} ${this.responseText}`);
                }
            }
        };
        http.send();
    }
    getCurrentUserKey(done, request, response) {
        DB.msg("http getCurrentUserKey");
        let http = new XMLHttpRequest();
        let url = `${this.urlRoot}currentuser`;
        http.open("GET", url);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let userKey = this.responseText;
                    if (userKey.length == 0) {
                        done(null);
                    }
                    else {
                        done(userKey);
                    }
                }
                else {
                    done(null);
                }
            }
        };
        http.send();
    }
    GETm(keys, done, forceRequest, serverContext) {
        let _this = this;
        if (!keys) {
            done(null, []);
            return;
        }
        let url = `${this.urlRoot}data/getm`;
        let http = new XMLHttpRequest();
        http.open("POST", url);
        http.setRequestHeader("Content-Type", "application/json");
        let jstr = JSON.stringify({ keys: keys });
        http.send(jstr);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let json = JSON.parse(http.responseText);
                    let rslt = [];
                    for (let i in json) {
                        let objDesc = json[i];
                        let mobj = DataObj.make(null, objDesc);
                        mobj.dataSource = _this;
                        rslt.push(mobj);
                    }
                    if (done)
                        done(null, rslt);
                    _this.notify();
                }
                else if (done)
                    done("" + this.status + " " + this.statusText, null);
            }
        };
    }
    GETBlob(blobKey, serverContext, done) {
        if (blobKey) {
            let url = HTTPDataSource.urlFromBlobKey(blobKey);
            window.location.href = url;
        }
    }
    static urlFromBlobKey(blobKey) {
        let url = `/blob/${blobKey}`;
        return url;
    }
    PUT(obj, done, serverContext) {
        let _this = this;
        let typeCode = obj.getTypeCode();
        let url = `${this.urlRoot}data/put/${obj._key}`;
        DB.msg("HTTP PUT ", url);
        let http = new XMLHttpRequest();
        http.open("POST", url);
        http.setRequestHeader("Content-Type", "application/json");
        let sjson = obj.toJSON();
        let jstr = JSON.stringify(sjson);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let json = JSON.parse(http.responseText);
                    let mobj = DataObj.make(typeCode, json);
                    mobj.dataSource = _this;
                    if (done)
                        done(null, mobj);
                    _this.notify();
                }
                else {
                    DB.msg(`PUT failure ${this.status} ${this.statusText}`, obj);
                    if (done)
                        done("" + this.status + " " + this.statusText, null);
                }
            }
        };
        http.send(jstr);
    }
    createUser(userDesc, password, done) {
        let url = `${this.urlRoot}createuser?password="${password}"`;
        let http = new XMLHttpRequest();
        http.open("POST", url);
        http.setRequestHeader("Content-Type", "application/json");
        let jstr = JSON.stringify(userDesc);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    done(null);
                }
                else {
                    done(`${this.status} ${this.responseText}`);
                }
            }
        };
        http.send(jstr);
    }
    PUTm(objs, done, serverContext) {
        let _this = this;
        let url = `${this.urlRoot}data/putm`;
        let http = new XMLHttpRequest();
        let toSend = [];
        for (let i in objs) {
            toSend.push(objs[i].toJSON());
        }
        http.open("POST", url);
        http.setRequestHeader("Content-Type", "application/json");
        let jstr = JSON.stringify(toSend);
        http.send(jstr);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let json = JSON.parse(http.responseText);
                    let rslt = [];
                    for (let i in json) {
                        let objDesc = json[i];
                        let mobj = DataObj.make(null, objDesc);
                        mobj.dataSource = _this;
                        rslt.push(mobj);
                    }
                    if (done)
                        done(null, rslt);
                    _this.notify();
                }
                else if (done)
                    done("" + this.status + " " + this.statusText, null);
            }
        };
    }
    PUTFileBlob(file, serverContext, done) {
        let _this = this;
        let url = `${this.urlRoot}blob`;
        let formData = new FormData();
        formData.append('name', file.name);
        formData.append('file', file);
        let http = new XMLHttpRequest();
        http.open("POST", url, true);
        http.send(formData);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let json = JSON.parse(http.responseText);
                    if (done)
                        done(null, json.blobKey);
                }
                else if (done)
                    done("" + this.status + " " + this.statusText, null);
                _this.notify();
            }
        };
    }
    PUTBlob(blob, name, serverContext, done) {
        let _this = this;
        let url = `${this.urlRoot}blob`;
        let formData = new FormData();
        DB.msg("HTTPDataSource.PUTBlob not done");
        formData.append('name', name);
        formData.append('data', blob);
        let http = new XMLHttpRequest();
        http.open("POST", url, true);
        http.send(formData);
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let json = JSON.parse(http.responseText);
                    if (done)
                        done(null, json.blobKey);
                }
                else if (done)
                    done("" + this.status + " " + this.statusText, null);
                _this.notify();
            }
        };
    }
    DELETE(key, done) {
        let _this = this;
        let url = `${this.urlRoot}data/delete/${key}`;
        DB.msg("HTTP DELETE ", url);
        let http = new XMLHttpRequest();
        http.open("DELETE", url);
        http.send();
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    if (done)
                        done(null);
                    _this.notify();
                }
                else if (done)
                    done("" + this.status + " " + this.statusText);
            }
        };
    }
    FIND(typeCode, search, done, keysOnly, forceRequest, serverContext) {
        let _this = this;
        let colCode = DataObj.typeToCollection(typeCode);
        let url = `${this.urlRoot}data/find/${colCode}?`;
        let start = true;
        let query = this.buildSearchQuery(search);
        if (keysOnly) {
            query += "&keysonly=1";
        }
        url += query;
        DB.msg("HTTP FIND ", url);
        let http = new XMLHttpRequest();
        http.open("GET", url);
        http.send();
        http.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let json = JSON.parse(http.responseText);
                    let keys = json.keys;
                    let objs = json.objs;
                    let dObjs = [];
                    if (objs) {
                        for (let o in objs) {
                            let objJson = objs[o];
                            let obj = DataObj.make(null, objJson);
                            dObjs.push(obj);
                        }
                    }
                    if (done)
                        done(null, keys, dObjs);
                    _this.notify();
                }
                else {
                    if (done)
                        done("" + this.status + " " + this.responseText, null, null);
                }
            }
        };
    }
    buildSearchQuery(search) {
        return "q=" + JSON.stringify(search.toJSON());
    }
}
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
class CacheDataSource extends DataSource {
    constructor(actualSource, dataMonitor) {
        super();
        this.MAX_CACHE = 1000;
        this.cacheCount = 0;
        this.MAX_FIND_CACHE = 100;
        this.findCacheCount = 0;
        this.actualSource = actualSource;
        this.setDataMonitor(dataMonitor);
        this.recentCache = {};
        this.prevCache = {};
        this.recentFindCache = {};
        this.prevFindCache = {};
    }
    setDataMonitor(dataMonitor) {
        super.setDataMonitor(dataMonitor);
        this.actualSource.setDataMonitor(dataMonitor);
    }
    setRightsManager(rm) {
        super.setRightsManager(rm);
        this.actualSource.setRightsManager(rm);
    }
    isRemote() { return this.actualSource.isRemote(); }
    GET(key, done, forceRequest, serverContext) {
        let co = this.getCachedObj(key);
        if (co) {
            if (co.requestInProgress) {
                setTimeout(() => {
                    this.GET(key, done, forceRequest, serverContext);
                }, 1000);
                return;
            }
            else {
                if (!forceRequest && co.obj) {
                    done(null, co.obj);
                    return;
                }
                else {
                    co.requestInProgress = true;
                }
            }
        }
        else {
            co = new CacheObj(null);
            co.requestInProgress = true;
            this.recentCache[key] = co;
        }
        this.actualSource.GET(key, (err, data) => {
            if (err) {
                done(err, null);
                return;
            }
            data.dataSource = this;
            this.cacheObj(data);
            done(null, data);
            this.notify();
        }, forceRequest, serverContext);
    }
    cGET(key, forceRequest) {
        let cObj = this.getCachedObj(key);
        if (cObj) {
            if (cObj.requestInProgress) {
                return null;
            }
            else if (forceRequest) {
                cObj.requestInProgress = true;
            }
            else {
                return cObj.obj;
            }
        }
        this.GET(key, () => { }, forceRequest, null);
        return null;
    }
    GETm(keys, done, forceRequest, serverContext) {
        if (!keys || keys.length == 0) {
            done(null, []);
            return;
        }
        if (forceRequest) {
            this.getMActual(keys, (err, data) => {
                done(err, data);
            }, forceRequest, serverContext);
        }
        else {
            if (this.cacheRequestInProgress(keys)) {
                setTimeout(() => {
                    this.GETm(keys, (subErr, subData) => {
                        done(subErr, subData);
                    }, forceRequest, serverContext);
                }, 1000);
            }
            else {
                let cObjs = this.getCachedObjs(keys);
                if (cObjs) {
                    done(null, cObjs);
                }
                else {
                    this.getMActual(keys, (err, data) => {
                        done(err, data);
                    }, forceRequest, serverContext);
                }
            }
        }
    }
    getMActual(keys, done, forceRequest, serverContext) {
        this.actualSource.GETm(keys, (err, data) => {
            if (err) {
                done(err, null);
                return;
            }
            for (let i in data)
                data[i].dataSource = this;
            this.cacheObjs(data);
            done(null, data);
        }, forceRequest, serverContext);
    }
    cGETm(keys, forceRequest) {
        if (!keys || keys.length == 0) {
            return [];
        }
        let cObjs = this.getCachedObjs(keys);
        let remainingKeys = [];
        if (forceRequest) {
            remainingKeys = keys;
        }
        else if (cObjs) {
            for (let k in keys) {
                let found = false;
                let key = keys[k];
                for (let o in cObjs) {
                    let obj = cObjs[o];
                    if (obj && key == obj._key) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    remainingKeys.push(key);
                }
            }
            if (remainingKeys.length > 0) {
                this.GETm(remainingKeys, () => { }, forceRequest, null);
            }
            return cObjs;
        }
        else {
            this.GETm(keys, () => { }, forceRequest, null);
            return null;
        }
    }
    GETBlob(blobKey, serverContext, done) {
        this.actualSource.GETBlob(blobKey, serverContext, done);
    }
    PUT(obj, done, serverContext) {
        obj.dataSource = this;
        let typeCode = obj.getTypeCode();
        this.clearFindCache(typeCode);
        this.actualSource.PUT(obj, (err, putObj) => {
            this.clearFindCache(typeCode);
            if (putObj)
                this.cacheObj(putObj);
            done(err, putObj);
        }, serverContext);
    }
    PUTm(objs, done, serverContext) {
        for (let i in objs)
            objs[i].dataSource = this;
        if (objs && objs.length > 0) {
            let typeCode = objs[0].getTypeCode();
            this.clearFindCache(typeCode);
        }
        this.actualSource.PUTm(objs, done, serverContext);
    }
    PUTFileBlob(file, serverContext, done) {
        this.actualSource.PUTFileBlob(file, serverContext, done);
    }
    PUTBlob(blob, name, serverContext, done) {
        this.actualSource.PUTBlob(blob, name, serverContext, done);
    }
    DELETE(key, done) {
        this.delObjCache(key);
        this.actualSource.DELETE(key, (delErr) => {
            this.delObjCache(key);
            if (done)
                done(delErr);
        });
    }
    FIND(typeCode, search, done, keysOnly, forceRequest, serverContext) {
        let findKeys = this.getCachedFind(typeCode, search);
        if (findKeys) {
            if (findKeys.requestInProgress) {
                setTimeout(() => {
                    this.FIND(typeCode, search, done, keysOnly, false, serverContext);
                }, 1000);
                return;
            }
            else if (forceRequest) {
                findKeys.requestInProgress = true;
                this.doFind(typeCode, search, done, keysOnly, serverContext);
            }
            else {
                if (findKeys.getKeys()) {
                    if (keysOnly) {
                        done(null, findKeys.getKeys(), []);
                    }
                    else {
                        this.GETm(findKeys.getKeys(), (getmErr, getMData) => {
                            if (getMData) {
                                done(null, findKeys.getKeys(), getMData);
                            }
                            else {
                                done(getmErr, findKeys.getKeys(), []);
                            }
                        }, false, serverContext);
                    }
                }
            }
        }
        else {
            this.doFind(typeCode, search, done, keysOnly, serverContext);
        }
    }
    doFind(typeCode, search, done, keysOnly, serverContext) {
        this.registerInProgress(typeCode, search);
        this.actualSource.FIND(typeCode, search, (err, keys, objs) => {
            if (err) {
                done(err, null, null);
                return;
            }
            this.cacheFind(typeCode, search, keys, objs);
            done(err, keys, objs);
        }, keysOnly, false, serverContext);
    }
    registerInProgress(typeCode, search) {
        let newFindCache = new FindCacheObj(search, []);
        newFindCache.requestInProgress = true;
        if (!this.recentFindCache[typeCode])
            this.recentFindCache[typeCode] = [];
        this.recentFindCache[typeCode].push(newFindCache);
    }
    cFIND(typeCode, search, keysOnly, forceRequest) {
        let findKeys = this.getCachedFind(typeCode, search);
        let rslt = [];
        if (findKeys) {
            if (findKeys.requestInProgress) {
                return findKeys.getKeys();
            }
            else if (forceRequest) {
                this.FIND(typeCode, search, () => {
                }, keysOnly, forceRequest, null);
                return findKeys.getKeys();
            }
            else {
                rslt = findKeys.getKeys();
                return rslt;
            }
        }
        else {
            this.FIND(typeCode, search, () => {
            }, keysOnly, forceRequest, null);
            return null;
        }
    }
    touched(obj) {
        this.scheduleUpdate(obj);
        return true;
    }
    login(userId, password, done, serverContext) {
        this.actualSource.login(userId, password, done, serverContext);
    }
    httpLogin(userName, password, done) {
        this.actualSource.httpLogin(userName, password, (aErr, aUser) => {
            if (aErr) {
                done(aErr, null);
            }
            else {
                this.cacheObj(aUser);
                done(null, aUser);
            }
        });
    }
    createUser(userDesc, password, done, serverContext) {
        this.actualSource.createUser(userDesc, password, done, serverContext);
    }
    checkCacheSize() {
        this.cacheCount++;
        if (this.cacheCount > this.MAX_CACHE) {
            this.cacheCount = 0;
            this.prevCache = this.recentCache;
            this.recentCache = {};
        }
    }
    cacheObj(obj) {
        let key = obj._key;
        let recentObj = this.recentCache[key];
        let prevObj = this.prevCache[key];
        let now = Date.now();
        if (recentObj) {
            this.recentCache[key] = new CacheObj(obj);
            obj.dataSource = this;
        }
        else if (prevObj) {
            this.recentCache[key] = new CacheObj(obj);
            obj.dataSource = this;
            this.prevCache[key] = null;
            this.checkCacheSize();
        }
        else {
            this.recentCache[key] = new CacheObj(obj);
            obj.dataSource = this;
            this.checkCacheSize();
        }
        this.notify();
    }
    cacheObjs(objs) {
        for (let i in objs) {
            let obj = objs[i];
            this.cacheObj(obj);
        }
    }
    getCachedObj(key) {
        let recentObj = this.recentCache[key];
        let prevObj = this.prevCache[key];
        let now = Date.now();
        if (recentObj) {
            if (recentObj.expired()) {
                this.recentCache[key] = null;
            }
            else
                return recentObj;
        }
        else if (prevObj) {
            if (prevObj.expired()) {
                this.prevCache[key] = null;
            }
            else
                return prevObj;
        }
        else {
            this.checkCacheSize();
            return null;
        }
    }
    cacheRequestInProgress(keys) {
        for (let i in keys) {
            let key = keys[i];
            let cache = this.getCachedObj(key);
            if (cache && cache.requestInProgress)
                return true;
        }
        return false;
    }
    getCachedObjs(keys) {
        let rslt = [];
        for (let i in keys) {
            let key = keys[i];
            let obj = this.getCachedObj(key);
            if (obj && obj.obj) {
                rslt.push(obj.obj);
            }
        }
        if (rslt.length == 0)
            rslt = null;
        return rslt;
    }
    delObjCache(key) {
        let objTypeCode = key.split("_")[0];
        this.clearFindCache(objTypeCode);
        let recentObj = this.recentCache[key];
        if (recentObj)
            this.recentCache[key] = null;
        let prevObj = this.prevCache[key];
        if (prevObj)
            this.prevCache[key] = null;
        this.notify();
    }
    checkFindCacheSize() {
        this.findCacheCount++;
        if (this.findCacheCount > this.MAX_FIND_CACHE) {
            this.findCacheCount = 0;
            this.prevFindCache = this.recentFindCache;
            this.recentFindCache = {};
        }
    }
    cacheFind(typeCode, search, keys, objs) {
        let recentSearch = this.locateFind(this.recentFindCache, typeCode, search);
        if (recentSearch) {
            recentSearch.setData(search, keys);
        }
        else {
            let prevSearch = this.locateFind(this.prevFindCache, typeCode, search);
            if (prevSearch) {
                prevSearch.setData(search, keys);
                if (!this.recentFindCache[typeCode])
                    this.recentFindCache[typeCode] = [];
                this.recentFindCache[typeCode].push(prevSearch);
                this.checkFindCacheSize();
            }
            else {
                let newSearch = new FindCacheObj(search, keys);
                if (!this.recentFindCache[typeCode])
                    this.recentFindCache[typeCode] = [];
                this.recentFindCache[typeCode].push(newSearch);
                this.checkFindCacheSize();
            }
        }
        this.cacheObjs(objs);
        this.notify();
    }
    getCachedFind(typeCode, search) {
        let recentSearch = this.locateFind(this.recentFindCache, typeCode, search);
        if (recentSearch) {
            if (recentSearch.expired()) {
                this.purgeFind(this.recentFindCache, typeCode, search);
            }
            else
                return recentSearch;
        }
        let prevSearch = this.locateFind(this.prevFindCache, typeCode, search);
        if (prevSearch) {
            if (prevSearch.expired()) {
                this.purgeFind(this.prevFindCache, typeCode, search);
            }
            else {
                return prevSearch;
            }
        }
        return null;
    }
    locateFind(cache, typeCode, search) {
        let searches = cache[typeCode];
        if (searches) {
            for (let i in searches) {
                let srch = searches[i];
                if (srch) {
                    if (Query.match(srch.search, search)) {
                        return srch;
                    }
                }
            }
            return null;
        }
        else {
            return null;
        }
    }
    purgeFind(cache, typeCode, search) {
        let searches = cache[typeCode];
        if (searches) {
            for (let i in searches) {
                let srch = searches[i];
                if (srch) {
                    if (Query.match(srch.search, search)) {
                        searches[i] = null;
                    }
                }
            }
            return null;
        }
        else {
            return null;
        }
    }
    clearFindCache(objTypeCode) {
        let possibleTypeCodes = this.superTypeCodes(objTypeCode);
        for (let c in possibleTypeCodes) {
            let tc = possibleTypeCodes[c];
            this.recentFindCache[tc] = [];
            this.prevFindCache[tc] = [];
        }
    }
    superTypeCodes(typeCode) {
        let rslt = [];
        let classInfo = DataObj.classInfo;
        let cli = classInfo[typeCode];
        while (cli) {
            rslt.push(typeCode);
            typeCode = cli.superCode;
            cli = classInfo[typeCode];
        }
        return rslt;
    }
    scheduleUpdate(obj) {
        if (!obj)
            return;
        if (!this.pendingUpdates)
            this.pendingUpdates = {};
        this.pendingUpdates[obj._key] = obj;
        if (!this.pendingUpdateTimerStarted) {
            this.pendingUpdateTimerStarted = null;
            setTimeout(() => {
                let updates = this.pendingUpdates;
                this.pendingUpdates = {};
                let updateList = [];
                for (let key in updates) {
                    let updateObj = updates[key];
                    updateList.push(updateObj);
                }
                this.PUTm(updateList, (err, newObjs) => {
                }, null);
            }, CacheDataSource.updateLatency);
        }
    }
}
CacheDataSource.objLeaseTime = 1000 * 60 * 5;
CacheDataSource.updateLatency = 500;
class CacheObj {
    constructor(obj) {
        this.timeCached = Date.now();
        this.requestInProgress = false;
        this.obj = obj;
    }
    expired() {
        let now = Date.now();
        let time = now - this.timeCached;
        if (time > CacheDataSource.objLeaseTime)
            if (this.requestInProgress) {
                if (time > 2 * CacheDataSource.objLeaseTime) {
                    this.timeCached = now - CacheDataSource.objLeaseTime;
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return true;
            }
        else
            return false;
    }
}
class FindCacheObj extends CacheObj {
    constructor(search, keys) {
        super(null);
        this.search = search;
        this.keys_ = keys;
    }
    setKeys(newKeys) {
        this.keys_ = newKeys;
        this.keyMap = {};
        for (let i in newKeys) {
            let key = newKeys[i];
            this.keyMap[key] = true;
        }
    }
    getKeys() {
        return this.keys_;
    }
    setData(search, keys) {
        this.timeCached = Date.now();
        this.requestInProgress = false;
        this.search = search;
        this.setKeys(keys);
    }
    checkDelete(key) {
        if (this.keyMap[key]) {
            this.keyMap[key] = false;
            this.rebuildKeysFromMap();
        }
    }
    checkForUpdate(obj) {
        let key = obj._key;
        if (key) {
            if (this.keyMap[key]) {
                if (this.search.matches(obj)) {
                    return;
                }
                else {
                    this.keyMap[key] = false;
                    this.rebuildKeysFromMap();
                }
            }
            else {
                if (this.search.matches(obj)) {
                    this.keyMap[key] = true;
                    this.rebuildKeysFromMap();
                }
                else
                    return;
            }
        }
    }
    rebuildKeysFromMap() {
        this.keys_ = [];
        for (let key in this.keyMap) {
            if (this.keyMap[key])
                this.keys_.push(key);
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
        return '';
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
class ZUI {
    constructor() {
    }
    renderJQ() {
        let jq = this.content.renderJQ();
        let classes = this.classStr();
        jq.addClass(classes);
        if (this.css_) {
            jq.attr('style', ZUI.stringVal(this.css_));
        }
        return jq;
    }
    static notify() {
        if (this.notifyCount < 3) {
            this.notifyCount += 1;
            try {
                if (ZUI.pageManager)
                    ZUI.pageManager.notify();
            }
            finally {
                this.notifyCount -= 1;
            }
        }
    }
    css(c) {
        this.css_ = c;
        return this;
    }
    applyCSS(jq) {
        if (this.css_) {
            let css = ZUI.stringVal(this.css_);
            jq.attr("style", css);
        }
    }
    field(f) {
        this.field_ = f;
        return this;
    }
    style(s) {
        this.style_ = s;
        return this;
    }
    hideShow(hs) {
        this.hideShow_ = hs;
        return this;
    }
    hide() {
        if (this.hideShow_ instanceof Function) {
            return this.hideShow_();
        }
        else {
            return this.hideShow_;
        }
    }
    static stringVal(content) {
        let val = "";
        if (content instanceof Function) {
            val = content();
        }
        else {
            val = content;
        }
        if (!val)
            val = "";
        return val;
    }
    static numberVal(content) {
        let val = 0;
        if (content instanceof Function) {
            val = content();
        }
        else {
            val = content;
        }
        return val;
    }
    classStr() {
        let str = "";
        if (this.style_) {
            let classes = ZUI.stringVal(this.style_);
            str = classes + " ";
        }
        else
            str = "";
        if (this.hideShow_) {
            let hs = this.hide();
            if (hs)
                str += " hidden ";
        }
        return str;
    }
    uniqueId() {
        let id = "i" + Math.floor(Math.random() * 1000000);
        return id;
    }
    waiting() {
        return $("<div>Waiting</div>");
    }
    error(msg) {
        return $(`ZUI ERROR ${msg}`);
    }
    static setState(fieldName, newVal) {
        let pm = ZUI.pageManager;
        if (pm) {
            let cp = pm.curPage;
            if (cp) {
                let ps = cp.pageState;
                if (ps)
                    ps[fieldName] = newVal;
            }
        }
    }
    static getState(fieldName) {
        let pm = ZUI.pageManager;
        if (pm) {
            let cp = pm.curPage;
            if (cp) {
                let ps = cp.pageState;
                if (ps)
                    return ps[fieldName];
            }
        }
        return null;
    }
    static getUserKey() {
        return ZUI.pageManager.getUserManager().getUserKey();
    }
}
ZUI.notifyCount = 0;
class TextUI extends ZUI {
    constructor(text) {
        super();
        this.textS = text;
    }
    renderJQ() {
        let val = ZUI.stringVal(this.textS);
        let jq = $(`<div class='TextUI ${this.classStr()}'>${val}</div>`);
        this.applyCSS(jq);
        return jq;
    }
}
class ButtonUI extends ZUI {
    constructor(title) {
        super();
        this.title = title;
    }
    click(onclick) {
        this.onclick = onclick;
        return this;
    }
    enable(enabled) {
        this.enabled = enabled;
        return this;
    }
    renderJQ() {
        let title = ZUI.stringVal(this.title);
        let jq = $(`<button class='ButtonUI ${this.classStr()}' ></button>`);
        if (this.enabled && !this.enabled()) {
            jq.addClass("ButtonUI-disabled");
        }
        jq.html(title);
        if ((!this.enabled || this.enabled()) && this.onclick) {
            jq.click((event) => {
                this.onclick(event);
            });
        }
        this.applyCSS(jq);
        return jq;
    }
}
class InputUI extends ZUI {
    constructor(fieldType) {
        super();
        this.getF_ = null;
        this.setF_ = null;
        this.phF = null;
        this.fieldType = fieldType;
        if (!fieldType)
            this.fieldType = "text";
    }
    getF(getFF) {
        this.getF_ = getFF;
        return this;
    }
    setF(setFF) {
        this.setF_ = setFF;
        return this;
    }
    placeHolder(phF) {
        this.phF = phF;
        return this;
    }
    renderJQ() {
        let val = ZUI.stringVal(this.getF_);
        let ph = ZUI.stringVal(this.phF);
        let jq = $(`<input type='${this.fieldType}' class='InputUI ${this.classStr()}' value='${val}' placeholder='${ph}'/>`);
        jq.click((event) => {
            event.stopImmediatePropagation();
        });
        jq.on("change", (event) => {
            let newVal = jq.val();
            if (this.setF_) {
                this.setF_(newVal);
                jq.val(this.getF_());
            }
        });
        jq.on("paste", (event) => {
            let oe = event.originalEvent;
            let content = oe.clipboardData.getData('text/plain');
            this.setF_(content);
        });
        jq.on('drop', (event) => {
            event.preventDefault();
            let oe = event.originalEvent;
            let data = oe.dataTransfer.getData("Text");
            this.setF_(data);
        });
        this.applyCSS(jq);
        return jq;
    }
}
class TextFieldUI extends InputUI {
    constructor(fieldType) {
        super(fieldType);
        this.getF_ = null;
        this.setF_ = null;
        this.phF = null;
    }
}
class PageManager {
    constructor(dataSource, homePage, pageContentSelector) {
        PageManager.curManager = this;
        this.dataSource = dataSource;
        dataSource.setDataMonitor(this);
        this.homePage = homePage;
        homePage.pageManager = this;
        this.curPage = null;
        this.pageContentSelector = pageContentSelector;
        let windowPath = window.location.pathname;
        window.onpopstate = (ev) => {
            this.doPopState(ev.state);
        };
        this.pageFromURLPath(windowPath);
        this.notify();
    }
    getPageState() {
        return this.curPage.pageState;
    }
    static GETPageState() {
        return PageManager.curManager.curPage.pageState;
    }
    static GOTO(pageName, newState = PageManager.GETPageState()) {
        PageManager.curManager.goto(pageName, newState);
    }
    goto(pageName, newState = this.getPageState()) {
        if (PageManager.curManager && PageManager.curManager.curPage)
            newState.__pageName = pageName;
        let newURL = this.setupNextPage(pageName, newState);
        history.replaceState(newState, null, newURL);
        PageManager.curManager.notify();
    }
    static PUSHTO(pageName, newState = PageManager.GETPageState()) {
        PageManager.curManager.pushto(pageName, newState);
    }
    pushto(pageName, newState = this.getPageState()) {
        if (PageManager.curManager && PageManager.curManager.curPage)
            newState.__pageName = pageName;
        let newURL = this.setupNextPage(pageName, newState);
        history.pushState(newState, null, newURL);
        PageManager.curManager.notify();
    }
    setupNextPage(pageName, newState) {
        let pageF = PageManager.pageMap[pageName];
        if (pageF) {
            let newPage = pageF(newState);
            if (newPage) {
                PageManager.curManager.curPage = newPage;
                newPage.pageManager = this;
            }
            else {
                DB.msg(`page function on ${pageName} returned no page`, newState);
            }
        }
        else {
            DB.msg("no registerd page for " + pageName);
        }
        let root = PageManager.curManager.root;
        let queryStr = PageManager.queryFromState(newState);
        let newURL = root + "/pg/" + pageName + queryStr;
        return newURL;
    }
    static queryFromState(newState) {
        if (typeof newState == "object") {
            let first = true;
            let queryStr = "";
            for (let paramName in newState) {
                if (paramName != "__pageName") {
                    let param = newState[paramName];
                    if (typeof param == "string") {
                        let paramStr = paramName + '=' + param;
                        paramStr = encodeURI(paramStr);
                        if (first) {
                            first = false;
                            queryStr = "?" + paramStr;
                        }
                        else {
                            queryStr += "&" + paramStr;
                        }
                    }
                }
            }
            return queryStr;
        }
        else {
            return "";
        }
    }
    getUserManager() {
        let ds = this.dataSource;
        if (ds) {
            let rm = ds.getRightsManager();
            if (rm) {
                let um = rm.userManager;
                return um;
            }
        }
        return null;
    }
    getUser(done) {
        let um = this.getUserManager();
        if (um) {
            um.getUser(done);
        }
        else {
            done(null);
        }
    }
    getUserKey() {
        let um = this.getUserManager();
        let uk = um.getUserKey();
        return uk;
    }
    notify() {
        let pageContent = $(this.pageContentSelector);
        pageContent.empty();
        if (this.curPage) {
            let newContent = this.curPage.renderJQ();
            pageContent.empty();
            pageContent.append(newContent);
            PageManager.afterDOMNotify();
        }
        else {
            pageContent.html("******************** No Cur Page ***********************");
        }
    }
    static registerPageFactory(pageName, factory) {
        PageManager.pageMap[pageName] = factory;
    }
    doPopState(state) {
        if (!state) {
            let pn = this.homePage.pageName();
            this.setupNextPage(pn, { __pageName: pn });
            PageManager.curManager.notify();
            return;
        }
        if (state.__pageName) {
            this.setupNextPage(state.__pageName, state);
            PageManager.curManager.notify();
        }
    }
    pageFromURLPath(windowPath) {
        let query = window.location.search;
        let newState = this.stateFromQuery(query);
        let parts = windowPath.split("/pg/");
        let pageName = parts[1];
        this.root = parts[0];
        if (this.root.length <= 1)
            this.root = "/client";
        if (!this.getUserKey()) {
            this.curPage = this.homePage;
        }
        else {
            if (pageName.length == 0) {
                this.curPage = this.homePage;
                newState.__pageName = this.homePage.pageName();
            }
            else {
                let newPageF = PageManager.pageMap[pageName];
                if (newPageF) {
                    newState.__pageName = pageName;
                    this.curPage = newPageF(newState);
                }
                else {
                    DB.msg("no such page as " + pageName);
                }
            }
        }
        this.notify();
    }
    stateFromQuery(query) {
        if (query.startsWith('?')) {
            query = query.substr(1, query.length - 1);
        }
        let rslt = {};
        let decQuery = decodeURI(query);
        let qParts = decQuery.split("&");
        for (let i in qParts) {
            let qPart = qParts[i];
            let eqParts = qPart.split("=");
            let name = eqParts[0];
            let val = eqParts[1];
            if (name.length > 0)
                rslt[name] = val;
        }
        return rslt;
    }
    static addAfterDOMNotice(noticeF) {
        if (!PageManager.afterDOMList) {
            PageManager.afterDOMList = [];
        }
        PageManager.afterDOMList.push(noticeF);
    }
    static afterDOMNotify() {
        for (let i in PageManager.afterDOMList) {
            let f = PageManager.afterDOMList[i];
            f();
        }
    }
}
PageManager.pageMap = {};
class Page extends ZUI {
    constructor(pageState) {
        super();
        this.pageState = pageState;
        this.pageManager = null;
    }
    notify() {
        this.pageManager.notify();
    }
    getUserManager() {
        let ds = DataObj.globalSource;
        if (ds) {
            let rm = ds.getRightsManager();
            if (rm) {
                return rm.userManager;
            }
        }
        return null;
    }
    getUserKey() {
        let um = this.getUserManager();
        if (um) {
            return um.getUserKey(null);
        }
        return null;
    }
}
class TabUI extends ZUI {
    constructor() {
        super();
        this.items = [];
        this.selectedTabIdx = 0;
    }
    tab(tabTitle, tabView) {
        let desc = { tabTitle: tabTitle, tabView: tabView, renderTabView: null };
        this.items.push(desc);
        return this;
    }
    renderJQ() {
        let jq = $(`<div class="TabUI ${this.style_}"></div>`);
        let tabBar = this.renderTabBar();
        jq.append(tabBar);
        if (!this.items[this.selectedTabIdx].renderTabView) {
            if (typeof this.items[this.selectedTabIdx].tabView == 'function') {
                let tv = (this.items[this.selectedTabIdx]).tabView();
                this.items[this.selectedTabIdx].renderTabView = tv;
            }
            else {
                this.items[this.selectedTabIdx].renderTabView = this.items[this.selectedTabIdx].tabView;
            }
        }
        let pane = this.items[this.selectedTabIdx].renderTabView.renderJQ();
        jq.append(pane);
        this.applyCSS(jq);
        return jq;
    }
    renderTabBar() {
        let bar = $(`<div class="TabUI-bar ${this.style_}-bar"></div>`);
        for (let i in this.items) {
            let desc = this.items[i];
            let btn = this.renderTabBtn(i, desc);
            bar.append(btn);
        }
        return bar;
    }
    renderTabBtn(i, desc) {
        let btn = $(`<div class="TabUI-btn ${this.style_}-btn">${desc.tabTitle}</div>`);
        if (i == this.selectedTabIdx) {
            btn.addClass("TabUI-selected");
            btn.addClass(`${this.style_}-selected`);
        }
        PageManager.addAfterDOMNotice(() => {
            btn.click(() => {
                if (this.selectedTabIdx != i) {
                    this.selectedTabIdx = i;
                    if (typeof desc.tabView == 'function') {
                        desc.renderTabView = desc.tabView();
                    }
                    else {
                        desc.renderTabView = desc.tabView;
                    }
                    ZUI.notify();
                }
            });
        });
        return btn;
    }
}
class DivUI extends ZUI {
    constructor(items) {
        super();
        this.items = items;
    }
    renderJQ() {
        let items = null;
        if (this.items instanceof Function)
            items = this.items();
        else
            items = this.items;
        let jq = $(`<div class='DivUI ${this.classStr()}'></div>`);
        for (let i in items) {
            let curItem = items[i];
            let itemJQ = curItem.renderJQ();
            jq.append(itemJQ);
        }
        this.applyCSS(jq);
        return jq;
    }
}
class TypeSwitchUI extends ZUI {
    constructor() {
        super();
        this.choices = [];
        this.model = null;
    }
    choice(typeCode, controller) {
        let choice = {
            typeCode: typeCode,
            zui: controller
        };
        this.choices.push(choice);
        return this;
    }
    renderJQ() {
        let jq = $(`<div class='TypeSwitchUI ${this.classStr()}'></div>`);
        if (this.model && this.model instanceof DataObj) {
            let tc = this.model.getTypeCode();
            for (let i in this.choices) {
                let choice = this.choices[i];
                if (choice.typeCode == tc) {
                    let choiceJQ = choice.zui.renderJQ();
                    jq.append(choiceJQ);
                    break;
                }
            }
        }
        this.applyCSS(jq);
        return jq;
    }
}
class OpenCloseUI extends ZUI {
    constructor(headerUI, hideShowUI, initialOpen) {
        super();
        this.headerZ = headerUI;
        this.hideShowFZ = hideShowUI;
        this.hidden = !initialOpen;
        this.hideShowZ = null;
    }
    renderJQ() {
        let containerJQ = $(`<div class='HideShowUI ${this.classStr()}'></div>`);
        this.arrowBoxJQ = this.arrowBox();
        containerJQ.append(this.arrowBoxJQ);
        let headerJQ = $("<div class='HideShowUIHeaderBar'></div>")
            .click(() => { this.openCloseClick(); });
        containerJQ.append(headerJQ);
        if (this.headerZ) {
            let headerZ = this.headerZ.renderJQ();
            headerJQ.append(headerZ);
        }
        if (!this.hideShowJQ) {
            this.hideShowJQ = $(`<div class='HideShowUIContent'></div>`);
        }
        if (!this.hidden && !this.hideShowZ) {
            this.hideShowZ = this.hideShowFZ();
        }
        if (this.hideShowZ) {
            this.hideShowJQ.empty();
            this.hideShowJQ.append(this.hideShowZ.renderJQ());
        }
        containerJQ.append(this.hideShowJQ);
        this.refreshArrow();
        this.applyCSS(containerJQ);
        return containerJQ;
    }
    arrowBox() {
        let box = $("<div class='arrowbox'></div>");
        box.click(() => {
            this.openCloseClick();
        });
        return box;
    }
    openCloseClick() {
        this.hidden = !this.hidden;
        this.refreshArrow();
        ZUI.notify();
    }
    refreshArrow() {
        if (this.hidden) {
            this.arrowBoxJQ.addClass("rightArrowBtn");
            this.arrowBoxJQ.removeClass("downArrowBtn");
            if (this.hideShowJQ)
                this.hideShowJQ.addClass("hidden");
        }
        else {
            this.arrowBoxJQ.removeClass("rightArrowBtn");
            this.arrowBoxJQ.addClass("downArrowBtn");
            if (this.hideShowJQ)
                this.hideShowJQ.removeClass("hidden");
        }
    }
}
class KeyListUI extends DivUI {
    constructor(keyListF) {
        super([]);
        this.keyListF = keyListF;
        this.keyMap = {};
        this.style("KeyListUI");
    }
    itemView(itemViewF) {
        this.itemViewF = itemViewF;
        return this;
    }
    sort(sortF) {
        this.sortF = sortF;
        return this;
    }
    buildKeyViewList() {
        let newKeyMap = {};
        let keyList = this.keyListF();
        if (keyList && this.sortF) {
            keyList.sort(this.sortF);
        }
        this.items = [];
        for (let i in keyList) {
            let key = keyList[i];
            let viewZUI = this.keyMap[key];
            if (!viewZUI) {
                viewZUI = this.itemViewF(key);
            }
            newKeyMap[key] = viewZUI;
            this.items.push(viewZUI);
        }
        this.keyMap = newKeyMap;
    }
    renderJQ() {
        this.buildKeyViewList();
        return super.renderJQ();
    }
}
class Messages extends ZUI {
    constructor() {
        super();
        this.messageList = [];
        Messages.curMessages = this;
    }
    renderJQ() {
        let div = $(`<div class='Messages ${this.classStr()}'></div>`);
        for (let i in this.messageList) {
            let msg = this.messageList[i];
            let msgDiv = this.newMessage(msg);
            div.append(msgDiv);
        }
        this.applyCSS(div);
        return div;
    }
    newMessage(msg) {
        let mDiv = null;
        if (msg.msgType == "error")
            mDiv = $(`<div class='MessageError'>${msg.msg}</div>`);
        else
            mDiv = $(`<div class='MessageInform'>${msg.msg}</div>`);
        return mDiv;
    }
    static error(msg) {
        Messages.curMessages.messageList.push({ msgType: "error", msg: msg });
        ZUI.notify();
    }
    static inform(msg) {
        Messages.curMessages.messageList.push({ msgType: "inform", msg: msg });
        ZUI.notify();
    }
    static clear() {
        Messages.curMessages.messageList = [];
        ZUI.notify();
    }
    static hasMessages() {
        return Messages.curMessages.messageList.length > 0;
    }
}
class SelectUI extends ZUI {
    constructor(selectF) {
        super();
        this.selectF = selectF;
        this.choices = {};
    }
    choice(selectCode, ui) {
        this.choices[selectCode] = ui;
        return this;
    }
    renderJQ() {
        let select = this.selectF();
        let selected = this.choices[select];
        if (selected) {
            if (selected instanceof ZUI)
                return selected.renderJQ();
            else
                return selected().renderJQ();
        }
        else if (this.choices["_default_"]) {
            let sel = this.choices["_default_"];
            if (sel instanceof ZUI)
                return sel.renderJQ();
            else
                return sel().renderJQ();
        }
        else {
            return this.error("Bad selection " + select);
        }
    }
}
class Modal {
    static alert(message) {
        let zui = new TextUI(message);
        Modal.show(zui, {
            "OK": () => { }
        });
    }
    static confirm(message, answer) {
        let zui = new TextUI(message);
        Modal.show(zui, {
            "Yes": () => { answer(true); },
            "No": () => { answer(false); }
        });
    }
    static show(display, actions) {
        let now = Date.now();
        if ((now - this.lastShowMillis) > 1000) {
            this.lastShowMillis = now;
            Modal.saveSelection();
            Modal.saveDisplay = display;
            Modal.actions = actions;
            Modal.notify();
        }
    }
    static notify() {
        if (Modal.saveDisplay) {
            let overlay = $("#modaloverlay");
            overlay.addClass("Modal");
            overlay.empty();
            let contentDiv = Modal.saveDisplay.renderJQ().addClass("Modal-content");
            let actionDiv = this.makeActions(Modal.actions).addClass("Modal-actbar");
            let showBox = $(`<div class="Modal-show"></div>`);
            showBox.append(contentDiv);
            showBox.append(actionDiv);
            overlay.append(showBox);
            overlay.removeClass("hidden");
        }
    }
    static hide() {
        Modal.saveDisplay = null;
        $("#modaloverlay").addClass("hidden");
    }
    static makeActions(actions) {
        let actList = [];
        for (let a in actions) {
            let action = actions[a];
            let btn = this.btnAction(a, action);
            actList.push(btn);
        }
        let actZui = new DivUI(actList).style("Modal-actions");
        return actZui.renderJQ();
    }
    static btnAction(text, action) {
        let bz = new ButtonUI(text).click(() => {
            Modal.lastShowMillis = 0;
            Modal.restoreSelection();
            action();
            Modal.saveDisplay = null;
            $("#modaloverlay").addClass("hidden");
        }).style("Modal-btn");
        return bz;
    }
    static saveSelection() {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                Modal.savedSelection = sel.getRangeAt(0);
            }
        }
    }
    static restoreSelection() {
        if (Modal.savedSelection) {
            if (window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(Modal.savedSelection);
            }
        }
    }
}
Modal.lastShowMillis = 0;
class HTMLEditUI extends ZUI {
    constructor() {
        super();
        this.saveTimerStarted = false;
        this.getF_ = null;
        this.setF_ = null;
        this.isMin = true;
        this.saveStatusBar = new HTMLEditSaveStatusBar();
        this.content = new DivUI([
            this.toolBar(),
            this.saveStatusBar
        ]);
        let divId = "h" + Math.floor(10000000 * Math.random() + 1).toString();
        this.htmlDiv = $(`<div id="${divId}" class="HTMLEditUI-html left col-gn-12" contentEditable="true"></div>`);
        PageManager.addAfterDOMNotice(() => {
            this.htmlDiv.on("blur keyup paste cut", () => {
                this.scheduleSave();
            });
        });
        this.htmlDiv.on("blur keyup paste cut", "#" + divId, () => {
            DB.msg("div changed");
        });
        this.style("HTMLEditUI");
    }
    getF(getFF) {
        this.getF_ = getFF;
        return this;
    }
    setF(setFF) {
        this.setF_ = setFF;
        return this;
    }
    toolBar() {
        let bar = new DivUI([
            new HTMLEditControl(this, "undo", "l"),
            new HTMLEditControl(this, "bold"),
            new HTMLEditControl(this, "italic"),
            new HTMLEditControl(this, "underline"),
            new HTMLEditControl(this, "subscript"),
            new HTMLEditControl(this, "superscript", "r"),
            new HTMLBlockControl(this, "h1", "<b>H1</b>", "l"),
            new HTMLBlockControl(this, "h2", "<b>H2</b>"),
            new HTMLBlockControl(this, "h3", "<b>H3</b>"),
            new HTMLBlockControl(this, "h4", "<b>H4</b>"),
            new HTMLBlockControl(this, "pre", "pre"),
            new HTMLBlockControl(this, "p", "<b>P</b>", "r"),
            new HTMLEditControl(this, "indent", "l"),
            new HTMLEditControl(this, "outdent"),
            new HTMLEditControl(this, "insertUnorderedList", null, "list-ul"),
            new HTMLEditControl(this, "insertOrderedList", "r", "list-ol"),
            new HTMLEditControl(this, "createlink", "l", "link"),
            new HTMLEditControl(this, "unlink"),
            new HTMLImageDropControl(this, "insertimage", "r", "image"),
            new HTMLEditControl(this, "justifyLeft", "l", "align-left"),
            new HTMLEditControl(this, "justifyCenter", null, "align-center"),
            new HTMLEditControl(this, "justifyRight", null, "align-right"),
            new HTMLEditControl(this, "justify", "r", "align-justify"),
        ]).style("HTMLEditUI-tool");
        return bar;
    }
    renderJQ() {
        let div = this.content.renderJQ();
        let newHTML = this.getF_();
        this.htmlDiv.empty();
        this.htmlDiv.html(newHTML);
        div.append(this.htmlDiv);
        this.applyCSS(div);
        return div;
    }
    scheduleSave() {
        this.saveContent = this.htmlDiv.html();
        if (this.saveTimerStarted)
            return;
        this.saveTimerStarted = true;
        this.saveStatusBar.set(this.saveTimerStarted);
        setTimeout(() => {
            this.saveTimerStarted = false;
            this.setF_(this.saveContent);
            this.saveStatusBar.set(this.saveTimerStarted);
        }, 5000);
    }
}
class HTMLEditSaveStatusBar extends ZUI {
    constructor() {
        super();
        this.div = $("<div class='HTMLEditSaveStatusBar left col-gn-2 offset-gn-2'>--</div>");
    }
    set(saveOn) {
        this.div.empty();
        if (saveOn)
            this.div.html("-- save pending --");
        else
            this.div.html("-- saved --");
    }
    renderJQ() {
        return this.div;
    }
}
class HTMLEditControl extends ButtonUI {
    constructor(parent, cmnd, cap, style) {
        super(`<i class='fas fa-${style ? style : cmnd}'></i>`);
        this.click(() => {
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
            if (cmnd == "insertimage" || cmnd == "createlink") {
                let url = prompt("enter url", "http:\/\/");
                if (this.validURL(url))
                    document.execCommand(cmnd, false, url);
                else
                    alert("Invalid URL \"" + url + "\"");
            }
            else {
                document.execCommand(cmnd, false);
            }
            parent.scheduleSave();
        });
        this.parent = parent;
        this.cls = "htc";
        if (cap) {
            this.cls += "-" + cap;
        }
        this.cmnd = cmnd;
        this.st = style;
        if (!style)
            this.st = cmnd;
        this.style(this.cls);
    }
    validURL(url) {
        if (url && (url.search("http:\/\/") == 0 || url.search("https:\/\/") == 0) && url.search("\/\/http") == -1)
            return true;
        else
            return false;
    }
}
class HTMLImageDropControl extends ZUI {
    constructor(parent, cmnd, cap, style) {
        super();
        this.id = this.uniqueId();
        PageManager.addAfterDOMNotice(() => {
            let cnt = $("#" + this.id);
            cnt.on("dragenter dragover dragleave", (e) => {
                e.preventDefault();
                e.stopPropagation();
                cnt.addClass("ImageDropHover");
            });
            cnt.on("dragleave", (e) => {
                e.preventDefault();
                e.stopPropagation();
                cnt.removeClass("ImageDropHover");
            });
            cnt.on("drop", (e) => {
                e.preventDefault();
                e.stopPropagation();
                let oe = (e.originalEvent);
                let files = oe.dataTransfer.files;
                this.processDroppedFiles(files);
            });
        });
        this.parent = parent;
        this.cls = "htc";
        if (cap) {
            this.cls += "-" + cap;
        }
        this.cmnd = cmnd;
        this.st = style;
        if (!style)
            this.st = cmnd;
        this.style(this.cls);
    }
    processDroppedFiles(files) {
        let file = files[0];
        if (file.type.indexOf("image") < 0) {
            Modal.alert(`Dropped file of type ${file.type}. Only image files are allowed`);
        }
        else {
            DataObj.PUTFileBlob(file, (err, blobKey) => {
                let url = HTTPDataSource.urlFromBlobKey(blobKey);
                let alignChoice = "right";
                let width = "50";
                Modal.show(new DivUI([
                    new DropDownChoiceUI()
                        .getF(() => {
                        return alignChoice;
                    })
                        .setF((val) => {
                        alignChoice = val;
                        Modal.notify();
                    })
                        .choice("left", "Left")
                        .choice("right", "Right")
                        .style("ImageModal-align"),
                    new TextUI("width%").style("ImageModal-widthl"),
                    new TextFieldUI("number")
                        .getF(() => { return width; })
                        .setF((val) => {
                        width = val;
                        Modal.notify();
                    }).style("ImageModal-width"),
                    new TextUI(() => {
                        return `<img src="${url}"  width="${width}%" align="${alignChoice}"/>`;
                    }).style("ImageModal-frame"),
                ]), {
                    "Insert": () => {
                        document.execCommand("insertHTML", false, `<img src="${url}"  width="${width}%" align="${alignChoice}"/>`);
                        this.parent.scheduleSave();
                    },
                    "Cancel": () => { }
                });
            });
        }
    }
    renderJQ() {
        let title = `<i class='fas fa-${this.st ? this.st : this.cmnd}'></i><i>Drop here</i>`;
        let jq = $(`<div class="ButtonUI ${this.classStr()}">${title}</div>`);
        jq.attr("id", this.id);
        this.applyCSS(jq);
        return jq;
    }
}
class HTMLBlockControl extends ButtonUI {
    constructor(parent, param, text, cap) {
        super(text);
        this.click(() => {
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
            document.execCommand("formatBlock", false, param);
            this.parent.scheduleSave();
        });
        this.parent = parent;
        this.cls = "htc";
        if (cap) {
            this.cls += "-" + cap;
        }
        this.style(this.cls);
    }
}
class ClickWrapperUI extends DivUI {
    constructor(items) {
        super(items);
        this.id = this.uniqueId();
        PageManager.addAfterDOMNotice(() => {
            if (this.onclick)
                $("#" + this.id).click(this.onclick);
        });
    }
    click(onclick) {
        this.onclick = onclick;
        return this;
    }
    renderJQ() {
        let jq = super.renderJQ();
        jq.attr("id", this.id);
        this.applyCSS(jq);
        return jq;
    }
}
class BreakUI extends ZUI {
    constructor(text) {
        super();
        this.textS = text;
        if (!text)
            this.textS = "";
    }
    renderJQ() {
        let val = ZUI.stringVal(this.textS);
        if (!val || val.length == 0) {
            val = "BreakUI";
        }
        let jq = $(`<div class='BreakUI ${this.classStr()}'>${val}</div>`);
        this.applyCSS(jq);
        return jq;
    }
}
class ObjListUI extends DivUI {
    constructor(objListF) {
        super([]);
        this.objListF = objListF;
        this.objMap = [];
        this.style("ObjListUI");
    }
    itemView(itemViewF) {
        this.itemViewF = itemViewF;
        return this;
    }
    sort(sortF) {
        this.sortF = sortF;
        return this;
    }
    buildKeyViewList() {
        let newObjMap = [];
        let objList = this.objListF();
        if (this.sort) {
            objList.sort(this.sortF);
        }
        this.items = [];
        for (let i in objList) {
            let obj = objList[i];
            let viewZUI = this.findZUI(obj);
            if (!viewZUI) {
                viewZUI = this.itemViewF(obj);
            }
            newObjMap.push({ obj: obj, zui: viewZUI });
            this.items.push(viewZUI);
        }
        this.objMap = newObjMap;
    }
    findZUI(obj) {
        for (let i in this.objMap) {
            let map = this.objMap[i];
            if (map.obj === obj) {
                return map.zui;
            }
        }
        return null;
    }
    renderJQ() {
        this.buildKeyViewList();
        return super.renderJQ();
    }
}
class FileDropTargetUI extends ZUI {
    constructor(content) {
        super();
        this.content = content;
        this.hoverStyle_ = "FileDropTargetUI-drop";
        this.id = this.uniqueId();
        PageManager.addAfterDOMNotice(() => {
            let cnt = $("#" + this.id);
            cnt.on("dragenter dragover dragleave", (e) => {
                e.preventDefault();
                e.stopPropagation();
                cnt.addClass(this.hoverStyle_);
            });
            cnt.on("dragleave", (e) => {
                e.preventDefault();
                e.stopPropagation();
                cnt.removeClass(this.hoverStyle_);
            });
            cnt.on("drop", (e) => {
                e.preventDefault();
                e.stopPropagation();
                let oe = (e.originalEvent);
                let files = oe.dataTransfer.files;
                if (this.onDrop) {
                    this.onDrop(files);
                }
            });
        });
    }
    drop(onDrop) {
        this.onDrop = onDrop;
        return this;
    }
    hoverStyle(hStyle) {
        this.hoverStyle_ = hStyle;
        return this;
    }
    renderJQ() {
        let jq = super.renderJQ();
        jq.attr("id", this.id);
        this.applyCSS(jq);
        return jq;
    }
}
class IconButtonUI extends ZUI {
    constructor(iconName, url) {
        super();
        this.iconName = iconName;
        this.url = url;
        this.onclick = onclick;
    }
    click(onclick) {
        this.onclick = onclick;
        return this;
    }
    selected(selectedF) {
        this.selected_ = selectedF;
        return this;
    }
    getIconName() {
        return this.iconName;
    }
    renderJQ() {
        this.jq = $(`<button class="IconButtonUI ${this.classStr()}"></button>`);
        this.jq.html(`<img src="${this.url}"/>`);
        if (this.selected_ && this.selected_())
            this.jq.addClass("IconButtonUI-selected");
        else
            this.jq.removeClass("IconButtonUI-selected");
        this.jq.click((event) => { this.onclick(event); });
        this.applyCSS(this.jq);
        return this.jq;
    }
}
class ColorPickerUI extends ZUI {
    constructor() {
        super();
        this.getF_ = null;
        this.setF_ = null;
    }
    getF(getFF) {
        this.getF_ = getFF;
        return this;
    }
    setF(setFF) {
        this.setF_ = setFF;
        return this;
    }
    renderJQ() {
        let val = ZUI.stringVal(this.getF_);
        if (val == "none")
            val = "#FFFFFF";
        let jq = $(`<input type='color' class='ColorPickerUI ${this.classStr()}' value='${val}'/>`);
        jq.on("change", (event) => {
            let newVal = jq.val();
            if (this.setF_) {
                this.setF_(newVal);
            }
        });
        this.applyCSS(jq);
        return jq;
    }
}
class SliderUI extends ZUI {
    constructor(min, max) {
        super();
        this.getF_ = null;
        this.setF_ = null;
        this.minF_ = min;
        this.maxF_ = max;
    }
    getF(getFF) {
        this.getF_ = getFF;
        return this;
    }
    setF(setFF) {
        this.setF_ = setFF;
        return this;
    }
    renderJQ() {
        let val = ZUI.numberVal(this.getF_);
        let jq = $(`<input type='range' class='SliderUI ${this.classStr()}' value='${val}'` +
            ` min='${ZUI.numberVal(this.minF_)}' max='${ZUI.numberVal(this.maxF_)}'/>`);
        jq.on("change", (event) => {
            let newVal = Number.parseFloat(jq.val());
            if (this.setF_) {
                this.setF_(newVal);
            }
        });
        this.applyCSS(jq);
        return jq;
    }
}
class StyleCheckUI extends ZUI {
    constructor(checkVal) {
        super();
        this.checkVal = checkVal;
        this.checkedStyle_ = "StyleCheckUI-checked";
        this.clickF = null;
    }
    click(clickF) {
        this.clickF = clickF;
        return this;
    }
    checkedStyle(checkedStyle) {
        this.checkedStyle_ = checkedStyle;
        return this;
    }
    renderJQ() {
        let checked = this.checkVal();
        let cStyle = "StyleCheckUI-checked " + this.checkedStyle_;
        if (!checked)
            if (this.classStr())
                cStyle = "StyleCheckUI " + this.classStr();
            else
                cStyle = "StyleCheckUI";
        let jq = $(`<div class='${cStyle}'></div>`);
        jq.click(() => {
            if (this.clickF) {
                this.clickF();
                ZUI.notify();
            }
        });
        this.applyCSS(jq);
        return jq;
    }
}
class DoneIndicatorUI extends ZUI {
    constructor(getF) {
        super();
        this.getF_ = getF;
        this.barStyle_ = "";
        this.clickF = null;
    }
    barStyle(barStyle_) {
        this.barStyle_ = barStyle_;
        return this;
    }
    click(clickF) {
        this.clickF = clickF;
        return this;
    }
    renderJQ() {
        let fraction = this.getF_();
        if (fraction < 0)
            fraction = 0;
        if (fraction > 1)
            fraction = 1;
        if (fraction > 0 && fraction < 0.05)
            fraction = 0.05;
        if (fraction < 1 && fraction > 0.95)
            fraction = 0.95;
        let style = "DoneIndicatorUI";
        if (this.clickF)
            style = "DoneIndicatorUI-clickable";
        let jq = $(`<div class='${style} ${this.classStr()}'></div>`);
        let slider = $(`<div class='DoneIndicatorUI-slider ${this.barStyle_}'></div>`);
        slider.css("width", `${fraction * 100}%`);
        jq.append(slider);
        jq.click(() => {
            if (this.clickF) {
                this.clickF();
                ZUI.notify();
            }
        });
        this.applyCSS(jq);
        return jq;
    }
}
class DropDownChoiceUI extends ZUI {
    constructor() {
        super();
        this.choices = [];
    }
    getF(f) {
        this.getF_ = f;
        return this;
    }
    setF(f) {
        this.setF_ = f;
        return this;
    }
    choice(selectCode, label) {
        this.choices.push({ selectCode: selectCode, label: label });
        return this;
    }
    renderJQ() {
        let select = null;
        if (this.getF_) {
            select = this.getF_();
        }
        let base = $(`<select class="DropDownChoiceUI ${this.classStr()}"></select>`);
        for (let i in this.choices) {
            let choice = this.choices[i];
            let cJQ = null;
            if (choice.selectCode == select) {
                cJQ = $(`<option value="${choice.selectCode}" selected>${choice.label}</option>`);
            }
            else {
                cJQ = $(`<option value="${choice.selectCode}">${choice.label}</option>`);
            }
            base.append(cJQ);
        }
        base.change(() => {
            if (this.setF_) {
                this.setF_(base.val());
            }
        });
        this.applyCSS(base);
        return base;
    }
}
class DateTimeUI extends InputUI {
    constructor(fieldType) {
        super(fieldType);
    }
}
class DragDropWrapperUI extends ZUI {
    constructor(content) {
        super();
        this.content = content;
        this.id = this.uniqueId();
        this.hoverStyle = "DragDropWrapperUI-hover";
        this.hoverHighStyle = "";
        this.hoverLowStyle = "";
        PageManager.addAfterDOMNotice(() => {
            let cnt = $("#" + this.id);
            cnt.on("dragenter", (e) => {
                this.dragEnter(e);
            });
            cnt.on("dragover", (e) => {
                this.dragOver(e);
            });
            cnt.on("dragleave", (e) => {
                this.dragLeave(e);
            });
            cnt.on("drop", (e) => {
                this.dropEvent(e);
            });
            cnt.on("dragstart", (e) => {
                this.dragStart(e);
            });
        });
    }
    dragEnter(e) {
    }
    dragOver(e) {
        if (this.id == $(e.currentTarget).attr("id")) {
            e.preventDefault();
            let jq = $(e.currentTarget);
            let height = jq[0].offsetHeight;
            jq.removeClass(this.hoverHighStyle);
            jq.removeClass(this.hoverLowStyle);
            jq.removeClass(this.hoverStyle);
            if (this.doDrop) {
                jq.addClass(this.hoverStyle);
                let y = e.offsetY;
                if (this.hoverLowStyle && y > height * 0.5) {
                    jq.addClass(this.hoverLowStyle);
                }
                if (this.hoverHighStyle && y <= height * 0.5) {
                    jq.addClass(this.hoverHighStyle);
                }
            }
        }
    }
    eventPayload(event) {
        let payloadST = event.originalEvent.dataTransfer.getData("zingpayload");
        if (payloadST) {
            let payload = JSON.parse(payloadST);
            return payload;
        }
        else {
            return null;
        }
    }
    dragLeave(e) {
        let jq = $(e.currentTarget);
        jq.removeClass(this.hoverHighStyle);
        jq.removeClass(this.hoverLowStyle);
        jq.removeClass(this.hoverStyle);
    }
    dropEvent(e) {
        let jq = $(e.currentTarget);
        jq.removeClass(this.hoverHighStyle);
        jq.removeClass(this.hoverLowStyle);
        jq.removeClass(this.hoverStyle);
        if (this.doDrop) {
            let payload = this.eventPayload(e);
            if (payload) {
                let height = jq[0].offsetHeight;
                let y = e.offsetY;
                let where = null;
                if (y <= height * 0.5) {
                    where = "high";
                }
                if (y > height * 0.5) {
                    where = "low";
                }
                this.doDrop(payload, where);
            }
        }
    }
    dragStart(e) {
        if (this.id == $(e.currentTarget).attr("id")) {
            let payload = this.getPayload();
            e.originalEvent.dataTransfer.setData("zingpayload", payload);
        }
    }
    hover(hvStyle) {
        this.hoverStyle = hvStyle;
        return this;
    }
    high(hStyle) {
        this.hoverHighStyle = hStyle;
        return this;
    }
    low(hStyle) {
        this.hoverLowStyle = hStyle;
        return this;
    }
    getPayload() {
        let rslt = null;
        if (this.payload && typeof this.payload === "function") {
            rslt = this.payload();
        }
        else {
            rslt = this.payload;
        }
        return JSON.stringify(rslt);
    }
    dragPayload(payload) {
        this.payload = payload;
        return this;
    }
    drop(doDrop) {
        this.doDrop = doDrop;
        return this;
    }
    renderJQ() {
        let jq = super.renderJQ();
        jq.attr("id", this.id);
        this.applyCSS(jq);
        if (this.payload) {
            jq.attr("draggable", "true");
        }
        return jq;
    }
}
class ImageUI extends ZUI {
    constructor(urlSource) {
        super();
        this.urlSource = urlSource;
    }
    url() {
        let sc = this.urlSource;
        if (typeof sc == "function") {
            sc = sc();
        }
        if (sc instanceof Array) {
            let r = Math.random();
            let l = sc.length;
            r = Math.floor(r * l);
            if (r >= l)
                r = l - 1;
            sc = sc[r];
        }
        return sc;
    }
    renderJQ() {
        let url = this.url();
        let jq = $(`<img src="${url}" class="ImageUI ${this.classStr()}"/>`);
        this.applyCSS(jq);
        return jq;
    }
}
class ProcessLogUI extends ZUI {
    constructor() {
        super();
        this.clear();
    }
    timing(timeOn = true) {
        this.timingOn = timeOn;
        return this;
    }
    clear() {
        this.log = "";
        this.indent = 0;
        this.startTimeStack = [];
        this.lastOverWrite = false;
    }
    msg(msg) {
        this.lastOverWrite = false;
        let theOut = "";
        for (let i = 0; i < this.indent; i++) {
            theOut += "  ";
        }
        theOut += msg;
        if (this.timingOn) {
            let date = new Date();
            let secs = date.getSeconds();
            let secStr = secs.toFixed(0);
            if (secStr.length < 2)
                secStr = "0" + secStr;
            theOut = `[${date.getMinutes()}:${secStr}] ` + theOut;
        }
        this.log = theOut + "\n" + this.log;
        ZUI.notify();
    }
    overWrite(msg) {
        if (this.lastOverWrite) {
            let idx = this.log.indexOf("\n");
            this.log = this.log.substring(idx + 1);
            this.msg(msg);
        }
        else {
            this.lastOverWrite = true;
            this.msg(msg);
        }
        this.lastOverWrite = true;
    }
    start(msg) {
        this.msg("&gt;" + msg);
        this.indent++;
        let now = Date.now();
        this.startTimeStack.push(now);
    }
    end(msg) {
        if (this.timingOn) {
            let now = Date.now();
            let start = this.startTimeStack.pop();
            let sec = (now - start) / 1000;
            msg += ` [${sec.toFixed(2)}sec]`;
        }
        this.indent--;
        this.msg("&lt;" + msg);
    }
    renderJQ() {
        let jq = $(`<div class="ProcessLogUI ${this.classStr()}"></div>`);
        if (this.log && this.log.length > 0) {
            let btns = $(`<div style="float:right"></div>`);
            let clearBtn = $(`<button>clear</button>`);
            clearBtn.click(() => {
                this.clear();
                ZUI.notify();
            });
            btns.append(clearBtn);
            jq.append(btns);
        }
        let log = $(`<pre class="ProcessLogUI-log"></pre>`);
        jq.append(log);
        log.html(this.log);
        this.applyCSS(jq);
        log.scrollTop(50);
        return jq;
    }
}
class DataTableUIAbs extends ZUI {
    constructor(maxRows = 20, maxColumns = 10, cellEnter) {
        super();
        this.maxRows = maxRows;
        this.maxColumns = maxColumns;
        this.cellEnter = cellEnter;
    }
    setMaxes(maxRows, maxColumns) {
        this.maxRows = maxRows;
        this.maxColumns = maxColumns;
        ZUI.notify();
    }
    setFirstCol(firstCol) {
        this.firstCol = firstCol;
        ZUI.notify();
    }
    setFirstRow(firstRow) {
        this.firstRow = firstRow;
        ZUI.notify();
    }
    tableStyle() { return "DataTableUI-table " + this.classStr(); }
    ;
    renderJQ() {
        let table = $(`<table class="${this.tableStyle()}"></table>`);
        let colHeaderList = this.colHeaderList();
        let rowLabelList = this.rowLabelList();
        if (this.hasData()) {
            this.resolveRowsCols(rowLabelList.length, colHeaderList.length);
            let colHeaders = this.columnHeaderRow(colHeaderList);
            table.append(colHeaders);
            if (this.firstRow > 0)
                table.append(this.upRow());
            for (let row = this.firstRow; row <= this.lastRow; row++) {
                let rowData = this.rowData(row, this.firstCol, this.lastCol);
                let tableRow = this.tableRow(row, rowLabelList[row], rowData);
                table.append(tableRow);
            }
            if (this.lastRow < this.nRows - 1)
                table.append(this.downRow());
        }
        this.applyCSS(table);
        return table;
    }
    columnHeaderRow(colHeaderList) {
        let rowJQ = $(`<tr><th></th></tr>`);
        if (this.firstCol > 0)
            rowJQ.append(this.leftBtn());
        for (let col = this.firstCol; col <= this.lastCol; col++) {
            let header = colHeaderList[col];
            let colJQ = $(`<th>${header}</th>`);
            rowJQ.append(colJQ);
        }
        if (this.lastCol < this.nCols - 1)
            rowJQ.append(this.rightBtn());
        return rowJQ;
    }
    tableRow(rowIdx, rowLabel, rowData) {
        let row = $(`<tr><th>${rowLabel}</th></tr>`);
        if (this.firstCol > 0)
            row.append(this.ellipsis());
        for (let colIdx = 0; colIdx < rowData.length; colIdx++) {
            let d = rowData[colIdx];
            let ds = "";
            if (d)
                ds = d.toString();
            else if (d == 0)
                ds = "0";
            let td = $(`<td>${ds}</td>`);
            td.mouseenter(() => {
                if (this.cellEnter)
                    this.cellEnter(rowIdx, colIdx);
            });
            td.append(td);
            row.append(td);
        }
        if (this.lastCol < this.nCols - 1)
            row.append(this.ellipsis());
        return row;
    }
    leftBtn() {
        let jq = $(`<th class="leftArrowBtn"></th>`);
        jq.click(() => {
            this.firstCol -= this.colInc;
            ZUI.notify();
        });
        return jq;
    }
    rightBtn() {
        let jq = $(`<th class="rightArrowBtn"></th>`);
        jq.click(() => {
            this.firstCol += this.colInc;
            ZUI.notify();
        });
        return jq;
    }
    upRow() {
        let row = $(`<tr></tr>`);
        row.append(this.upBtn());
        if (this.firstCol > 0)
            row.append($(`<td></td>`));
        for (let col = this.firstCol; col <= this.lastCol; col++) {
            row.append(this.ellipsis());
        }
        return row;
    }
    upBtn() {
        let jq = $(`<th class="upArrowBtn"></th>`);
        jq.click(() => {
            this.firstRow -= this.rowInc;
            ZUI.notify();
        });
        return jq;
    }
    downRow() {
        let row = $(`<tr></tr>`);
        row.append(this.downBtn());
        if (this.firstCol > 0)
            row.append($(`<td></td>`));
        for (let col = this.firstCol; col <= this.lastCol; col++) {
            row.append(this.ellipsis());
        }
        return row;
    }
    downBtn() {
        let jq = $(`<th class="downArrowBtn"></th>`);
        jq.click(() => {
            this.firstRow += this.rowInc;
            ZUI.notify();
        });
        return jq;
    }
    ellipsis() {
        let jq = $(`<td class="DataTableUI-ell">...</td>`);
        return jq;
    }
    resolveRowsCols(nRows, nCols) {
        this.nRows = nRows;
        this.nCols = nCols;
        this.rowInc = Math.floor(this.maxRows * 0.8);
        this.colInc = Math.floor(this.maxColumns * 0.8);
        if (this.firstRow < 0)
            this.firstRow = 0;
        this.lastRow = this.firstRow + this.maxRows - 1;
        if (this.lastRow >= nRows) {
            this.lastRow = nRows - 1;
            this.firstRow = this.lastRow - this.maxRows + 1;
            if (this.firstRow < 0)
                this.firstRow = 0;
        }
        if (this.firstCol < 0)
            this.firstCol = 0;
        this.lastCol = this.firstCol + this.maxColumns - 1;
        if (this.lastCol >= nCols) {
            this.lastCol = nCols - 1;
            this.firstCol = this.lastCol - this.maxColumns + 1;
            if (this.firstCol < 0)
                this.firstCol = 0;
        }
    }
}
class DataTableAbs {
    toJSON() {
        let rslt = [];
        let nr = this.nRows();
        let ch = this.columnHeaders();
        for (let r = 0; r < nr; r++) {
            let obj = {};
            for (let c in ch) {
                let v = this.get(r, c);
                if (v || v == 0) {
                    obj[c] = v;
                }
            }
            rslt.push(obj);
        }
        return rslt;
    }
    getRow(row) {
        if (row < 0 || row >= this.nRows())
            return null;
        let dr = new DataRow();
        for (let c of this.columnHeaders())
            dr.set(c, this.get(row, c));
        return dr;
    }
    getColumn(col) {
        let rslt = new DataColumn(col);
        let nRows = this.nRows();
        for (let row = 0; row < nRows; row++) {
            rslt.set(row, this.get(row, col));
        }
        return rslt;
    }
    copy() {
        let rslt = new DataTable();
        let nRows = this.nRows();
        let ch = this.columnHeaders();
        for (let row = 0; row < nRows; row++) {
            for (let col of ch) {
                let v = this.get(row, col);
                rslt.set(row, col, v);
            }
        }
        return rslt;
    }
    toCSVStr() {
        let headStr = this.toCSVHead();
        let rslt = headStr;
        for (let r = 0; r < this.nRows(); r++) {
            let rowStr = this.toCSVRow(r);
            rslt += "\n" + rowStr;
        }
        return rslt;
    }
    toCSVHead() {
        let ch = this.columnHeaders();
        let rslt = ch[0];
        for (let c = 1; c < ch.length; c++) {
            rslt += "," + ch[c];
        }
        return rslt;
    }
    toCSVRow(r) {
        let ch = this.columnHeaders();
        let rslt = "";
        for (let col of ch) {
            let val = this.get(r, col);
            if (rslt.length == 0) {
                rslt += val;
            }
            else {
                rslt += "," + val;
            }
        }
        return rslt;
    }
    valueDensity() {
        DB.start("valueDensity");
        let nFeatures = this.nCols() * this.nRows();
        let nFound = 0;
        let ch = this.columnHeaders();
        for (let r = 0; r < this.nRows(); r++) {
            for (let c in ch) {
                let val = this.get(r, c);
                if (val !== undefined) {
                    nFound++;
                }
            }
        }
        DB.end(`valueDensity ${nFound}/${nFeatures} ${nFound / nFeatures * 100}%`);
        return nFound / nFeatures;
    }
    columnDensityCount(density) {
        let ch = this.columnHeaders();
        let denseColCount = 0;
        for (let col of ch) {
            let cnt = 0;
            for (let r = 0; r < this.nRows(); r++) {
                let v = this.get(r, col);
                if (v)
                    cnt++;
            }
            let colDense = cnt / this.nRows();
            if (colDense > density) {
                denseColCount++;
            }
        }
        DB.msg(`has ${denseColCount}/${this.nCols()} with feature density>${density}`);
    }
    sum() {
        let total = 0;
        let nRows = this.nRows();
        let ch = this.columnHeaders();
        for (let r = 0; r < nRows; r++) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (!isNaN(v))
                    total += v;
            }
        }
        return total;
    }
    count() {
        let total = 0;
        let nRows = this.nRows();
        let ch = this.columnHeaders();
        for (let r = 0; r < nRows; r++) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (v || v == 0)
                    total++;
            }
        }
        return total;
    }
    countNumbers() {
        let total = 0;
        let nRows = this.nRows();
        let ch = this.columnHeaders();
        for (let r = 0; r < nRows; r++) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (!isNaN(v))
                    total++;
            }
        }
        return total;
    }
    max() {
        let foundNum = false;
        let max = 0;
        ;
        let nRows = this.nRows();
        let ch = this.columnHeaders();
        for (let r = 0; r < nRows; r++) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (!isNaN(v)) {
                    if (!foundNum) {
                        max = v;
                        foundNum = true;
                    }
                    if (v > max) {
                        max = v;
                    }
                }
            }
        }
        return max;
    }
    min() {
        let foundNum = false;
        let min = 0;
        let nRows = this.nRows();
        let ch = this.columnHeaders();
        for (let r = 0; r < nRows; r++) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (!isNaN(v)) {
                    if (!foundNum) {
                        min = v;
                        foundNum = true;
                    }
                    if (v < min) {
                        min = v;
                    }
                }
            }
        }
        return min;
    }
    db(msg, maxColumns = 5, maxRows = 20) {
        if (msg)
            DB.start(msg);
        DB.msg(`(${this.nRows()}x${this.nCols()})`);
        let rowEll = false;
        let colEll = false;
        let cols = this.nCols();
        if (cols > maxColumns) {
            colEll = true;
            cols = maxColumns;
        }
        let rows = this.nRows();
        if (rows > maxRows) {
            rowEll = true;
            rows = maxRows;
        }
        let headerStr = "\t";
        let ch = this.columnHeaders();
        for (let c = 0; c < cols; c++) {
            let col = ch[c];
            headerStr += col + "\t";
        }
        if (colEll)
            headerStr += "...";
        DB.msg(headerStr);
        for (let r = 0; r < rows; r++) {
            let rowStr = `[${r}]:\t`;
            for (let c of ch) {
                let val = this.get(r, c);
                if (typeof val == "string") {
                    rowStr += '"' + val + '"\t';
                }
                else {
                    rowStr += val + "\t";
                }
            }
            if (colEll)
                rowStr += "...";
            DB.msg(rowStr);
        }
        if (rowEll)
            DB.msg("...");
        if (msg)
            DB.end(msg);
    }
}
class DataRowAbs {
    toJSON() {
        let rslt = {};
        for (let c in this.columnHeaders()) {
            let val = this.get(c);
            if (val || val == 0) {
                rslt[c] = val;
            }
        }
        return rslt;
    }
    copy() {
        let newDR = new DataRow();
        for (let colName of this.columnHeaders()) {
            newDR.set(colName, this.get(colName));
        }
        return newDR;
    }
    sum() {
        let total = 0;
        for (let col of this.columnHeaders()) {
            let v = this.get(col);
            if (!isNaN(v))
                total += v;
        }
        return total;
    }
    sumSquares() {
        let total = 0;
        for (let col of this.columnHeaders()) {
            let v = this.get(col);
            if (!isNaN(v))
                total += v * v;
        }
        return total;
    }
    pairProduct(row2) {
        let rslt = new DataRow();
        let nc = this.nCols();
        for (let col of this.columnHeaders()) {
            let v1 = this.get(col);
            let v2 = row2.get(col);
            if (isNaN(v1) || isNaN(v2)) {
                rslt.set(col, 0);
            }
            else {
                rslt.set(col, v1 * v2);
            }
        }
        return rslt;
    }
    dotProduct(row2) {
        let rslt = 0;
        let nc = this.nCols();
        for (let col of this.columnHeaders()) {
            let v1 = this.get(col);
            let v2 = row2.get(col);
            if (!isNaN(v1) && !isNaN(v2)) {
                rslt += v1 * v2;
            }
        }
        return rslt;
    }
    count() {
        let total = 0;
        for (let c of this.columnHeaders()) {
            let v = this.get(c);
            if (v || v == 0)
                total++;
        }
        return total;
    }
    countNumbers() {
        let total = 0;
        for (let c of this.columnHeaders()) {
            let v = this.get(c);
            if (!isNaN(v))
                total++;
        }
        return total;
    }
    max() {
        let ch = this.columnHeaders();
        let max = this.get(ch[0]);
        for (let c of ch) {
            let v = this.get(c);
            if (!isNaN(v)) {
                if (v > max) {
                    max = v;
                }
            }
        }
        return max;
    }
    min() {
        let ch = this.columnHeaders();
        let min = this.get(ch[0]);
        for (let c of ch) {
            let v = this.get(c);
            if (!isNaN(v)) {
                if (v < min) {
                    min = v;
                }
            }
        }
        return min;
    }
    subSet(startIdx, endIdx) {
        let rslt = new DataRow();
        if (startIdx > endIdx) {
            let tmp = startIdx;
            startIdx = endIdx;
            endIdx = tmp;
        }
        let ch = this.columnHeaders();
        for (let i = startIdx; i <= endIdx; i++) {
            let colName = ch[i];
            let v = this.get(colName);
            rslt.set(colName, v);
        }
        return rslt;
    }
    db(msg, maxColumns = 20) {
        if (msg)
            DB.start(msg);
        let cols = this.nCols();
        let ellipses = false;
        if (cols > maxColumns) {
            cols = maxColumns;
            ellipses = true;
        }
        let ch = this.columnHeaders();
        for (let c = 0; c < cols; c++) {
            let col = ch[c];
            let val = this.get(col);
            if (isNaN(val))
                DB.msg(`[${col}]:"${val}"`);
            else
                DB.msg(`[${col}]:${val}`);
        }
        if (ellipses)
            DB.msg("...");
        if (msg)
            DB.end(msg);
    }
}
class DataRow extends DataRowAbs {
    constructor(headerIdxs, contents) {
        super();
        this.columnHeaderIdxs = {};
        if (headerIdxs)
            for (let col in headerIdxs) {
                this.columnHeaderIdxs[col] = headerIdxs[col];
            }
        this.contents = [];
        if (contents) {
            for (let i in contents) {
                this.contents.push(contents[i]);
            }
        }
    }
    hasCol(colName) {
        return colName in this.columnHeaderIdxs;
    }
    colIdx(colName) {
        if (this.hasCol(colName))
            return this.columnHeaderIdxs[colName];
        else
            return undefined;
    }
    colName(colIndex) {
        if (colIndex < 0 || colIndex >= this.nCols())
            return null;
        return this.orderedColumnHeaders[colIndex];
    }
    columnHeaders() {
        if (!this.orderedColumnHeaders) {
            this.rebuildOrderedColumnHeaders();
        }
        return this.orderedColumnHeaders;
    }
    rebuildOrderedColumnHeaders() {
        this.orderedColumnHeaders = new Array(this.nCols());
        for (let col in this.columnHeaderIdxs) {
            let idx = this.columnHeaderIdxs[col];
            this.orderedColumnHeaders[idx] = col;
        }
    }
    nCols() {
        return this.contents.length;
    }
    getI(col) {
        if (col < 0 || col >= this.contents.length)
            return 0;
        return this.contents[col];
    }
    setI(col, newVal) {
        while (col > this.contents.length - 1) {
            this.contents.push(0);
        }
        this.contents[col] = newVal;
    }
    get(col) {
        let colIdx = this.columnHeaderIdxs[col];
        if (!colIdx && colIdx != 0) {
            return 0;
        }
        return this.getI(colIdx);
    }
    set(col, newVal) {
        let colIdx = this.columnHeaderIdxs[col];
        if (isNaN(colIdx)) {
            colIdx = this.nCols();
            this.columnHeaderIdxs[col] = colIdx;
            if (this.orderedColumnHeaders)
                this.orderedColumnHeaders.push(col);
            else
                this.rebuildOrderedColumnHeaders();
        }
        this.setI(colIdx, newVal);
    }
    addTo(col, newVal) {
        let oldVal = this.get(col);
        if (isNaN(oldVal)) {
            this.set(col, newVal);
        }
        else {
            this.set(col, oldVal + newVal);
        }
    }
    static fromJSON(json) {
        let rslt = new DataRow();
        for (let c in json) {
            rslt.set(c, json[c]);
        }
        return rslt;
    }
    scalerMult(scaler) {
        for (let c in this.contents) {
            if (!isNaN(this.contents[c])) {
                this.contents[c] *= scaler;
            }
        }
    }
    renameColumns(newNames) {
        for (let oldName in newNames) {
            let newName = newNames[oldName];
            if (oldName in this.columnHeaderIdxs) {
                let idx = this.columnHeaderIdxs[oldName];
                delete this.columnHeaderIdxs[oldName];
                this.columnHeaderIdxs[newName] = idx;
            }
            else {
                DB.msg("DataRow.renameColumns no such column named " + oldName);
            }
        }
        this.rebuildOrderedColumnHeaders();
    }
    sort(descending = false) {
        let sortList = [];
        for (let col in this.columnHeaderIdxs) {
            sortList.push({ val: this.get(col), col: col });
        }
        sortList.sort((a, b) => {
            let r = 0;
            if (typeof a.val === "string") {
                r = a.val.localeCompare(b.val);
            }
            else {
                r = a.val - b.val;
            }
            if (descending)
                r = -r;
            return r;
        });
        this.contents = [];
        this.columnHeaderIdxs = {};
        for (let i = 0; i < sortList.length; i++) {
            let sl = sortList[i];
            this.set(sl.col, sl.val);
        }
        this.rebuildOrderedColumnHeaders();
    }
}
class DataColumnAbs {
    constructor(columnName) {
        this.columnName = columnName;
    }
    name() { return this.columnName; }
    toJSON() {
        let rslt = [];
        let nRows = this.nValues();
        for (let r = 0; r < nRows; r++) {
            rslt.push(this.get(r));
        }
        return rslt;
    }
    copy() {
        let newDC = new DataColumn(this.name());
        let nRows = this.nValues();
        for (let row = 0; row < nRows; row++) {
            newDC.set(row, this.get(row));
        }
        return newDC;
    }
    sum() {
        let total = 0;
        let nRows = this.nValues();
        for (let r = 0; r < nRows; r++) {
            let v = this.get(r);
            if (!isNaN(v))
                total += v;
        }
        return total;
    }
    sumSquares() {
        let total = 0;
        let nRows = this.nValues();
        for (let r = 0; r < nRows; r++) {
            let v = this.get(r);
            if (!isNaN(v))
                total += v * v;
        }
        return total;
    }
    pairProduct(col2) {
        let rslt = new DataColumn(this.columnName + "*" + col2.columnName);
        let nr = this.nValues();
        for (let r = 0; r < nr; r++) {
            let v1 = this.get(r);
            let v2 = col2.get(r);
            if (isNaN(v1) || isNaN(v2)) {
                rslt.set(r, 0);
            }
            else {
                rslt.set(r, v1 * v2);
            }
        }
        return rslt;
    }
    dotProduct(col2) {
        let rslt = 0;
        let nr = this.nValues();
        for (let r = 0; r < nr; r++) {
            let v1 = this.get(r);
            let v2 = col2.get(r);
            if (!isNaN(v1) && !isNaN(v2)) {
                rslt += v1 * v2;
            }
        }
        return rslt;
    }
    count() {
        let total = 0;
        let nRows = this.nValues();
        for (let r = 0; r < nRows; r++) {
            let v = this.get(r);
            if (v || v == 0)
                total++;
        }
        return total;
    }
    countNumbers() {
        let total = 0;
        let nRows = this.nValues();
        for (let r = 0; r < nRows; r++) {
            let v = this.get(r);
            if (!isNaN(v))
                total++;
        }
        return total;
    }
    max() {
        let max = this.get(0);
        let nRows = this.nValues();
        for (let r = 0; r < nRows; r++) {
            let v = this.get(r);
            if (v > max) {
                max = v;
            }
        }
        return max;
    }
    min() {
        let min = this.get(0);
        let nRows = this.nValues();
        for (let r = 0; r < nRows; r++) {
            let v = this.get(r);
            if (!isNaN(v)) {
                if (v < min) {
                    min = v;
                }
            }
        }
        return min;
    }
    db(msg, maxRows = 20) {
        if (msg)
            DB.start(msg);
        let rows = this.nValues();
        let ellipses = false;
        if (rows > maxRows) {
            rows = maxRows;
            ellipses = true;
        }
        for (let r = 0; r < rows; r++) {
            DB.msg(`[${r}]:"${this.get(r)}"`);
        }
        if (ellipses)
            DB.msg("...");
        if (msg)
            DB.end(msg);
    }
}
class DataColumn extends DataColumnAbs {
    constructor(columnName, contents) {
        super(columnName);
        this.contents = [];
        if (contents) {
            for (let i in contents) {
                this.contents.push(contents[i]);
            }
        }
    }
    nValues() {
        return this.contents.length;
    }
    static fromJSON(colName, json) {
        let rslt = new DataColumn(colName);
        for (let r = 0; r < json.length; r++) {
            rslt.set(r, json[r]);
        }
        return rslt;
    }
    get(row) {
        if (row < 0 || row >= this.contents.length)
            return 0;
        return this.contents[row];
    }
    set(row, newVal) {
        if (row < 0)
            return;
        while (row > this.contents.length - 1)
            this.contents.push(0);
        this.contents[row] = newVal;
    }
    addTo(row, newVal) {
        let oldV = this.get(row);
        if (isNaN(oldV)) {
            this.set(row, newVal);
        }
        else {
            this.set(row, oldV + newVal);
        }
    }
    scalerMult(scaler) {
        for (let c in this.contents) {
            if (!isNaN(this.contents[c])) {
                this.contents[c] *= scaler;
            }
        }
    }
}
class DataTable extends DataTableAbs {
    constructor(contents, headers) {
        super();
        if (contents && headers) {
            if (contents.length > 0 && contents[0].length != headers.length) {
                DB.msg("DataTable const wrong number of headers for data");
                return;
            }
            this.contents = contents;
            this.columnHeaderIdxs = {};
            for (let i = 0; i < headers.length; i++) {
                this.columnHeaderIdxs[headers[i]] = i;
            }
        }
        else {
            this.contents = [];
            this.columnHeaderIdxs = {};
        }
        this.rebuildOrderedColumnHeaders();
    }
    fromCSVStr(str, noHeaders) {
        if (noHeaders) {
            this.csvNoHeadFromStr(str);
        }
        else {
            this.csvHeadFromStr(str);
        }
        return this;
    }
    hasCol(colName) {
        return colName in this.columnHeaderIdxs;
    }
    colName(colIdx) {
        if (!this.orderedColumnHeaders)
            this.rebuildOrderedColumnHeaders();
        return this.orderedColumnHeaders[colIdx];
    }
    colIdx(colName) {
        let idx = this.columnHeaderIdxs[colName];
        if (idx || idx == 0)
            return idx;
        else
            return -1;
    }
    columnIndex() {
        return this.columnHeaderIdxs;
    }
    nRows() {
        return this.contents.length;
    }
    columnHeaders() {
        if (!this.orderedColumnHeaders) {
            this.rebuildOrderedColumnHeaders();
        }
        return this.orderedColumnHeaders;
    }
    nCols() {
        return this.orderedColumnHeaders.length;
    }
    static fromJSON(json) {
        let rslt = new DataTable();
        let nr = json.length;
        for (let r = 0; r < nr; r++) {
            let obj = json[r];
            for (let c in obj) {
                let val = obj[c];
                rslt.set(r, c, val);
            }
        }
        return rslt;
    }
    csvHeadFromStr(data) {
        this.contents = [];
        let rows = data.split("\n");
        let headerRow = this.trimReturnChars(rows[0]);
        let columnNames = this.splitRow(headerRow);
        this.buildColumnHeaders(columnNames);
        for (let r = 1; r < rows.length; r++) {
            let row = this.trimReturnChars(rows[r]);
            if (row.length > 0) {
                let cells = this.splitRow(row);
                this.contents.push(cells);
            }
        }
        this.rebuildOrderedColumnHeaders();
    }
    csvNoHeadFromStr(data) {
        this.contents = [];
        let rows = data.split("\n");
        for (let r = 0; r < rows.length; r++) {
            let row = this.trimReturnChars(rows[r]);
            if (row.length > 0) {
                let cells = this.splitRow(row);
                for (let c in cells) {
                    let colName = "H" + c;
                    this.set(r, colName, cells[c]);
                }
            }
        }
        this.rebuildOrderedColumnHeaders();
    }
    trimReturnChars(row) {
        if (row.length > 0 && row.charAt(row.length - 1) == "\r")
            return row.substring(0, row.length - 1);
        else
            return row;
    }
    splitRow(row) {
        if (row.charCodeAt(0) > 300) {
            row = row.slice(1);
        }
        let rslt = [];
        let charIdx = 0;
        let endIdx = 0;
        let sub = "";
        while (charIdx < row.length) {
            switch (row.charAt(charIdx)) {
                case '"':
                    endIdx = row.indexOf('"', charIdx + 1);
                    if (endIdx < 0) {
                        sub = row.substring(charIdx + 1, row.length - 1);
                        charIdx = row.length;
                    }
                    else {
                        sub = row.substring(charIdx + 1, endIdx);
                        charIdx = endIdx + 2;
                    }
                    rslt.push(sub);
                    break;
                case "'":
                    endIdx = row.indexOf("'", charIdx + 1);
                    if (endIdx < 0) {
                        sub = row.substring(charIdx + 1, row.length - 1);
                        charIdx = row.length;
                    }
                    else {
                        sub = row.substring(charIdx + 1, endIdx);
                        charIdx = endIdx + 2;
                    }
                    rslt.push(sub);
                    break;
                default:
                    if (row.charAt(charIdx) == ",") {
                        sub = undefined;
                        charIdx++;
                    }
                    else {
                        endIdx = row.indexOf(',', charIdx + 1);
                        if (endIdx < 0) {
                            sub = row.substring(charIdx, row.length);
                            charIdx = row.length;
                        }
                        else {
                            sub = row.substring(charIdx, endIdx);
                            charIdx = endIdx + 1;
                        }
                    }
                    rslt.push(sub);
                    break;
            }
        }
        return rslt;
    }
    buildColumnHeaders(headers) {
        this.columnHeaderIdxs = {};
        for (let i = 0; i < headers.length; i++) {
            this.columnHeaderIdxs[headers[i]] = i;
        }
    }
    getI(row, col) {
        if (row < 0 || row >= this.contents.length)
            return 0;
        let contRow = this.contents[row];
        if (col < 0 || col >= contRow.length)
            return 0;
        return this.contents[row][col];
    }
    setI(row, col, newVal) {
        if (row < 0)
            return;
        if (row >= this.contents.length) {
            if ((row - this.contents.length > 20)) {
                let oldLength = this.contents.length;
                this.contents.length = row + 1;
                for (let i = oldLength; i < this.contents.length; i++) {
                    this.contents[i] = [];
                }
            }
            else {
                while (row > this.contents.length - 1)
                    this.contents.push([]);
            }
        }
        let contRow = this.contents[row];
        if (col >= contRow.length) {
            if ((col - contRow.length) > 20) {
                let oldLength = contRow.length;
                contRow.length = col + 1;
                for (let i = oldLength; i < contRow.length; i++)
                    contRow[i] = 0;
            }
            else {
                while (col > contRow.length - 1) {
                    contRow.push(0);
                }
            }
        }
        this.contents[row][col] = newVal;
    }
    get(row, col) {
        let colIdx = this.columnHeaderIdxs[col];
        if (!colIdx && colIdx != 0) {
            return 0;
        }
        return this.getI(row, colIdx);
    }
    set(row, col, newVal) {
        let colIdx = this.columnHeaderIdxs[col];
        if (isNaN(colIdx)) {
            colIdx = this.nCols();
            this.columnHeaderIdxs[col] = colIdx;
            if (!this.orderedColumnHeaders)
                this.rebuildOrderedColumnHeaders();
            else
                this.orderedColumnHeaders.push(col);
        }
        this.setI(row, colIdx, newVal);
    }
    addTo(row, col, newVal) {
        let oldVal = this.get(row, col);
        if (isNaN(oldVal)) {
            this.set(row, col, newVal);
        }
        else {
            this.set(row, col, oldVal + newVal);
        }
    }
    renameColumns(newNames) {
        for (let oldName in newNames) {
            let newName = newNames[oldName];
            if (oldName in this.columnHeaderIdxs) {
                let idx = this.columnHeaderIdxs[oldName];
                delete this.columnHeaderIdxs[oldName];
                this.columnHeaderIdxs[newName] = idx;
            }
            else {
                DB.msg("DataTable.renameColumns no such column named " + oldName);
            }
        }
        this.rebuildOrderedColumnHeaders();
    }
    sortRows(colName, descending = false) {
        if (!(colName in this.columnHeaderIdxs)) {
            DB.msg("DataTable.sortRows no such column " + colName);
            return;
        }
        let colIdx = this.columnHeaderIdxs[colName];
        this.contents.sort((a, b) => {
            let aVal = a[colIdx];
            let bVal = b[colIdx];
            switch (typeof aVal) {
                case "number":
                    let vr = aVal - bVal;
                    if (descending)
                        vr = -vr;
                    return vr;
                case "string":
                    let r = aVal.localeCompare(bVal);
                    if (descending)
                        r = -r;
                    return r;
                default:
                    return 0;
            }
        });
    }
    rebuildOrderedColumnHeaders() {
        let len = Object.keys(this.columnHeaderIdxs).length;
        this.orderedColumnHeaders = new Array(len);
        for (let col in this.columnHeaderIdxs) {
            let idx = this.columnHeaderIdxs[col];
            this.orderedColumnHeaders[idx] = col;
        }
    }
    replaceNulls(fractionOfColumnMin = 0) {
        if (fractionOfColumnMin == 0) {
            let nc = this.nCols();
            for (let c = 0; c < nc; c++) {
                for (let r = 0; r < this.contents.length; r++) {
                    let v = this.getI(r, c);
                    if (!v) {
                        this.setI(r, c, 0);
                    }
                }
            }
        }
        else {
            let nc = this.nCols();
            for (let c = 0; c < nc; c++) {
                let min = 10000000;
                for (let r = 0; r < this.contents.length; r++) {
                    let v = this.getI(r, c);
                    if (v && v < min) {
                        min = v;
                    }
                }
                min = min * fractionOfColumnMin;
                for (let r = 0; r < this.contents.length; r++) {
                    let v = this.getI(r, c);
                    if (!v) {
                        this.setI(r, c, min);
                    }
                }
            }
        }
    }
    parseNumbers() {
        let nr = this.nRows();
        for (let row = 0; row < nr; row++) {
            for (let col in this.columnHeaderIdxs) {
                let v = this.get(row, col);
                if (typeof v == "string") {
                    let nv = parseFloat(v);
                    if (!isNaN(nv)) {
                        this.set(row, col, nv);
                    }
                }
            }
        }
    }
    averageNormalizeByRow() {
        let rslt = new DataTable([], this.columnHeaders());
        let nr = this.nRows();
        for (let row = 0; row < nr; row++) {
            let sum = 0;
            let count = 0;
            let nc = this.columnHeaders().length;
            for (let col = 0; col < nc; col++) {
                let v = this.getI(row, col);
                if (typeof v == "number") {
                    sum += v;
                    count++;
                }
            }
            if (count > 0) {
                let avg = sum / count;
                for (let col in this.columnHeaderIdxs) {
                    let v = this.get(row, col);
                    if (typeof v == "number") {
                        v = v / avg;
                        rslt.set(row, col, v);
                    }
                    else {
                        rslt.set(row, col, v);
                    }
                }
            }
        }
        return rslt;
    }
    scalerMult(scaler) {
        for (let r in this.contents) {
            let row = this.contents[r];
            for (let c in row) {
                if (!isNaN(row[c])) {
                    row[c] *= scaler;
                }
            }
        }
    }
}
class DataTableUI extends DataTableUIAbs {
    constructor(maxRows = 20, maxCols = 10, cellEnter) {
        super(maxRows, maxCols, cellEnter);
    }
    setData(dataTable) {
        this.dataTable = dataTable;
        this.firstRow = 0;
        this.firstCol = 0;
        ZUI.notify();
    }
    getData() {
        return this.dataTable;
    }
    hasData() {
        if (this.dataTable)
            return true;
        return false;
    }
    colHeaderList() {
        if (this.dataTable) {
            return this.dataTable.columnHeaders();
        }
        else {
            return null;
        }
    }
    rowLabelList() {
        if (this.dataTable) {
            let rll = [];
            let nr = this.dataTable.nRows();
            for (let row = 0; row < nr; row++) {
                let rowLabel = (row + 1).toFixed(0);
                rll.push(rowLabel);
            }
            return rll;
        }
        return null;
    }
    rowData(row, firstCol, lastCol) {
        if (this.dataTable) {
            let ch = this.dataTable.columnHeaders();
            let rowData = [];
            for (let col = firstCol; col <= lastCol; col++) {
                let colName = ch[col];
                let v = this.dataTable.get(row, colName);
                rowData.push(v);
            }
            return rowData;
        }
        else {
            return null;
        }
    }
}
class DataTableRowLabeledAbs {
    copy() {
        let rslt = new DataTableRowLabeled();
        let rl = this.rowLabels();
        let ch = this.columnHeaders();
        for (let r in rl) {
            for (let c in ch) {
                let v = this.get(r, c);
                rslt.set(r, c, v);
            }
        }
        return rslt;
    }
    toJSON() {
        let rslt = {};
        let rl = this.rowLabels();
        let ch = this.columnHeaders();
        for (let r of rl) {
            let rowObj = {};
            for (let c of ch) {
                let v = this.get(r, c);
                if (v || v == 0)
                    rowObj[c] = v;
            }
            rslt[r] = rowObj;
        }
        return rslt;
    }
    sum() {
        let total = 0;
        let rl = this.rowLabels();
        let ch = this.columnHeaders();
        for (let r of rl) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (!isNaN(v))
                    total += v;
            }
        }
        return total;
    }
    count() {
        let total = 0;
        let rl = this.rowLabels();
        let ch = this.columnHeaders();
        for (let r of rl) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (v || 0 == (v))
                    total++;
            }
        }
        return total;
    }
    countNumbers() {
        let total = 0;
        let rl = this.rowLabels();
        let ch = this.columnHeaders();
        for (let r of rl) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (!isNaN(v))
                    total++;
            }
        }
        return total;
    }
    max() {
        let foundNum = false;
        let max = 0;
        let rl = this.rowLabels();
        let ch = this.columnHeaders();
        for (let r of rl) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (!isNaN(v)) {
                    if (!foundNum) {
                        max = v;
                        foundNum = true;
                    }
                    if (v > max) {
                        max = v;
                    }
                }
            }
        }
        return max;
    }
    min() {
        let foundNum = false;
        let min = 0;
        let rl = this.rowLabels();
        let ch = this.columnHeaders();
        for (let r of rl) {
            for (let c of ch) {
                let v = this.get(r, c);
                if (!isNaN(v)) {
                    if (!foundNum) {
                        min = v;
                        foundNum = true;
                    }
                    if (v < min) {
                        min = v;
                    }
                }
            }
        }
        return min;
    }
    db(msg, maxColumns = 5, maxRows = 20) {
        if (msg)
            DB.start(msg);
        DB.msg(`(${this.nRows()}x${this.nCols()})`);
        let rowEll = false;
        let colEll = false;
        let cols = this.nCols();
        if (cols > maxColumns) {
            colEll = true;
            cols = maxColumns;
        }
        let rows = this.nRows();
        if (rows > maxRows) {
            rowEll = true;
            rows = maxRows;
        }
        let headerStr = "\t";
        let ch = this.columnHeaders();
        let rl = this.rowLabels();
        for (let c = 0; c < cols; c++) {
            let col = ch[c];
            headerStr += col + "\t";
        }
        if (colEll)
            headerStr += "...";
        DB.msg(headerStr);
        for (let r = 0; r < rows; r++) {
            let rowStr = `[${rl[r]}]:\t`;
            for (let c = 0; c < cols; c++) {
                let val = this.get(this.rowLabel(r), this.colName(c));
                if (typeof val == "string") {
                    rowStr += '"' + val + '"\t';
                }
                else {
                    rowStr += val + "\t";
                }
            }
            if (colEll)
                rowStr += "...";
            DB.msg(rowStr);
        }
        if (rowEll)
            DB.msg("...");
        if (msg)
            DB.end(msg);
    }
}
class DataTableRowLabeled extends DataTableRowLabeledAbs {
    constructor() {
        super();
        this.contents = [];
        this.columnHeaderIdxs = {};
        this.rowLabelIdxs = {};
        this.orderedColumnHeaders = [];
        this.orderedRowLabels = [];
    }
    rowIndexes() { return this.rowLabelIdxs; }
    colIndexes() { return this.columnHeaderIdxs; }
    hasCol(colName) {
        return colName in this.columnHeaderIdxs;
    }
    hasRow(rowName) {
        return rowName in this.rowLabelIdxs;
    }
    nRows() {
        return this.contents.length;
    }
    rowLabels() {
        if (!this.orderedRowLabels)
            this.rebuildOrderedRowLabels();
        return this.orderedRowLabels;
    }
    rowLabel(rowIdx) {
        return this.orderedRowLabels[rowIdx];
    }
    rowIdx(rowLabel) {
        return this.rowLabelIdxs[rowLabel];
    }
    columnHeaders() {
        if (!this.orderedColumnHeaders) {
            this.rebuildOrderedColumnHeaders();
        }
        return this.orderedColumnHeaders;
    }
    nCols() {
        return this.orderedColumnHeaders.length;
    }
    colName(colIdx) {
        return this.orderedColumnHeaders[colIdx];
    }
    colIdx(colName) {
        return this.columnHeaderIdxs[colName];
    }
    static fromJSON(json) {
        let rslt = new DataTableRowLabeled();
        for (let r in json) {
            let row = json[r];
            for (let c in row) {
                let v = row[c];
                rslt.set(r, c, v);
            }
        }
        return rslt;
    }
    getI(row, col) {
        if (row < 0 || row >= this.contents.length)
            return 0;
        let contRow = this.contents[row];
        if (col < 0 || col >= contRow.length)
            return 0;
        return this.contents[row][col];
    }
    setI(row, col, newVal) {
        if (row < 0)
            return;
        while (row > this.contents.length - 1)
            this.contents.push([]);
        let contRow = this.contents[row];
        while (col > contRow.length - 1) {
            contRow.push(0);
        }
        this.contents[row][col] = newVal;
    }
    get(row, col) {
        let rowIdx = this.rowLabelIdxs[row];
        if (!rowIdx && rowIdx != 0)
            return 0;
        let colIdx = this.columnHeaderIdxs[col];
        if (!colIdx && colIdx != 0) {
            return 0;
        }
        return this.getI(rowIdx, colIdx);
    }
    set(row, col, newVal) {
        let rowIdx = this.rowLabelIdxs[row];
        if (isNaN(rowIdx)) {
            rowIdx = this.nRows();
            this.rowLabelIdxs[row] = rowIdx;
            if (!this.orderedRowLabels)
                this.rebuildOrderedRowLabels();
            else
                this.orderedRowLabels.push(row);
        }
        let colIdx = this.columnHeaderIdxs[col];
        if (isNaN(colIdx)) {
            colIdx = this.nCols();
            this.columnHeaderIdxs[col] = colIdx;
            if (!this.orderedColumnHeaders)
                this.rebuildOrderedColumnHeaders();
            else
                this.orderedColumnHeaders.push(col);
        }
        this.setI(rowIdx, colIdx, newVal);
    }
    addTo(row, col, newVal) {
        let oldVal = this.get(row, col);
        if (isNaN(oldVal)) {
            this.set(row, col, newVal);
        }
        else {
            this.set(row, col, oldVal + newVal);
        }
    }
    getRow(row) {
        let dr = new DataRow();
        for (let col in this.columnHeaderIdxs) {
            dr.set(col, this.get(row, col));
        }
        return dr;
    }
    getCol(col) {
        let dc = new DataColumn(col);
        let idx = 0;
        for (let row in this.rowLabelIdxs) {
            dc.set(idx++, this.get(row, col));
        }
        return dc;
    }
    renameColumns(newNames) {
        for (let oldName in newNames) {
            let newName = newNames[oldName];
            if (oldName in this.columnHeaderIdxs) {
                let idx = this.columnHeaderIdxs[oldName];
                delete this.columnHeaderIdxs[oldName];
                this.columnHeaderIdxs[newName] = idx;
            }
            else {
                DB.msg("DataTableRowLabeled.renameColumns no such column named " + oldName);
            }
        }
        this.rebuildOrderedColumnHeaders();
    }
    relabelRows(newNames) {
        for (let oldName in newNames) {
            let newName = newNames[oldName];
            if (oldName in this.rowLabelIdxs) {
                let idx = this.rowLabelIdxs[oldName];
                delete this.rowLabelIdxs[oldName];
                this.rowLabelIdxs[newName] = idx;
            }
            else {
                DB.msg("DataTableRowLabeled.renameRows no such row named " + oldName);
            }
        }
        this.rebuildOrderedRowLabels();
    }
    rebuildOrderedColumnHeaders() {
        let len = Object.keys(this.columnHeaderIdxs).length;
        this.orderedColumnHeaders = new Array(len);
        for (let col in this.columnHeaderIdxs) {
            let idx = this.columnHeaderIdxs[col];
            this.orderedColumnHeaders[idx] = col;
        }
    }
    rebuildOrderedRowLabels() {
        let len = Object.keys(this.rowLabelIdxs).length;
        this.orderedRowLabels = new Array(len);
        for (let row in this.rowLabelIdxs) {
            let idx = this.rowLabelIdxs[row];
            this.orderedRowLabels[idx] = row;
        }
    }
    scalerMult(scaler) {
        for (let r in this.contents) {
            let row = this.contents[r];
            for (let c in row) {
                if (!isNaN(row[c])) {
                    row[c] *= scaler;
                }
            }
        }
    }
}
class DataTableRowLabeledUI extends DataTableUIAbs {
    constructor(maxRows = 20, maxCols = 10, cellEnter) {
        super(maxRows, maxCols, cellEnter);
    }
    setData(dataTable) {
        this.dataTable = dataTable;
        this.firstRow = 0;
        this.firstCol = 0;
        ZUI.notify();
    }
    hasData() {
        if (this.dataTable)
            return true;
        return false;
    }
    colHeaderList() {
        if (this.dataTable) {
            return this.dataTable.columnHeaders();
        }
        else {
            return null;
        }
    }
    rowLabelList() {
        if (this.dataTable) {
            let rowLabels = this.dataTable.rowLabels();
            this.rowLabels = rowLabels;
        }
        else
            this.rowLabels = null;
        return this.rowLabels;
    }
    rowData(row, firstCol, lastCol) {
        if (this.dataTable) {
            let rowLabel = this.rowLabels[row];
            let ch = this.dataTable.columnHeaders();
            let rowData = [];
            for (let col = firstCol; col <= lastCol; col++) {
                let colName = ch[col];
                let v = this.dataTable.get(rowLabel, colName);
                rowData.push(v);
            }
            return rowData;
        }
        else {
            return null;
        }
    }
}
class ChartUI extends ZUI {
    constructor() {
        super();
        this.setWidth = 100;
        this.setHeight = 50;
        this.yAxisWidth = 50;
        this.xAxisHeight = 20;
        this.nYTicks = 10;
        this.nXTicks = 10;
        this.eventsSetup = false;
        this.showYAxis = true;
        this.drawLineColor = "#FF0000";
        this.drawLineWidth = 2;
        this.startColRange = -1;
        this.endColRange = -1;
        PageManager.addAfterDOMNotice(() => {
            if (!this.eventsSetup && this.canvas) {
                this.setupEventListeners();
                this.eventsSetup = true;
            }
        });
    }
    size(width, height) {
        this.setWidth = width;
        this.setHeight = height;
        return this;
    }
    gridSize(nXTicks, nYTicks) {
        this.nXTicks = nXTicks;
        this.nYTicks = nYTicks;
        return this;
    }
    setDataRow(dataRow) {
        this.dataType = "row";
        this.dataRow = dataRow;
        ZUI.notify();
    }
    colHover(colHoverCallback) {
        this.colHoverCallback = colHoverCallback;
        return this;
    }
    colRangeSelect(colRangeCallback) {
        this.colRangeCallback = colRangeCallback;
        return this;
    }
    click(onClick) {
        this.onClick = onClick;
        return this;
    }
    xAxis(show = true) {
        this.showXAxis = show;
        return this;
    }
    yAxis(show = true) {
        this.showYAxis = show;
        return this;
    }
    line(lc, width = 4) {
        this.drawLineColor = lc;
        this.drawLineWidth = width;
        return this;
    }
    toX(x) {
        let newX = this.chartLeft + (x - this.xMin) / (this.xMax - this.xMin)
            * (this.chartRight - this.chartLeft);
        return newX;
    }
    fromX(x) {
        let newX = (x * 2 - this.chartLeft) / (this.chartRight - this.chartLeft)
            * (this.xMax - this.xMin) + this.xMin;
        return newX;
    }
    eventX(event) {
        let x = 0;
        if (event instanceof MouseEvent) {
            x = event.clientX;
        }
        else if (event instanceof TouchEvent) {
            x = event.changedTouches[0].pageX;
        }
        else {
            let oe = event.originalEvent;
            if (oe) {
                x = oe.clientX;
            }
        }
        let rect = this.canvas[0].getBoundingClientRect();
        x = x - rect.left;
        return x;
    }
    eventToChartX(event) {
        let x = this.eventX(event);
        x = this.fromX(x);
        return x;
    }
    toY(y) {
        let newY = this.chartBottom + (y - this.yMin) / (this.yMax - this.yMin)
            * (this.chartTop - this.chartBottom);
        return newY;
    }
    fromY(y) {
        let newY = (y * 2 - this.chartBottom) / (this.chartTop - this.chartBottom)
            * (this.yMax - this.yMin) + this.yMin;
        return newY;
    }
    eventY(event) {
        let y = 0;
        if (event instanceof MouseEvent) {
            y = event.clientY;
        }
        else if (event instanceof TouchEvent) {
            y = event.changedTouches[0].pageY;
        }
        else {
            let oe = event.originalEvent;
            if (oe) {
                y = oe.clientY;
            }
        }
        let rect = this.canvas[0].getBoundingClientRect();
        y = y - rect.top;
        return y;
    }
    eventToChartY(event) {
        let y = this.eventY(event);
        y = this.fromY(y);
        return y;
    }
    mouseMove(event) {
        let x = this.eventToChartX(event);
        let y = this.eventToChartY(event);
        if (this.colRangeCallback) {
            if (event.originalEvent)
                event = event.originalEvent;
            if (event instanceof MouseEvent) {
                let me = event;
                if (me.which == 1) {
                    this.expandRange(x);
                    this.paint();
                }
            }
        }
        if (this.colHoverCallback) {
            if (x < this.xMin || x > this.xMax)
                return;
            let colIdx = Math.floor(x + 0.5);
            if (colIdx != this.lastHoverIdx) {
                this.lastHoverIdx = colIdx;
                if (this.dataRow) {
                    let colName = this.dataRow.columnHeaders()[colIdx];
                    this.colHoverCallback(colName);
                }
            }
        }
    }
    expandRange(x) {
        if (x < this.xMin)
            x = this.xMin;
        if (x > this.xMax)
            x = this.xMax;
        x = Math.floor(x + 0.5);
        if (this.startColRange < 0)
            this.startColRange = x;
        if (this.endColRange < 0)
            this.endColRange = x;
        if (x < this.startColRange)
            this.startColRange = x;
        if (x > this.endColRange)
            this.endColRange = x;
    }
    mouseDown(event) {
        this.downX = this.eventX(event);
        if (this.colRangeCallback) {
            let x = this.eventToChartX(event);
            if (x < this.xMin)
                this.expandRange(this.xMin);
            else if (x > this.xMax)
                this.expandRange(this.xMax);
            else
                this.expandRange(x);
            this.paint();
        }
        else {
            this.startColRange = this.endColRange = -1;
        }
    }
    mouseUp(event) {
        let upX = this.eventX(event);
        let dx = upX - this.downX;
        if (dx < 0)
            dx = -dx;
        if (this.colRangeCallback) {
            let x = this.eventToChartX(event);
            this.expandRange(x);
            if (this.startColRange >= 0) {
                let start = Math.floor(this.startColRange + 0.5);
                let end = Math.floor(this.endColRange + 0.5);
                if (dx > 4)
                    this.colRangeCallback(start, end);
            }
            this.startColRange = this.endColRange = -1;
            this.paint();
        }
        if (this.onClick) {
            let x = Math.floor(this.eventToChartX(event) + 0.5);
            if (dx <= 4)
                this.onClick(x);
        }
    }
    mouseEnter(event) {
        if (this.colRangeCallback) {
            if (event instanceof MouseEvent) {
                if (event.which == 1) {
                    let x = this.eventToChartX(event);
                    this.expandRange(x);
                    this.paint();
                }
            }
        }
    }
    mouseLeave(event) {
        this.startColRange = this.endColRange = -1;
        this.paint();
    }
    calculateChartArea() {
        this.chartLeft = this.yAxisWidth + 2;
        this.chartRight = this.width - 2;
        let m = this.graphics.measureText("A");
        let textPad = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
        this.chartTop = 2 + textPad;
        this.chartBottom = this.height - this.xAxisHeight - textPad;
    }
    calculateAxesSpace() {
        if (this.dataType) {
            switch (this.dataType) {
                case "row":
                    this.computeRowAxes();
                    return;
                default:
                    break;
            }
        }
        this.yAxisWidth = 0;
        this.xAxisHeight = 0;
    }
    calculateDataBounds() {
        if (this.dataType) {
            switch (this.dataType) {
                case "row":
                    this.rowBounds();
                    return;
                default:
                    break;
            }
        }
        this.xMin = -10;
        this.yMin = -1;
        this.xMax = 100;
        this.yMax = 1;
    }
    paint() {
        let g = this.graphics;
        g.font = ChartUI.labelFont;
        this.calculateDataBounds();
        this.calculateAxesSpace();
        this.calculateChartArea();
        g.strokeStyle = "#000000";
        g.clearRect(0, 0, this.width, this.height);
        this.paintSelection();
        this.paintGrid();
        this.paintAxes();
        g.strokeRect(this.chartLeft, this.chartTop, this.chartRight - this.chartLeft, this.chartBottom - this.chartTop);
        if (this.dataType) {
            switch (this.dataType) {
                case "row":
                    this.paintRow();
                    break;
                default:
                    break;
            }
        }
    }
    paintGrid() {
        let g = this.graphics;
        g.font = ChartUI.labelFont;
        let xWidth = this.xMax - this.xMin;
        let xStride = (xWidth) / this.nXTicks;
        let yWidth = this.yMax - this.yMin;
        let yStride = yWidth / this.nYTicks;
        g.strokeStyle = "#888888";
        let saveDash = g.getLineDash();
        let saveWidth = g.lineWidth;
        g.lineWidth = 3;
        g.setLineDash([6, 9]);
        g.beginPath();
        if (xStride > 0) {
            for (let x = xStride; x < xWidth; x += xStride) {
                g.moveTo(this.toX(x), this.toY(this.yMin));
                g.lineTo(this.toX(x), this.toY(this.yMax));
            }
        }
        if (yStride > 0) {
            for (let y = yStride; y < yWidth; y += yStride) {
                g.moveTo(this.toX(this.xMin), this.toY(y));
                g.lineTo(this.toX(this.xMax), this.toY(y));
            }
        }
        g.stroke();
        g.setLineDash(saveDash);
        g.lineWidth = saveWidth;
    }
    paintAxes() {
        if (this.dataType) {
            switch (this.dataType) {
                case "row":
                    this.paintRowAxes();
                    return;
                default:
                    break;
            }
        }
        return;
    }
    paintSelection() {
        if (this.startColRange < 0)
            return;
        let start = this.toX(this.startColRange - 0.5);
        let end = this.toX(this.endColRange + 0.5);
        let g = this.graphics;
        let saveFill = g.fillStyle;
        g.fillStyle = "rgba(200,200,200,0.2)";
        g.fillRect(start, this.chartTop, end - start, this.chartBottom - this.chartTop);
        g.fillStyle = saveFill;
    }
    paintRow() {
        let g = this.graphics;
        let saveStroke = g.strokeStyle;
        let saveWidth = g.lineWidth;
        g.strokeStyle = this.drawLineColor;
        g.lineWidth = this.drawLineWidth;
        g.beginPath();
        let nc = this.dataRow.nCols();
        let ch = this.dataRow.columnHeaders();
        let gap = true;
        for (let cIdx = 0; cIdx < nc; cIdx++) {
            let v = this.dataRow.get(ch[cIdx]);
            if (isNaN(v)) {
            }
            else {
                if (gap) {
                    g.moveTo(this.toX(cIdx), this.toY(v));
                    gap = false;
                }
                else {
                    g.lineTo(this.toX(cIdx), this.toY(v));
                }
            }
        }
        g.stroke();
        g.strokeStyle = saveStroke;
        g.lineWidth = saveWidth;
    }
    paintRowAxes() {
        let g = this.graphics;
        let saveAlign = g.textAlign;
        let saveBase = g.textBaseline;
        g.fillStyle = "#000000";
        if (this.showYAxis) {
            g.textAlign = "end";
            g.textBaseline = "middle";
            let yWidth = this.yMax - this.yMin;
            let yStride = yWidth / this.nYTicks;
            if (yStride == 0) {
                let label = this.yMax.toString();
                g.fillText(label, this.chartLeft - ChartUI.yLabelOffset, this.chartTop);
                g.fillText(label, this.chartLeft - ChartUI.yLabelOffset, this.chartBottom);
            }
            else {
                let decimals = this.estimateDecimals(yStride);
                for (let y = this.yMin; y <= this.yMax; y += yStride) {
                    let label = y.toFixed(decimals);
                    if (decimals > 10)
                        label = y.toString();
                    g.fillText(label, this.chartLeft - ChartUI.yLabelOffset, this.toY(y));
                }
            }
        }
        if (this.showXAxis) {
            g.textAlign = "center";
            g.textBaseline = "bottom";
            let xWidth = this.xMax - this.xMin;
            let xStride = xWidth / this.nXTicks;
            if (xStride == 0) {
                let label = this.xMax.toString();
                g.fillText(label, this.chartLeft, this.height);
            }
            else {
                let ch = this.dataRow.columnHeaders();
                for (let x = this.xMin; x < this.xMax; x += xStride) {
                    let colIdx = Math.floor(x + 0.5);
                    let label = ch[colIdx];
                    g.fillText(label, this.toX(x), this.height);
                }
            }
        }
        g.textAlign = saveAlign;
        g.textBaseline = saveBase;
    }
    rowBounds() {
        this.xMin = 0;
        this.xMax = this.dataRow.nCols() - 1;
        this.yMin = this.dataRow.min();
        this.yMax = this.dataRow.max();
    }
    computeRowAxes() {
        this.computeRowYAxis();
        this.computeRowXAxis();
    }
    computeRowYAxis() {
        if (this.showYAxis) {
            let g = this.graphics;
            let yWidth = this.yMax - this.yMin;
            let yStride = yWidth / this.nYTicks;
            if (yStride == 0) {
                let label = this.yMax.toString();
                let width = g.measureText(label).width + ChartUI.yLabelOffset;
                this.yAxisWidth = width;
            }
            else {
                let decimals = this.estimateDecimals(yStride);
                this.yAxisWidth = 0;
                for (let y = 0; y <= yWidth; y += yStride) {
                    let label = y.toFixed(decimals);
                    if (decimals > 10)
                        label = y.toString();
                    let width = g.measureText(label).width + ChartUI.yLabelOffset;
                    if (width > this.yAxisWidth)
                        this.yAxisWidth = width;
                }
            }
        }
        else {
            this.yAxisWidth = 0;
        }
    }
    computeRowXAxis() {
        if (this.showXAxis) {
            let g = this.graphics;
            let m = g.measureText("A");
            this.xAxisHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        }
        else {
            this.xAxisHeight = 0;
        }
    }
    estimateDecimals(range) {
        let decimals = 0;
        let nr = range;
        while (nr < 1) {
            nr *= 10;
            decimals++;
            if (decimals > 10)
                return decimals;
        }
        return decimals;
    }
    setupEventListeners() {
        let canvas = this.canvas;
        canvas.mousemove((event) => {
            try {
                event.preventDefault();
                this.mouseMove(event);
            }
            catch (e) {
                DB.msg("mousemove ERR", e);
            }
        });
        canvas.mouseup((event) => {
            try {
                event.preventDefault();
                this.mouseUp(event);
            }
            catch (e) {
                DB.msg("mouseup Err", e);
            }
        });
        canvas.mousedown((event) => {
            try {
                event.preventDefault();
                this.mouseDown(event);
            }
            catch (e) {
                DB.msg("mousedown Err", e);
            }
        });
        canvas.mouseleave((event) => {
            try {
                event.preventDefault();
                this.mouseLeave(event);
            }
            catch (e) {
                DB.msg("mouseleave Err", e);
            }
        });
        canvas.mouseenter((event) => {
            try {
                event.preventDefault();
                this.mouseEnter(event);
            }
            catch (e) {
                DB.msg("mouseenter Err", e);
            }
        });
    }
    renderJQ() {
        this.eventsSetup = false;
        this.canvas = $(`<canvas class="ChartUI ${this.classStr()}" width=${this.setWidth}px height=${this.setHeight}px style="width:${this.setWidth}px;height:${this.setHeight}"></canvas>`);
        this.width = this.setWidth * 2;
        this.canvas[0].width = this.width;
        this.height = this.setHeight * 2;
        this.canvas[0].height = this.height;
        this.graphics = this.canvas[0].getContext("2d");
        this.paint();
        this.applyCSS(this.canvas);
        return this.canvas;
    }
}
ChartUI.yLabelOffset = 2;
ChartUI.labelFont = "30px Arial";
class LineDiff {
    constructor(from, to) {
        this.lFrom = from.split("\n");
        this.lTo = to.split("\n");
        this.patch = this.editsForS1IntoS2();
        this.indexPatch();
    }
    getPatch() {
        return this.patch;
    }
    fromLineReplaced(fromLine) { return this.fromLineReplaced_[fromLine]; }
    fromLineSkipped(fromLine) { return this.fromLineSkipped_[fromLine]; }
    toLineDeleted(fromLine) { return this.toLineDeleted_[fromLine]; }
    indexPatch() {
        this.fromLineReplaced_ = {};
        this.fromLineSkipped_ = {};
        this.toLineDeleted_ = {};
        if (this.patch) {
            for (let i = 0; i < this.patch.length; i++) {
                let edit = this.patch[i];
                switch (edit.edit) {
                    case "start":
                        break;
                    case "match":
                        break;
                    case "replace":
                        this.fromLineReplaced_[edit.fromIdx] = true;
                        break;
                    case "skipFrom":
                        this.fromLineSkipped_[edit.fromIdx] = true;
                        break;
                    case "addTo":
                        this.toLineDeleted_[edit.fromIdx] = true;
                        break;
                }
            }
        }
    }
    editsForS1IntoS2() {
        this.heap = [];
        this.addMemory = {};
        let top = new DiffEdit(0, 0, "start", 0);
        while (top.fromIdx < this.lFrom.length || top.toIdx < this.lTo.length) {
            if (top.fromIdx < this.lFrom.length) {
                let skip = new DiffEdit(top.fromIdx + 1, top.toIdx, "skipFrom", top.totalCost + 1, top);
                this.add(skip);
            }
            if (top.toIdx < this.lTo.length) {
                let add = new DiffEdit(top.fromIdx, top.toIdx + 1, "addTo", top.totalCost + 1, top);
                this.add(add);
            }
            if (top.fromIdx < this.lFrom.length && top.toIdx < this.lTo.length) {
                let mc = this.matchCost(top.fromIdx, top.toIdx);
                let edit = "replace";
                if (mc == 0)
                    edit = "match";
                let match = new DiffEdit(top.fromIdx + 1, top.toIdx + 1, edit, top.totalCost + 2 * mc, top);
                this.add(match);
            }
            top = this.get();
        }
        let rslt = this.reverseEdits(top);
        return rslt;
    }
    matchCost(fromIdx, toIdx) {
        let fromS = this.lFrom[fromIdx];
        let toS = this.lTo[toIdx];
        if (fromS == toS)
            return 0;
        else
            return 0.99999;
    }
    reverseEdits(top) {
        if (top && top.edit != "start") {
            let prev = this.reverseEdits(top.prevState);
            top.fromIdx--;
            top.toIdx--;
            prev.push(top);
            return prev;
        }
        else {
            return [];
        }
    }
    add(edit) {
        let hash = edit.hash();
        let mem = this.addMemory[hash];
        if (mem && mem.totalCost <= edit.totalCost)
            return;
        this.addMemory[hash] = edit;
        let lastIdx = this.heap.length;
        this.heap.push(edit);
        while (lastIdx > 0) {
            let upIdx = Math.floor(lastIdx / 2);
            if (this.heap[lastIdx].totalCost < this.heap[upIdx].totalCost) {
                this.exchange(lastIdx, upIdx);
                lastIdx = upIdx;
            }
            else {
                lastIdx = -1;
            }
        }
    }
    exchange(i1, i2) {
        let tmp = this.heap[i1];
        this.heap[i1] = this.heap[i2];
        this.heap[i2] = tmp;
    }
    get() {
        if (this.heap.length > 0) {
            let rslt = this.heap[0];
            this.heap[0] = this.heap.pop();
            let idx = 0;
            while (idx < this.heap.length) {
                let left = idx * 2 + 1;
                if (left < this.heap.length && this.heap[left].totalCost < this.heap[idx].totalCost) {
                    this.exchange(left, idx);
                    idx = left;
                }
                else {
                    let right = left + 1;
                    if (right < this.heap.length && this.heap[right].totalCost < this.heap[idx].totalCost) {
                        this.exchange(right, idx);
                        idx = right;
                    }
                    else {
                        idx = this.heap.length;
                    }
                }
            }
            return rslt;
        }
        else {
            return null;
        }
    }
    applyEditFromTo(edits) {
        let rslt = "";
        for (let i = 0; i < edits.length; i++) {
            let edit = edits[i];
            switch (edit.edit) {
                case "start":
                    break;
                case "match":
                case "replace":
                    rslt = this.addLine(rslt, this.lTo[edit.toIdx]);
                    break;
                case "addTo":
                    rslt = this.addLine(rslt, this.lTo[edit.toIdx]);
                    break;
                case "skipFrom":
                    break;
            }
        }
        return rslt;
    }
    addLine(str, addStr) {
        if (str && str.length > 0) {
            return str + "\n" + addStr;
        }
        else {
            return addStr;
        }
    }
}
class DiffEdit {
    constructor(fromIdx, toIdx, edit, totalCost, prevState) {
        this.fromIdx = fromIdx;
        this.toIdx = toIdx;
        this.edit = edit;
        this.totalCost = totalCost;
        this.prevState = prevState;
    }
    hash() {
        return this.fromIdx * 10000 + this.toIdx;
    }
}
class StringDiff {
    constructor(from, to) {
        this.lFrom = from;
        this.lTo = to;
        this.patch = this.editsForS1IntoS2();
        this.indexPatch();
    }
    getPatch() {
        return this.patch;
    }
    fromCharReplaced(fromLine) { return this.fromCharReplaced_[fromLine]; }
    fromCharSkipped(fromLine) { return this.fromCharSkipped_[fromLine]; }
    toCharDeleted(fromLine) { return this.toCharDeleted_[fromLine]; }
    indexPatch() {
        this.fromCharReplaced_ = {};
        this.fromCharSkipped_ = {};
        this.toCharDeleted_ = {};
        if (this.patch) {
            for (let i = 0; i < this.patch.length; i++) {
                let edit = this.patch[i];
                switch (edit.edit) {
                    case "start":
                        break;
                    case "match":
                        break;
                    case "replace":
                        this.fromCharReplaced_[edit.fromIdx] = true;
                        break;
                    case "skipFrom":
                        this.fromCharSkipped_[edit.fromIdx] = true;
                        break;
                    case "addTo":
                        this.toCharDeleted_[edit.fromIdx] = true;
                        break;
                }
            }
        }
    }
    editsForS1IntoS2() {
        this.heap = [];
        this.addMemory = {};
        let top = new DiffEdit(0, 0, "start", 0);
        while (top.fromIdx < this.lFrom.length || top.toIdx < this.lTo.length) {
            if (top.fromIdx < this.lFrom.length) {
                let skip = new DiffEdit(top.fromIdx + 1, top.toIdx, "skipFrom", top.totalCost + 1, top);
                this.add(skip);
            }
            if (top.toIdx < this.lTo.length) {
                let add = new DiffEdit(top.fromIdx, top.toIdx + 1, "addTo", top.totalCost + 1, top);
                this.add(add);
            }
            if (top.fromIdx < this.lFrom.length && top.toIdx < this.lTo.length) {
                let mc = this.matchCost(top.fromIdx, top.toIdx);
                let edit = "replace";
                if (mc == 0)
                    edit = "match";
                let match = new DiffEdit(top.fromIdx + 1, top.toIdx + 1, edit, top.totalCost + 2 * mc, top);
                this.add(match);
            }
            top = this.get();
        }
        let rslt = this.reverseEdits(top);
        return rslt;
    }
    matchCost(fromIdx, toIdx) {
        let fromS = this.lFrom.charCodeAt(fromIdx);
        let toS = this.lTo.charCodeAt(toIdx);
        if (fromS == toS)
            return 0;
        else
            return 0.99999;
    }
    reverseEdits(top) {
        if (top && top.edit != "start") {
            let prev = this.reverseEdits(top.prevState);
            top.fromIdx--;
            top.toIdx--;
            prev.push(top);
            return prev;
        }
        else {
            return [];
        }
    }
    add(edit) {
        let hash = edit.hash();
        let mem = this.addMemory[hash];
        if (mem && mem.totalCost <= edit.totalCost)
            return;
        this.addMemory[hash] = edit;
        let lastIdx = this.heap.length;
        this.heap.push(edit);
        while (lastIdx > 0) {
            let upIdx = Math.floor(lastIdx / 2);
            if (this.heap[lastIdx].totalCost < this.heap[upIdx].totalCost) {
                this.exchange(lastIdx, upIdx);
                lastIdx = upIdx;
            }
            else {
                lastIdx = -1;
            }
        }
    }
    exchange(i1, i2) {
        let tmp = this.heap[i1];
        this.heap[i1] = this.heap[i2];
        this.heap[i2] = tmp;
    }
    get() {
        if (this.heap.length > 0) {
            let rslt = this.heap[0];
            this.heap[0] = this.heap.pop();
            let idx = 0;
            while (idx < this.heap.length) {
                let left = idx * 2 + 1;
                if (left < this.heap.length && this.heap[left].totalCost < this.heap[idx].totalCost) {
                    this.exchange(left, idx);
                    idx = left;
                }
                else {
                    let right = left + 1;
                    if (right < this.heap.length && this.heap[right].totalCost < this.heap[idx].totalCost) {
                        this.exchange(right, idx);
                        idx = right;
                    }
                    else {
                        idx = this.heap.length;
                    }
                }
            }
            return rslt;
        }
        else {
            return null;
        }
    }
    applyEditFromTo(edits) {
        let rslt = "";
        for (let i = 0; i < edits.length; i++) {
            let edit = edits[i];
            switch (edit.edit) {
                case "start":
                    break;
                case "match":
                case "replace":
                    rslt += this.lTo.charAt(edit.toIdx);
                    break;
                case "addTo":
                    rslt += this.lTo.charAt(edit.toIdx);
                    break;
                case "skipFrom":
                    break;
            }
        }
        return rslt;
    }
}
class TextEditUI extends ZUI {
    constructor(editType) {
        super();
        this.editType = editType;
        if (!editType) {
            this.editType = "text";
        }
    }
    setText(text) {
        this.sourceText = text;
        if (this.jq) {
            let html = this.renderTextIntoHTML(text, this.baseText);
            this.jq.html(html);
        }
    }
    getText() {
        if (this.jq) {
            this.sourceText = this.renderHTMLIntoText();
        }
        return this.sourceText;
    }
    setBase(text) {
        this.baseText = text;
        if (this.jq) {
            let html = this.renderTextIntoHTML(this.sourceText, this.baseText);
            this.jq.html(html);
        }
    }
    setF(eif) {
        this.setF_ = eif;
        return this;
    }
    renderTextIntoHTML(text, baseText) {
        let lines = [];
        if (text)
            lines = text.split("\n");
        let rslt = "";
        let ld = null;
        if (baseText) {
            ld = new LineDiff(text, baseText);
        }
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let changeStyles = "";
            if (ld) {
                if (ld.fromLineReplaced(i))
                    changeStyles += " TextEditUI-flr";
                if (ld.fromLineSkipped(i))
                    changeStyles += " TextEditUI-fls";
                if (ld.toLineDeleted(i))
                    changeStyles += " TextEditUI-tld";
            }
            let html = `<div class="TextEditUI-line ${changeStyles}" zel="${i}" contenteditable>${line}</div>`;
            rslt += html;
        }
        this.nLines = lines.length;
        return rslt;
    }
    extractSelection() {
        let sel = document.getSelection();
        let range = sel.getRangeAt(0);
        let startEl = range.startContainer.parentElement;
        let startLine = parseInt(startEl.getAttribute("zel"));
        let startOffset = range.startOffset;
        let endEl = range.endContainer.parentElement;
        let endLine = parseInt(endEl.getAttribute("zel"));
        let endOffset = range.endOffset;
        return { startLine: startLine, startOffset: startOffset, endLine: endLine, endOffset: endOffset };
    }
    renderHTMLIntoText() {
        let rslt = '';
        let first = true;
        this.jq.find("div").each((index, elem) => {
            let html = elem.innerHTML;
            if (first) {
                first = false;
                rslt = html;
            }
            else {
                rslt += "\n" + html;
            }
        });
        return rslt;
    }
    renderJQ() {
        this.getText();
        let val = ZUI.stringVal(this.getF_);
        if (!val)
            val = "";
        this.jq = $(`<div class="TextEditUI-${this.editType} ${this.classStr()}" contenteditable>${val}</div>`);
        this.jq.on("input", (event) => {
            this.afterSel = this.extractSelection();
            this.handleMajorEventChange();
        });
        this.jq.on('keydown', (event) => {
            this.beforeSel = this.extractSelection();
            this.keyCode = event.keyCode;
            this.majorEventInput = false;
            if (event.ctrlKey)
                this.majorEventInput = true;
            if (event.keyCode == 9) {
                event.preventDefault();
                this.handleTab();
            }
            else if (event.keyCode == 13) {
                event.preventDefault();
                this.handleReturn();
            }
        });
        this.jq.on("blur", () => {
            this.majorEventInput = true;
            this.handleMajorEventChange();
        });
        let html = this.renderTextIntoHTML(this.sourceText, this.baseText);
        this.jq.html(html);
        this.applyCSS(this.jq);
        return this.jq;
    }
    handleMajorEventChange() {
        let majorEvent = false;
        let nChildren = this.jq.children.length;
        if (this.nLines != nChildren)
            majorEvent = true;
        if (this.beforeSel.startLine != this.beforeSel.endLine)
            majorEvent = true;
        if (this.afterSel.startLine != this.afterSel.endLine)
            majorEvent = true;
        if (this.beforeSel.endLine != this.afterSel.endLine)
            majorEvent = true;
        if (this.beforeSel.startLine != this.afterSel.startLine)
            majorEvent = true;
        if (!this.keyCode)
            majorEvent = true;
        if (this.majorEventInput)
            majorEvent = true;
        if (majorEvent) {
            if (this.setF_) {
                let text = this.renderHTMLIntoText();
                this.setF_(text);
                this.setText(text);
                let zel = this.afterSel.endLine.toFixed();
                let children = this.jq[0].children;
                let selLineEl = children[this.afterSel.endLine];
                let selLineTxt = selLineEl.innerHTML;
                let range = new Range();
                let offset = this.afterSel.endOffset;
                if (selLineTxt.length < offset) {
                    offset = offset - selLineTxt.length - 1;
                    selLineEl = children[this.afterSel.endLine + 1];
                }
                range.setStart(selLineEl.firstChild, offset);
                range.setEnd(selLineEl.firstChild, offset);
                let sel = document.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
    handleTab() {
        let sel = document.getSelection();
        let r = sel.getRangeAt(0);
        r.deleteContents();
        document.execCommand("insertHTML", false, "\t");
        r.collapse();
    }
    handleReturn() {
        let sel = document.getSelection();
        let r = sel.getRangeAt(0);
        let startLineText = r.startContainer.parentElement.innerHTML;
        let whiteSpace = "";
        let i = 0;
        while (startLineText.charAt(i) <= " " && i < startLineText.length) {
            whiteSpace += startLineText.charAt(i);
            i++;
        }
        r.deleteContents();
        document.execCommand("insertHTML", false, "\r" + whiteSpace);
        r.collapse();
        this.afterSel = this.extractSelection();
        this.majorEventInput = true;
        this.handleMajorEventChange();
    }
}
class TeamsAdmin extends ZUI {
    constructor() {
        super();
        this.content = new DivUI(() => {
            return [
                new ButtonUI("Create Team")
                    .click(() => {
                    this.creatingTeam = true;
                    Team.makeNew("New Team", (err, team) => {
                        if (err) {
                            console.error(err);
                        }
                        else {
                            PageManager.PUSHTO("team", { teamKey: team._key });
                        }
                        this.creatingTeam = false;
                    });
                })
                    .enable(() => !this.creatingTeam),
                new DivUI(() => { return this.teamList(); }),
            ];
        });
    }
    teamList() {
        return [new KeyListUI(() => Team.allTeams())
                .itemView((teamKey) => {
                const team = Team.cGET(teamKey);
                if (!team) {
                    return new TextUI('');
                }
                return new ClickWrapperUI([
                    new TextUI(team.getTeamName())
                ]).click(() => {
                    DB.msg(`edit ${team.getTeamName()}`);
                    PageManager.PUSHTO("team", { teamKey: team._key });
                }).style("TeamListItem");
            })
                .sort((key1, key2) => {
                const t1 = Team.cGET(key1);
                const t2 = Team.cGET(key2);
                if (!t1)
                    return 1;
                if (!t2)
                    return -1;
                return t1.getTeamName().localeCompare(t2.getTeamName());
            })];
    }
}
class PersonsAdmin extends ZUI {
    constructor() {
        super();
        this.content = new DivUI(() => {
            return [
                new ButtonUI("Create Person")
                    .click(() => {
                    const newPerson = new Person({});
                    newPerson.PUT((err, person) => {
                        this.editingPersonKey = person._key;
                        ZUI.notify();
                    });
                }),
                new DivUI(() => { return this.personList(); }),
            ];
        });
    }
    personList() {
        return [new KeyListUI(() => (Person.allPersons()))
                .itemView((personKey) => (new PersonCard(personKey, {
                inEditMode: () => (this.editingPersonKey === personKey),
                onToggleEditMode: (editMode) => {
                    if (editMode) {
                        this.editingPersonKey = personKey;
                    }
                    else {
                        this.editingPersonKey = null;
                    }
                    ZUI.notify();
                },
                onRemove: () => {
                    Person.GET(personKey, (err, person) => {
                        if (!err) {
                            person.DELETE((err) => {
                                ZUI.notify();
                            });
                        }
                    });
                }
            })))
                .sort((key1, key2) => {
                const p1 = Person.cGET(key1);
                const p2 = Person.cGET(key2);
                if (!p1)
                    return 1;
                if (!p2)
                    return -1;
                return p1.getDescription().localeCompare(p2.getDescription());
            })];
    }
}
class HomePage extends Page {
    constructor(pageState) {
        super(pageState);
        this.content = new DivUI([
            new TextUI("Home Page"),
            new TabUI()
                .tab('Teams', new TeamsAdmin())
                .tab('People', new PersonsAdmin())
        ]);
    }
    pageName() {
        return "home";
    }
}
PageManager.registerPageFactory("home", (state) => {
    return new HomePage(state);
});
const defaultPersonCardOptions = {
    size: 'full',
    inEditMode: () => false,
    onToggleEditMode: null,
    onRemove: null,
};
class PersonCard extends ZUI {
    constructor(personKey, options = {}) {
        super();
        const opts = Object.assign(Object.assign({}, defaultPersonCardOptions), options);
        Person.GET(personKey, (err, person) => {
            this.err = err;
            this.person = person;
        });
        if (opts.size === 'full') {
            this.content = new DivUI(() => {
                if (this.err) {
                    return [new DivUI([
                            new TextUI(`Error: ${this.err}`).style('LoadingText'),
                            opts.onRemove && new ClickWrapperUI([
                                new TextUI('✕')
                            ]).click(() => { opts.onRemove(); }).style('LinkText')
                        ]).style('ShadowedCard')];
                }
                if (!this.person) {
                    return [new DivUI([
                            new TextUI('Loading...').style('LoadingText')
                        ]).style('ShadowedCard')];
                }
                return ([
                    new DivUI([
                        new TextUI('First Name:').style('Label'),
                        opts.inEditMode()
                            ? new TextFieldUI().getF(() => this.person.getFirstName()).setF((newName => { this.person.setFirstName(newName); })).placeHolder('Bob').style('Value')
                            : new TextUI(this.person.getFirstName()).style('Value'),
                        new TextUI('Email:').style('Label'),
                        opts.inEditMode()
                            ? new TextFieldUI().getF(() => this.person.getEmail()).setF((newEmail => { this.person.setEmail(newEmail); })).placeHolder('name@example.com').style('Value')
                            : new TextUI(this.person.getEmail()).style('Value'),
                    ]).style('Row'),
                    new DivUI([
                        new TextUI('Last Name:').style('Label'),
                        opts.inEditMode()
                            ? new TextFieldUI().getF(() => this.person.getLastName()).setF((newName => { this.person.setLastName(newName); })).placeHolder('Smith').style('Value')
                            : new TextUI(this.person.getLastName()).style('Value'),
                        new TextUI('Phone:').style('Label'),
                        opts.inEditMode()
                            ? new TextFieldUI().getF(() => this.person.getPhone()).setF((newPhone => { this.person.setPhone(newPhone); })).placeHolder('888-333-4444').style('Value')
                            : new TextUI(this.person.getPhone()).style('Value'),
                    ]).style('Row'),
                    new DivUI([
                        opts.onToggleEditMode
                            ? new ClickWrapperUI([
                                new TextUI('✎')
                            ]).click(() => { opts.onToggleEditMode(!opts.inEditMode()); }).style('LinkText')
                            : new DivUI([]),
                        opts.onRemove
                            ? new ClickWrapperUI([
                                new TextUI('✕')
                            ]).click(() => { opts.onRemove(); }).style('LinkText')
                            : new DivUI([])
                    ]).style('UpperRightActions')
                ]);
            }).style('ShadowedCard');
        }
        else {
            this.content = new DivUI(() => ([
                new TextUI('No one').style('EmptyText')
            ])).style('ShadowedCard');
        }
    }
}
const defaultPersonSelectorOptions = {
    getSelected: () => (''),
    onSelect: () => { },
    nullable: true,
    allowAddNew: true,
    addNewLabel: 'Add New Person'
};
class PersonSelector extends ZUI {
    constructor(options = defaultPersonSelectorOptions) {
        super();
        this.options = Object.assign(Object.assign({}, defaultPersonSelectorOptions), options);
        this.content = new DivUI(() => {
            return [this.makeDropDown()];
        });
    }
    makeDropDown() {
        const personKeys = Person.allPersons();
        const personList = Person.cGETm(personKeys);
        const dropdown = new DropDownChoiceUI()
            .getF(this.options.getSelected)
            .setF(this.handleSelect(this.options));
        const duplicateNames = {};
        personList.forEach((person) => {
            if (person.getFullName() in duplicateNames) {
                duplicateNames[person.getFullName()] = true;
            }
            else {
                duplicateNames[person.getFullName()] = false;
            }
        });
        if (this.options.nullable) {
            dropdown.choice('', '-- Select a Person --');
        }
        personList.forEach((person) => dropdown.choice(person._key, person.getDescription(duplicateNames[person.getFullName()])));
        if (this.options.allowAddNew) {
            dropdown.choice('add-new-person', this.options.addNewLabel);
        }
        return dropdown;
    }
    handleSelect(opts) {
        return (personKey) => {
            if (personKey === 'add-new-person') {
                const newPerson = new Person({});
                newPerson.PUT((err, person) => {
                    opts.onSelect(person._key);
                });
                return;
            }
            opts.onSelect(personKey);
        };
    }
}
class TeamPage extends Page {
    constructor(pageState) {
        super(pageState);
        this.inEditMode = false;
        this.teamKey = pageState.teamKey;
        Team.GET(this.teamKey, (err, team) => {
            this.team = team;
        });
        if (!this.team) {
            this.content = new DivUI([]);
            return;
        }
        this.content = new DivUI(() => ([
            new ClickWrapperUI([new TextUI("< Back")])
                .click(() => {
                history.back();
            }),
            new TextUI("Manage Team"),
            new TextFieldUI()
                .getF(() => this.getTeamName())
                .setF((newName) => { this.setTeamName(newName); })
                .placeHolder("Name of the team"),
            this.team.getCoach()
                ? new PersonCard(this.team.getCoach(), {
                    onToggleEditMode: (mode) => { this.inEditMode = mode; this.notify(); },
                    inEditMode: () => this.inEditMode,
                    onRemove: () => { this.team.setCoach(null); }
                })
                : new PersonSelector({
                    getSelected: () => (this.team.getCoach()),
                    onSelect: (personKey) => { this.setCoach(personKey); },
                    allowAddNew: true
                })
        ]));
    }
    getTeamName() {
        const team = Team.cGET(this.teamKey);
        if (team) {
            return team.getTeamName();
        }
        return '';
    }
    setTeamName(newName) {
        Team.GET(this.teamKey, (err, team) => {
            team.setTeamName(newName);
        });
    }
    setCoach(personKey) {
        Team.GET(this.teamKey, (err, team) => {
            team.setCoach(personKey);
        });
    }
    pageName() {
        return "team";
    }
}
PageManager.registerPageFactory("team", (state) => {
    if (!state.teamKey) {
        PageManager.PUSHTO("home", { Message: "Team Id required to create or edit a team." });
    }
    return new TeamPage(state);
});
let httpSource = new HTTPDataSource(window.location.origin + "/");
let source = new CacheDataSource(httpSource);
DataObj.globalSource = source;
let rm = new AllRightsManager(source);
source.setRightsManager(rm);
ZUI.pageManager = new PageManager(source, new HomePage(null), "#content");

//# sourceMappingURL=client.js.map
