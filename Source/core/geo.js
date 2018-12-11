/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

var BufIP, fs = require("fs");
require("./library.js");
var MapNames = {}, FileIp = "./SITE/DB/iplocation.db", FileNames = "./SITE/DB/locationnames.csv", Format = "{Value:uint32,Length:uint32, id:uint32, latitude:uint32, longitude:uint32}",
FormatStruct = {};

function SetGeoLocation(t)
{
    if(!t.ip || !BufIP || !BufIP.length)
        return !1;
    var e = IPToUint(t.ip), i = FindItem(BufIP, 20, e);
    return i && (t.latitude = i.latitude, t.longitude = i.longitude, t.name = MapNames[i.id]), t.Geo = 1, !0;
};

function ReadItem(t,e)
{
    return BufIP.len = t * e, BufLib.Read(BufIP, Format, void 0, FormatStruct);
};

function FindItem(t,e,i)
{
    var n, a = Math.trunc(t.length / e), o = (ReadItem(0, e), ReadItem(a, e), 0), r = a, u = Math.trunc(i * a / 4294967296);
    for(a <= u && (u = a - 1), u < o && (u = o); ; )
    {
        if(!(n = ReadItem(u, e)))
            throw "Error read num";
        if(n.Value > i)
        {
            if(r = u - 1, 0 === (l = u - o))
                return ;
            u -= l = Math.trunc((1 + l) / 2);
        }
        else
            if(n.Value < i)
            {
                if(n.Value + n.Length >= i)
                    break;
                var l;
                if(o = u + 1, 0 === (l = r - u))
                    return ;
                u += l = Math.trunc((1 + l) / 2);
            }
            else
                if(n.Value === i)
                    break;
    }
    return n;
};

function Init()
{
    console.log("loading"), BufIP = fs.readFileSync(FileIp);
    for(var t = fs.readFileSync(FileNames), e = 0, i = 0; ; )
    {
        var n = t.indexOf("\n", e);
        if(n < 0)
            break;
        var a = t.toString("utf-8", e, n - 1);
        e = n + 1;
        var o = a.split(","), r = parseInt(o[0]);
        if(r)
        {
            i++;
            var u = o[10];
            u || (u = o[7]), u || (u = o[5]), MapNames[r] = u;
        }
    }
    console.log("loading ok Count=" + i);
};

function IPToUint(t)
{
    var e = t.split(".");
    return 256 * (256 * (256 *  + e[0] +  + e[1]) +  + e[2]) +  + e[3];
};

function Test()
{
    var t;
    SetGeoLocation(t = {ip:"185.17.3.159"}), console.log(JSON.stringify(t)), SetGeoLocation(t = {ip:"195.211.195.236"}), console.log(JSON.stringify(t));
};
global.SetGeoLocation = SetGeoLocation, Init();
