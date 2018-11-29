/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

require("./constant.js");
var fs = require("fs");
require("./log-strict.js");
var file_name_info = GetDataPath("info.log"), file_name_infoPrev = GetDataPath("info-prev.log");
CheckSizeLogFile(file_name_info, file_name_infoPrev);
var file_name_log = GetDataPath("log.log"), file_name_logPrev = GetDataPath("log-prev.log");
CheckSizeLogFile(file_name_log, file_name_logPrev);
var StartStatTime, file_name_error = GetDataPath("err.log"), file_name_errorPrev = GetDataPath("err-prev.log");

function ToLogFile(t,e,r)
{
    e instanceof Error && (e = e.message + "\n" + e.stack), console.log(START_PORT_NUMBER + ": " + GetStrOnlyTime() + ": " + e),
    r || SaveToLogFileSync(t, e);
};

function ToLogClient(t,e,r)
{
    t && (ToLogFile(file_name_log, t), e || (e = ""), ArrLogClient.push({text:GetStrOnlyTime() + " " + t, key:e, final:r}), 13 < ArrLogClient.length && ArrLogClient.shift());
};
CheckSizeLogFile(file_name_error, file_name_errorPrev), global.ToLog = function (t)
{
    global.SendLogToClient || global.ALL_LOG_TO_CLIENT ? ToLogClient(t, void 0, void 0) : ToLogFile(file_name_log, t);
}, global.SmallAddr = function (t)
{
    return t.substr(0, 5);
}, global.ToErrorTrace = function (t)
{
    ToError(t + ":" + (new Error).stack);
}, global.ToLogTrace = function (t)
{
    ToErrorTrace(t);
}, global.ToInfo = function (t)
{
    ToLogFile(file_name_info, t, 1);
}, global.ToError = function (t)
{
    ToLogFile(file_name_error, t);
}, global.ArrLogClient = [], global.ToLogClient = ToLogClient;
var CONTEXT_STATS = {Total:{}, Interval:[]}, CONTEXT_ERRORS = {Total:{}, Interval:[]}, CurStatIndex = 0;

function GetCurrentStatIndex()
{
    var t = 2 * MAX_STAT_PERIOD + 2;
    return CurStatIndex % t;
};

function ResizeArrMax(t)
{
    for(var e = [], r = Math.trunc(t.length / 2), o = 0; o < r; o++)
        e[o] = Math.max(t[2 * o], t[2 * o + 1]);
    return e;
};

function ResizeArrAvg(t)
{
    for(var e = [], r = Math.trunc(t.length / 2), o = 0; o < r; o++)
        e[o] = (t[2 * o] + t[2 * o + 1]) / 2;
    return e;
};

function ResizeArr(t)
{
    for(var e = [], r = Math.trunc(t.length / 2), o = 0; o < r; o++)
        e[o] = t[2 * o];
    return e;
};

function GetDiagramData(t,e)
{
    var r, o = 2 * MAX_STAT_PERIOD + 2;
    r = "MAX:" === e.substr(0, 4);
    for(var n, a = MAX_STAT_PERIOD, l = (GetCurrentStatIndex() - a + o) % o, i = (t.Total, []), T = void 0, g = l; g < l + a; g++)
    {
        var S = g % o;
        if(n = t.Interval[S])
        {
            var f = n[e];
            void 0 !== f ? r ? i.push(f) : (void 0 !== T ? i.push(f - T) : i.push(f), T = f) : i.push(0);
        }
    }
    return i;
};

function CalcInterval(t,e,r)
{
    for(var o, n = 2 * MAX_STAT_PERIOD + 2, a = {}, l = (e - r + n) % n, i = t.Total, T = l; T < l + r; T++)
    {
        var g = T % n;
        if(o = t.Interval[g])
            break;
    }
    if(o)
        for(var S in i)
            "MAX:" === S.substr(0, 4) ? a[S] = 0 : void 0 === o[S] ? a[S] = i[S] : a[S] = i[S] - o[S];
    return a;
};

function AddToStatContext(t,e,r)
{
    void 0 === r && (r = 1);
    var o = t.Total[e];
    o || (o = 0), "MAX:" === e.substr(0, 4) ? o = Math.max(o, r) : o += r, t.Total[e] = o, StartStatTime || (StartStatTime = GetCurrentTime(0));
};

function CopyStatInterval(t,e)
{
    var r = t.Interval[e];
    r || (r = {}, t.Interval[e] = r);
    var o = t.Total;
    for(var n in o)
        r[n] = o[n], "MAX:" === n.substr(0, 4) && (o[n] = 0);
};

function SaveToLogFileAsync(t,o)
{
    fs.open(t, "a", void 0, function (t,r)
    {
        if(t)
            console.log("Ошибка открытия лог-файла ошибок");
        else
        {
            var e = GetStrTime() + " : " + o + "\r\n";
            fs.write(r, e, null, "utf8", function (t,e)
            {
                t ? console.log("Ошибка записи в лог-файл ошибок!") : (console.log(o), fs.close(r));
            });
        }
    });
};

