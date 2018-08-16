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
var CServer=require("./server");

global.glCurNumFindArr=0;
global.ArrReconnect=[];
global.ArrConnect=[];

var FindList=[
    {"ip":"194.1.237.94","port":30000},//3
    {"ip":"91.235.136.81","port":30005},//5
    {"ip":"194.87.162.33","port":30000},//9
    //{"ip":"209.58.140.250","port":30000},//16
    // {"ip":"103.102.45.224","port":30000},//12
    // {"ip":"185.17.122.149","port":30000},//20
    ];





if(global.LOCAL_RUN)
{
    FindList=[{"ip":"127.0.0.1","port":40000},{"ip":"127.0.0.1","port":40001}];
}
//global.USE_LOG_NETWORK=1;

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
    DoConnectToNodes(ArrReconnect,"RECONNECT");
}, 200);

setInterval(function run2()
{
    DoGetNodes();

    DoConnectToNodes(ArrConnect,"CONNECT");
}, 500);



var StartCheckMining=0;
const os = require('os');
var cpus = os.cpus();
global.CountMiningCPU=cpus.length-1;
global.MiningPaused=0;
global.ArrMiningWrk=[];
var BlockMining;


if(global.ADDRLIST_MODE)
{
    return;
}


//------------------------------------------------------------------------------------------------------------------
function RunStopPOWProcess(Mode)
{
    if(!global.CountMiningCPU || global.CountMiningCPU<=0)
        return;
    if(!StartCheckMining)
    {
        StartCheckMining=1;
        setInterval(RunStopPOWProcess,1000);
    }



    if(global.USE_MINING && global.MINING_START_TIME && global.MINING_PERIOD_TIME)
    {
        var Time=GetCurrentTime();
        var TimeCur=Time.getUTCHours()*3600+Time.getUTCMinutes()*60+Time.getUTCSeconds();

        var StartTime=GetSecFromStrTime(global.MINING_START_TIME);
        var RunPeriod=GetSecFromStrTime(global.MINING_PERIOD_TIME);


        var TimeEnd=StartTime+RunPeriod;

        global.MiningPaused=1;
        if(TimeCur>=StartTime && TimeCur<=TimeEnd)
        {
            global.MiningPaused=0;
        }
        else
        {
            //may be start on prev day
            StartTime-=24*3600;
            TimeEnd-=24*3600;
            if(TimeCur>=StartTime && TimeCur<=TimeEnd)
            {
                global.MiningPaused=0;
            }
        }

        if(ArrMiningWrk.length && global.MiningPaused)
        {
            ToLog("------------ MINING MUST STOP ON TIME")
            ArrMiningWrk=[];
            return;
        }
        else
        if(!ArrMiningWrk.length && !global.MiningPaused)
        {
            ToLog("*********** MINING MUST START ON TIME")
        }
        else
        {
            return;
        }
    }
    else
    {
        global.MiningPaused=0;
    }





    if(!global.USE_MINING || Mode==="STOP")
    {
        ArrMiningWrk=[];
        return;
    }

    if(global.USE_MINING && ArrMiningWrk.length)
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
        ArrMiningWrk.push(Worker);
        Worker.Num=ArrMiningWrk.length;

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
                    ADD_HASH_RATE(msg.CountNonce);
                    //ADD_TO_STAT("MAX:POWER2",GetPowPower(msg.Hash));

                }

            });

        Worker.on('error', (err) =>
        {
            if(!ArrMiningWrk.length)
                return;
            ToError('ERROR IN PROCESS: '+err);
        });

        Worker.on('close', (code) =>
        {
            ToLog("STOP PROCESS: "+Worker.Num);
            for(var i=0;i<ArrMiningWrk.length;i++)
            {
                if(ArrMiningWrk[i].Num===Worker.Num)
                {
                    //ToLog("Delete wrk from arr");
                    ArrMiningWrk.splice(i,1);
                }
            }
        });
    }
}


