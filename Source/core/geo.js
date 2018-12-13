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
    var a, r = Math.trunc(t.length / e), n = (ReadItem(0, e), ReadItem(r, e), 0), u = r, o = Math.trunc(i * r / 4294967296);
    for(r <= o && (o = r - 1), o < n && (o = n); ; )
    {
        if(!(a = ReadItem(o, e)))
            throw "Error read num";
        if(a.Value > i)
        {
            if(u = o - 1, 0 === (f = o - n))
                return ;
            o -= f = Math.trunc((1 + f) / 2);
        }
        else
            if(a.Value < i)
            {
                if(a.Value + a.Length >= i)
                    break;
                var f;
                if(n = o + 1, 0 === (f = u - o))
                    return ;
                o += f = Math.trunc((1 + f) / 2);
            }
            else
                if(a.Value === i)
                    break;
    }
    return a;
};

function Init()
{
    BufIP = fs.readFileSync(FileIp);
    for(var t = fs.readFileSync(FileNames), e = 0; ; )
    {
        var i = t.indexOf("\n", e);
        if(i < 0)
            break;
        var a = t.toString("utf-8", e, i - 1);
        e = i + 1;
        var r = a.split(","), n = parseInt(r[0]);
        if(n)
        {
            0;
            var u = r[10];
            u || (u = r[7]), u || (u = r[5]), MapNames[n] = u;
        }
    }
};

function IPToUint(t)
{
    var e = t.split(".");
    return 256 * (256 * (256 *  + e[0] +  + e[1]) +  + e[2]) +  + e[3];
};
global.SetGeoLocation = SetGeoLocation, Init();
