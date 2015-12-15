var handler = require("./handler");
var errormsg = require("./errormsg");

var conn = {};

var CONN_TYPE_NOT_AUTH = 0;
var CONN_TYPE_SERVER = 1;
var CONN_TYPE_CLIENT = 2;
var serverId2Conn = {};
var clientId2Conn = {};
var clientId2Info = {};
var serverId2Pass = {};

var SERVER_ID = process.env.SERVER_ID || '15374043072';
var SERVER_PASS = process.env.SERVER_PASS || '123456';

serverId2Pass[SERVER_ID] = SERVER_PASS;

conn.addConn = function (ws, id, type) {
    var co = {
        ws:ws,
        id:id,
        type:type
    };
    ws.co = co;
    console.log("addconn");
    if (type==CONN_TYPE_SERVER) {
        serverId2Conn[id] = co;
    } else if (type==CONN_TYPE_CLIENT) {
        clientId2Conn[id] = co;
        broadCastClientState(id, "online");
    }
}

conn.delConn = function (ws) {
    var co = ws.co;
    if (co) {
        if (co.type==CONN_TYPE_SERVER) {
            serverId2Conn[co.id] = null;
        } else if (co.type==CONN_TYPE_CLIENT) {
            clientId2Conn[co.id] = null;
            broadCastClientState(co.id, "offline");
        }
    }
}

var broadCastClientState =  function (clientId, state) {
    var serverId2Conn = conn.getServerList();
    var prot = {};
    prot.phone = clientId;
    prot.state = state;
    for (serverId in serverId2Conn) {
        var co = serverId2Conn[serverId];
        if (co) {
            handler.sendProt(co.ws, "setClientState", prot);
        }
    }
}

conn.isAuthorServer = function (ws) {
    if (ws.co && ws.co.type == CONN_TYPE_SERVER) {
        return true;
    }
    return false;
}

conn.isAuthorClient = function (ws) {
    if (ws.co && ws.co.type == CONN_TYPE_CLIENT) {
        return true;
    }
    return false;
}

var onAuth = function (ws, prot) {
    console.log(prot);

    var id = prot.id;
    var pass = prot.pass;
    var type = prot.type;
    if (type!=CONN_TYPE_CLIENT && type!=CONN_TYPE_SERVER) {
        return ws.close();
    }

    if (type==CONN_TYPE_SERVER) {
        if (serverId2Pass.hasOwnProperty(id) && serverId2Pass[id]==pass) { // TODO: use crypto
            conn.addConn(ws,id,type);
            var prot = {msg:"AUTH OK"}
            handler.sendProt(ws, "authServer",  prot);
        } else {
            errormsg.send(ws, "autherror");
            ws.close();
        }
    } else if (type==CONN_TYPE_CLIENT) {
        var co = conn.getServerList()[0];
        if (clientId2Info.hasOwnProperty(id) && clientId2Info[id].pass==pass) { // TODO: use crypto
            conn.addConn(ws, id, type);
            var prot = {msg:"AUTH OK"}
            handler.sendProt(ws, "auth", prot);
        } else {
            errormsg.send(ws, "autherror");
            ws.close();
        }
    }
}
handler.registerHandler("auth", onAuth);

var getOnlineClient = function (ws, prot) {
    if (!conn.isAuthorServer(ws)) {
        errormsg.send(ws, "notauthor");
        ws.close();
        return;
    }
    sendOnlineClient(ws);
}
handler.registerHandler("getOnlineClient", getOnlineClient);

var sendOnlineClient = function (ws) {
    var phoneList = [];
    for (phone in clientId2Conn) {
        phoneList.push(phone);
    }
    var prot = {
        phoneList: phoneList
    }
    handler.sendProt(ws, "getOnlineClient", prot);
}

var isAdmin = function (ws, prot) {
    if (ws.co && ws.co.type==CONN_TYPE_SERVER && ws.co.id==SERVER_ID) {
        prot.isAdmin = true;
    } else {
        prot.isAdmin = false;
    }
    handler.sendProt(ws, "isAdmin", prot);
}
handler.registerHandler("isAdmin", isAdmin);

var getClientInfos = function (ws, prot) {
    if (!conn.isAuthorServer(ws)) {
        errormsg.send(ws, "notauthor");
        ws.close();
        return;
    }
    sendClientInfos(ws);
}
handler.registerHandler("getClientInfos", getClientInfos);

var sendClientInfos = function(ws) {
    var prot = {};
    prot.clientId2Info = clientId2Info;
    handler.sendProt(ws, "getClientInfos", prot);
}

var setClientInfos = function (ws, prot) {
    if (ws.co && ws.co.type==CONN_TYPE_SERVER && ws.co.id==SERVER_ID) {
        var tmpClientId2Info = prot.clientId2Info;
        for (var clientId in tmpClientId2Info) {
            clientId2Info[clientId] = tmpClientId2Info[clientId];
        }
        handler.sendProt(ws, "setClientInfos", {msg:"设置ClientInfo成功"});

        // 推送新的clientinfos
        var serverId2Conn = conn.getServerList();
        for (serverId in serverId2Conn) {
            if (serverId!==SERVER_ID) {
                var co = serverId2Conn[serverId];
                sendClientInfos(co.ws);
            }
        }
    } else {
        errormsg.send(ws, "error");
    }
}
handler.registerHandler("setClientInfos", setClientInfos);

var getServerPasss = function(ws, prot) {
    if (ws.co && ws.co.type==CONN_TYPE_SERVER && ws.co.id==SERVER_ID) {
        prot.serverId2Pass = serverId2Pass;
        handler.sendProt(ws, "getServerPasss", prot);
    } else {
        errormsg.send(ws, "error");
    }
}
handler.registerHandler("getServerPasss", getServerPasss);

var setServerPasss = function (ws, prot) {
    if (ws.co && ws.co.type==CONN_TYPE_SERVER && ws.co.id==SERVER_ID) {
        serverId2Pass = {};
        serverId2Pass[SERVER_ID]=SERVER_PASS;
        for (var phone in prot.serverId2Pass) {
            if (phone!==SERVER_ID) {
                serverId2Pass[phone] = prot.serverId2Pass[phone];
            }
        }
        handler.sendProt(ws, "setServerPasss", {msg:"设置ServerPasss成功"});
    } else {
        errormsg.send(ws, "error");
    }
}
handler.registerHandler("setServerPasss", setServerPasss);

conn.getClient = function (id) {
    return clientId2Conn[id];
}

conn.getServerList = function (id) {
    if (typeof id === 'undefined') {
        return serverId2Conn;
    } else {
        var obj = {};
        obj[id] = serverId2Conn;
    }
}

module.exports = conn;
