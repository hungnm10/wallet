/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * Web: http://terafoundation.org
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
    var a, n = Math.trunc(e.length / t), r = (ReadItem(0, t), ReadItem(n, t), 0), u = n, o = Math.trunc(i * n / 4294967296);
    for(n <= o && (o = n - 1), o < r && (o = r); ; )
    {
        if(!(a = ReadItem(o, t)))
            throw "Error read num";
        if(a.Value > i)
        {
            if(u = o - 1, 0 === (f = o - r))
                return ;
            o -= f = Math.trunc((1 + f) / 2);
        }
        else
            if(a.Value < i)
            {
                if(a.Value + a.Length >= i)
                    break;
                var f;
                if(r = o + 1, 0 === (f = u - o))
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
    if(fs.existsSync(FileIp) && fs.existsSync(FileNames))
    {
        BufIP = fs.readFileSync(FileIp);
        for(var e = fs.readFileSync(FileNames), t = 0; ; )
        {
            var i = e.indexOf("\n", t);
            if(i < 0)
                break;
            var a = e.toString("utf-8", t, i - 1);
            t = i + 1;
            var n = a.split(","), r = parseInt(n[0]);
            if(r)
            {
                0;
                var u = n[10];
                u || (u = n[7]), u || (u = n[5]), MapNames[r] = u;
            }
        }
    }
};

function IPToUint(e)
{
    var t = e.split(".");
    return 256 * (256 * (256 *  + t[0] +  + t[1]) +  + t[2]) +  + t[3];
};
global.SetGeoLocation = SetGeoLocation, Init();
