/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * Web: http://terafoundation.org
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

"use strict";
require("./crypto-library");
require("./log.js");
const crypto = require('crypto');
const os = require('os');
const http = require('http'), net = require('net'), url = require('url'), fs = require('fs'), querystring = require('querystring');
var ContenTypeMap = {};
ContenTypeMap["js"] = "application/javascript";
ContenTypeMap["css"] = "text/css";
ContenTypeMap["wav"] = "audio/wav";
ContenTypeMap["mp3"] = "audio/mpeg";
ContenTypeMap["ico"] = "image/vnd.microsoft.icon";
ContenTypeMap["png"] = "image/png";
ContenTypeMap["gif"] = "image/gif";
ContenTypeMap["jpg"] = "image/jpeg";
ContenTypeMap["html"] = "text/html";
ContenTypeMap["txt"] = "text/plain";
ContenTypeMap["csv"] = "text/csv";
ContenTypeMap[""] = "application/octet-stream";
ContenTypeMap["zip"] = "application/zip";
ContenTypeMap["pdf"] = "application/pdf";
ContenTypeMap[".js"] = "application/javascript";
ContenTypeMap["tml"] = "text/html";
global.HTTPCaller = {};

function DoCommand(response,Type,Path,params,remoteAddress)
{
    var F = HTTPCaller[params[0]];
    if(F)
    {
        if(Type !== "POST")
        {
            response.end();
            return ;
        }
        response.writeHead(200, {'Content-Type':'text/plain'});
        var Ret = F(params[1]);
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
    var method = params[0];
    method = method.toLowerCase();
    switch(method)
    {
        case "":
            SendFileHTML(response, "./HTML/wallet.html");
            break;
        case "dapp":
            DappTemplateFile(response, params[1]);
            break;
        case "smart":
            DappSmartCodeFile(response, params[1]);
            break;
        case "file":
            SendBlockFile(response, params[1], params[2]);
            break;
        default:
            {
                if(Path.indexOf(".") ===  - 1)
                    ToError("Error path:" + Path + "  remoteAddress=" + remoteAddress);
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
                        path = "./HTML/JS/" + path;
                        break;
                    case "css":
                        path = "./HTML/CSS/" + path;
                        break;
                    case "wav":
                    case "mp3":
                        path = "./HTML/SOUND/" + path;
                        break;
                    case "png":
                    case "gif":
                    case "jpg":
                    case "ico":
                        path = "./HTML/PIC/" + path;
                        break;
                    default:
                        path = "./HTML/" + path;
                        break;
                }
                SendFileHTML(response, path, Path);
                break;
            }
    }
};
global.DappTemplateFile = DappTemplateFile;

