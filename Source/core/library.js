/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

var fs = require("fs");
if(require("./constant.js"), global.USE_PARAM_JS)
{
    var PathParams = GetCodePath("../extern-run.js");
    if(fs.existsSync(PathParams))
        try
        {
            require(PathParams);
        }
        catch(r)
        {
            console.log(r);
        }
}

function ReadUintFromArr(r,t)
{
    void 0 === t && (t = r.len, r.len += 6);
    var e = 2 * (r[t + 5] << 23) + (r[t + 4] << 16) + (r[t + 3] << 8) + r[t + 2];
    return e = 256 * (e = 256 * e + r[t + 1]) + r[t];
};

function ReadUint32FromArr(r,t)
{
    return void 0 === t && (t = r.len, r.len += 4), 2 * (r[t + 3] << 23) + (r[t + 2] << 16) + (r[t + 1] << 8) + r[t];
};

function ReadUint16FromArr(r,t)
{
    return void 0 === t && (t = r.len, r.len += 2), (r[t + 1] << 8) + r[t];
};

function WriteUintToArr(r,t)
{
    var e = r.length;
    r[e] = 255 & t, r[e + 1] = t >>> 8 & 255, r[e + 2] = t >>> 16 & 255, r[e + 3] = t >>> 24 & 255;
    var o = Math.floor(t / 4294967296);
    r[e + 4] = 255 & o, r[e + 5] = o >>> 8 & 255;
};

function WriteUintToArrOnPos(r,t,e)
{
    r[e] = 255 & t, r[e + 1] = t >>> 8 & 255, r[e + 2] = t >>> 16 & 255, r[e + 3] = t >>> 24 & 255;
    var o = Math.floor(t / 4294967296);
    r[e + 4] = 255 & o, r[e + 5] = o >>> 8 & 255;
};

function WriteUint32ToArr(r,t)
{
    var e = r.length;
    r[e] = 255 & t, r[e + 1] = t >>> 8 & 255, r[e + 2] = t >>> 16 & 255, r[e + 3] = t >>> 24 & 255;
};

function WriteUint32ToArrOnPos(r,t,e)
{
    r[e] = 255 & t, r[e + 1] = t >>> 8 & 255, r[e + 2] = t >>> 16 & 255, r[e + 3] = t >>> 24 & 255;
};

function WriteUint16ToArrOnPos(r,t,e)
{
    r[e] = 255 & t, r[e + 1] = t >>> 8 & 255;
};

function WriteArrToArr(r,t,e)
{
    for(var o = r.length, n = 0; n < e; n++)
        r[o + n] = t[n];
};

function WriteArrToArrOnPos(r,t,e,o)
{
    for(var n = 0; n < o; n++)
        r[e + n] = t[n];
};

function WriteArrToArrHOnPos(r,t,e,o)
{
    for(var n = 0; n < o; n++)
        r[e + n] |= t[n] << 8;
};

function ConvertBufferToStr(r)
{
    for(var t in r)
    {
        var e = r[t];
        e instanceof Buffer ? r[t] = GetHexFromArr(e) : "object" == typeof e && ConvertBufferToStr(e);
    }
};

function CopyObjValue(r,t)
{
    if(t && 5 < t)
        return r;
    var e = {};
    for(var o in r)
    {
        var n = r[o];
        "object" != typeof n || n instanceof Buffer || n instanceof ArrayBuffer || n instanceof Array || (n = CopyObjValue(n, t + 1)),
        e[o] = n;
    }
    return e;
};

