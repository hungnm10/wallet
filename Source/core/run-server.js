//Copyright: Yuriy Ivanov, 2017,2018 e-mail: progr76@gmail.com

const fs = require('fs');
require("./constant");
const crypto = require('crypto');




global.DATA_PATH=GetNormalPathString(global.DATA_PATH);
global.CODE_PATH=GetNormalPathString(global.CODE_PATH);

console.log("DATA DIR: "+global.DATA_PATH);
console.log("PROGRAM DIR: "+global.CODE_PATH);
console.log("USE_AUTO_UPDATE: "+USE_AUTO_UPDATE);
console.log("USE_PARAM_JS: "+USE_PARAM_JS);

if(USE_PARAM_JS)
{
    var PathParams=GetCodePath("../extern-run.js");
    if(fs.existsSync(PathParams))
        try{require(PathParams)}catch(e) {console.log(e)};
    if(global.ReturnServeJS)
        return;
}




require("./library");
// const cluster = require('cluster');
// if(!cluster.isMaster)
//     return;



var CServer=require("./server");

global.glCurNumFindArr=0;
global.ArrReconnect=[];
var FindList=LoadParams(GetDataPath("finds-server.lst"),undefined);
if(!FindList)
{
    FindList=[
        {"ip":"194.1.237.94","port":30000},//3
        {"ip":"91.235.136.81","port":30000},//5
        {"ip":"209.58.140.250","port":30000},//16
        // {"ip":"103.102.45.224","port":30000},//12
        // {"ip":"185.17.122.144","port":30000},//14
        // {"ip":"185.17.122.149","port":30000},//20
        ];

    SaveParams(GetDataPath("finds-server.lst"),FindList);
}
//global.USE_LOG_NETWORK=1;





if(global.LOCAL_RUN)
{
    FindList=[{"ip":"127.0.0.1","port":40000},{"ip":"127.0.0.1","port":40001}];
}
// if(global.TEST_DEVELOP_MODE)
//     FindList=[{"ip":"91.235.136.81","port":30002}];


global.SERVER=undefined;
var idRunOnce;
var Worker;



global.NeedRestart=0;



//if(global.nw)
process.on('uncaughtException', function (err)
{
    if(process.send)
    {
        process.send({cmd:"log",message:err});
    }

    ToError(err.stack);
    ToLog(err.stack);

    if(err.code==="ENOTFOUND"
    ||err.code==="ECONNRESET")
    {
        //do work
    }
    else
    {
        TO_ERROR_LOG("APP",666,err);
        ToLog("-----------------EXIT------------------");
        process.exit();
    }
});
process.on('error', function (err)
{
    ToError(err.stack);
    ToLog(err.stack);
});






require("./html-server");
RunServer(false);


setInterval(function run1()
{
    ReconnectingFromServer();
}, 200);
setInterval(function run2()
{
    ConnectToNodes();
}, 500);


if(global.ADDRLIST_MODE)
{
    return;
}

//ToLog("global.USE_MINING="+global.USE_MINING);
var ArrWrk=[];
var BlockMining;

var StartCheckMining=0;
const os = require('os');
var cpus = os.cpus();
var CountMiningCPU=cpus.length-1;

