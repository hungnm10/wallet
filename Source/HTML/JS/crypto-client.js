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

function GetHashWithValues(r,e,n,t)
{
    var E;
    return (E = t ? r : r.slice())[0] = 255 & e, E[1] = e >>> 8 & 255, E[2] = e >>> 16 & 255, E[3] = e >>> 24 & 255, E[4] = 255 & n,
    E[5] = n >>> 8 & 255, E[6] = n >>> 16 & 255, E[7] = n >>> 24 & 255, shaarr(E);
};

function GetPowPower(r)
{
    for(var e = 0, n = 0; n < r.length; n++)
    {
        var t = Math.clz32(r[n]) - 24;
        if(e += t, 8 !== t)
            break;
    }
    return e;
};

function GetPowValue(r)
{
    var e = 2 * (r[0] << 23) + (r[1] << 16) + (r[2] << 8) + r[3];
    return e = 256 * (e = 256 * e + r[4]) + r[5];
};

function CreateNoncePOWExtern(r,e,n,t)
{
    for(var E = [], o = 0; o < r.length; o++)
        E[o] = r[o];
    t || (t = 0);
    for(var T = 0, a = MAX_SUPER_VALUE_POW, _ = t; _ <= t + n; _++)
    {
        var u = GetPowValue(GetHashWithValues(E, _, e, !0));
        u < a && (T = _, a = u);
    }
    return T;
};

function CreateHashBody(r,e,n)
{
    var t = r.length - 12;
    return r[t + 0] = 255 & e, r[t + 1] = e >>> 8 & 255, r[t + 2] = e >>> 16 & 255, r[t + 3] = e >>> 24 & 255, r[t + 4] = 0, r[t + 5] = 0,
    r[(t = r.length - 6) + 0] = 255 & n, r[t + 1] = n >>> 8 & 255, r[t + 2] = n >>> 16 & 255, r[t + 3] = n >>> 24 & 255, r[t + 4] = 0,
    r[t + 5] = 0, shaarr(r);
};

function GetBlockNumTr(r)
{
    var e = GetCurrentBlockNumByTime();
    if(r[0] === TYPE_TRANSACTION_CREATE)
    {
        var n = 10 * Math.trunc(e / 10);
        n < e && (n += 10), e = n;
    }
    return e;
};

function CreateHashBodyPOWInnerMinPower(r,e)
{
    for(var n = GetBlockNumTr(r), t = 0; ; )
    {
        if(e <= GetPowPower(CreateHashBody(r, n, t)))
            return t;
        ++t % 1e3 == 0 && (n = GetBlockNumTr(r));
    }
};
window.TYPE_TRANSACTION_CREATE = 100, window.SetBlockChainConstant = function (r)
{
    var e = new Date - r.CurTime;
    r.DELTA_CURRENT_TIME || (r.DELTA_CURRENT_TIME = 0), window.DELTA_CURRENT_TIME2 = r.DELTA_CURRENT_TIME - e, window.FIRST_TIME_BLOCK = r.FIRST_TIME_BLOCK,
    window.CONSENSUS_PERIOD_TIME = r.CONSENSUS_PERIOD_TIME, window.GetCurrentBlockNumByTime = function ()
    {
        var r = new Date -  - DELTA_CURRENT_TIME2 - FIRST_TIME_BLOCK - CONSENSUS_PERIOD_TIME / 2;
        return Math.floor((r + CONSENSUS_PERIOD_TIME) / CONSENSUS_PERIOD_TIME);
    };
}, window.GetCurrentBlockNumByTime = function ()
{
    return 0;
};