function DappTemplateFile(response,StrNum)
{
    var Num = parseInt(StrNum);
    if(Num && Num <= DApps.Smart.GetMaxNum())
    {
        var Data = DApps.Smart.ReadSmart(Num);
        if(Data)
        {
            response.writeHead(200, {'Content-Type':'text/html', "X-Frame-Options":"sameorigin"});
            var Str = fs.readFileSync("HTML/dapp-frame.html", {encoding:"utf8"});
            Str = Str.replace(/#template-number#/g, StrNum);
            Str = Str.replace(/#template-name#/g, Data.Name);
            response.end(Str);
            return ;
        }
    }
    response.writeHead(404, {'Content-Type':'text/html'});
    response.end();
};
global.DappSmartCodeFile = DappSmartCodeFile;

function DappSmartCodeFile(response,StrNum)
{
    var Num = parseInt(StrNum);
    if(Num && Num <= DApps.Smart.GetMaxNum())
    {
        var Data = DApps.Smart.ReadSmart(Num);
        if(Data)
        {
            response.writeHead(200, {'Content-Type':'application/javascript'});
            response.end(Data.Code);
            return ;
        }
    }
    response.writeHead(404, {'Content-Type':'text/html'});
    response.end();
};
HTTPCaller.DappSmartHTMLFile = function (Params)
{
    var Data = DApps.Smart.ReadSmart(Params.Smart);
    if(Data)
    {
        if(Params.DebugPath)
        {
            ToLog("Load: " + Params.DebugPath);
            Data.HTML = fs.readFileSync(Params.DebugPath, {encoding:"utf8"});
        }
        return {result:1, Body:Data.HTML};
    }
    return {result:0};
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
                if(TR.ContentType.indexOf("html") ==  - 1)
                {
                    response.writeHead(200, {'Content-Type':TR.ContentType});
                    response.end(TR.Data);
                    return ;
                }
                else
                {
                }
            }
        }
    }
    response.writeHead(404, {'Content-Type':'text/html'});
    response.end();
};
HTTPCaller.DappBlockFile = function (Params)
{
    Params.BlockNum = parseInt(Params.BlockNum);
    Params.TrNum = parseInt(Params.TrNum);
    if(!Params.TrNum)
        Params.TrNum = 0;
    if(Params.BlockNum && Params.TrNum <= MAX_TRANSACTION_COUNT)
    {
        var Block = SERVER.ReadBlockDB(Params.BlockNum);
        if(Block && Block.arrContent)
        {
            var Body = Block.arrContent[Params.TrNum];
            if(Body)
            {
                var Type = Body[0];
                if(Type === global.TYPE_TRANSACTION_FILE)
                {
                    var TR = DApps.File.GetObjectTransaction(Body);
                    return {result:1, Type:Type, ContentType:TR.ContentType, Name:TR.Name, Body:TR.Data.toString('utf8')};
                }
                else
                {
                    var App = DAppByType[Type];
                    if(App)
                    {
                        Body = JSON.parse(App.GetScriptTransaction(Body));
                    }
                    return {result:1, Type:Type, Body:Body};
                }
            }
        }
    }
    return {result:0};
};
var glBlock0;
HTTPCaller.DappCall = function (Data)
{
    DApps.Accounts.BeginBlock();
    DApps.Accounts.BeginTransaction();
    global.TickCounter = 1000000;
    var Account = DApps.Accounts.ReadStateTR(Data.Account);
    if(!Account)
    {
        return {result:0, RetValue:"Error account Num: " + Data.Account};
    }
    if(!glBlock0)
        glBlock0 = SERVER.ReadBlockHeaderDB(0);
    var RetValue;
    try
    {
        RetValue = RunSmartMethod(glBlock0, Account.Value.Smart, Account, 0, 0, undefined, Data.MethodName, Data.Params, 1);
    }
    catch(e)
    {
        return {result:0, RetValue:"" + e};
    }
    return {result:1, RetValue:RetValue};
};
HTTPCaller.DappInfo = function (Params)
{
    var Account, Smart = DApps.Smart.ReadSimple(Params.Smart);
    if(Smart)
    {
        delete Smart.HTML;
        delete Smart.Code;
        Account = DApps.Accounts.ReadState(Smart.Account);
        try
        {
            Account.SmartState = BufLib.GetObjectFromBuffer(Account.Value.Data, Smart.StateFormat, {});
            if(typeof Account.SmartState === "object")
                Account.SmartState.Num = Account.Num;
        }
        catch(e)
        {
            Account.SmartState = {};
        }
    }
    var WLData = HTTPCaller.DappWalletList(Params);
    var Ret = {result:1, Smart:Smart, Account:Account, BlockNumDB:SERVER.BlockNumDB, CurBlockNum:GetCurrentBlockNumByTime(), MaxAccID:DApps.Accounts.GetMaxAccount(),
        MaxDappsID:DApps.Smart.GetMaxNum(), CurTime:Date.now(), DELTA_CURRENT_TIME:DELTA_CURRENT_TIME, MIN_POWER_POW_TR:MIN_POWER_POW_TR,
        FIRST_TIME_BLOCK:FIRST_TIME_BLOCK, CONSENSUS_PERIOD_TIME:CONSENSUS_PERIOD_TIME, MIN_POWER_POW_ACC_CREATE:MIN_POWER_POW_ACC_CREATE,
        WalletList:WLData.arr, WalletIsOpen:(WALLET.WalletOpen !== false), WalletCanSign:(WALLET.WalletOpen !== false && WALLET.KeyPair.WasInit),
        PubKey:WALLET.KeyPair.PubKeyStr, ArrLog:ArrLogClient, PRICE_DAO:PRICE_DAO(SERVER.BlockNumDB), };
    return Ret;
};
HTTPCaller.DappWalletList = function (Params)
{
    var arr0 = DApps.Accounts.GetWalletAccountsByMap(WALLET.AccountMap);
    var arr = [];
    for(var i = 0; i < arr0.length; i++)
    {
        if(arr0[i].Value.Smart === Params.Smart)
        {
            arr.push(arr0[i]);
        }
    }
    var Ret = {result:1, arr:arr, };
    return Ret;
};
HTTPCaller.DappAccountList = function (Params)
{
    var arr = DApps.Accounts.GetRowsAccounts(Params.StartNum, Params.CountNum, undefined, 1);
    return {arr:arr, result:1};
};
HTTPCaller.DappSmartList = function (Params)
{
    var arr = DApps.Smart.GetRows(Params.StartNum, Params.CountNum, undefined, undefined, Params.GetAllData, Params.TokenGenerate);
    return {arr:arr, result:1};
};
HTTPCaller.DappBlockList = function (Params)
{
    var arr = SERVER.GetRows(Params.StartNum, Params.CountNum);
    return {arr:arr, result:1};
};
HTTPCaller.DappTransactionList = function (Params)
{
    var arr = SERVER.GetTrRows(Params.BlockNum, Params.StartNum, Params.CountNum);
    return {arr:arr, result:1};
};
HTTPCaller.LoopEvent = function (Params)
{
    if(!global.TX_PROCESS || !global.TX_PROCESS.Worker)
        return {result:0};
    global.TX_PROCESS.Worker.send({cmd:"SetSmartEvent", Smart:Params.Smart});
    var Arr = global.EventMap[Params.Smart];
    global.EventMap[Params.Smart] = [];
    if(!Arr || Arr.length === 0)
    {
        return {result:0};
    }
    return {arr:Arr, result:1};
};
var sessionid = GetHexFromAddres(crypto.randomBytes(20));
HTTPCaller.RestartNode = function (Params)
{
    global.RestartNode();
    return {result:1};
};
HTTPCaller.ToLogServer = function (Str)
{
    ToLogClient(Str);
    return {result:1};
};
HTTPCaller.FindMyAccounts = function (Params)
{
    WALLET.FindMyAccounts();
    return {result:1};
};
HTTPCaller.GetAccount = function (id)
{
    id = parseInt(id);
    var arr = DApps.Accounts.GetRowsAccounts(id, 1);
    return {Item:arr[0], result:1};
};
HTTPCaller.GetAccountList = function (Params)
{
    if(!Params.CountNum)
        Params.CountNum = 1;
    var arr = DApps.Accounts.GetRowsAccounts(Params.StartNum, Params.CountNum, Params.Filter);
    return {arr:arr, result:1};
};
HTTPCaller.GetDappList = function (Params)
{
    if(!Params.CountNum)
        Params.CountNum = 1;
    var arr = DApps.Smart.GetRows(Params.StartNum, Params.CountNum, Params.Filter, Params.Filter2);
    return {arr:arr, result:1};
};
HTTPCaller.GetBlockList = function (Params)
{
    if(!Params.CountNum)
        Params.CountNum = 1;
    var arr = SERVER.GetRows(Params.StartNum, Params.CountNum, Params.Filter);
    return {arr:arr, result:1};
};
HTTPCaller.GetTransactionAll = function (Params)
{
    if(!Params.CountNum)
        Params.CountNum = 1;
    var arr = SERVER.GetTrRows(Params.Param3, Params.StartNum, Params.CountNum, Params.Filter);
    return {arr:arr, result:1};
};
HTTPCaller.GetActList = function (Params)
{
    var arr = DApps.Accounts.GetActList(Params.StartNum, Params.CountNum, Params.Filter);
    return {arr:arr, result:1};
};
HTTPCaller.GetHashList = function (Params)
{
    var arr = DApps.Accounts.DBAccountsHash.GetRows(Params.StartNum, Params.CountNum, Params.Filter);
    for(var i = 0; i < arr.length; i++)
    {
        var item = arr[i];
        var Block = SERVER.ReadBlockHeaderDB(item.BlockNum);
        if(Block)
            item.TrDataLen = Block.TrDataLen;
    }
    return {arr:arr, result:1};
};
HTTPCaller.GetHistoryAct = function (Params)
{
    var arr = WALLET.GetHistory(Params.StartNum, Params.CountNum, Params.Filter);
    return {arr:arr, result:1};
};
var LastTimeGetHashRate = 0;
var LastHashRate = 0;
var HashRateOneSec = 0;
HTTPCaller.GetWalletInfo = function ()
{
    var Constants = {};
    for(var i = 0; i < global.CONST_NAME_ARR.length; i++)
    {
        var key = global.CONST_NAME_ARR[i];
        Constants[key] = global[key];
    }
    var MaxHistory = WALLET.GetHistoryMaxNum();
    var Delta = (new Date) - LastTimeGetHashRate;
    if(Delta >= 1000)
    {
        if(Delta < 1100)
            HashRateOneSec = global.HASH_RATE - LastHashRate;
        LastHashRate = global.HASH_RATE;
        LastTimeGetHashRate = (new Date) - 0;
    }
    var StateTX = DApps.Accounts.DBStateTX.Read(0);
    var TXBlockNum = 0;
    if(StateTX)
        TXBlockNum = StateTX.BlockNum;
    var Ret = {result:1, WalletOpen:WALLET.WalletOpen, WalletIsOpen:(WALLET.WalletOpen !== false), WalletCanSign:(WALLET.WalletOpen !== false && WALLET.KeyPair.WasInit),
        CODE_VERSION:CODE_VERSION, VersionNum:global.UPDATE_CODE_VERSION_NUM, RelayMode:SERVER.RelayMode, BlockNumDB:SERVER.BlockNumDB,
        CurBlockNum:GetCurrentBlockNumByTime(), CurTime:Date.now(), IsDevelopAccount:IsDeveloperAccount(WALLET.PubKeyArr), AccountMap:WALLET.AccountMap,
        ArrLog:ArrLogClient, MaxAccID:DApps.Accounts.GetMaxAccount(), MaxActNum:DApps.Accounts.GetActsMaxNum(), MaxDappsID:DApps.Smart.GetMaxNum(),
        NeedRestart:global.NeedRestart, ip:SERVER.ip, port:SERVER.port, NET_WORK_MODE:global.NET_WORK_MODE, INTERNET_IP_FROM_STUN:global.INTERNET_IP_FROM_STUN,
        HistoryMaxNum:MaxHistory, DELTA_CURRENT_TIME:DELTA_CURRENT_TIME, FIRST_TIME_BLOCK:FIRST_TIME_BLOCK, CONSENSUS_PERIOD_TIME:CONSENSUS_PERIOD_TIME,
        MIN_POWER_POW_ACC_CREATE:MIN_POWER_POW_ACC_CREATE, DATA_PATH:(DATA_PATH.substr(1, 1) === ":" ? DATA_PATH : GetNormalPathString(process.cwd() + "/" + DATA_PATH)),
        NodeAddrStr:SERVER.addrStr, STAT_MODE:global.STAT_MODE, HTTPPort:global.HTTP_PORT_NUMBER, HTTPPassword:HTTP_PORT_PASSWORD,
        CONSTANTS:Constants, CheckPointBlockNum:CHECK_POINT.BlockNum, MiningAccount:global.GENERATE_BLOCK_ACCOUNT, CountMiningCPU:GetCountMiningCPU(),
        CountRunCPU:global.ArrMiningWrk.length, MiningPaused:global.MiningPaused, HashRate:HashRateOneSec, MIN_POWER_POW_TR:MIN_POWER_POW_TR,
        PRICE_DAO:PRICE_DAO(SERVER.BlockNumDB), NWMODE:global.NWMODE, PERIOD_ACCOUNT_HASH:PERIOD_ACCOUNT_HASH, MAX_ACCOUNT_HASH:DApps.Accounts.DBAccountsHash.GetMaxNum(),
        TXBlockNum:TXBlockNum, };
    Ret.PrivateKey = WALLET.KeyPair.PrivKeyStr;
    Ret.PublicKey = WALLET.KeyPair.PubKeyStr;
    return Ret;
};
HTTPCaller.GetWalletAccounts = function ()
{
    var Ret = {result:1, arr:DApps.Accounts.GetWalletAccountsByMap(WALLET.AccountMap), };
    Ret.PrivateKey = WALLET.KeyPair.PrivKeyStr;
    Ret.PublicKey = WALLET.KeyPair.PubKeyStr;
    return Ret;
};
HTTPCaller.SetWalletKey = function (PrivateKeyStr)
{
    WALLET.SetPrivateKey(PrivateKeyStr, true);
    return {result:1};
};
HTTPCaller.SetWalletPasswordNew = function (Password)
{
    WALLET.SetPasswordNew(Password);
    return {result:1};
};
HTTPCaller.OpenWallet = function (Password)
{
    var res = WALLET.OpenWallet(Password);
    return {result:res};
};
HTTPCaller.CloseWallet = function ()
{
    var res = WALLET.CloseWallet();
    return {result:res};
};
HTTPCaller.GetSignTransaction = function (TR)
{
    var Sign = WALLET.GetSignTransaction(TR);
    return {Sign:Sign, result:1};
};
HTTPCaller.GetSignFromHEX = function (Params)
{
    var Arr = GetArrFromHex(Params.Hex);
    var Sign;
    if(Params.Account)
        Sign = WALLET.GetSignFromArr(Arr, WALLET.AccountMap[Params.Account]);
    else
        Sign = WALLET.GetSignFromArr(Arr);
    return {Sign:Sign, result:1};
};
var AddTrMap = {};
AddTrMap[ - 4] = "Bad type transaction";
AddTrMap[ - 3] = "Bad time";
AddTrMap[ - 2] = "Bad PoW";
AddTrMap[ - 1] = "Bad length";
AddTrMap[0] = "Not add";
AddTrMap[1] = "OK";
AddTrMap[2] = "Update OK";
AddTrMap[3] = "Was send";
AddTrMap[4] = "Added to time pool";
HTTPCaller.SendTransactionHex = function (Params)
{
    var body = GetArrFromHex(Params.Hex);
    var Result = {result:1};
    var Res = WALLET.AddTransaction({body:body, ToAll:1});
    Result.sessionid = sessionid;
    Result.text = AddTrMap[Res];
    var final = false;
    if(Res < 1 && Res >  - 3)
        final = true;
    ToLogClient("Send: " + Result.text, GetHexFromArr(shaarr(body)), final);
    return Result;
};
HTTPCaller.SendDirectCode = function (StrCommand)
{
    var Result;
    try
    {
        var ret = eval(StrCommand);
        Result = JSON.stringify(ret, "", 4);
    }
    catch(e)
    {
        Result = "" + e;
    }
    var Struct = {result:1, sessionid:sessionid, text:Result};
    return Struct;
};
HTTPCaller.SetMining = function (MiningAccount)
{
    WALLET.SetMiningAccount(parseInt(MiningAccount));
    return {result:1};
};