function RunStopPOWProcess(Mode)
{
    if(CountMiningCPU<=0)
        return;
    if(!StartCheckMining)
    {
        StartCheckMining=1;
        setInterval(RunStopPOWProcess,1000);
    }



    if(global.USE_MINING && global.MINING_START_TIME && global.MINING_PERIOD_TIME)
    {
        var Time=GetCurrentTime();
        var TimeSec=Time.getUTCHours()*3600+Time.getUTCMinutes()*60+Time.getUTCSeconds();

        var StartTime=GetSecFromStrTime(global.MINING_START_TIME);
        var RunPeriod=GetSecFromStrTime(global.MINING_PERIOD_TIME);


        var TimeEnd=StartTime+RunPeriod;
        if(TimeSec<StartTime)
        {
            if(TimeEnd>24*3600)
            {
                TimeEnd=TimeEnd-24*3600;
                if(TimeSec>TimeEnd)
                {
                    if(ArrWrk.length)
                    {
                        ArrWrk=[];
                        ToLog("------------ MINING MUST STOP ON TIME")
                    }
                    return;
                }
            }
        }
        else
        if(TimeSec>TimeEnd)
        {
            if(ArrWrk.length)
            {
                ArrWrk=[];
                ToLog("------------ MINING MUST STOP ON TIME")
            }
            return;
        }

        if(!ArrWrk.length)
        {
                ToLog("*********** MINING MUST START ON TIME")
        }
    }





    if(!global.USE_MINING || Mode==="STOP")
    {
        ArrWrk=[];
        return;
    }

    if(global.USE_MINING && ArrWrk.length)
        return;

    if(SERVER.LoadHistoryMode)
        return;


    if(GENERATE_BLOCK_ACCOUNT<8)
        return;


    const child_process = require('child_process');
    ToLog("START MINER PROCESS COUNT="+CountMiningCPU);
    for(var R=0;R<CountMiningCPU;R++)
    {
        let Worker = child_process.fork("./core/pow-process.js");
        console.log(`Worker pid: ${Worker.pid}`);
        ArrWrk.push(Worker);
        Worker.Num=ArrWrk.length;

        Worker.on('message',
            function (msg)
            {
                if(msg.cmd==="log")
                {
                    ToLog(msg.message);
                }
                else
                if(msg.cmd==="online")
                {
                    Worker.bOnline=true;
                    ToLog("RUNING PROCESS:"+Worker.Num+":"+msg.message);
                }
                else
                if(msg.cmd==="POW")
                {
                    //ToLog("POW: "+JSON.stringify(msg))


                    if(BlockMining && BlockMining.Hash && BlockMining.SeqHash
                        && CompareArr(BlockMining.SeqHash,msg.SeqHash)===0
                        && CompareArr(BlockMining.Hash,msg.Hash)>=0)
                    {
                        BlockMining.Hash=msg.Hash;
                        BlockMining.AddrHash=msg.AddrArr;

                        BlockMining.Power=GetPowPower(msg.Hash);
                        //ADD_TO_STAT("MAX:POWER:"+msg.Num,GetPowPower(msg.Hash));
                        ADD_TO_STAT("MAX:POWER",GetPowPower(msg.Hash));

                        SERVER.AddToMaxPOW(BlockMining,
                            {
                                SeqHash:BlockMining.SeqHash,
                                AddrHash:BlockMining.AddrHash,
                                PrevHash:BlockMining.PrevHash,
                                TreeHash:BlockMining.TreeHash,
                            });
                    }
                }
                else
                if(msg.cmd==="HASHRATE")
                {
                    ADD_TO_STAT("HASHRATE",msg.CountNonce);
                    //ADD_TO_STAT("MAX:POWER2",GetPowPower(msg.Hash));

                }

            });

        Worker.on('error', (err) =>
        {
            if(!ArrWrk.length)
                return;
            ToError('ERROR IN PROCESS: '+err);
        });

        Worker.on('close', (code) =>
        {
            ToLog("STOP PROCESS: "+Worker.Num);
            for(var i=0;i<ArrWrk.length;i++)
            {
                if(ArrWrk[i].Num===Worker.Num)
                {
                    //ToLog("Delete wrk from arr");
                    ArrWrk.splice(i,1);
                }
            }
        });
    }
}


function SetCalcPOW(Block)
{
    if(!global.USE_MINING)
        return;

    if(ArrWrk.length!==CountMiningCPU)
        return;

    BlockMining=Block;
    for(var i=0;i<ArrWrk.length;i++)
    {
        var CurWorker=ArrWrk[i];
        if(!CurWorker.bOnline)
            continue;

        CurWorker.send(
            {
                cmd:"SetBlock",
                Account:GENERATE_BLOCK_ACCOUNT,
                BlockNum:Block.BlockNum,
                SeqHash:Block.SeqHash,
                Hash:Block.Hash,
                Time:new Date()-0,
                Num:CurWorker.Num,
                RunPeriod:global.POWRunPeriod,
                RunCount:global.POWRunCount,
                Percent:global.POW_MAX_PERCENT,
            });
    }

}

global.SetCalcPOW=SetCalcPOW;
global.RunStopPOWProcess=RunStopPOWProcess;





function ReconnectingFromServer()
{
    if(!SERVER || SERVER.CanSend<2)
    {
        //ToLog("Not can send")
        return;
    }

    if(global.NET_WORK_MODE && !NET_WORK_MODE.UseDirectIP)
    {
        //ToLog("!UseDirectIP")
        return;
    }

    if(ArrReconnect.length)
    {
        var MinProcessCount=SERVER.BusyLevel;
        for(var i=0;i<ArrReconnect.length;i++)
        {
            var Node=ArrReconnect[i];
            if(Node.BlockProcessCount>MinProcessCount)
            {
                ArrReconnect.splice(i,1);
                Node.WasAddToReconnect=undefined;
                Node.CreateConnect();
                break;
            }
        }
        // var Node=ArrReconnect.shift();
        // Node.WasAddToReconnect=undefined;
        // Node.CreateConnect();
    }

    //connect to next node on another time (100ms)
}


function ConnectToNodes()
{
    if(!SERVER || SERVER.CanSend<2)
        return;

    if(!SERVER.NodesArrUnSort || !SERVER.NodesArrUnSort.length)
        return;

    var Num=glCurNumFindArr%SERVER.NodesArrUnSort.length;
    var Node=SERVER.NodesArrUnSort[Num];
    if(Num===0)
        glCurNumFindArr=0;
    glCurNumFindArr++;


    if(global.NET_WORK_MODE && !NET_WORK_MODE.UseDirectIP)
    {
        if(!Node.StartFindList)
            return;
    }

    if(Node.Delete)
        return;

    if(SERVER.NodeInBan(Node))
        return;

    if(SERVER.BusyLevel && Node.BlockProcessCount<=SERVER.BusyLevel)
        return;


    if(GetSocketStatus(Node.Socket)===100)
    {
        if(global.NET_WORK_MODE && !NET_WORK_MODE.UseDirectIP)
            return;

        SERVER.StartGetNodes(Node);
    }
    else
    {
        SERVER.StartConnectTry(Node);
    }
    //connect to next node on another time
}


