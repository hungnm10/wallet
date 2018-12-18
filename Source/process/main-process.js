/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

const fs = require('fs');
require("../core/constant");
const crypto = require('crypto');
global.START_SERVER = 1;
global.PROCESS_NAME = "MAIN";
global.DATA_PATH = GetNormalPathString(global.DATA_PATH);
global.CODE_PATH = GetNormalPathString(global.CODE_PATH);
console.log("DATA DIR: " + global.DATA_PATH);
console.log("PROGRAM DIR: " + global.CODE_PATH);
require("../core/library");
var VerArr = process.versions.node.split('.');
if(VerArr[0] < 8)
{
    ToError("Error version of NodeJS=" + VerArr[0] + "  Pls, download new version from www.nodejs.org and update it. The minimum version must be 8");
    process.exit();
}
var CServer = require("../core/server");
global.glCurNumFindArr = 0;
global.ArrReconnect = [];
global.ArrConnect = [];
var FindList = [{"ip":"91.235.136.81", "port":30005}, {"ip":"149.154.70.158", "port":30000}, ];
if(global.LOCAL_RUN)
{
    FindList = [{"ip":"127.0.0.1", "port":50000}, {"ip":"127.0.0.1", "port":50001}];
}
else
    if(global.TEST_NETWORK)
    {
        FindList = [{"ip":"149.154.70.158", "port":40000}, ];
    }
global.SERVER = undefined;
global.NeedRestart = 0;
process.on('uncaughtException', function (err)
{
    if(process.send)
    {
        process.send({cmd:"log", message:err});
    }
    ToError(err.stack);
    ToLog(err.stack);
    if(err.code === "ENOTFOUND" || err.code === "ECONNRESET")
    {
    }
    else
    {
        TO_ERROR_LOG("APP", 666, err);
        ToLog("-----------------EXIT------------------");
        process.exit();
    }
});
process.on('error', function (err)
{
    ToError(err.stack);
    ToLog(err.stack);
});
var ArrChildProcess = [];
var WebProcess = {Name:"WEB PROCESS", idInterval:0, idInterval1:0, idInterval2:0, LastAlive:Date.now(), Worker:undefined, Path:"./process/web-process.js",
    OnMessage:OnMessageHosting, PeriodAlive:3000};
if(global.HTTP_HOSTING_PORT && !global.NWMODE)
{
    ArrChildProcess.push(WebProcess);
    WebProcess.idInterval1 = setInterval(function ()
    {
        if(WebProcess.Worker && WebProcess.Worker.connected)
        {
            try
            {
                WebProcess.Worker.send({cmd:"Stat", Name:"MAX:ALL_NODES", Value:global.CountAllNode});
            }
            catch(e)
            {
                WebProcess.Worker = undefined;
            }
        }
    }, 500);
    WebProcess.idInterval2 = setInterval(function ()
    {
        if(WebProcess.Worker && WebProcess.Worker.connected)
        {
            var arr = SERVER.GetDirectNodesArray(true, true).slice(1, 500);
            var arr2 = [];
            var CurTime = GetCurrentTime() - 0;
            for(var i = 0; i < SERVER.NodesArr.length; i++)
            {
                var Item = SERVER.NodesArr[i];
                if(Item.LastTime && (CurTime - Item.LastTime) < 3600 * 1000)
                    arr2.push({ip:Item.ip});
                else
                    if(Item.LastTimeGetNode && (CurTime - Item.LastTimeGetNode) < 3600 * 1000)
                        arr2.push({ip:Item.ip});
            }
            WebProcess.Worker.send({cmd:"NodeList", Value:arr, ValueAll:arr2});
        }
    }, 5000);
}

function OnMessageHosting(msg)
{
    if(msg.cmd === "SendTransactionHex")
    {
        var body = GetArrFromHex(msg.Value);
        SERVER.AddTransaction({body:body}, 1);
    }
};
global.STATIC_PROCESS = {Name:"STATIC PROCESS", idInterval:0, idInterval1:0, idInterval2:0, LastAlive:Date.now(), Worker:undefined,
    Path:"./process/static-process.js", OnMessage:OnMessageStatic, PeriodAlive:3000};