function CheckCorrectDevKey()
{
    if(WALLET.WalletOpen === false)
    {
        var StrErr = "Not open wallet";
        ToLogClient(StrErr);
        return {result:0, text:StrErr};
    }
    if(!IsDeveloperAccount(WALLET.PubKeyArr))
    {
        var StrErr = "Not developer key";
        ToLogClient(StrErr);
        return {result:0, text:StrErr};
    }
    return true;
};
HTTPCaller.SendECode = function (Param)
{
    var Ret = CheckCorrectDevKey();
    if(Ret !== true)
        return Ret;
    if(Param.All)
    {
        SERVER.ConnectToAll();
        var arr = SERVER.GetActualNodes();
        for(var i = 0; i < arr.length; i++)
        {
            var Node = arr[i];
            SERVER.SendECode(Param, Node);
        }
        return {result:1, text:"Sent to " + arr.length + " nodes"};
    }
    var Node = FindNodeByAddr(Param.Addr, 1);
    if(Node === undefined)
        return {result:0, text:"Node not found"};
    if(Node === false)
        return {result:0, text:"Node not active - reconnect"};
    SERVER.SendECode(Param, Node);
    return {result:1, text:"Send"};
};
HTTPCaller.SetCheckPoint = function (BlockNum)
{
    var Ret = CheckCorrectDevKey();
    if(Ret !== true)
        return Ret;
    if(!BlockNum)
        BlockNum = SERVER.BlockNumDB;
    else
        BlockNum = parseInt(BlockNum);
    if(SetCheckPointOnBlock(BlockNum))
        return {result:1, text:"Set check point on BlockNum=" + BlockNum};
    else
        return {result:0, text:"Error on check point BlockNum=" + BlockNum};
};

