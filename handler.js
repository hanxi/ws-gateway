// prot handler
var handler = {};
var g_protName2Handler = {};

handler.getHandler = function(name) {
    var func = g_protName2Handler[name];
    return func;
}
handler.registerHandler = function(name, func) {
    g_protName2Handler[name] = func;
}
handler.sendProt = function(ws, name, prot) {
    prot.__name = name;
    ws.send(JSON.stringify(prot));
}

module.exports = handler;