function RunServer(bVirtual)
{
    idRunOnce=setInterval(RunOnce,1000);
    ToLog("NETWORK: "+GetNetworkName());
    ToLog("VERSION: "+DEF_VERSION);

    if(global.NET_WORK_MODE)// && NET_WORK_MODE.UseDirectIP)
    {
        global.START_IP=NET_WORK_MODE.ip;
        global.START_PORT_NUMBER=NET_WORK_MODE.port;
    }

    var KeyPair = crypto.createECDH('secp256k1');
    if(!global.SERVER_PRIVATE_KEY_HEX || global.NEW_SERVER_PRIVATE_KEY)
    {
        while(true)
        {
            var Arr=crypto.randomBytes(32);
            KeyPair.setPrivateKey(Buffer.from(Arr));
            var Arr2=KeyPair.getPublicKey('','compressed');
            if(Arr2[0]===2)
                break;
        }

        global.SERVER_PRIVATE_KEY_HEX=GetHexFromArr(Arr);
        SAVE_CONST(true);
    }
    KeyPair.setPrivateKey(Buffer.from(GetArrFromHex(global.SERVER_PRIVATE_KEY_HEX)));
    new CServer(KeyPair,START_IP, START_PORT_NUMBER,false,bVirtual);

    DoStartFindList();
}

function DoStartFindList()
{
    var keyThisServer=SERVER.ip+":"+SERVER.port;

    for(var n=0;n<FindList.length;n++)
    {
        var item=FindList[n];
        if(!item.ip)
            continue;

        var key=item.ip+":"+item.port;
        if(keyThisServer===key)
            continue;


        var addrStr=GetHexFromAddres(crypto.randomBytes(32));
        var Node=SERVER.GetNewNode(addrStr,item.ip,item.port);
        Node.addrStrTemp=addrStr;
        //Node.DirectIP=1;
        Node.StartFindList=1;
        if(Node.BlockProcessCount<1000000)
            Node.BlockProcessCount=1000000;
    }
}


function RunOnce()
{
    if(global.SERVER)
    {
        clearInterval(idRunOnce);

        RunOnUpdate();

        if(global.RESTART_PERIOD_SEC)
        {
            var Period=(random(600)+global.RESTART_PERIOD_SEC);
            ToLog("SET RESTART NODE AFTER: "+Period+" sec");
            setInterval(function ()
            {
                RestartNode();
            },Period*1000)
        }

        setTimeout(function ()
        {
            RunStopPOWProcess();
        },10000)
    }
}

function RunOnUpdate()
{

    if(!UPDATE_NUM_COMPLETE)
        UPDATE_NUM_COMPLETE=0;
    var CurNum=UPDATE_NUM_COMPLETE;
    if(CurNum!==UPDATE_CODE_VERSION_NUM)
    {
        global.UPDATE_NUM_COMPLETE=UPDATE_CODE_VERSION_NUM;
        SAVE_CONST(true);

        global.SendLogToClient=1;
        ToLog("UPDATER Start");
        //DO UPDATE
        //DO UPDATE
        //DO UPDATE
        //----------------------------------------------------------------------------------------------------------

        CheckRewriteTr(2981080,"FD484F6B2DF9075DA77EB6BECF57C2AF3347D7A6F3851E7594092F9C1D9C0589",2000000);
        CheckRewriteTr(3047000,"2A8E6163A4413C33A5651F9547F365D21946D7586B1293AB0932432B98241283",2981080);
        CheckRewriteTr(3105000,"08F406ECDA4E3BE9DB0F0CBFF47D961E26C0443140557DC1CA6D729A4E96EC1D",3047000);
        CheckRewriteTr(3133700,"14B84537B73D1E00E42C6E5D7D91582D9B4F287C64F5114C4797BA60C8610FEE",3105000);

        CheckRewriteTr(3210000,"17FFDCCDF89B5803E9BD276636CEB9B9FDDA4B3A014E5045428A5F078AEE6C03",3133700);








        // global.UPDATE_NUM_COMPLETE=UPDATE_CODE_VERSION_NUM;
        // SAVE_CONST(true);

        //----------------------------------------------------------------------------------------------------------
        ToLog("UPDATER Finish");
        global.SendLogToClient=0;
    }
}

function CheckRewriteTr(Num,StrHash,StartRewrite)
{
    if(SERVER.BlockNumDB<StartRewrite)
        return "NO";

    var AccountsHash=DApps.Accounts.GetHashOrUndefined(Num);
    if(!AccountsHash || GetHexFromArr(AccountsHash) !== StrHash)
    {
        ToLog("START REWRITE ERR ACTS TRANSACTIONS")
        SERVER.ReWriteDAppTransactions(StartRewrite);
        return "Rewrite"
    }
    else
    {
        return "OK"
    }
}
global.CheckRewriteTr=CheckRewriteTr;

