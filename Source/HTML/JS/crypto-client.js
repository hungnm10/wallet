/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

var MAX_SUPER_VALUE_POW = 2 * (1 << 30);

function GetHashWithValues(e,r,n,t)
{
    var o;
    return (o = t ? e : e.slice())[0] = 255 & r, o[1] = r >>> 8 & 255, o[2] = r >>> 16 & 255, o[3] = r >>> 24 & 255, o[4] = 255 & n,
    o[5] = n >>> 8 & 255, o[6] = n >>> 16 & 255, o[7] = n >>> 24 & 255, shaarr(o);
};

function GetPowPower(e)
{
    for(var r = 0, n = 0; n < e.length; n++)
    {
        var t = Math.clz32(e[n]) - 24;
        if(r += t, 8 !== t)
            break;
    }
    return r;
};

function GetPowValue(e)
{
    var r = 2 * (e[0] << 23) + (e[1] << 16) + (e[2] << 8) + e[3];
    return r = 256 * (r = 256 * r + e[4]) + e[5];
};

function CreateNoncePOWExtern(e,r,n,t)
{
    for(var o = [], E = 0; E < e.length; E++)
        o[E] = e[E];
    t || (t = 0);
    for(var a = 0, _ = MAX_SUPER_VALUE_POW, T = t; T <= t + n; T++)
    {
        var u = GetPowValue(GetHashWithValues(o, T, r, !0));
        u < _ && (a = T, _ = u);
    }
    return a;
};

function CreateHashBody(e,r,n)
{
    var t = e.length - 12;
    return e[t + 0] = 255 & r, e[t + 1] = r >>> 8 & 255, e[t + 2] = r >>> 16 & 255, e[t + 3] = r >>> 24 & 255, e[t + 4] = 0, e[t + 5] = 0,
    e[(t = e.length - 6) + 0] = 255 & n, e[t + 1] = n >>> 8 & 255, e[t + 2] = n >>> 16 & 255, e[t + 3] = n >>> 24 & 255, e[t + 4] = 0,
    e[t + 5] = 0, shaarr(e);
};

function CreateHashBodyPOWInnerMinPower(e,r)
{
    for(var n = GetCurrentBlockNumByTime(), t = 0; ; )
    {
        if(r <= GetPowPower(CreateHashBody(e, n, t)))
            return t;
        ++t % 1e3 == 0 && (n = GetCurrentBlockNumByTime());
    }
};
window.SetBlockChainConstant = function (e)
{
    var r = new Date - e.CurTime;
    e.DELTA_CURRENT_TIME || (e.DELTA_CURRENT_TIME = 0), window.DELTA_CURRENT_TIME2 = e.DELTA_CURRENT_TIME - r, window.FIRST_TIME_BLOCK = e.FIRST_TIME_BLOCK,
    window.CONSENSUS_PERIOD_TIME = e.CONSENSUS_PERIOD_TIME, window.GetCurrentBlockNumByTime = function ()
    {
        var e = new Date -  - DELTA_CURRENT_TIME2 - FIRST_TIME_BLOCK - CONSENSUS_PERIOD_TIME / 2;
        return Math.floor((e + CONSENSUS_PERIOD_TIME) / CONSENSUS_PERIOD_TIME);
    };
}, window.GetCurrentBlockNumByTime = function ()
{
    return 0;
};