function CopyArr(r)
{
    var t = [];
    if(r)
        for(var e = 0; e < r.length; e++)
            t[e] = r[e];
    return t;
};
require("./log.js"), global.BufLib = require("../core/buffer"), require("../HTML/JS/sha3.js"), require("../HTML/JS/coinlib.js"),
Number.prototype.toStringZ = function (r)
{
    var t = this.toString();
    return t.length > r ? r = t.length : t = "0000000000" + t, t.substring(t.length - r, t.length);
}, String.prototype.right = function (r)
{
    return this.length > r ? this.substr(this.length - r, r) : this.substr(0, this.length);
}, global.ReadUint32FromArr = ReadUint32FromArr, global.ReadUintFromArr = ReadUintFromArr, global.ReadUint16FromArr = ReadUint16FromArr,
global.WriteUintToArr = WriteUintToArr, global.WriteUint32ToArr = WriteUint32ToArr, global.WriteUint32ToArrOnPos = WriteUint32ToArrOnPos,
global.WriteUint16ToArrOnPos = WriteUint16ToArrOnPos, global.WriteUintToArrOnPos = WriteUintToArrOnPos, global.WriteArrToArr = WriteArrToArr,
global.WriteArrToArrOnPos = WriteArrToArrOnPos, global.WriteArrToArrHOnPos = WriteArrToArrHOnPos, global.ConvertBufferToStr = ConvertBufferToStr,
global.CopyObjValue = CopyObjValue, global.CopyArr = CopyArr, global.DelDir = function (r)
{
    if("/" === r.substr(r.length - 1, 1) && (r = r.substr(0, r.length - 1)), fs.existsSync(r))
        for(var t = fs.readdirSync(r), e = 0; e < t.length; e++)
        {
            var o = r + "/" + t[e];
            if(fs.statSync(o).isDirectory())
                DelDir(o);
            else
            {
                if("const.lst" == o.right(9))
                    continue;
                if("log.log" == o.right(7))
                    continue;
                fs.unlinkSync(o);
            }
        }
}, global.SliceArr = function (r,t,e)
{
    for(var o = [], n = t; n < e; n++)
        o[n - t] = r[n];
    return o;
}, global.RandomValue = Math.floor(123 + 1e3 * Math.random()), global.random = function (r)
{
    return Math.floor(Math.random() * r);
}, global.AddrLevelArrFromBegin = function (r,t)
{
    for(var e = 0, o = 0; o < r.length; o++)
        for(var n = r[o], a = t[o], i = 0; i < 8; i++)
        {
            if((128 & n) != (128 & a))
                return e;
            n <<= 1, a <<= 1, e++;
        }
    return e;
}, global.AddrLevelArr = function (r,t)
{
    for(var e = 0, o = r.length - 1; 0 <= o; o--)
        for(var n = r[o], a = t[o], i = 0; i < 8; i++)
        {
            if((1 & n) != (1 & a))
                return e;
            n >>= 1, a >>= 1, e++;
        }
    return e;
}, global.SaveToFile = function (r,t)
{
    var e = require("fs"), o = e.openSync(r, "w");
    e.writeSync(o, t, 0, t.length), e.closeSync(o);
}, global.LoadParams = function (t,r)
{
    try
    {
        if(fs.existsSync(t))
        {
            var e = fs.readFileSync(t);
            if(0 < e.length)
                return JSON.parse(e);
        }
    }
    catch(r)
    {
        TO_ERROR_LOG("MAINLIB", 100, "Error in file:" + t + "\n" + r);
    }
    return r;
}, global.SaveParams = function (r,t)
{
    SaveToFile(r, Buffer.from(JSON.stringify(t, "", 4)));
}, global.StartTime = function ()
{
    global.TimeStart = GetCurrentTime();
}, global.FinishTime = function (r)
{
    r = r || "";
    var t = GetCurrentTime() - TimeStart;
    console.log(r + " time: " + t + " ms");
}, global.CompareItemBufFD = function (r,t)
{
    return r.FD !== t.FD ? r.FD - t.FD : r.Position - t.Position;
}, global.CompareArr = function (r,t)
{
    for(var e = 0; e < r.length; e++)
        if(r[e] !== t[e])
            return r[e] - t[e];
    return 0;
}, global.CompareArr33 = function (r,t)
{
    for(var e = 0; e < 33; e++)
        if(r[e] !== t[e])
            return r[e] - t[e];
    return 0;
}, global.CompareItemHashSimple = function (r,t)
{
    return r.hash < t.hash ?  - 1 : r.hash > t.hash ? 1 : 0;
}, global.CompareItemHash = function (r,t)
{
    for(var e = r.hash, o = t.hash, n = 0; n < e.length; n++)
        if(e[n] !== o[n])
            return e[n] - o[n];
    return 0;
}, global.CompareItemHash32 = function (r,t)
{
    for(var e = r.hash, o = t.hash, n = 0; n < 32; n++)
        if(e[n] !== o[n])
            return e[n] - o[n];
    return 0;
}, global.CompareItemHASH32 = function (r,t)
{
    for(var e = r.HASH, o = t.HASH, n = 0; n < 32; n++)
        if(e[n] !== o[n])
            return e[n] - o[n];
    return 0;
}, global.CompareItemHash33 = function (r,t)
{
    for(var e = r.hash, o = t.hash, n = 0; n < 33; n++)
        if(e[n] !== o[n])
            return e[n] - o[n];
    return 0;
}, global.CompareItemHashPow = function (r,t)
{
    return CompareArr(r.hashPow, t.hashPow);
}, global.CompareItemTimePow = function (r,t)
{
    return t.TimePow !== r.TimePow ? t.TimePow - r.TimePow : CompareArr(r.hashPow, t.hashPow);
}, global.LOAD_CONST = function ()
{
    var r = 0, t = LoadParams(GetDataPath("const.lst"), {});
    if(t)
        for(var e = 0; e < CONST_NAME_ARR.length; e++)
        {
            var o = CONST_NAME_ARR[e];
            void 0 !== t[o] && (r++, global[o] = t[o]);
        }
    return r;
};
var WasStartSaveConst = !1;