function SetCheckPointOnBlock(BlockNum)
{
    if(WALLET.WalletOpen === false)
        return 0;
    var Block = SERVER.ReadBlockHeaderDB(BlockNum);
    if(!Block)
        return 0;
    var SignArr = arr2(Block.Hash, GetArrFromValue(Block.BlockNum));
    var Sign = secp256k1.sign(shabuf(SignArr), WALLET.KeyPair.getPrivateKey('')).signature;
    global.CHECK_POINT = {BlockNum:BlockNum, Hash:Block.Hash, Sign:Sign};
    SERVER.ResetNextPingAllNode();
    return 1;
};
global.SetCheckPointOnBlock = SetCheckPointOnBlock;
var idSetTimeSetCheckPoint;
HTTPCaller.SetAutoCheckPoint = function (Param)
{
    var Ret = CheckCorrectDevKey();
    if(Ret !== true)
        return Ret;
    if(idSetTimeSetCheckPoint)
        clearInterval(idSetTimeSetCheckPoint);
    idSetTimeSetCheckPoint = undefined;
    if(Param.Set)
        idSetTimeSetCheckPoint = setInterval(RunSetCheckPoint, Param.Period * 1000);
    return {result:1, text:"AutoCheck: " + Param.Set + " each " + Param.Period + " sec"};
};
var SumCheckPow = 0;
var CountCheckPow = 0;

function RunSetCheckPoint()
{
    if(!SERVER.BlockNumDB)
        return ;
    if(SERVER.BlockNumDB < 2100000)
        return ;
    var Delta = GetCurrentBlockNumByTime() - SERVER.BlockNumDB;
    if(Delta > 16)
        return ;
    var BlockNum = SERVER.BlockNumDB - global.CheckPointDelta;
    var Block = SERVER.ReadBlockHeaderDB(BlockNum);
    if(Block)
    {
        var Power = GetPowPower(Block.PowHash);
        if(Power < 30)
        {
            ToLog("CANNOT SET CHECK POINT Power=" + Power + "  BlockNum=" + BlockNum);
            return ;
        }
        CountCheckPow++;
        SumCheckPow += Power;
        var AvgPow = SumCheckPow / CountCheckPow;
        if(CountCheckPow > 10)
        {
            if(Power < AvgPow - 2)
            {
                ToLog("**************** CANNOT SET CHECK POINT Power=" + Power + "/" + AvgPow + "  BlockNum=" + BlockNum);
                return ;
            }
        }
        SetCheckPointOnBlock(BlockNum);
        ToLog("SET CHECK POINT Power=" + Power + "/" + AvgPow + "  BlockNum=" + BlockNum);
    }
};
HTTPCaller.SetNewCodeVersion = function (Data)
{
    var Ret = CheckCorrectDevKey();
    if(Ret !== true)
        return Ret;
    var Ret = SERVER.SetNewCodeVersion(Data, WALLET.KeyPair.getPrivateKey(''));
    SERVER.ResetNextPingAllNode();
    return {result:1, text:Ret};
};
HTTPCaller.SetCheckDeltaTime = function (Data)
{
    var Ret = CheckCorrectDevKey();
    if(Ret !== true)
        return Ret;
    if(!Data || !Data.Num)
    {
        ToLogClient("Num not set");
        return {result:0};
    }
    var SignArr = SERVER.GetSignCheckDeltaTime(Data);
    Data.Sign = secp256k1.sign(shabuf(SignArr), WALLET.KeyPair.getPrivateKey('')).signature;
    global.CHECK_DELTA_TIME = Data;
    SERVER.ResetNextPingAllNode();
    return {result:1, text:"Set check time Num=" + Data.Num};
};
var idAutoCorrTime;
HTTPCaller.SetAutoCorrTime = function (bSet)
{
    var Ret = CheckCorrectDevKey();
    if(Ret !== true)
        return Ret;
    if(idAutoCorrTime)
        clearInterval(idAutoCorrTime);
    idAutoCorrTime = undefined;
    if(bSet)
        idAutoCorrTime = setInterval(RunAutoCorrTime, 1000);
    return {result:1, text:"Auto correct: " + bSet};
};
var StartCheckTimeNum = 0;

