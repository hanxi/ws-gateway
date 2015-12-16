#!/usr/bin/env node

var wsport = (process.env.WSPORT || 9001);
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
                var serverId2Conn = conn.getServerList(prot.serverId);
                for (serverId in serverId2Conn) {
                    var co = serverId2Conn[serverId];
                    if (co) { // transport to server
                        prot.clientId = ws.co.id;
                        co.ws.send(JSON.stringify(prot));
                    } else {
                        errormsg.send(ws, "serveroffline");
                        //ws.close();
                    }
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
    ws.on('close', function close() {
        console.log('disconnected');
        conn.delConn(ws);
    });
             
});
console.log("websocket listen port : " + wsport);


var static = require('node-static');
var fileServer = new static.Server('./public');
var httpport = (process.env.HTTPPORT || 8080);
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(httpport);

console.log("http listen port : " + httpport);

