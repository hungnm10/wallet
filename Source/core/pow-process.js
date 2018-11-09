/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

global.POWPROCESS = 1, require("./library"), require("./crypto-library"), require("./terahash");
var PROCESS = process;
process.send && !global.DEBUGPROCESS ? (global.ToLog = function (e)
{
    process.send({cmd:"log", message:e});
}, process.send({cmd:"online", message:"OK"})) : PROCESS = global.DEBUGPROCESS;
var LastAlive = new Date - 0;
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
            CreatePOWVersionX(Block) && process.send({cmd:"POW", SeqHash:Block.SeqHash, Hash:Block.Hash, PowHash:Block.PowHash, AddrHash:Block.AddrHash,
                Num:Block.Num});
        }
        catch(e)
        {
            ToError(e);
        }
    }
};
PROCESS.on("message", function (e)
{
    if(LastAlive = new Date - 0, "SetBlock" === e.cmd)
    {
        var o = 1e6 * (1 + e.Num);
        Block.HashCount && process.send({cmd:"HASHRATE", CountNonce:Block.HashCount, Hash:Block.Hash}), Block.HashCount = 0, (Block = e).Time = new Date - 0,
        Block.LastNonce = o, Block.Period = CONSENSUS_PERIOD_TIME * Block.Percent / 100, 0 < Block.Period && 0 < Block.RunPeriod && (CalcPOWHash(),
        void 0 !== idInterval && clearInterval(idInterval), idInterval = setInterval(CalcPOWHash, Block.RunPeriod));
    }
    else
        "Alive" === e.cmd || "Exit" === e.cmd && PROCESS.exit(0);
});