ArrChildProcess.push(STATIC_PROCESS);

function OnMessageStatic(msg)
{
    switch(msg.cmd)
    {
        case "Send":
            {
                var Node = SERVER.NodesMap[msg.addrStr];
                if(Node)
                {
                    msg.Data = msg.Data.data;
                    SERVER.Send(Node, msg, 1);
                }
                break;
            }
    }
};
global.TX_PROCESS = {Name:"TX PROCESS", idInterval:0, idInterval1:0, idInterval2:0, LastAlive:Date.now(), Worker:undefined,
    Path:"./process/tx-process.js", OnMessage:OnMessageWriter, PeriodAlive:100 * 1000 * 300};
ArrChildProcess.push(TX_PROCESS);

function OnMessageWriter(msg)
{
    switch(msg.cmd)
    {
        case "RunOK":
            {
                break;
            }
    }
};
setInterval(function ()
{
    if(global.DApps && DApps.Accounts)
    {
        DApps.Accounts.Close();
        DApps.Smart.DBSmart.Close();
    }
}, 1000);

function StartAllChilds()
{
    for(var i = 0; i < ArrChildProcess.length; i++)
    {
        var Item = ArrChildProcess[i];
        StartChildProcess(Item);
    }
};

function StartChildProcess(Item)
{
    let ITEM = Item;
    ITEM.idInterval = setInterval(function ()
    {
        var Delta = Date.now() - ITEM.LastAlive;
        if(ITEM.Worker && Delta > ITEM.PeriodAlive)
        {
            if(ITEM.Worker)
            {
                ToLog("KILL PROCESS " + ITEM.Name + ": " + ITEM.Worker.pid);
                try
                {
                    process.kill(ITEM.Worker.pid, 'SIGKILL');
                }
                catch(e)
                {
                }
                ITEM.Worker = undefined;
            }
        }
        try
        {
            ITEM.Worker.send({cmd:"Alive"});
        }
        catch(e)
        {
            ITEM.Worker = undefined;
        }
        if(!ITEM.Worker)
        {
            ITEM.LastAlive = (Date.now()) + ITEM.PeriodAlive * 3;
            ToLog("STARTING " + ITEM.Name);
            ITEM.Worker = Fork(ITEM.Path, ["READONLYDB"]);
            ITEM.Worker.on('message', function (msg)
            {
                if(ITEM.LastAlive < Date.now())
                    ITEM.LastAlive = Date.now();
                if(msg.cmd === "log")
                {
                    ToLog(msg.message);
                }
                else
                    if(msg.cmd === "ToLogClient")
                    {
                        ToLogClient(msg.Str, msg.StrKey, msg.bFinal);
                    }
                    else
                        if(msg.cmd === "online")
                        {
                            ToLog("RUNING " + ITEM.Name + " : " + msg.message + " pid: " + ITEM.Worker.pid);
                        }
                        else
                            if(ITEM.OnMessage)
                            {
                                ITEM.OnMessage(msg);
                            }
            });
        }
    }, 500);
};
global.StopChildProcess = function ()
{
    for(var i = 0; i < ArrChildProcess.length; i++)
    {
        var Item = ArrChildProcess[i];
        if(Item.idInterval)
            clearInterval(Item.idInterval);
        Item.idInterval = 0;
        if(Item.idInterval1)
            clearInterval(Item.idInterval1);
        Item.idInterval1 = 0;
        if(Item.idInterval2)
            clearInterval(Item.idInterval2);
        Item.idInterval2 = 0;
        if(Item.Worker && Item.Worker.connected)
        {
            Item.Worker.send({cmd:"Exit"});
            Item.Worker = undefined;
        }
    }
    RunStopPOWProcess("STOP");
};
require("../core/html-server");
RunServer();
setInterval(function run1()
{
    DoConnectToNodes(ArrReconnect, "RECONNECT");
}, 200);
setInterval(function run2()
{
    DoGetNodes();
    DoConnectToNodes(ArrConnect, "CONNECT");
}, 500);
var StartCheckMining = 0;
global.MiningPaused = 0;
var ProcessMemorySize = 0;
global.ArrMiningWrk = [];
var BlockMining;
if(global.ADDRLIST_MODE)
{
    return ;
}

