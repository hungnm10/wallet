/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

global.NWMODE = 1, require("./library"), require("./crypto-library"), require("./terahash");
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
    3e3 < Math.abs(e) && PROCESS.exit(0);
};

function CalcPOWHash()
{
    if(Block.SeqHash)
    {
        if(new Date - Block.Time > Block.Period)
            return clearInterval(idInterval), void (idInterval = void 0);
        if(Block.BlockNum >= StartNumNewAlgo())
            CreatePOWVersion0(Block), process.send({cmd:"POW", SeqHash:Block.SeqHash, Hash:Block.Hash, PowHash:Block.PowHash, AddrHash:Block.AddrHash,
                Num:Block.Num});
        else
        {
            var e = GetArrFromValue(Block.Account), o = CreateAddrPOW(Block.SeqHash, e, Block.Hash, Block.LastNonce, Block.RunCount, Block.BlockNum);
            Block.LastNonce = o.LastNonce, o.bFind && (Block.Hash = o.MaxHash, Block.PowHash = o.MaxHash, process.send({cmd:"POW", SeqHash:Block.SeqHash,
                Hash:Block.Hash, AddrHash:e, PowHash:Block.PowHash, Num:Block.Num}));
        }
    }
};
PROCESS.on("message", function (e)
{
    if(LastAlive = new Date - 0, "SetBlock" === e.cmd)
    {
        var o = 1e7 * (1 + e.Num);
        Block.LastNonce && process.send({cmd:"HASHRATE", CountNonce:Block.LastNonce - o, Hash:Block.Hash}), (Block = e).Time = new Date - 0,
        Block.LastNonce = o, Block.Period = CONSENSUS_PERIOD_TIME * Block.Percent / 100, 0 < Block.Period && 0 < Block.RunPeriod && (CalcPOWHash(),
        void 0 !== idInterval && clearInterval(idInterval), idInterval = setInterval(CalcPOWHash, Block.RunPeriod));
    }
    else
        "Alive" === e.cmd || "Exit" === e.cmd && PROCESS.exit(0);
});
