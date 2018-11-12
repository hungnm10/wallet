/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

const crypto = require('crypto');
const http = require('http'), net = require('net'), url = require('url'), fs = require('fs'), querystring = require('querystring');
require("./constant");
global.DATA_PATH = GetNormalPathString(global.DATA_PATH);
global.CODE_PATH = GetNormalPathString(global.CODE_PATH);
require("./library");
global.READ_ONLY_DB = 1;
var LastAlive = new Date() - 0;
setTimeout(function ()
{
    setInterval(CheckAlive, 1000);
}, 20000);
process.on('message', function (msg)
{
    LastAlive = (new Date()) - 0;
    if(msg.cmd === "Exit")
    {
        process.exit(0);
    }
});

function CheckAlive()
{
    var Delta = (new Date()) - LastAlive;
    if(Math.abs(Delta) > CHECK_STOP_CHILD_PROCESS)
    {
        ToLog("HOSTING: ALIVE TIMEOUT Stop and exit: " + Delta + "/" + global.CHECK_STOP_CHILD_PROCESS);
        process.exit(0);
        return ;
    }
};
process.on('uncaughtException', function (err)
{
    ToError(err.stack);
    ToLog(err.stack);
    TO_ERROR_LOG("HOSTING", 777, err);
    ToLog("-----------------HOSTING EXIT------------------");
    process.exit();
});
process.on('error', function (err)
{
    ToError(err.stack);
    ToLog(err.stack);
});
if(!global.HTTP_HOSTING_PORT)
{
    ToLogTrace("global.HTTP_HOSTING_PORT=" + global.HTTP_HOSTING_PORT);
    process.exit();
}
var CServerDB = require("./db/block-db");
var KeyPair = crypto.createECDH('secp256k1');
KeyPair.setPrivateKey(Buffer.from([77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77,
77, 77, 77, 77, 77, 77, 77, 77, 77, 77]));
global.SERVER = new CServerDB(KeyPair, undefined, undefined, false, true);
global.HTTP_PORT_NUMBER = 0;
require("./html-server");
var HostingServer = http.createServer(function (request,response0)
{
    if(!request.headers)
        return ;
    if(!request.socket || !request.socket.remoteAddress)
        return ;
    let RESPONSE = response0;
    var response = {end:function (data)
        {
            try
            {
                RESPONSE.end(data);
            }
            catch(e)
            {
                ToError("H##4");
                ToError(e);
            }
        }, writeHead:function (num,data)
        {
            try
            {
                RESPONSE.writeHead(num, data);
            }
            catch(e)
            {
                ToError("H##5");
                ToError(e);
            }
        }, };
    var fromURL = url.parse(request.url);
    var Path = querystring.unescape(fromURL.path);
    var params = Path.split('/', 6);
    params.splice(0, 1);
    var Type = request.method;
    if(Type === "GET")
    {
        DoCommand(response, Type, Path, params);
    }
    else
    {
        response.end();
    }
}).listen(global.HTTP_HOSTING_PORT, function ()
{
    ToLog("Run Hosting-server on port:" + global.HTTP_HOSTING_PORT);
});
HostingServer.on('error', function (err)
{
    ToError("H##6");
    ToError(err);
});

function DoCommand(response,Type,Path,params,remoteAddress)
{
    var method = params[0];
    method = method.toLowerCase();
    switch(method)
    {
        case "":
            SendFileHTML(response, "./SITE/index.html");
            break;
        default:
            {
                var path = params[params.length - 1];
                if(typeof path !== "string")
                    path = "ErrorPath";
                else
                    if(path.indexOf("..") >= 0 || path.indexOf("\\") >= 0 || path.indexOf("/") >= 0)
                        path = "ErrorFilePath";
                if(path.indexOf(".") < 0)
                    path += ".html";
                var type = Path.substr(Path.length - 3, 3);
                switch(type)
                {
                    case ".js":
                        path = "./SITE/JS/" + path;
                        break;
                    case "css":
                        path = "./SITE/CSS/" + path;
                        break;
                    case "wav":
                    case "mp3":
                        path = "./SITE/SOUND/" + path;
                        break;
                    case "png":
                    case "gif":
                    case "jpg":
                    case "ico":
                        path = "./SITE/PIC/" + path;
                        break;
                    default:
                        path = "./SITE/" + path;
                        break;
                }
                SendFileHTML(response, path, Path);
                break;
            }
    }
};
