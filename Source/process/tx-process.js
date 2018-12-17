/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

global.PROCESS_NAME = "TX";
const crypto = require('crypto');
const fs = require('fs');
require("../core/constant");
global.DATA_PATH = GetNormalPathString(global.DATA_PATH);
global.CODE_PATH = GetNormalPathString(global.CODE_PATH);
require("../core/library");
global.READ_ONLY_DB = 0;
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
global.ToLogClient = function (Str,StrKey,bFinal)
{
    process.send({cmd:"ToLogClient", Str:Str, StrKey:StrKey, bFinal:bFinal});
};
process.on('message', function (msg)
{
    LastAlive = Date.now();
    switch(msg.cmd)
    {
        case "ALive":
            break;
        case "FindTX":
            SERVER.TreeFindTX.SaveValue(msg.TX, msg.TX);
            break;
        case "RunTransaction":
            RunTransaction(msg);
            break;
        default:
            break;
    }
});

function CheckAlive()
{
    var Delta = Date.now() - LastAlive;
    if(Delta > CHECK_STOP_CHILD_PROCESS)
    {
        ToLog("TX-PROCESS: ALIVE TIMEOUT Stop and exit: " + Delta + "/" + global.CHECK_STOP_CHILD_PROCESS);
        process.exit(0);
        return ;
    }
};
process.on('uncaughtException', function (err)
{
    ToError(err.stack);
    ToLog(err.stack);
    TO_ERROR_LOG("TX-PROCESS", 777, err);
    ToLog("-----------------TX-PROCESS EXIT------------------");
    process.exit();
});
process.on('error', function (err)
{
    ToError("TX-PROCESS:\n" + err.stack);
    ToLog(err.stack);
});
global.HTTP_PORT_NUMBER = 0;
var CServerDB = require("../core/transaction-validator");
var KeyPair = crypto.createECDH('secp256k1');
KeyPair.setPrivateKey(Buffer.from([77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77, 77,
77, 77, 77, 77, 77, 77, 77, 77, 77, 77]));
global.SERVER = new CServerDB(KeyPair, undefined, undefined, false, true);
setInterval(function ()
{
    if(SERVER)
        SERVER.ClearBufMap();
    global.BlockDB.CloseDBFile("block-header");
    global.BlockDB.CloseDBFile("block-body");
    DoTXProcess();
}, 500);

function RunTransaction(msg)
{
    process.send({cmd:"RunOK", BlockNum:msg.BlockNum, SumHash:msg.SumHash, });
};
var BlockList = {};
var LastBlockNum = undefined;

function DoTXProcess()
{
    InitTXProcess();
    var BlockMin = FindMinimal();
    if(!BlockMin)
    {
        return ;
    }
    for(var Num = BlockMin.BlockNum + 1; Num < BlockMin.BlockNum + 1000; Num++)
    {
        var Block = SERVER.ReadBlockDB(Num);
        if(!Block)
            break;
        if(IsZeroArr(Block.SumHash))
            break;
        var Item = BlockList[Block.BlockNum];
        if(Item && CompareArr(Item.SumHash, Block.SumHash) === 0)
            continue;
        SERVER.BlockProcessTX(Block);
        BlockList[Block.BlockNum] = {BlockNum:Block.BlockNum, SumHash:Block.SumHash};
        LastBlockNum = Block.BlockNum;
    }
};

function FindMinimal()
{
    for(var Num = LastBlockNum; Num--; Num > 0)
    {
        var Block = SERVER.ReadBlockHeaderDB(Num);
        if(!Block)
        {
            continue;
        }
        if(Block.BlockNum % PERIOD_ACCOUNT_HASH === 0)
        {
            var Item = DApps.Accounts.DBAccountsHash.Read(Block.BlockNum / PERIOD_ACCOUNT_HASH);
            if(Item)
            {
                BlockList = {};
                BlockList[Block.BlockNum] = Item;
            }
        }
        var Item = BlockList[Block.BlockNum];
        if(Item && CompareArr(Item.SumHash, Block.SumHash) === 0)
            return Block;
    }
    Block = SERVER.ReadBlockHeaderDB(0);
    return Block;
};

function InitTXProcess()
{
    if(LastBlockNum === undefined)
    {
        var DB = DApps.Accounts.DBAccountsHash;
        var Item = DB.Read(DB.GetMaxNum());
        if(Item)
        {
            LastBlockNum = Item.BlockNum;
        }
        if(!LastBlockNum || LastBlockNum < START_BLOCK_ACCOUNT_HASH)
            LastBlockNum = START_BLOCK_ACCOUNT_HASH;
    }
};