function AllAlive()
{
    for(var i = 0; i < ArrMiningWrk.length; i++)
    {
        ArrMiningWrk[i].send({cmd:"Alive"});
    }
};

function ClearArrMining()
{
    for(var i = 0; i < ArrMiningWrk.length; i++)
    {
        ArrMiningWrk[i].send({cmd:"Exit"});
    }
    ArrMiningWrk = [];
};

function RunStopPOWProcess(Mode)
{
    if(!GetCountMiningCPU() || GetCountMiningCPU() <= 0)
        return ;
    if(!StartCheckMining)
    {
        StartCheckMining = 1;
        setInterval(RunStopPOWProcess, CHECK_RUN_MINING);
        setInterval(AllAlive, 1000);
    }
    if(global.NeedRestart)
        return ;
    if(global.USE_MINING && global.MINING_START_TIME && global.MINING_PERIOD_TIME)
    {
        var Time = GetCurrentTime();
        var TimeCur = Time.getUTCHours() * 3600 + Time.getUTCMinutes() * 60 + Time.getUTCSeconds();
        var StartTime = GetSecFromStrTime(global.MINING_START_TIME);
        var RunPeriod = GetSecFromStrTime(global.MINING_PERIOD_TIME);
        var TimeEnd = StartTime + RunPeriod;
        global.MiningPaused = 1;
        if(TimeCur >= StartTime && TimeCur <= TimeEnd)
        {
            global.MiningPaused = 0;
        }
        else
        {
            StartTime -= 24 * 3600;
            TimeEnd -= 24 * 3600;
            if(TimeCur >= StartTime && TimeCur <= TimeEnd)
            {
                global.MiningPaused = 0;
            }
        }
        if(ArrMiningWrk.length && global.MiningPaused)
        {
            ToLog("------------ MINING MUST STOP ON TIME");
            ClearArrMining();
            return ;
        }
        else
            if(!ArrMiningWrk.length && !global.MiningPaused)
            {
                ToLog("*********** MINING MUST START ON TIME");
            }
            else
            {
                return ;
            }
    }
    else
    {
        global.MiningPaused = 0;
    }
    if(!global.USE_MINING || Mode === "STOP")
    {
        ClearArrMining();
        return ;
    }
    if(global.USE_MINING && ArrMiningWrk.length)
        return ;
    if(SERVER.LoadHistoryMode)
        return ;
    if(GENERATE_BLOCK_ACCOUNT < 8)
        return ;
    var PathMiner = GetCodePath("../miner.js");
    if(!fs.existsSync(PathMiner))
        PathMiner = "./process/pow-process.js";
    if(ArrMiningWrk.length >= GetCountMiningCPU())
        return ;
    if(GrayConnect())
    {
        ToLog("CANNOT START MINER IN NOT DIRECT IP MODE");
        return ;
    }
    var Memory;
    if(global.SIZE_MINING_MEMORY)
        Memory = global.SIZE_MINING_MEMORY;
    else
    {
        const os = require('os');
        Memory = os.freemem() - (512 + GetCountMiningCPU() * 100) * 1024 * 1014;
        if(Memory < 0)
        {
            ToLog("Not enough memory to start processes.");
            return ;
        }
    }
    ProcessMemorySize = Math.trunc(Memory / GetCountMiningCPU());
    ToLog("START MINER PROCESS COUNT: " + GetCountMiningCPU() + " Memory: " + ProcessMemorySize / 1024 / 1024 + " Mb for eatch process");
    for(var R = 0; R < GetCountMiningCPU(); R++)
    {
        let Worker = Fork(PathMiner);
        ArrMiningWrk.push(Worker);
        Worker.Num = ArrMiningWrk.length;
        Worker.on('message', function (msg)
        {
            if(msg.cmd === "log")
            {
                ToLog(msg.message);
            }
            else
                if(msg.cmd === "online")
                {
                    Worker.bOnline = true;
                    ToLog("RUNING PROCESS:" + Worker.Num + ":" + msg.message);
                }
                else
                    if(msg.cmd === "POW")
                    {
                        SERVER.MiningProcess(msg);
                    }
                    else
                        if(msg.cmd === "HASHRATE")
                        {
                            ADD_HASH_RATE(msg.CountNonce);
                        }
        });
        Worker.on('error', function (err)
        {
            if(!ArrMiningWrk.length)
                return ;
            ToError('ERROR IN PROCESS: ' + err);
        });
        Worker.on('close', function (code)
        {
            ToLog("STOP PROCESS: " + Worker.Num + " pid:" + Worker.pid);
            for(var i = 0; i < ArrMiningWrk.length; i++)
            {
                if(ArrMiningWrk[i].pid === Worker.pid)
                {
                    ToLog("Delete wrk from arr - pid:" + Worker.pid);
                    ArrMiningWrk.splice(i, 1);
                }
            }
        });
    }
};