function SaveConst()
{
    for(var r = {}, t = 0; t < CONST_NAME_ARR.length; t++)
    {
        var e = CONST_NAME_ARR[t];
        void 0 !== global[e] && (r[e] = global[e]);
    }
    SaveParams(GetDataPath("const.lst"), r), WasStartSaveConst = !1;
};
global.SAVE_CONST = function (r)
{
    r ? SaveConst() : (WasStartSaveConst || setTimeout(SaveConst, 1e4), WasStartSaveConst = !0);
};
var ntpClient = require("ntp-client");

function CheckTime()
{
    ntpClient.getNetworkTime("pool.ntp.org", 123, function (r,t)
    {
        if(r)
            TO_ERROR_LOG("MAINLIB", 110, r);
        else
        {
            var e = new Date;
            global.DELTA_CURRENT_TIME = t - e, isNaN(global.DELTA_CURRENT_TIME) || "number" != typeof global.DELTA_CURRENT_TIME ? global.DELTA_CURRENT_TIME = 0 : 864e5 < Math.abs(global.DELTA_CURRENT_TIME) && (global.DELTA_CURRENT_TIME = 0),
            SAVE_CONST();
        }
    }), SAVE_CONST();
};

function GetSecFromStrTime(r)
{
    for(var t = r.split(":"), e = 3600, o = 0, n = 0; n < t.length; n++)
        o += e * parseInt(t[n]), e /= 60;
    return o;
};

function DateFromBlock(r)
{
    var t;
    return t = (t = (t = new Date(FIRST_TIME_BLOCK + 1e3 * r).toISOString()).substr(0, t.indexOf("."))).replace("T", " ");
};
global.GetDeltaCurrentTime = function ()
{
    return (isNaN(global.DELTA_CURRENT_TIME) || "number" != typeof global.DELTA_CURRENT_TIME) && (global.DELTA_CURRENT_TIME = 0),
    global.DELTA_CURRENT_TIME;
}, global.GetStrTimeUTC = function (r)
{
    r || (r = GetCurrentTime());
    var t = "" + r.getUTCDate();
    return t = (t = (t = (t = (t = t + "." + (1 + r.getUTCMonth())) + "." + r.getUTCFullYear()) + " " + r.getUTCHours()) + ":" + r.getUTCMinutes()) + ":" + r.getUTCSeconds();
}, global.GetStrOnlyTimeUTC = function (r)
{
    return r || (r = GetCurrentTime()), "" + r.getUTCHours().toStringZ(2) + ":" + r.getUTCMinutes().toStringZ(2) + ":" + r.getUTCSeconds().toStringZ(2);
}, global.GetSecFromStrTime = GetSecFromStrTime, global.GetCurrentTime = function (r)
{
    void 0 === r && (r = GetDeltaCurrentTime());
    var t = new Date;
    return new Date(t -  - r);
}, global.DateFromBlock = DateFromBlock;
var code_base = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя";
global.NormalizeName = function (r)
{
    for(var t = "", e = 0; e < r.length; e++)
    {
        var o = r.charCodeAt(e);
        32 <= o && (t += code_base.charAt(o - 32));
    }
    return t;
};
var glEvalMap = {};

function CreateEval(formula,StrParams)
{
    var Ret = glEvalMap[formula];
    return Ret || (eval("function M(" + StrParams + "){return " + formula + "}; Ret=M;"), glEvalMap[formula] = Ret), Ret;
};
global.CreateEval = CreateEval, LOAD_CONST() || global.POWPROCESS || CheckTime(), global.AUTO_COORECT_TIME = 1;
