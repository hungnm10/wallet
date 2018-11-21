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
global.MAX_STAT_PERIOD = 60;
require("./constant");
global.MAX_STAT_PERIOD = 60;
global.DATA_PATH = GetNormalPathString(global.DATA_PATH);
global.CODE_PATH = GetNormalPathString(global.CODE_PATH);
require("./library");
global.READ_ONLY_DB = 1;
global.MAX_STAT_PERIOD = 60;
var HostNodeList = [];
var NodeBlockChain = [];
var LastAlive = new Date() - 0;
setTimeout(function ()
{
    setInterval(CheckAlive, 1000);
}, 20000);
process.on('message', function (msg)
{
    LastAlive = (new Date()) - 0;
    switch(msg.cmd)
    {
        case "Exit":
            process.exit(0);
            break;
        case "Stat":
            ADD_TO_STAT(msg.Name, msg.Value);
            break;
        case "NodeList":
            HostNodeList = msg.Value;
            break;
        case "NodeBlockChain":
            NodeBlockChain = msg.Value;
            break;
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
require("./transaction-validator");
global.STAT_MODE = 1;
setInterval(PrepareStatEverySecond, 1000);
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
    var DataURL = url.parse(request.url);
    var Params = querystring.parse(DataURL.query);
    var Path = querystring.unescape(DataURL.pathname);
    var ArrPath = Path.split('/', 6);
    Path = ArrPath[ArrPath.length - 1];
    var Type = request.method;
    if(Type === "POST")
    {
        let Response = response;
        let postData = "";
        request.addListener("data", function (postDataChunk)
        {
            if(postData.length < 500 && postDataChunk.length < 500)
                postData += postDataChunk;
        });
        request.addListener("end", function ()
        {
            var Data;
            try
            {
                Data = JSON.parse(postData);
            }
            catch(e)
            {
                Response.writeHead(405, {'Content-Type':'text/html'});
                Response.end("Error data parsing");
            }
            DoCommandNew(response, Type, Path, Data);
        });
    }
    else
    {
        DoCommandNew(response, Type, Path, Params);
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
var WalletFileMap = {};
WalletFileMap["coinlib.js"] = 1;
WalletFileMap["client.js"] = 1;
WalletFileMap["diagram.js"] = 1;
WalletFileMap["sha3.js"] = 1;
WalletFileMap["terahashlib.js"] = 1;
WalletFileMap["crypto-client.js"] = 1;
WalletFileMap["buttons.css"] = 1;
WalletFileMap["style.css"] = 1;
WalletFileMap["wallet.css"] = 1;
WalletFileMap["blockviewer.html"] = 1;
global.HostingCaller = {};

function DoCommandNew(response,Type,Path,Params,remoteAddress)
{
    var method = Path;
    var F = HostingCaller[method];
    if(F)
    {
        response.writeHead(200, {'Content-Type':'text/plain', 'Access-Control-Allow-Origin':"*"});
        var Ret = F(Params);
        try
        {
            var Str = JSON.stringify(Ret);
            response.end(Str);
        }
        catch(e)
        {
            ToLog("ERR PATH:" + Path);
            ToLog(e);
            response.end();
        }
        return ;
    }
    method = method.toLowerCase();
    switch(method)
    {
        case "":
            SendFileHTML(response, "./SITE/index.html", undefined, true);
            break;
        default:
            {
                var path = Path;
                if(typeof path !== "string")
                    path = "ErrorPath";
                else
                    if(path.indexOf("..") >= 0 || path.indexOf("\\") >= 0 || path.indexOf("/") >= 0)
                        path = "ErrorFilePath";
                if(path.indexOf(".") < 0)
                    path += ".html";
                var PrefixPath;
                if(WalletFileMap[path])
                    PrefixPath = "./HTML";
                else
                    PrefixPath = "./SITE";
                var type = Path.substr(Path.length - 3, 3);
                switch(type)
                {
                    case ".js":
                        path = PrefixPath + "/JS/" + path;
                        break;
                    case "css":
                        path = PrefixPath + "/CSS/" + path;
                        break;
                    case "wav":
                    case "mp3":
                        path = PrefixPath + "/SOUND/" + path;
                        break;
                    case "png":
                    case "gif":
                    case "jpg":
                    case "ico":
                        path = PrefixPath + "/PIC/" + path;
                        break;
                    default:
                        path = PrefixPath + "/" + path;
                        break;
                }
                SendFileHTML(response, path, Path);
                break;
            }
    }
};
var MaxCountViewRows = 20;
HostingCaller.GetAccountList = function (Params)
{
    if(Params.CountNum > MaxCountViewRows)
        Params.CountNum = MaxCountViewRows;
    var arr = DApps.Accounts.GetRowsAccounts(ParseNum(Params.StartNum), ParseNum(Params.CountNum));
    return {arr:arr, result:1};
};
HostingCaller.GetBlockList = function (Params)
{
    if(Params.CountNum > MaxCountViewRows)
        Params.CountNum = MaxCountViewRows;
    var arr = SERVER.GetRows(ParseNum(Params.StartNum), ParseNum(Params.CountNum));
    return {arr:arr, result:1};
};
HostingCaller.GetTransactionList = function (Params)
{
    return HostingCaller.GetTransactionAll(Params);
};
HostingCaller.GetTransactionAll = function (Params)
{
    if(Params.CountNum > MaxCountViewRows)
        Params.CountNum = MaxCountViewRows;
    if(Params.Param3)
        Params.BlockNum = Params.Param3;
    var arr = SERVER.GetTrRows(ParseNum(Params.BlockNum), ParseNum(Params.StartNum), ParseNum(Params.CountNum));
    return {arr:arr, result:1};
};
HostingCaller.GetDappList = function (Params)
{
    if(Params.CountNum > MaxCountViewRows)
        Params.CountNum = MaxCountViewRows;
    var arr = DApps.Smart.GetRows(ParseNum(Params.StartNum), ParseNum(Params.CountNum));
    return {arr:arr, result:1};
};
HostingCaller.GetCurrentInfo = function (Params)
{
    var Ret = {result:1, VersionNum:global.UPDATE_CODE_VERSION_NUM, MaxNumBlockDB:SERVER.GetMaxNumBlockDB(), CurBlockNum:GetCurrentBlockNumByTime(),
        MaxAccID:DApps.Accounts.GetMaxAccount(), MaxDappsID:DApps.Smart.GetMaxNum(), FIRST_TIME_BLOCK:FIRST_TIME_BLOCK, };
    if(Params && Params.Diagram == true)
    {
        var arrNames = ["MAX:ALL_NODES", "MAX:HASH_RATE_G"];
        Ret.arr = GET_STATDIAGRAMS(arrNames);
    }
    if(Params && Params.BlockChain == true)
    {
        Ret.BlockChain = NodeBlockChain;
    }
    return Ret;
};
HostingCaller.GetNodeList = function (Params)
{
    var arr = [];
    var MaxNodes = 10;
    var len = HostNodeList.length;
    var UseRandom = 0;
    if(len > MaxNodes)
    {
        UseRandom = 1;
        len = MaxNodes;
    }
    var mapWasAdd = {};
    for(var i = 0; i < len; i++)
    {
        var Item;
        if(UseRandom)
        {
            Item = HostNodeList[random(HostNodeList.length)];
            if(mapWasAdd[Item.addrStr])
            {
                continue;
            }
            mapWasAdd[Item.addrStr] = 1;
        }
        else
        {
            Item = HostNodeList[i];
        }
        var Value = {ip:Item.ip, port:Item.portweb, };
        arr.push(Value);
    }
    return {arr:arr, result:1};
};
setInterval(function ()
{
    global.BlockDB.CloseDBFile("block-header");
    global.BlockDB.CloseDBFile("block-body");
    DApps.Accounts.DBState.CloseDBFile("accounts-state");
    DApps.Smart.DBSmart.CloseDBFile("smart");
}, 500);