function SetCalcPOW(Block,cmd)
{
    if(!global.USE_MINING)
        return ;
    if(ArrMiningWrk.length !== GetCountMiningCPU())
        return ;
    BlockMining = Block;
    for(var i = 0; i < ArrMiningWrk.length; i++)
    {
        var CurWorker = ArrMiningWrk[i];
        if(!CurWorker.bOnline)
            continue;
        CurWorker.send({cmd:cmd, BlockNum:Block.BlockNum, Account:GENERATE_BLOCK_ACCOUNT, MinerID:GENERATE_BLOCK_ACCOUNT, SeqHash:Block.SeqHash,
            Hash:Block.Hash, PrevHash:Block.PrevHash, Time:Date.now(), Num:CurWorker.Num, RunPeriod:global.POWRunPeriod, RunCount:global.POW_RUN_COUNT,
            RunCountFind:global.POW_RUN_COUNT_FIND, Percent:global.POW_MAX_PERCENT, CountMiningCPU:GetCountMiningCPU(), ProcessMemorySize:ProcessMemorySize,
        });
    }
};
global.SetCalcPOW = SetCalcPOW;
global.RunStopPOWProcess = RunStopPOWProcess;

function DoGetNodes()
{
    if(!SERVER)
        return ;
    if(!GrayConnect() && SERVER.CanSend < 2)
        return ;
    if(!SERVER.NodesArrUnSort || !SERVER.NodesArrUnSort.length)
        return ;
    var Num = glCurNumFindArr % SERVER.NodesArrUnSort.length;
    var Node = SERVER.NodesArrUnSort[Num];
    if(Num === 0)
        glCurNumFindArr = 0;
    glCurNumFindArr++;
    if(Node.Delete)
        return ;
    if(SERVER.NodeInBan(Node))
        return ;
    if(SERVER.BusyLevel && Node.BlockProcessCount <= SERVER.BusyLevel)
        return ;
    if(GetSocketStatus(Node.Socket) === 100)
    {
        SERVER.StartGetNodes(Node);
    }
};

function DoConnectToNodes(Arr,Mode)
{
    if(!SERVER)
        return ;
    if(!GrayConnect() && SERVER.CanSend < 2)
    {
        return ;
    }
    if(GrayConnect() && SERVER.ActualNodes.size > GetGrayServerConnections())
        return ;
    if(Arr.length)
    {
        var MinProcessCount = SERVER.BusyLevel - 1;
        for(var i = 0; i < Arr.length; i++)
        {
            var Node = Arr[i];
            if(Node.BlockProcessCount > MinProcessCount)
            {
                Arr.splice(i, 1);
                if(Mode === "CONNECT")
                {
                    Node.WasAddToConnect = undefined;
                    SERVER.StartConnectTry(Node);
                }
                else
                    if(Mode === "RECONNECT")
                    {
                        Node.WasAddToReconnect = undefined;
                        Node.CreateConnect();
                    }
                break;
            }
        }
    }
};
var idRunOnce;

