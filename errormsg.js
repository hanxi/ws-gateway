var handler = require ("./handler");
var errormsg = {};

errormsg.serveroffline = "服务器不在线";
errormsg.clientoffline = "客户端不在线";
errormsg.autherror = "账号或者密码错误";

errormsg.notauthor = "账号未登陆";

errormsg.send = function (ws, error) {
    var msg = errormsg[error];
    var prot = {msg:msg,error:error};
    handler.sendProt(ws, "error",  prot);
}

module.exports = errormsg;

