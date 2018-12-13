/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

global.POWPROCESS = 1, require("./library"), require("./crypto-library"), require("./terahashmining");
var PROCESS = process;
process.send && !global.DEBUGPROCESS ? (global.ToLog = function (e)
{
    process.send({cmd:"log", message:e});
}, process.send({cmd:"online", message:"OK"})) : PROCESS = global.DEBUGPROCESS;
var LastAlive = Date.now();
setInterval(CheckAlive, 1e3);
var idInterval = void 0, Block = {};

function CheckAlive()
{
    var e = new Date - LastAlive;
    Math.abs(e) > CHECK_STOP_CHILD_PROCESS && PROCESS.exit(0);
};

function CalcPOWHash()
{
    if(Block.SeqHash)
    {
        if(new Date - Block.Time > Block.Period)
            return clearInterval(idInterval), void (idInterval = void 0);
        try
        {
            CreatePOWVersionX(Block) && process.send({cmd:"POW", BlockNum:Block.BlockNum, SeqHash:Block.SeqHash, Hash:Block.Hash, PowHash:Block.PowHash,
                AddrHash:Block.AddrHash, Num:Block.Num});
        }
        catch(e)
        {
            ToError(e);
        }
    }
};
PROCESS.on("message", function (e)
{
    if(LastAlive = new Date - 0, "FastCalcBlock" === e.cmd)
    {
        var o = e;
        StartHashPump(o), o.RunCount = 0, o.RunCount0 = 100;
        try
        {
            CreatePOWVersionX(o) && process.send({cmd:"POW", BlockNum:o.BlockNum, SeqHash:o.SeqHash, Hash:o.Hash, PowHash:o.PowHash, AddrHash:o.AddrHash,
                Num:o.Num});
        }
        catch(e)
        {
            ToError(e);
        }
    }
    else
        if("SetBlock" === e.cmd)
        {
            var a = 1e6 * (1 + e.Num);
            Block.HashCount && process.send({cmd:"HASHRATE", CountNonce:Block.HashCount, Hash:Block.Hash}), Block.HashCount = 0, (Block = e).Time = new Date - 0,
            Block.LastNonce = a, Block.Period = CONSENSUS_PERIOD_TIME * Block.Percent / 100, 0 < Block.Period && 0 < Block.RunPeriod && (CalcPOWHash(),
            void 0 !== idInterval && clearInterval(idInterval), idInterval = setInterval(CalcPOWHash, Block.RunPeriod));
        }
        else
            "Alive" === e.cmd || "Exit" === e.cmd && PROCESS.exit(0);
});
var BlockPump = void 0, idIntervalPump = void 0;

function StartHashPump(e)
{
    (!BlockPump || BlockPump.BlockNum < e.BlockNum) && (BlockPump = {BlockNum:e.BlockNum, RunCount:e.RunCount, MinerID:e.MinerID,
        Percent:e.Percent, LastNonce:0}), idIntervalPump || (idIntervalPump = setInterval(PumpHash, global.POWRunPeriod));
};
var StartTime = 1, EndTime = 0;

function PumpHash()
{
    if(BlockPump)
    {
        var e = Date.now();
        if(EndTime < StartTime)
        {
            if(100 * (e - StartTime) / CONSENSUS_PERIOD_TIME > BlockPump.Percent)
                return void (EndTime = e);
            CreatePOWVersionX(BlockPump, 1);
        }
        else
        {
            100 * (e - EndTime) / CONSENSUS_PERIOD_TIME > 100 - BlockPump.Percent && (StartTime = e);
        }
    }
};