function RunServer()
{
    idRunOnce = setInterval(RunOnce, 1000);
    ToLog("NETWORK: " + GetNetworkName());
    ToLog("VERSION: " + DEF_VERSION);
    if(global.NET_WORK_MODE)
    {
        global.START_IP = NET_WORK_MODE.ip;
        global.START_PORT_NUMBER = NET_WORK_MODE.port;
    }
    var KeyPair = crypto.createECDH('secp256k1');
    if(!global.SERVER_PRIVATE_KEY_HEX || global.NEW_SERVER_PRIVATE_KEY)
    {
        while(true)
        {
            var Arr = crypto.randomBytes(32);
            KeyPair.setPrivateKey(Buffer.from(Arr));
            var Arr2 = KeyPair.getPublicKey('', 'compressed');
            if(Arr2[0] === 2)
                break;
        }
        global.SERVER_PRIVATE_KEY_HEX = GetHexFromArr(Arr);
        SAVE_CONST(true);
    }
    KeyPair.setPrivateKey(Buffer.from(GetArrFromHex(global.SERVER_PRIVATE_KEY_HEX)));
    new CServer(KeyPair, START_IP, START_PORT_NUMBER, false, false);
    DoStartFindList();
};

function DoStartFindList()
{
    var keyThisServer = SERVER.ip + ":" + SERVER.port;
    for(var n = 0; n < FindList.length; n++)
    {
        var item = FindList[n];
        if(!item.ip)
            continue;
        var key = item.ip + ":" + item.port;
        if(keyThisServer === key)
            continue;
        var addrStr = GetHexFromAddres(crypto.randomBytes(32));
        var Node = SERVER.GetNewNode(addrStr, item.ip, item.port);
        Node.addrStrTemp = addrStr;
        Node.StartFindList = 1;
    }
};

function RunOnce()
{
    if(global.SERVER)
    {
        clearInterval(idRunOnce);
        RunOnUpdate();
        StartAllChilds();
        if(global.RESTART_PERIOD_SEC)
        {
            var Period = (random(600) + global.RESTART_PERIOD_SEC);
            ToLog("SET RESTART NODE AFTER: " + Period + " sec");
            setInterval(function ()
            {
                RestartNode();
            }, Period * 1000);
        }
        setTimeout(function ()
        {
            RunStopPOWProcess();
        }, 10000);
    }
};

function RunOnUpdate()
{
    if(!UPDATE_NUM_COMPLETE)
        UPDATE_NUM_COMPLETE = 0;
    var CurNum = UPDATE_NUM_COMPLETE;
    if(CurNum !== UPDATE_CODE_VERSION_NUM)
    {
        global.UPDATE_NUM_COMPLETE = UPDATE_CODE_VERSION_NUM;
        global.SendLogToClient = 1;
        ToLog("UPDATER Start");
        SAVE_CONST(true);
        if(global.TEST_NETWORK)
        {
        }
        else
        {
            if(CurNum < 781)
            {
                CheckRewriteAllTr(100000, "2502F4136C778545135E19A5DDCAFAE48BDC60707A8B8CC455E230BC1CC211E4", 14615000, "5F2D5096D1BFA1BE1161B0E8FA56FAA323220DB5B2262D240FF304007B7ADDA0");
            }
        }
        ToLog("UPDATER Finish");
        global.SendLogToClient = 0;
    }
};

function CheckRewriteTr(Num,StrHash,StartRewrite)
{
    if(SERVER.BlockNumDB < StartRewrite)
        return "NO";
    var AccountsHash = DApps.Accounts.GetHashOrUndefined(Num);
    if(!AccountsHash || GetHexFromArr(AccountsHash) !== StrHash)
    {
        ToLog("START REWRITE ERR ACTS TRANSACTIONS");
        SERVER.ReWriteDAppTransactions(SERVER.BlockNumDB - StartRewrite);
        return "Rewrite";
    }
    else
    {
        return "OK";
    }
};

