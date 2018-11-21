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
    var o;
    return (o = t ? r : r.slice())[0] = 255 & e, o[1] = e >>> 8 & 255, o[2] = e >>> 16 & 255, o[3] = e >>> 24 & 255, o[4] = 255 & n,
    o[5] = n >>> 8 & 255, o[6] = n >>> 16 & 255, o[7] = n >>> 24 & 255, shaarr(o);
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
    for(var o = [], a = 0; a < r.length; a++)
        o[a] = r[a];
    t || (t = 0);
    for(var E = 0, _ = MAX_SUPER_VALUE_POW, T = t; T <= t + n; T++)
    {
        var u = GetPowValue(GetHashWithValues(o, T, e, !0));
        u < _ && (E = T, _ = u);
    }
    return E;
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
        var n = 10 * Math.floor(e / 10);
        n < e && (n += 10), e = n;
    }
    return e;
};

function CreateHashBodyPOWInnerMinPower(r,e)
{
    var n = GetBlockNumTr(r);
    void 0 === e && (e = MIN_POWER_POW_TR + Math.log2(r.length / 128));
    for(var t = 0; ; )
    {
        if(e <= GetPowPower(CreateHashBody(r, n, t)))
            return t;
        ++t % 1e3 == 0 && (n = GetBlockNumTr(r));
    }
};

function CalcHashFromArray(r,e)
{
    void 0 === e && r.sort(CompareArr);
    for(var n = [], t = 0; t < r.length; t++)
        for(var o = r[t], a = 0; a < o.length; a++)
            n.push(o[a]);
    return 0 === n.length ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : 32 === n.length ? n : shaarr(n);
};

function GetArrFromValue(r)
{
    var e = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    e[0] = 255 & r, e[1] = r >>> 8 & 255, e[2] = r >>> 16 & 255, e[3] = r >>> 24 & 255;
    var n = Math.floor(r / 4294967296);
    return e[4] = 255 & n, e[5] = n >>> 8 & 255, e;
};
window.TYPE_TRANSACTION_CREATE = 100, window.MIN_POWER_POW_TR = 0, window.SetBlockChainConstant = function (r)
{
    var e = new Date - r.CurTime;
    r.DELTA_CURRENT_TIME || (r.DELTA_CURRENT_TIME = 0), window.DELTA_CURRENT_TIME2 = r.DELTA_CURRENT_TIME - e, window.MIN_POWER_POW_TR = r.MIN_POWER_POW_TR,
    window.FIRST_TIME_BLOCK = r.FIRST_TIME_BLOCK, window.CONSENSUS_PERIOD_TIME = r.CONSENSUS_PERIOD_TIME, window.GetCurrentBlockNumByTime = function ()
    {
        var r = new Date -  - DELTA_CURRENT_TIME2 - FIRST_TIME_BLOCK - CONSENSUS_PERIOD_TIME / 2;
        return Math.floor((r + CONSENSUS_PERIOD_TIME) / CONSENSUS_PERIOD_TIME);
    }, window.NWMODE = r.NWMODE;
}, window.GetCurrentBlockNumByTime = function ()
{
    return 0;
};
