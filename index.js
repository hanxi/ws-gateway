#!/usr/bin/env node

var wsport = process.env.OPENSHIFT_NODEJS_PORT;
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: wsport});
var handler = require('./handler');
var conn = require('./conn');
var errormsg = require("./errormsg");
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        try {
            var prot = JSON.parse(message);
            var func = handler.getHandler(prot.__name);
            if (func) {
                func(ws, prot);
            } else if (conn.isAuthorClient(ws)) {
                var co = conn.getServer();
                if (co) { // transport to server
                    co.ws.send(message);
                } else {
                    errormsg.send(ws, "serveroffline");
                    ws.close();
                }
            } else if (conn.isAuthorServer(ws)) {
                var co = conn.getClient(prot.clientId);
                if (co) {
                    co.ws.send(message);
                } else {
                    errormsg.send(ws, "clientoffline");
                }
            } else {
                errormsg.send(ws, "notauthor");
                ws.close();
            }
        } catch (e) {
            console.log(e);
        }
    });
});
console.log("websocket listen port : " + wsport);

