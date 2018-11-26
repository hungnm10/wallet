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

function GetHashWithValues(r,n,e,t)
{
    var o;
    return (o = t ? r : r.slice())[0] = 255 & n, o[1] = n >>> 8 & 255, o[2] = n >>> 16 & 255, o[3] = n >>> 24 & 255, o[4] = 255 & e,
    o[5] = e >>> 8 & 255, o[6] = e >>> 16 & 255, o[7] = e >>> 24 & 255, shaarr(o);
};

function GetPowPower(r)
{
    for(var n = 0, e = 0; e < r.length; e++)
    {
        var t = Math.clz32(r[e]) - 24;
        if(n += t, 8 !== t)
            break;
    }
    return n;
};

function GetPowValue(r)
{
    var n = 2 * (r[0] << 23) + (r[1] << 16) + (r[2] << 8) + r[3];
    return n = 256 * (n = 256 * n + r[4]) + r[5];
};

function CreateNoncePOWExtern(r,n,e,t)
{
    for(var o = [], _ = 0; _ < r.length; _++)
        o[_] = r[_];
    t || (t = 0);
    for(var E = 0, a = MAX_SUPER_VALUE_POW, T = t; T <= t + e; T++)
    {
        var u = GetPowValue(GetHashWithValues(o, T, n, !0));
        u < a && (E = T, a = u);
    }
    return E;
};

function CreateHashBody(r,n,e)
{
    var t = r.length - 12;
    return r[t + 0] = 255 & n, r[t + 1] = n >>> 8 & 255, r[t + 2] = n >>> 16 & 255, r[t + 3] = n >>> 24 & 255, r[t + 4] = 0, r[t + 5] = 0,
    r[(t = r.length - 6) + 0] = 255 & e, r[t + 1] = e >>> 8 & 255, r[t + 2] = e >>> 16 & 255, r[t + 3] = e >>> 24 & 255, r[t + 4] = 0,
    r[t + 5] = 0, shaarr(r);
};

function GetBlockNumTr(r)
{
    var n = GetCurrentBlockNumByTime();
    if(r[0] === TYPE_TRANSACTION_CREATE)
    {
        var e = 10 * Math.floor(n / 10);
        e < n && (e += 10), n = e;
    }
    return n;
};

function CreateHashBodyPOWInnerMinPower(r,n)
{
    var e = GetBlockNumTr(r);
    void 0 === n && (n = MIN_POWER_POW_TR + Math.log2(r.length / 128));
    for(var t = 0; ; )
    {
        if(n <= GetPowPower(CreateHashBody(r, e, t)))
            return t;
        ++t % 1e3 == 0 && (e = GetBlockNumTr(r));
    }
};

function CalcHashFromArray(r,n)
{
    void 0 === n && r.sort(CompareArr);
    for(var e = [], t = 0; t < r.length; t++)
        for(var o = r[t], _ = 0; _ < o.length; _++)
            e.push(o[_]);
    return 0 === e.length ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : 32 === e.length ? e : shaarr(e);
};

function GetArrFromValue(r)
{
    var n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    n[0] = 255 & r, n[1] = r >>> 8 & 255, n[2] = r >>> 16 & 255, n[3] = r >>> 24 & 255;
    var e = Math.floor(r / 4294967296);
    return n[4] = 255 & e, n[5] = e >>> 8 & 255, n;
};
window.TYPE_TRANSACTION_CREATE = 100, window.MIN_POWER_POW_TR = 0, window.MIN_POWER_POW_ACC_CREATE = 0, window.SetBlockChainConstant = function (r)
{
    var n = new Date - r.CurTime;
    r.DELTA_CURRENT_TIME || (r.DELTA_CURRENT_TIME = 0), window.DELTA_CURRENT_TIME2 = r.DELTA_CURRENT_TIME - n, window.MIN_POWER_POW_TR = r.MIN_POWER_POW_TR,
    window.MIN_POWER_POW_ACC_CREATE = r.MIN_POWER_POW_ACC_CREATE + 3, window.FIRST_TIME_BLOCK = r.FIRST_TIME_BLOCK, window.CONSENSUS_PERIOD_TIME = r.CONSENSUS_PERIOD_TIME,
    window.GetCurrentBlockNumByTime = function ()
    {
        var r = new Date -  - DELTA_CURRENT_TIME2 - FIRST_TIME_BLOCK - CONSENSUS_PERIOD_TIME / 2;
        return Math.floor((r + CONSENSUS_PERIOD_TIME) / CONSENSUS_PERIOD_TIME);
    }, window.NWMODE = r.NWMODE;
}, window.GetCurrentBlockNumByTime = function ()
{
    return 0;
};
