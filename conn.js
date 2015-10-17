var handler = require("./handler");
var errormsg = require("./errormsg");

var conn = {};

var CONN_TYPE_NOT_AUTH = 0;
var CONN_TYPE_SERVER = 1;
var CONN_TYPE_CLIENT = 2;
var serverId2Conn = {};
var clientId2Conn = {};

var SERVER_ID = "15303030404";
var SERVER_PASS = "123456";

conn.addConn = function (ws, id, type) {
    var co = {
        ws:ws,
        id:id,
        type:type
    };
    ws.co = co;
    console.log("addconn")
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
        if (SERVER_ID==id && SERVER_PASS==pass) { // TODO: use crypto
            conn.addConn(ws,id,type);
            serverId2Conn[id] = ws.co;
            var prot = {msg:"auth OK."}
            handler.sendProt(ws, "authServer",  prot);
        } else {
            errormsg.send(ws, "autherror");
            ws.close();
        }
    } else if (type==CONN_TYPE_CLIENT) {
        var co = conn.getServer();
        if (co) { // transport to server
            conn.addConn(ws, id, type);
            clientId2Conn[id] = ws.co;
            handler.sendProt(co.ws, "authClient", prot);
        } else {
            errormsg.send(ws, "serveroffline");
            ws.close();
        }
    }
}
handler.registerHandler("auth", onAuth);

var onAuthClient = function (ws, prot) {
    if (!conn.isAuthorServer(ws)) {
        errormsg.send(ws, "notauthor");
        ws.close();
        return;
    }

    var co = conn.getClient(prot.clientId);
    if (co) {
        if (prot.error) {
            errormsg.send(co.ws, "autherror");
            co.ws.close();
        } else {
            handler.sendProt(co.ws, "auth", prot);
        }
    } else {
        errormsg.send(ws, "clientoffline");
    }
}
handler.registerHandler("authClient", onAuthClient);

conn.getClient = function (id) {
    return clientId2Conn[id];
}

conn.getServer = function () {
    return serverId2Conn[SERVER_ID];
}

module.exports = conn;