function SetCalcPOW(Block)
{
    if(!global.USE_MINING)
        return;

    if(ArrMiningWrk.length!==CountMiningCPU)
        return;

    BlockMining=Block;
    for(var i=0;i<ArrMiningWrk.length;i++)
    {
        var CurWorker=ArrMiningWrk[i];
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


//------------------------------------------------------------------------------------------------------------------




function DoGetNodes()
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
}



function DoConnectToNodes(Arr,Mode)
{
    if(!SERVER || SERVER.CanSend<2)
    {
        return;
    }

    if(global.NET_WORK_MODE && !NET_WORK_MODE.UseDirectIP)
    {
        return;
    }

    if(Arr.length)
    {
        var MinProcessCount=SERVER.BusyLevel-1;
        for(var i=0;i<Arr.length;i++)
        {
            var Node=Arr[i];
            if(Node.BlockProcessCount>MinProcessCount)
            {
                Arr.splice(i,1);
                //AddNodeInfo(Node,Mode);
                if(Mode==="CONNECT")
                {
                    Node.WasAddToConnect=undefined;
                    SERVER.StartConnectTry(Node);
                }
                else
                if(Mode==="RECONNECT")
                {
                    Node.WasAddToReconnect=undefined;
                    Node.CreateConnect();
                }
                break;
            }
        }
    }

    //connect to next node on another time (100ms)
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

        // CheckRewriteTr(2981080,"FD484F6B2DF9075DA77EB6BECF57C2AF3347D7A6F3851E7594092F9C1D9C0589",2000000);
        // CheckRewriteTr(3047000,"2A8E6163A4413C33A5651F9547F365D21946D7586B1293AB0932432B98241283",2981080);
        // CheckRewriteTr(3105000,"08F406ECDA4E3BE9DB0F0CBFF47D961E26C0443140557DC1CA6D729A4E96EC1D",3047000);
        // CheckRewriteTr(3133700,"14B84537B73D1E00E42C6E5D7D91582D9B4F287C64F5114C4797BA60C8610FEE",3105000);
        // CheckRewriteTr(3210000,"17FFDCCDF89B5803E9BD276636CEB9B9FDDA4B3A014E5045428A5F078AEE6C03",3133700);
        //CheckRewriteTr(3452000,"59E094C37B3C0B52EC52A97B50A192DC1430ED0D3862C7C542CD7C30EE48E4FA",3210000);

        // CheckRewriteTr(3510000,"8382C26507A070CF7B354D1EA97B3FA295E1A9E811C44A6681BEAD15281B775B",3452000);
        // CheckRewriteTr(3520000,"A6644B15A9EF0FC17E4B577AC90E9AFA9D5AF6CD78302FB493F068BB138748CB",3510000);

        CheckRewriteTr(3630000,"ED9EB2CB7016E5492E93F1B0FD1954E36A8C640CE11E3E280FBA84AD20E0AD55",3520000);
        CheckRewriteTr(3635000,"7863A6835A93551E76730C987FBCF940D6CD3C3656E9DE65416F2BDADA0436A1",3630000);


        CheckRewriteTr(3700000,"F0ED88818B4441D1A4BF08D06CB2E26AD9FC74C3341F7EAC0F23D65967610877",3635000);
        CheckRewriteTr(3710000,"E44EE067C92983E7EEE45CE879F9D231FBC18DF8D189627AA55A035320A01306",3700000);



        CheckRewriteTr(3800000,"189703C8E8266449AD510E3F03F27C503D8E9115A31E74344BE0F31AEC6F9627",3710000);
        CheckRewriteTr(3880000,"C3EDEC71304A106E0AC4826896AE1EEDD0A6DAA7B952B7C000DF6BFC05209047",3800000);









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
        SERVER.ReWriteDAppTransactions(SERVER.BlockNumDB-StartRewrite);
        return "Rewrite"
    }
    else
    {
        return "OK"
    }
}
global.CheckRewriteTr=CheckRewriteTr;

