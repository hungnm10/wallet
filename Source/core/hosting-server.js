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
require("./geo");
global.READ_ONLY_DB = 1;
global.MAX_STAT_PERIOD = 60;
var HostNodeList = [];
var AllNodeList = [];
var NodeBlockChain = [];
var LastAlive = Date.now();
setTimeout(function ()
{
    setInterval(CheckAlive, 1000);
}, 20000);
setInterval(function ()
{
    process.send({cmd:"Alive"});
}, 1000);
process.send({cmd:"online", message:"OK"});
global.ToLog = function (Str)
{
    process.send({cmd:"log", message:Str});
};
process.on('message', function (msg)
{
    LastAlive = Date.now();
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
            AllNodeList = msg.ValueAll;
            break;
        case "NodeBlockChain":
            NodeBlockChain = msg.Value;
            break;
    }
});

function CheckAlive()
{
    var Delta = Date.now() - LastAlive;
    if(Delta > CHECK_STOP_CHILD_PROCESS)
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
    ToError("HOSTING:\n" + err.stack);
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
            if(postData && postData.length && postData.substring(0, 1) === "{")
            {
                try
                {
                    Data = JSON.parse(postData);
                }
                catch(e)
                {
                    Response.writeHead(405, {'Content-Type':'text/html'});
                    Response.end("Error data parsing");
                }
            }
            DoCommandNew(response, Type, Path, Data);
        });
    }
    else
    {
        DoCommandNew(response, Type, Path, Params);
    }
});
HostingServer.on('error', function (err)
{
    if(err.code === 'EADDRINUSE')
    {
        ToLogClient('Port ' + global.HTTP_HOSTING_PORT + ' in use, retrying...');
        HostingServer.Server.close();
        setTimeout(function ()
        {
            RunListenServer();
        }, 5000);
        return ;
    }
    ToError("H##6");
    ToError(err);
});
RunListenServer();
var bWasRun = 0;

function RunListenServer()
{
    ToLogClient("Prepare to run WEB-server on port: " + global.HTTP_HOSTING_PORT);
    HostingServer.listen(global.HTTP_HOSTING_PORT, '0.0.0.0', function ()
    {
        if(!bWasRun)
            ToLogClient("Run WEB-server on port: " + global.HTTP_HOSTING_PORT);
        bWasRun = 1;
    });
};
var WalletFileMap = {};
WalletFileMap["coinlib.js"] = 1;
WalletFileMap["client.js"] = 1;
WalletFileMap["diagram.js"] = 1;
WalletFileMap["sha3.js"] = 1;
WalletFileMap["terahashlib.js"] = 1;
WalletFileMap["wallet-web.js"] = 1;
WalletFileMap["wallet-lib.js"] = 1;
WalletFileMap["crypto-client.js"] = 1;
WalletFileMap["buttons.css"] = 1;
WalletFileMap["style.css"] = 1;
WalletFileMap["wallet.css"] = 1;
WalletFileMap["blockviewer.html"] = 1;
global.HostingCaller = {};

function DoCommandNew(response,Type,Path,Params)
{
    if(Path.substring(0, 1) === "/")
        Path = Path.substring(1);
    var ArrPath = Path.split('/', 3);
    var Method = ArrPath[0];
    var F = HostingCaller[Method];
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
    Method = Method.toLowerCase();
    switch(Method)
    {
        case "":
            SendFileHTML(response, "./SITE/index.html", undefined, true);
            break;
        case "file":
            SendBlockFile(response, ArrPath[1], ArrPath[2]);
            break;
        case "dapp":
            DappTemplateFile(response, ArrPath[1]);
            break;
        case "smart":
            DappSmartCodeFile(response, ArrPath[1]);
            break;
        default:
            {
                var Name = ArrPath[ArrPath.length - 1];
                if(typeof Name !== "string")
                    Name = "ErrorPath";
                else
                    if(Name.indexOf("..") >= 0 || Name.indexOf("\\") >= 0 || Name.indexOf("/") >= 0)
                        Name = "ErrorFilePath";
                if(Name.indexOf(".") < 0)
                    Name += ".html";
                var PrefixPath;
                if(WalletFileMap[Name])
                    PrefixPath = "./HTML";
                else
                    PrefixPath = "./SITE";
                var type = Path.substr(Path.length - 3, 3);
                switch(type)
                {
                    case ".js":
                        Name = PrefixPath + "/JS/" + Name;
                        break;
                    case "css":
                        Name = PrefixPath + "/CSS/" + Name;
                        break;
                    case "wav":
                    case "mp3":
                        Name = PrefixPath + "/SOUND/" + Name;
                        break;
                    case "png":
                    case "gif":
                    case "jpg":
                    case "ico":
                        Name = PrefixPath + "/PIC/" + Name;
                        break;
                    default:
                        Name = PrefixPath + "/" + Name;
                        break;
                }
                SendFileHTML(response, Name, Path);
                break;
            }
    }
};