function SaveToLogFileSync(t,e)
{
    try
    {
        var r = GetStrTime() + " : " + e + "\r\n", o = fs.openSync(t, "a");
        fs.writeSync(o, r, null, "utf8"), fs.closeSync(o);
    }
    catch(t)
    {
        console.log(t.message);
    }
};
global.PrepareStatEverySecond = function ()
{
    CurStatIndex++;
    var t = GetCurrentStatIndex();
    if(CopyStatInterval(CONTEXT_STATS, t), CopyStatInterval(CONTEXT_ERRORS, t), SERVER.MiningBlock)
    {
        var e = SERVER.MiningBlock;
        SERVER.СтатБлок = {BlockNum:e.BlockNum, SeqHash:e.SeqHash, AddrHash:e.AddrHash};
    }
}, global.TO_ERROR_LOG = function (t,e,r,o,n,a)
{
    r instanceof Error && (r = r.message + "\n"), "rinfo" === o ? r += " from: " + n.address + ":" + n.port : "node" === o && (r += " from: " + n.ip + ":" + n.port);
    var l = t + ":" + e;
    ToError(" ==ERROR== " + l + " " + r), AddToStatContext(CONTEXT_ERRORS, l), ADD_TO_STAT("ERRORS");
}, global.HASH_RATE = 0, global.ADD_HASH_RATE = function (t)
{
    t /= 1e6, global.HASH_RATE += t, ADD_TO_STAT("HASHRATE", t);
}, global.GET_STAT = function (t)
{
    var e = CONTEXT_STATS.Total[t];
    return e || (e = 0), e;
}, global.ADD_TO_STAT_TIME = function (t,e,r)
{
    if(global.STAT_MODE)
    {
        if(r && 2 !== global.STAT_MODE)
            return ;
        var o = process.hrtime(e), n = 1e3 * o[0] + o[1] / 1e6;
        ADD_TO_STAT(t, n);
    }
}, global.ADD_TO_STAT = function (t,e,r)
{
    if(global.STAT_MODE)
    {
        if(r && 2 !== global.STAT_MODE)
            return ;
        AddToStatContext(CONTEXT_STATS, t, e);
    }
}, global.GET_STATDIAGRAMS = function (t)
{
    GetCurrentTime();
    var e = GetCurrentStatIndex();
    if(!t || !t.length)
        return [];
    for(var r = [], o = 0; o < t.length; o++)
    {
        var n = t[o], a = GetDiagramData(CONTEXT_STATS, n);
        r.push({name:n, maxindex:e, arr:a, starttime:StartStatTime - 0, steptime:1});
    }
    var l = void 0;
    for(o = 0; o < r.length; o++)
    {
        0 < (T = r[o].arr).length && (void 0 === l || T.length < l) && (l = T.length);
    }
    for(o = 0; o < r.length; o++)
    {
        var i = r[o], T = i.arr;
        l && T.length > l && (T = T.slice(T.length - l)), l && 0 <= ",POWER_MY_WIN,POWER_BLOCKCHAIN,".indexOf("," + i.name + ",") && (T = SERVER.GetStatBlockchain(i.name));
        for(var g = 0, S = 0; S < T.length; S++)
            T[S] && (g += T[S]);
        0 < T.length && (g /= T.length);
        var f = 1;
        if("MAX:" === i.name.substr(0, 4))
            for(; 500 <= T.length; )
                T = ResizeArrMax(T), f *= 2;
        else
            for(; 500 <= T.length; )
                T = ResizeArrAvg(T), f *= 2;
        i.AvgValue = g, i.steptime = f, i.arr = T.slice(1);
    }
    return r;
}, global.GET_STATS = function (t)
{
    var e = GetCurrentTime(), r = GetCurrentStatIndex();
    return {stats:{Counter:CONTEXT_STATS.Total, Counter10S:CalcInterval(CONTEXT_STATS, r, 10), Counter10M:CalcInterval(CONTEXT_STATS,
            r, 600)}, errors:{Counter:CONTEXT_ERRORS.Total, Counter10S:CalcInterval(CONTEXT_ERRORS, r, 10), Counter10M:CalcInterval(CONTEXT_ERRORS,
            r, 600)}, period:(e - StartStatTime) / 1e3, Confirmation:[]};
}, global.StartCommonStat = function ()
{
    for(var t in CONTEXT_STATS.Total)
        return ;
    ClearCommonStat();
}, global.ClearCommonStat = function ()
{
    StartStatTime = void (CurStatIndex = 0), CONTEXT_STATS = {Total:{}, Interval:[]}, CONTEXT_ERRORS = {Total:{}, Interval:[]},
    global.HASH_RATE = 0, SERVER.ClearStat();
}, global.ResizeArrAvg = ResizeArrAvg, global.ResizeArrMax = ResizeArrMax, DEBUG_MODE ? global.TO_DEBUG_LOG = function (t,e,r,o)
{
    DEBUG_MODE && ("rinfo" === e && (t += " from: " + r.address + ":" + r.port + " - " + o.length), ToLog(t));
} : global.TO_DEBUG_LOG = function (t,e,r,o)
{
}, global.GetStrOnlyTime = function (t)
{
    var e = "" + (t = t || GetCurrentTime()).getHours().toStringZ(2);
    return e = (e = (e = e + ":" + t.getMinutes().toStringZ(2)) + ":" + t.getSeconds().toStringZ(2)) + "." + t.getMilliseconds().toStringZ(3);
}, global.GetStrTime = function (t)
{
    var e = "" + (t = t || GetCurrentTime()).getDate().toStringZ(2);
    return e = (e = (e = (e = (e = (e = e + "." + (1 + t.getMonth()).toStringZ(2)) + "." + t.getFullYear()) + " " + t.getHours().toStringZ(2)) + ":" + t.getMinutes().toStringZ(2)) + ":" + t.getSeconds().toStringZ(2)) + "." + t.getMilliseconds().toStringZ(3);
};
