/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

global.PROCESS_NAME = "STATIC";
const crypto = require('crypto');
const fs = require('fs');
require("../core/constant");
global.DATA_PATH = GetNormalPathString(global.DATA_PATH);
global.CODE_PATH = GetNormalPathString(global.CODE_PATH);
require("../core/library");
global.READ_ONLY_DB = 1;
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
process.on('message', function (msg)
{
    LastAlive = Date.now();
    switch(msg.cmd)
    {
        case "ALive":
            break;
        case "GETBLOCKHEADER":
            GETBLOCKHEADER(msg);
            break;
        case "GETBLOCK":
            GETBLOCK(msg);
            break;
        case "GETCODE":
            GETCODE(msg);
            break;
    }
});

function CheckAlive()
{
    var Delta = Date.now() - LastAlive;
    if(Delta > CHECK_STOP_CHILD_PROCESS)
    {
        ToLog("STAIC-DB: ALIVE TIMEOUT Stop and exit: " + Delta + "/" + global.CHECK_STOP_CHILD_PROCESS);
        process.exit(0);
        return ;
    }
};
process.on('uncaughtException', function (err)
{
    ToError(err.stack);
    ToLog(err.stack);
    TO_ERROR_LOG("STAIC-DB", 777, err);
    ToLog("-----------------STAIC-DB EXIT------------------");
    process.exit();
});
process.on('error', function (err)
{
    ToError("STAIC-DB:\n" + err.stack);
    ToLog(err.stack);
});
var CServerDB = require("../core/db/block-db");
var KeyPair = crypto.createECDH('secp256k1');
KeyPair.setPrivateKey(Buffer.from([77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77,
77, 77, 77, 77, 77, 77, 77, 77, 77, 77]));
global.SERVER = new CServerDB(KeyPair, undefined, undefined, false, true);
global.HTTP_PORT_NUMBER = 0;
setInterval(function ()
{
    if(SERVER)
        SERVER.ClearBufMap();
    global.BlockDB.CloseDBFile("block-header");
    global.BlockDB.CloseDBFile("block-body");
}, 1000);

function GETBLOCKHEADER(msg)
{
    var Data = msg.Data;
    var StartNum = undefined;
    var BlockNum;
    var LoadHash = Data.Hash;
    var Foward = Data.Foward;
    if(Foward)
    {
        var BlockDB = SERVER.ReadBlockHeaderDB(Data.BlockNum);
        if(BlockDB && BlockDB.SumHash && CompareArr(BlockDB.SumHash, LoadHash) === 0)
        {
            StartNum = Data.BlockNum - BLOCK_PROCESSING_LENGTH2;
            if(StartNum < 0)
                StartNum = 0;
            BlockNum = StartNum + COUNT_BLOCKS_FOR_LOAD + BLOCK_PROCESSING_LENGTH2;
            if(BlockNum > SERVER.GetMaxNumBlockDB())
                BlockNum = SERVER.GetMaxNumBlockDB();
        }
    }
    else
    {
        BlockNum = Data.BlockNum;
        var IsSum = Data.IsSum;
        var Count = Data.Count;
        if(!Count || Count < 0 || BlockNum < 0)
            return ;
        if(Count > COUNT_BLOCKS_FOR_LOAD)
            Count = COUNT_BLOCKS_FOR_LOAD;
        Count += BLOCK_PROCESSING_LENGTH2;
        var BlockDB = SERVER.ReadBlockHeaderDB(BlockNum);
        if(BlockDB && (BlockDB.Prepared && (!IsSum) && BlockDB.Hash && CompareArr(BlockDB.Hash, LoadHash) === 0 || BlockDB.bSave && IsSum && BlockDB.SumHash && CompareArr(BlockDB.SumHash,
        LoadHash) === 0))
        {
            StartNum = BlockNum - Count + 1;
            if(StartNum < 0)
                StartNum = 0;
        }
    }
    var BufWrite = SERVER.BlockChainToBuf(StartNum, StartNum, BlockNum);
    process.send({cmd:"Send", addrStr:msg.addrStr, Method:"RETBLOCKHEADER", Context:msg.Context, Data:BufWrite});
};
const Formats = {BLOCK_TRANSFER:"{\
            BlockNum:uint,\
            TreeHash:hash,\
            arrContent:[tr],\
            }",
    WRK_BLOCK_TRANSFER:{}, };

function GETBLOCK(msg)
{
    var Data = msg.Data;
    var BlockNum = Data.BlockNum;
    var TreeHash = Data.TreeHash;
    if(msg.Context.SendCount)
    {
        return ;
    }
    var BufWrite;
    var BlockDB = undefined;
    if(TreeHash && !IsZeroArr(TreeHash))
    {
        BlockDB = SERVER.ReadBlockDB(BlockNum);
    }
    var StrSend;
    if(BlockDB && CompareArr(BlockDB.TreeHash, TreeHash) === 0)
    {
        var BufWrite = BufLib.GetBufferFromObject(BlockDB, Formats.BLOCK_TRANSFER, MAX_PACKET_LENGTH, Formats.WRK_BLOCK_TRANSFER);
        StrSend = "OK";
    }
    if(StrSend === "OK")
    {
        var TreeHash = CalcTreeHashFromArrBody(BlockDB.arrContent);
        if(CompareArr(BlockDB.TreeHash, TreeHash) !== 0)
        {
            ToLog("1. BAD CMP TreeHash block=" + BlockDB.BlockNum + " TO: " + Info.addrStr.substr(0, 8) + "  TreeHash=" + GetHexFromArr(TreeHash) + "  BlockTreeHash=" + GetHexFromArr(BlockDB.TreeHash));
            StrSend = "NO";
        }
    }
    if(StrSend === "OK")
    {
        ADD_TO_STAT("BLOCK_SEND");
    }
    else
    {
        BufWrite = BufLib.GetNewBuffer(100);
        StrSend = "NO";
    }
    process.send({cmd:"Send", addrStr:msg.addrStr, Method:"RETGETBLOCK", Context:msg.Context, Data:BufWrite});
};

function GETCODE(msg)
{
    var VersionNum = msg.Data;
    var fname = GetDataPath("Update/wallet-" + VersionNum + ".zip");
    if(fs.existsSync(fname))
    {
        var data = fs.readFileSync(fname);
        process.send({cmd:"Send", addrStr:msg.addrStr, Method:"RETCODE", Context:msg.Context, Data:data});
    }
};