function RunAutoCorrTime()
{
    if(WALLET.WalletOpen === false)
        return ;
    if(GetCurrentBlockNumByTime() > StartCheckTimeNum && Math.abs(global.DELTA_CURRENT_TIME) >= 120)
    {
        var AutoDelta =  - Math.trunc(global.DELTA_CURRENT_TIME);
        var Data = {Num:GetCurrentBlockNumByTime(), bUse:1, bAddTime:1};
        if(AutoDelta < 0)
        {
            AutoDelta =  - AutoDelta;
            Data.bAddTime = 0;
        }
        Data.DeltaTime = 40;
        Data.StartBlockNum = Data.Num + 5;
        Data.EndBlockNum = Data.StartBlockNum + Math.trunc(AutoDelta / Data.DeltaTime);
        var SignArr = SERVER.GetSignCheckDeltaTime(Data);
        Data.Sign = secp256k1.sign(shabuf(SignArr), WALLET.KeyPair.getPrivateKey('')).signature;
        global.CHECK_DELTA_TIME = Data;
        SERVER.ResetNextPingAllNode();
        StartCheckTimeNum = Data.EndBlockNum + 1;
        ToLog("Auto corr time Num:" + Data.Num + " AutoDelta=" + AutoDelta);
    }
};
HTTPCaller.SaveConstant = function (SetObj)
{
    var WasUpdate = global.USE_AUTO_UPDATE;
    for(var key in SetObj)
    {
        global[key] = SetObj[key];
    }
    SAVE_CONST(true);
    SERVER.DO_CONSTANT();
    if(!WasUpdate && global.USE_AUTO_UPDATE && CODE_VERSION.VersionNum && global.UPDATE_CODE_VERSION_NUM < CODE_VERSION.VersionNum)
    {
        SERVER.UseCode(CODE_VERSION.VersionNum, true);
    }
    if(SetObj.DoRestartNode)
        global.RestartNode();
    else
    {
        if(SetObj.DoMining)
            global.RunStopPOWProcess();
    }
    return {result:1};
};
HTTPCaller.SetHTTPParams = function (SetObj)
{
    global.HTTP_PORT_NUMBER = SetObj.HTTPPort;
    global.HTTP_PORT_PASSWORD = SetObj.HTTPPassword;
    SAVE_CONST(true);
    if(SetObj.DoRestartNode)
        global.RestartNode();
    return {result:1};
};
HTTPCaller.SetNetMode = function (SetObj)
{
    if(!global.NET_WORK_MODE)
        global.NET_WORK_MODE = {};
    for(var key in SetObj)
    {
        global.NET_WORK_MODE[key] = SetObj[key];
    }
    if(NET_WORK_MODE)
    {
        global.START_IP = NET_WORK_MODE.ip;
        global.START_PORT_NUMBER = NET_WORK_MODE.port;
    }
    SAVE_CONST(true);
    if(SetObj.DoRestartNode)
        global.RestartNode();
    return {result:1};
};
HTTPCaller.GetAccountKey = function (Num)
{
    var Result = {};
    Result.result = 0;
    var KeyPair = WALLET.GetAccountKey(Num);
    if(KeyPair)
    {
        Result.result = 1;
        Result.PubKeyStr = GetHexFromArr(KeyPair.getPublicKey('', 'compressed'));
    }
    return Result;
};
HTTPCaller.GetHotArray = function (Param)
{
    var ArrTree = SERVER.GetTransferTree();
    if(!ArrTree)
        return {result:0};
    for(var Level = 0; Level < ArrTree.length; Level++)
    {
        var arr = ArrTree[Level];
        if(arr)
            for(var n = 0; n < arr.length; n++)
            {
                arr[n].GetTiming = 0;
            }
    }
    var BlockCounts = 0;
    if(Param && Param.CountBlock)
        for(var i = SERVER.CurrentBlockNum - Param.CountBlock; i <= SERVER.CurrentBlockNum - Param.CountBlock; i++)
        {
            var Block = SERVER.GetBlock(i);
            if(!Block || !Block.Active || !Block.LevelsTransfer)
            {
                continue;
            }
            BlockCounts++;
            for(var n = 0; n < Block.LevelsTransfer.length; n++)
            {
                var Transfer = Block.LevelsTransfer[n];
                for(var Addr in Transfer.TransferNodes)
                {
                    var Item = Transfer.TransferNodes[Addr];
                    Item.Node.GetTiming += Item.GetTiming;
                }
            }
        }
    for(var Level = 0; Level < ArrTree.length; Level++)
    {
        var arr = ArrTree[Level];
        if(!arr)
            continue;
        arr.sort(SortNodeHot);
        for(var n = 0; n < arr.length; n++)
        {
            arr[n] = GetCopyNode(arr[n], BlockCounts);
        }
    }
    
function SortNodeHot(a,b)
    {
        if(b.Hot !== a.Hot)
            return b.Hot - a.Hot;
        if(b.BlockProcessCount !== a.BlockProcessCount)
            return b.BlockProcessCount - a.BlockProcessCount;
        if(a.DeltaTime !== b.DeltaTime)
            return a.DeltaTime - b.DeltaTime;
        return a.id - b.id;
    };
    return {result:1, ArrTree:ArrTree};
};