function SendBlockFile(response,BlockNum,TrNum)
{
    BlockNum = parseInt(BlockNum);
    TrNum = parseInt(TrNum);
    if(BlockNum && TrNum <= MAX_TRANSACTION_COUNT)
    {
        var Block = SERVER.ReadBlockDB(BlockNum);
        if(Block && Block.arrContent)
        {
            var Body = Block.arrContent[TrNum];
            if(Body && Body[0] === global.TYPE_TRANSACTION_FILE)
            {
                var TR = DApps.File.GetObjectTransaction(Body);
                response.writeHead(200, {'Content-Type':TR.ContentType});
                response.end(TR.Data);
            }
        }
    }
    response.writeHead(404, {'Content-Type':'text/html'});
    response.end();
};
var MaxCountViewRows = 20;
HostingCaller.GetAccountList = function (Params)
{
    if(!Params)
        return {result:0};
    if(Params.CountNum > MaxCountViewRows)
        Params.CountNum = MaxCountViewRows;
    if(!Params.CountNum)
        Params.CountNum = 1;
    var arr = DApps.Accounts.GetRowsAccounts(ParseNum(Params.StartNum), ParseNum(Params.CountNum));
    return {result:1, arr:arr};
};
HostingCaller.GetBlockList = function (Params)
{
    if(!Params)
        return {result:0};
    if(Params.CountNum > MaxCountViewRows)
        Params.CountNum = MaxCountViewRows;
    if(!Params.CountNum)
        Params.CountNum = 1;
    var arr = SERVER.GetRows(ParseNum(Params.StartNum), ParseNum(Params.CountNum));
    return {result:1, arr:arr};
};
HostingCaller.GetTransactionList = function (Params)
{
    return HostingCaller.GetTransactionAll(Params);
};
HostingCaller.GetTransactionAll = function (Params)
{
    if(!Params)
        return {result:0};
    if(Params.CountNum > MaxCountViewRows)
        Params.CountNum = MaxCountViewRows;
    if(!Params.CountNum)
        Params.CountNum = 1;
    if(Params.Param3)
        Params.BlockNum = Params.Param3;
    var arr = SERVER.GetTrRows(ParseNum(Params.BlockNum), ParseNum(Params.StartNum), ParseNum(Params.CountNum));
    return {result:1, arr:arr};
};
HostingCaller.GetDappList = function (Params)
{
    if(!Params)
        return {result:0};
    if(Params.CountNum > MaxCountViewRows)
        Params.CountNum = MaxCountViewRows;
    if(!Params.CountNum)
        Params.CountNum = 1;
    var arr = DApps.Smart.GetRows(ParseNum(Params.StartNum), ParseNum(Params.CountNum));
    return {result:1, arr:arr};
};
HostingCaller.GetCurrentInfo = function (Params)
{
    var Ret = {result:1, VersionNum:global.UPDATE_CODE_VERSION_NUM, MaxNumBlockDB:SERVER.GetMaxNumBlockDB(), CurBlockNum:GetCurrentBlockNumByTime(),
        MaxAccID:DApps.Accounts.GetMaxAccount(), MaxDappsID:DApps.Smart.GetMaxNum(), NETWORK:global.NETWORK, CurTime:Date.now(), DELTA_CURRENT_TIME:DELTA_CURRENT_TIME,
        MIN_POWER_POW_TR:MIN_POWER_POW_TR, FIRST_TIME_BLOCK:FIRST_TIME_BLOCK, CONSENSUS_PERIOD_TIME:CONSENSUS_PERIOD_TIME, MIN_POWER_POW_ACC_CREATE:MIN_POWER_POW_ACC_CREATE,
    };
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
    var List;
    if(Params.All)
        List = AllNodeList;
    else
        List = HostNodeList;
    var MaxNodes = 20;
    var len = List.length;
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
            var num = random(List.length);
            Item = List[num];
            if(mapWasAdd[Item.ip])
            {
                continue;
            }
            mapWasAdd[Item.ip] = 1;
        }
        else
        {
            Item = List[i];
        }
        var Value = {ip:Item.ip, port:Item.portweb, };
        if(Params.Geo)
        {
            if(!Item.Geo)
                SetGeoLocation(Item);
            Value.latitude = Item.latitude;
            Value.longitude = Item.longitude;
            Value.name = Item.name;
        }
        arr.push(Value);
    }
    return {result:1, arr:arr};
};
var AccountKeyMap = {};
var LastMaxNum = 0;
HostingCaller.GetAccountListByKey = function (Params)
{
    if(!Params)
        return {result:0};
    var Accounts = DApps.Accounts;
    for(var num = LastMaxNum; true; num++)
    {
        if(Accounts.IsHole(num))
            continue;
        var Data = Accounts.ReadState(num);
        if(!Data)
            break;
        var StrKey = GetHexFromArr(Data.PubKey);
        Data.Next = AccountKeyMap[StrKey];
        AccountKeyMap[StrKey] = Data;
    }
    LastMaxNum = num;
    var arr = [];
    var Item = AccountKeyMap[Params.Key];
    while(Item)
    {
        var Data = Accounts.ReadState(Item.Num);
        if(!Data)
            continue;
        if(!Data.PubKeyStr)
            Data.PubKeyStr = GetHexFromArr(Data.PubKey);
        if(Data.Currency)
            Data.CurrencyObj = DApps.Smart.ReadSimple(Data.Currency);
        if(Data.Value.Smart)
        {
            Data.SmartObj = DApps.Smart.ReadSimple(Data.Value.Smart);
            try
            {
                Data.SmartState = BufLib.GetObjectFromBuffer(Data.Value.Data, Data.SmartObj.StateFormat, {});
                if(typeof Data.SmartState === "object")
                    Data.SmartState.Num = Item.Num;
            }
            catch(e)
            {
                Data.SmartState = {};
            }
        }
        arr.unshift(Data);
        Item = Item.Next;
        if(arr.length >= 30)
            break;
    }
    return {result:1, arr:arr};
};
HostingCaller.SendTransactionHex = function (Params)
{
    if(!Params || !Params.Hex)
        return {result:0};
    process.send({cmd:"SendTransactionHex", Value:Params.Hex});
    return {result:1, text:"OK"};
};
setInterval(function ()
{
    var Accounts = DApps.Accounts;
    if(SERVER)
        SERVER.ClearBufMap();
    Accounts.DBState.ClearBufMap();
    DApps.Smart.DBSmart.ClearBufMap();
    global.BlockDB.CloseDBFile("block-header");
    global.BlockDB.CloseDBFile("block-body");
    Accounts.DBState.CloseDBFile("accounts-state");
    DApps.Smart.DBSmart.CloseDBFile("smart");
    Accounts.DBActPrev.CloseDBFile(Accounts.DBActPrev.FileName);
    Accounts.DBAct.CloseDBFile(Accounts.DBAct.FileName);
}, 500);
setInterval(function ()
{
    var MaxNumBlockDB = SERVER.GetMaxNumBlockDB();
    var arr = SERVER.GetStatBlockchain("POWER_BLOCKCHAIN", 100);
    if(arr.length)
    {
        var SumPow = 0;
        var Count = 0;
        for(var i = arr.length - 100; i < arr.length; i++)
            if(arr[i])
            {
                SumPow += arr[i];
                Count++;
            }
        var AvgPow = SumPow / Count;
        var HashRate = Math.pow(2, AvgPow) / 1024 / 1024 / 1024;
        ADD_TO_STAT("MAX:HASH_RATE_G", HashRate);
    }
    var Count = COUNT_BLOCK_PROOF + 16 - 1;
    if(MaxNumBlockDB > Count)
    {
        var StartNum = MaxNumBlockDB - Count;
        var BufWrite = SERVER.BlockChainToBuf(StartNum, StartNum, MaxNumBlockDB);
        NodeBlockChain = BufWrite;
    }
}, 1000);