function CheckRewriteAllTr(Num,StrHash,Num2,StrHash2)
{
    if(global.LOCAL_RUN || global.TEST_NETWORK)
        return "NONE";
    var MaxNum = SERVER.GetMaxNumBlockDB();
    if(MaxNum < START_BLOCK_ACCOUNT_HASH)
        return "NONE";
    var AccountsHash = DApps.Accounts.GetHashOrUndefined(Num);
    var AccountsHash2 = DApps.Accounts.GetHashOrUndefined(Num2);
    if(AccountsHash2 && GetHexFromArr(AccountsHash2) === StrHash2)
        return "OK";
    if(AccountsHash && GetHexFromArr(AccountsHash) !== StrHash)
    {
        ToLog("***************** START REWRITE ALL DAPPS");
        global.UpdateMode = 1;
        for(var key in DApps)
        {
            DApps[key].ClearDataBase();
        }
        global.UpdateMode = 0;
        return "Rewrite";
    }
    else
    {
        return "OK";
    }
};
global.CheckRewriteTr = CheckRewriteTr;

function Fork(Path,ArrArgs)
{
    const child_process = require('child_process');
    ArrArgs = ArrArgs || [];
    if(global.LOCAL_RUN)
        ArrArgs.push("LOCALRUN");
    else
        if(global.TEST_NETWORK)
            ArrArgs.push("TESTRUN");
    ArrArgs.push("PATH:" + global.DATA_PATH);
    ArrArgs.push("HOSTING:" + global.HTTP_HOSTING_PORT);
    if(!global.USE_PARAM_JS)
        ArrArgs.push("NOPARAMJS");
    var Worker = child_process.fork(Path, ArrArgs);
    return Worker;
};

function FixBlockBug12970020()
{
    var Block = SERVER.ReadBlockHeaderDB(12970020);
    if(!Block)
        return ;
    CorrectBlockBug12970020(Block);
    var BufWrite = BufLib.GetNewBuffer(BLOCK_HEADER_SIZE);
    SERVER.BlockHeaderToBuf(BufWrite, Block);
    var Ret = SERVER.WriteBufHeaderDB(BufWrite, Block.BlockNum);
    return Ret;
};

function CorrectBlockBug12970020(Block)
{
    Block.TreeHash = GetArrFromHex("9FE0A443BD42E70206133119D6D13638D422E34BD5CC38A7A12368EB4A8A1D4F");
    CreateHashMinimal(Block, 0);
    Block.SumPow = 367146128;
};

function RecreateAccountHashDB()
{
    var name = "accounts-hash";
    var fname = GetDataPath("DB/" + name);
    if(fs.existsSync(fname))
    {
        global.UpdateMode = 1;
        ToLog("Start updating " + name);
        const DBRow = require("../core/db/db-row");
        var DB0 = new DBRow(name, 6 + 32 + 12, "{BlockNum:uint,Hash:hash, Reserve: arr12}");
        var DB2 = DApps.Accounts.DBAccountsHash;
        for(var num = START_BLOCK_ACCOUNT_HASH; true; num += PERIOD_ACCOUNT_HASH)
        {
            var Item = DB0.Read(num);
            if(!Item)
                break;
            var Block = SERVER.ReadBlockHeaderDB(num);
            if(!Block)
                break;
            var Data = {Num:Block.BlockNum / PERIOD_ACCOUNT_HASH, BlockNum:Block.BlockNum, Hash:Item.Hash, SumHash:Block.SumHash};
            DB2.Write(Data);
            DB2.Truncate(Block.BlockNum / PERIOD_ACCOUNT_HASH);
        }
        ToLog("Finish updating " + name);
        DB0.Close();
        DB2.Close();
        global.UpdateMode = 0;
        fs.unlinkSync(fname);
    }
};