function GetCopyNode(Node,BlockCounts)
{
    if(!Node)
        return ;
    if(Node.Socket && Node.Socket.Info)
    {
        Node.Info += Node.Socket.Info + "\n";
        Node.Socket.Info = "";
    }
    if(!Node.PrevInfo)
        Node.PrevInfo = "";
    var GetTiming = 0;
    if(BlockCounts !== 0)
        GetTiming = Math.trunc(Node.GetTiming / BlockCounts) / 1000;
    var Item = {VersionNum:Node.VersionNum, DirectMAccount:Node.DirectMAccount, id:Node.id, ip:Node.ip, portweb:Node.portweb, port:Node.port,
        TransferCount:Node.TransferCount, GetTiming:GetTiming, ErrCountAll:Node.ErrCountAll, LevelCount:Node.LevelCount, LevelEnum:Node.LevelEnum,
        TimeTransfer:GetStrOnlyTimeUTC(new Date(Node.LastTimeTransfer)), BlockProcessCount:Node.BlockProcessCount, DeltaTime:Node.DeltaTime,
        DeltaTimeM:Node.DeltaTimeM, DeltaGlobTime:Node.DeltaGlobTime, PingNumber:Node.PingNumber, NextConnectDelta:Node.NextConnectDelta,
        NextGetNodesDelta:Node.NextGetNodesDelta, NextHotDelta:Node.NextHotDelta, Name:Node.Name, addrStr:Node.addrStr, CanHot:Node.CanHot,
        Active:Node.Active, Hot:Node.Hot, Info:Node.PrevInfo + Node.Info, InConnectArr:Node.WasAddToConnect, Level:Node.Level, TransferBlockNum:Node.TransferBlockNum,
        TransferBlockNumFix:Node.TransferBlockNumFix, CurBlockNum:Node.CurBlockNum, };
    return Item;
};
HTTPCaller.GetBlockchainStat = function (Param)
{
    var Result = SERVER.GetStatBlockchainPeriod(Param);
    Result.result = 1;
    Result.sessionid = sessionid;
    return Result;
};
HTTPCaller.GetAllCounters = function ()
{
    var Result = GET_STATS();
    Result.result = 1;
    Result.sessionid = sessionid;
    Result.STAT_MODE = global.STAT_MODE;
    return Result;
};
HTTPCaller.SetStatMode = function (flag)
{
    if(flag)
        StartCommonStat();
    global.STAT_MODE = flag;
    SAVE_CONST(true);
    return {result:1, sessionid:sessionid, STAT_MODE:global.STAT_MODE};
};
HTTPCaller.ClearStat = function ()
{
    global.ClearCommonStat();
    return {result:1, sessionid:sessionid, STAT_MODE:global.STAT_MODE};
};
HTTPCaller.RewriteAllTransactions = function (Param)
{
    RewriteAllTransactions();
    return {result:1, sessionid:sessionid};
};
HTTPCaller.RewriteTransactions = function (Param)
{
    var Ret = SERVER.ReWriteDAppTransactions(Param.BlockCount);
    return {result:Ret, sessionid:sessionid};
};
HTTPCaller.TruncateBlockChain = function (Param)
{
    var StartNum = SERVER.BlockNumDB - Param.BlockCount;
    var MinBlock = DApps.Accounts.GetMinBlockAct();
    if(MinBlock > StartNum)
    {
        ToLog("Cant Truncate BlockChain. Very long length. Max length=" + (SERVER.BlockNumDB - MinBlock));
        return {result:0, sessionid:sessionid};
    }
    SERVER.TruncateBlockDB(StartNum);
    return {result:1, sessionid:sessionid};
};
HTTPCaller.ClearDataBase = function (Param)
{
    SERVER.ClearDataBase();
    return {result:1, sessionid:sessionid};
};
HTTPCaller.CleanChain = function (Param)
{
    if(global.CleanChain)
    {
        var StartNum = SERVER.BlockNumDB - Param.BlockCount;
        global.CleanChain(StartNum);
        return {result:1, sessionid:sessionid};
    }
    return {result:0, sessionid:sessionid};
};
HTTPCaller.GetArrStats = function (Keys)
{
    var arr = GET_STATDIAGRAMS(Keys);
    return {result:1, sessionid:sessionid, arr:arr, STAT_MODE:global.STAT_MODE};
};
HTTPCaller.GetBlockChain = function (type)
{
    if(!global.SERVER || !SERVER.LoadedChainList)
    {
        return {result:0};
    }
    var MainChains = {};
    for(var i = 0; i < SERVER.LoadedChainList.length; i++)
    {
        var chain = SERVER.LoadedChainList[i];
        if(chain && !chain.Deleted)
            MainChains[chain.id] = true;
    }
    var arrBlocks = [];
    var arrLoadedChainList = [];
    var arrLoadedBlocks = [];
    for(var key in SERVER.BlockChain)
    {
        var Block = SERVER.BlockChain[key];
        if(Block)
        {
            arrBlocks.push(CopyBlockDraw(Block, MainChains));
        }
    }
    AddChainList(arrLoadedChainList, SERVER.LoadedChainList, true);
    AddMapList(arrLoadedBlocks, type, SERVER.MapMapLoaded, MainChains);
    var ArrLoadedChainList = global.HistoryBlockBuf.LoadValue("LoadedChainList", 1);
    if(ArrLoadedChainList)
        for(var List of ArrLoadedChainList)
        {
            AddChainList(arrLoadedChainList, List);
        }
    var ArrMapMapLoaded = global.HistoryBlockBuf.LoadValue("MapMapLoaded", 1);
    if(ArrMapMapLoaded)
        for(var List of ArrMapMapLoaded)
        {
            AddMapList(arrLoadedBlocks, type, List);
        }
    var obj = {LastCurrentBlockNum:SERVER.GetLastCorrectBlockNum(), CurrentBlockNum:SERVER.CurrentBlockNum, LoadedChainList:arrLoadedChainList,
        LoadedBlocks:arrLoadedBlocks, BlockChain:arrBlocks, port:SERVER.port, DELTA_CURRENT_TIME:DELTA_CURRENT_TIME, memoryUsage:process.memoryUsage(),
        IsDevelopAccount:IsDeveloperAccount(WALLET.PubKeyArr), LoadedChainCount:SERVER.LoadedChainList.length, StartLoadBlockTime:SERVER.StartLoadBlockTime,
        sessionid:sessionid, result:1};
    var obj2 = HTTPCaller.GetHotArray();
    obj.ArrTree = obj2.ArrTree;
    arrBlocks = [];
    arrLoadedChainList = [];
    arrLoadedBlocks = [];
    return obj;
};

