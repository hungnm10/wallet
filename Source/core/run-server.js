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
require("./constant");
const crypto = require('crypto');
global.START_SERVER = 1;
global.DATA_PATH = GetNormalPathString(global.DATA_PATH);
global.CODE_PATH = GetNormalPathString(global.CODE_PATH);
console.log("DATA DIR: " + global.DATA_PATH);
console.log("PROGRAM DIR: " + global.CODE_PATH);
require("./library");
var VerArr = process.versions.node.split('.');
if(VerArr[0] < 8)
{
    ToError("Error version of NodeJS=" + VerArr[0] + "  Pls, download new version from www.nodejs.org and update it. The minimum version must be 8");
    process.exit();
}
var CServer = require("./server");
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
var idHostingAliveInterval = 0;
var LastHostingAlive = new Date() - 0;
var HostingWorker;
if(global.HTTP_HOSTING_PORT && !global.NWMODE)
{
    idHostingAliveInterval = setInterval(function ()
    {
        var Delta = (new Date()) - LastHostingAlive;
        if(HostingWorker && Delta > 3 * 1000)
        {
            ToLog("KILL PROCESS: " + HostingWorker.pid);
            try
            {
                process.kill(HostingWorker.pid, 'SIGKILL');
            }
            catch(e)
            {
                ToLog(e);
            }
            LastHostingAlive = (new Date() - 0) + 10 * 1000;
            HostingWorker = undefined;
        }
        if(HostingWorker && HostingWorker.connected)
        {
            HostingWorker.send({cmd:"Stat", Name:"MAX:ALL_NODES", Value:global.CountAllNode});
        }
        else
        {
            ToLog("NOT HOSTING CONNECTED. RESTART!");
            HostingWorker = Fork("./core/hosting-server.js", ["READONLYDB"]);
            HostingWorker.on('message', OnMessageHosting);
        }
    }, 500);
    setInterval(function ()
    {
        if(HostingWorker && HostingWorker.connected)
        {
            var arr = SERVER.GetDirectNodesArray(true, true).slice(1, 500);
            HostingWorker.send({cmd:"NodeList", Value:arr});
        }
    }, 5000);
}

function OnMessageHosting(msg)
{
    LastHostingAlive = new Date() - 0;
    if(msg.cmd === "SendTransactionHex")
    {
        var body = GetArrFromHex(msg.Value);
        SERVER.AddTransaction({body:body});
    }
};
global.StopHostingServer = function ()
{
    if(idHostingAliveInterval)
        clearInterval(idHostingAliveInterval);
    idHostingAliveInterval = 0;
    if(HostingWorker && HostingWorker.connected)
    {
        HostingWorker.send({cmd:"Exit"});
        HostingWorker = undefined;
    }
};
require("./html-server");
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
        PathMiner = "./core/pow-process.js";
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
            ToLog("STOP PROCESS: " + Worker.Num);
            for(var i = 0; i < ArrMiningWrk.length; i++)
            {
                if(ArrMiningWrk[i].Num === Worker.Num)
                {
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
            Hash:Block.Hash, PrevHash:Block.PrevHash, Time:new Date() - 0, Num:CurWorker.Num, RunPeriod:global.POWRunPeriod, RunCount:global.POW_RUN_COUNT,
            RunCount0:global.POW_RUN_COUNT0, Percent:global.POW_MAX_PERCENT, CountMiningCPU:GetCountMiningCPU(), ProcessMemorySize:ProcessMemorySize,
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
        SAVE_CONST(true);
        global.SendLogToClient = 1;
        ToLog("UPDATER Start");
        if(global.TEST_NETWORK)
        {
        }
        else
        {
            FixBlockBug12970020();
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

function CheckRewriteAllTr(Num,StrHash)
{
    var AccountsHash = DApps.Accounts.GetHashOrUndefined(Num);
    if(!AccountsHash || GetHexFromArr(AccountsHash) !== StrHash)
    {
        ToLog("START REWRITE ALL TRANSACTIONS");
        SERVER.RewriteAllTransactions();
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
