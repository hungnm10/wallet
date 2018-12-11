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

function SetGeoLocation(e)
{
    if(!e.ip || !BufIP || !BufIP.length)
        return !1;
    var t = IPToUint(e.ip), i = FindItem(BufIP, 20, t);
    return i && (e.latitude = i.latitude, e.longitude = i.longitude, e.name = MapNames[i.id]), e.Geo = 1, !0;
};

function ReadItem(e,t)
{
    return BufIP.len = e * t, BufLib.Read(BufIP, Format, void 0, FormatStruct);
};

function FindItem(e,t,i)
{
    var n, a = Math.trunc(e.length / t), r = (ReadItem(0, t), ReadItem(a, t), 0), u = a, o = Math.trunc(i * a / 4294967296);
    for(a <= o && (o = a - 1), o < r && (o = r); ; )
    {
        if(!(n = ReadItem(o, t)))
            throw "Error read num";
        if(n.Value > i)
        {
            if(u = o - 1, 0 === (l = o - r))
                return ;
            o -= l = Math.trunc((1 + l) / 2);
        }
        else
            if(n.Value < i)
            {
                if(n.Value + n.Length >= i)
                    break;
                var l;
                if(r = o + 1, 0 === (l = u - o))
                    return ;
                o += l = Math.trunc((1 + l) / 2);
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
    for(var e = fs.readFileSync(FileNames), t = 0, i = 0; ; )
    {
        var n = e.indexOf("\n", t);
        if(n < 0)
            break;
        var a = e.toString("utf-8", t, n - 1);
        t = n + 1;
        var r = a.split(","), u = parseInt(r[0]);
        if(u)
        {
            i++;
            var o = r[10];
            o || (o = r[7]), o || (o = r[5]), MapNames[u] = o;
        }
    }
    console.log("loading ok Count=" + i);
};

function IPToUint(e)
{
    var t = e.split(".");
    return 256 * (256 * (256 *  + t[0] +  + t[1]) +  + t[2]) +  + t[3];
};
global.SetGeoLocation = SetGeoLocation, Init();