function GetCopyBlock(Block)
{
    var Result = {BlockNum:Block.BlockNum, bSave:Block.bSave, TreeHash:GetHexFromAddres(Block.TreeHash), AddrHash:GetHexFromAddres(Block.AddrHash),
        PrevHash:GetHexFromAddres(Block.PrevHash), SumHash:GetHexFromAddres(Block.SumHash), SumPow:Block.SumPow, TrDataPos:Block.TrDataPos,
        TrDataLen:Block.TrDataLen, SeqHash:GetHexFromAddres(Block.SeqHash), Hash:GetHexFromAddres(Block.Hash), Power:GetPowPower(Block.PowHash),
        TrCount:Block.TrCount, arrContent:Block.arrContent, };
    return Result;
};
var AddrLength = 16;

function GetHexFromAddresShort(Hash)
{
    return GetHexFromAddres(Hash).substr(0, AddrLength);
};

function GetHexFromStrShort(Str)
{
    if(Str === undefined)
        return Str;
    else
        return Str.substr(0, AddrLength);
};
var glid = 0;

function GetGUID(Block)
{
    if(!Block)
        return "------";
    if(!Block.guid)
    {
        glid++;
        Block.guid = glid;
    }
    return Block.guid;
};

function CopyBlockDraw(Block,MainChains)
{
    var MinerID = 0;
    var MinerName = "";
    if(Block.AddrHash)
    {
        var Num = ReadUintFromArr(Block.AddrHash, 0);
        MinerID = Num;
        var Item = DApps.Accounts.ReadState(Num);
        if(Item && Item.Name)
            MinerName = Item.Name.substr(0, 8);
    }
    var CheckPoint = 0;
    if(Block.BlockNum === CHECK_POINT.BlockNum)
        CheckPoint = 1;
    var Mining;
    if(SERVER.MiningBlock === Block)
        Mining = 1;
    else
        Mining = 0;
    GetGUID(Block);
    var Item = {guid:Block.guid, Active:Block.Active, bSave:Block.bSave, Prepared:Block.Prepared, BlockNum:Block.BlockNum, Hash:GetHexFromAddresShort(Block.Hash),
        SumHash:GetHexFromAddresShort(Block.SumHash), SeqHash:GetHexFromAddresShort(Block.SeqHash), TreeHash:GetHexFromAddresShort(Block.TreeHash),
        AddrHash:GetHexFromAddresShort(Block.AddrHash), MinerID:MinerID, MinerName:MinerName, Comment1:Block.Comment1, Comment2:Block.Comment2,
        SumPow:Block.SumPow, Info:Block.Info, TreeLoaded:Block.TreeEq, AddToLoad:Block.AddToLoad, LoadDB:Block.LoadDB, FindBlockDB:Block.FindBlockDB,
        TrCount:Block.TrCount, ArrLength:0, TrDataLen:Block.TrDataLen, Power:GetPowPower(Block.PowHash), CheckPoint:CheckPoint, Mining:Mining,
        HasErr:Block.HasErr, };
    if(Block.chain)
        Item.chainid = Block.chain.id;
    if(Block.LoadDB !== undefined)
        Item.bSave = Block.LoadDB;
    if(Block.arrContent)
        Item.TrCount = Block.arrContent.length;
    Item.BlockDown = GetGUID(Block.BlockDown);
    if(MainChains && Item.chainid)
    {
        Item.Main = MainChains[Item.chainid];
    }
    return Item;
};

function CopyChainDraw(Chain,bWasRecursive,bMain)
{
    if(!Chain)
        return Chain;
    GetGUID(Chain);
    var Item = {guid:Chain.guid, id:Chain.id, chainid:Chain.id, bSave:Chain.LoadDB, FindBlockDB:Chain.FindBlockDB, GetFindDB:Chain.GetFindDB(),
        BlockNum:Chain.BlockNumStart, Hash:GetHexFromAddresShort(Chain.HashStart), Comment1:Chain.Comment1, Comment2:Chain.Comment2,
        StopSend:Chain.StopSend, SumPow:0, Info:Chain.Info, IsSum:Chain.IsSum, Main:bMain, };
    if(Chain.IsSumStart)
    {
        Item.SumHash = Item.Hash;
        Item.Hash = "-------";
    }
    if(Chain.RootChain)
    {
        var rootChain = Chain.GetRootChain();
        if(rootChain)
        {
            Item.rootid = rootChain.id;
            if(!bWasRecursive)
                Item.root = CopyChainDraw(rootChain, true);
        }
    }
    else
        Item.rootid = "";
    if(Chain.BlockHead)
    {
        Item.HashMaxStr = GetGUID(Chain.BlockHead);
        Item.BlockNumMax = Chain.BlockHead.BlockNum;
    }
    else
    {
        Item.HashMaxStr = "------";
    }
    return Item;
};

function AddChainList(arrLoadedChainList,LoadedChainList,bMain)
{
    for(var chain of LoadedChainList)
    {
        if(chain)
        {
            arrLoadedChainList.push(CopyChainDraw(chain, false, bMain));
        }
    }
};

function AddMapList(arrLoadedBlocks,type,MapMapLoaded,MainChains)
{
    for(var key in MapMapLoaded)
    {
        var map = MapMapLoaded[key];
        if(map)
        {
            for(var key in map)
            {
                var Block = map[key];
                if(key.substr(1, 1) === ":")
                    continue;
                if(!Block.Send || type === "reload")
                {
                    arrLoadedBlocks.push(CopyBlockDraw(Block, MainChains));
                    Block.Send = true;
                }
            }
        }
    }
};
var MapFileHTML5 = {};

function SendFileHTML(response,name,StrCookie)
{
    let type = name.substr(name.length - 3, 3);
    fs.readFile("./" + name, function read(err,data)
    {
        if(err)
        {
            if(type === "ico")
            {
                response.writeHead(404, {'Content-Type':'text/html'});
                response.end();
                return ;
            }
            data = "Not found: " + name;
        }
        else
        {
            var StrContentType = ContenTypeMap[type];
            if(!StrContentType || StrContentType === "text/html")
            {
                var Headers = {'Content-Type':'text/html', "X-Frame-Options":"sameorigin"};
                if(StrCookie)
                    Headers['Set-Cookie'] = StrCookie;
                response.writeHead(200, Headers);
            }
            else
            {
                response.writeHead(200, {'Content-Type':StrContentType});
            }
        }
        response.end(data);
    });
};
global.SendFileHTML = SendFileHTML;

