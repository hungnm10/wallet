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

function CopyFiles(l,o,t)
{
    if(fs.existsSync(l))
        for(var e = fs.readdirSync(l), n = 0; n < e.length; n++)
        {
            var a = l + "/" + e[n], s = o + "/" + e[n];
            if(fs.statSync(a).isDirectory())
                t && (fs.existsSync(s) || fs.mkdirSync(s), CopyFiles(a, s, t));
            else
            {
                var r = fs.readFileSync(a), i = fs.openSync(s, "w");
                fs.writeSync(i, r, 0, r.length), fs.closeSync(i);
            }
        }
};
global.GetDataPath = function (l)
{
    return "/" !== global.DATA_PATH.substr(global.DATA_PATH.length - 1, 1) && (global.DATA_PATH = global.DATA_PATH + "/"), GetNormalPathString(global.DATA_PATH + l);
}, global.GetCodePath = function (l)
{
    return "/" !== global.CODE_PATH.substr(global.CODE_PATH.length - 1, 1) && (global.CODE_PATH = global.CODE_PATH + "/"), GetNormalPathString(global.CODE_PATH + l);
}, global.GetNormalPathString = function (l)
{
    return l.split("\\").join("/");
}, global.CheckCreateDir = function (l,o,t)
{
    if(l = GetNormalPathString(l), !fs.existsSync(l))
    {
        o || console.log("Create: " + l);
        var e = l.split("/"), n = e[0];
        t && e.length--;
        for(var a = 1; a < e.length; a++)
            n += "/" + e[a], fs.existsSync(n) || fs.mkdirSync(n);
    }
}, global.CopyFiles = CopyFiles, global.ToLog || (global.ToLog = function (l)
{
    console.log(l);
});