function GetStrTime(now)
{
    if(!now)
        now = GetCurrentTime(0);
    var Str = "" + now.getHours().toStringZ(2);
    Str = Str + ":" + now.getMinutes().toStringZ(2);
    Str = Str + ":" + now.getSeconds().toStringZ(2);
    return Str;
};

function OnGetData(arg)
{
    var response = {end:function ()
        {
        }, writeHead:function ()
        {
        }, };
    var Path = arg.path;
    var obj = arg.obj;
    if(Path.substr(0, 1) === "/")
        Path = Path.substr(1);
    var params = Path.split('/', 5);
    var Ret;
    var F = HTTPCaller[params[0]];
    if(F)
    {
        if(obj)
            Ret = F(obj);
        else
            Ret = F(params[1], params[2], params[3]);
    }
    else
    {
        Ret = {result:0};
    }
    return Ret;
};

function parseCookies(rc)
{
    var list = {};
    rc && rc.split(';').forEach(function (cookie)
    {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
};
if(global.HTTP_PORT_NUMBER)
{
    var ClientTokenMap = {};
    var ClientIPMap = {};
    setInterval(function ()
    {
        ClientTokenMap = {};
    }, 24 * 3600 * 1000);
    var port = global.HTTP_PORT_NUMBER;
    var HTTPServer = http.createServer(function (request,response0)
    {
        if(!request.headers)
            return ;
        if(!request.socket || !request.socket.remoteAddress)
            return ;
        var remoteAddress = request.socket.remoteAddress.replace(/^.*:/, '');
        if(remoteAddress === "1")
            remoteAddress = "127.0.0.1";
        if(!global.HTTP_PORT_PASSWORD && remoteAddress.indexOf("127.0.0.1") < 0)
            return ;
        if(global.HTTP_IP_CONNECT && remoteAddress.indexOf("127.0.0.1") < 0 && global.HTTP_IP_CONNECT.indexOf(remoteAddress) < 0)
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
                    ToError("H##1");
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
                    ToError("H##2");
                    ToError(e);
                }
            }, };
        if(!global.SERVER)
        {
            response.writeHead(404, {'Content-Type':'text/html'});
            response.end("");
            return ;
        }
        var fromURL = url.parse(request.url);
        var Path = querystring.unescape(fromURL.path);
        if(!ClientIPMap[remoteAddress])
        {
            ClientIPMap[remoteAddress] = 1;
            ToLog("CONNECT TO HTTP ACCESS FROM: " + remoteAddress);
            ToLog("Path: " + Path);
        }
        if(global.HTTP_PORT_PASSWORD)
        {
            var StrPort = "";
            if(global.HTTP_PORT_NUMBER !== 80)
                StrPort = global.HTTP_PORT_NUMBER;
            var cookies = parseCookies(request.headers.cookie);
            var cookies_token = cookies["token" + StrPort];
            var cookies_hash = cookies["hash" + StrPort];
            if(cookies_token && cookies_hash && ClientTokenMap[cookies_token] === 0)
            {
                if(cookies_hash.substr(0, 4) !== "0000")
                {
                    SendFileHTML(response, "./HTML/password.html", "token" + StrPort + "=" + cookies_token + ";path=/");
                    return ;
                }
                var nonce = 0;
                var index = cookies_hash.indexOf("-");
                if(index > 0)
                {
                    nonce = parseInt(cookies_hash.substr(index + 1));
                    if(!nonce)
                        nonce = 0;
                }
                var hash = ClientHex(cookies_token + "-" + global.HTTP_PORT_PASSWORD, nonce);
                if(hash === cookies_hash)
                {
                    ClientTokenMap[cookies_token] = 1;
                }
                else
                {
                    SendFileHTML(response, "./HTML/password.html", "token" + StrPort + "=" + cookies_token + ";path=/");
                    return ;
                }
            }
            if(!cookies_token || !ClientTokenMap[cookies_token])
            {
                var StrToken = GetHexFromArr(crypto.randomBytes(16));
                ClientTokenMap[StrToken] = 0;
                SendFileHTML(response, "./HTML/password.html", "token" + StrPort + "=" + StrToken + ";path=/");
                return ;
            }
        }
        var params = Path.split('/', 6);
        params.splice(0, 1);
        var Type = request.method;
        if(Type === "POST")
        {
            let Response = response;
            let Params = params;
            let postData = "";
            request.addListener("data", function (postDataChunk)
            {
                if(postData.length < 70000 && postDataChunk.length < 70000)
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
                    ToError("--------Error data parsing : " + Params[0] + " " + postData.substr(0, 200));
                    Response.writeHead(405, {'Content-Type':'text/html'});
                    Response.end("Error data parsing");
                }
                if(Params[0] === "HTML")
                    DoCommand(response, Type, Path, [Params[1], Data], remoteAddress);
                else
                    DoCommand(response, Type, Path, [Params[0], Data], remoteAddress);
            });
        }
        else
        {
            DoCommand(response, Type, Path, params, remoteAddress);
        }
    }).listen(port, function ()
    {
        global.HTTP_SERVER_START_OK = 1;
        ToLog("Run HTTP-server on port:" + port);
    });
    HTTPServer.on('error', function (err)
    {
        ToError("H##3");
        ToError(err);
    });
}
if(global.ELECTRON)
{
    const ipcMain = require('electron').ipcMain;
    ipcMain.on('GetData', function (event,arg)
    {
        event.returnValue = OnGetData(arg);
    });
}
exports.SendData = OnGetData;

function RunConsole(StrRun)
{
    var Str = fs.readFileSync("./EXPERIMENTAL/!run-console.js", {encoding:"utf8"});
    if(StrRun)
        Str += "\n" + StrRun;
    try
    {
        var ret = eval(Str);
    }
    catch(e)
    {
        ret = e.message + "\n" + e.stack;
    }
    return ret;
};
