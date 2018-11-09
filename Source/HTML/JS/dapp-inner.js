/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/


function SendPay(e)
{
    e.cmd = "pay", SendData(e);
};

function SetStorage(e,t)
{
    SendData({cmd:"setstorage", Key:e, Value:t});
};

function GetStorage(e,t)
{
    SendData({cmd:"getstorage", Key:e}, t);
};

function SetCommon(e,t)
{
    SendData({cmd:"setcommon", Key:e, Value:t});
};

function GetCommon(e,t)
{
    SendData({cmd:"getcommon", Key:e}, t);
};

function GetInfo(e)
{
    SendData({cmd:"DappInfo"}, e);
};

function Call(e,t,a,n)
{
    SendData({cmd:"DappCall", MethodName:t, Params:a, Account:e}, n);
};

function SendCall(e,t,a,n)
{
    return INFO.WalletCanSign ? (SendData({cmd:"DappSendCall", MethodName:t, Params:a, Account:e, FromNum:n}), 1) : (SetError("Pls, open wallet"),
    0);
};

function GetWalletAccounts(e)
{
    SendData({cmd:"DappWalletList"}, e);
};

function GetAccountList(e,t)
{
    SendData({cmd:"DappAccountList", Params:e}, t);
};

function GetSmartList(e,t)
{
    SendData({cmd:"DappSmartList", Params:e}, t);
};

function GetBlockList(e,t)
{
    SendData({cmd:"DappBlockList", Params:e}, t);
};

function GetTransactionList(e,t)
{
    SendData({cmd:"DappTransactionList", Params:e}, t);
};

function DappSmartHTMLFile(e,t)
{
    SendData({cmd:"DappSmartHTMLFile", Params:{Smart:e}}, t);
};

function DappBlockFile(e,t,a)
{
    SendData({cmd:"DappBlockFile", Params:{BlockNum:e, TrNum:t}}, a);
};

function SetStatus(e)
{
    SendData({cmd:"SetStatus", Message:e});
};

function SetError(e)
{
    SendData({cmd:"SetError", Message:e});
};

function CheckInstall()
{
    SendData({cmd:"CheckInstall"});
};

function CurrencyName(e)
{
    var n = MapCurrency[e];
    return n || (GetSmartList({StartNum:e, CountNum:1, TokenGenerate:1}, function (e,t)
    {
        if(!e && 0 !== t.length)
        {
            var a = t[0];
            n = GetTokenName(a.Num, a.ShortName), MapCurrency[a.Num] = n;
        }
    }), n = GetTokenName(e, "")), n;
};
var SendCountUpdate = 0;

function FindAllCurrency()
{
    SendCountUpdate++, GetSmartList({StartNum:8, CountNum:100, TokenGenerate:1}, function (e,t)
    {
        if(SendCountUpdate--, !e)
            for(var a = 0; a < t.length; a++)
            {
                var n = t[a];
                if(!MapCurrency[n.Num])
                {
                    var o = GetTokenName(n.Num, n.ShortName);
                    MapCurrency[n.Num] = o;
                }
            }
    });
};
var glMapF = {}, glKeyF = 0;

function SendData(e,t)
{
    window.parent && (t && (glKeyF++, e.CallID = glKeyF, glMapF[glKeyF] = t), window.parent.postMessage(e, "*"));
};

function listener(e)
{
    var t = e.data;
    if(t && "object" == typeof t)
    {
        var a = t.CallID, n = t.cmd;
        if(a)
        {
            var o = glMapF[a];
            if(o)
            {
                switch(delete t.CallID, delete t.cmd, n)
                {
                    case "getstorage":
                    case "getcommon":
                        o(t.Key, t.Value);
                        break;
                    case "DappCall":
                        o(t.Err, t.RetValue);
                        break;
                    case "DappInfo":
                        o(t.Err, t);
                        break;
                    case "DappWalletList":
                    case "DappAccountList":
                    case "DappSmartList":
                    case "DappBlockList":
                    case "DappTransactionList":
                        o(t.Err, t.arr);
                        break;
                    case "DappBlockFile":
                    case "DappSmartHTMLFile":
                        o(t.Err, t.Body);
                        break;
                    default:
                        console.log("Error cmd: " + n);
                }
                delete glMapF[a];
            }
        }
        else
            if("OnEvent" === n)
            {
                window.OnEvent && window.OnEvent(t);
                var r = new CustomEvent("Event", {detail:t});
                window.dispatchEvent(r);
            }
    }
};

function OpenRefFile(e)
{
    var t = ParseFileName(e);
    DappBlockFile(t.BlockNum, t.TrNum, function (e,t)
    {
        document.write(t);
    });
};

function SaveToStorageByArr(e)
{
    SetStorage("VerSave", "1");
    for(var t = 0; t < e.length; t++)
    {
        var a = e[t], n = $(a);
        "checkbox" === n.type ? SetStorage(a, 0 + n.checked) : SetStorage(a, n.value);
    }
};

function LoadFromStorageByArr(n,o)
{
    GetStorage("VerSave", function (e,t)
    {
        if("1" === t)
            for(var a = 0; a < n.length; a++)
                a === n.length - 1 ? LoadFromStorageById(n[a], o) : LoadFromStorageById(n[a]);
    });
};

function LoadFromStorageById(n,o)
{
    GetStorage(n, function (e,t)
    {
        var a = document.getElementById(n);
        "checkbox" === a.type ? a.checked = parseInt(t) : a.value = t, o && o(e, t);
    });
};
document.addEventListener("DOMContentLoaded", function ()
{
    for(var e = document.getElementsByTagName("A"), t = 0, a = e.length; t < a; t++)
        0 <= e[t].href.indexOf("/file/") && (e[t].onclick = function ()
        {
            OpenRefFile(this.href);
        });
}), window.addEventListener ? window.addEventListener("message", listener) : window.attachEvent("onmessage", listener);
var SMART = {}, BASE_ACCOUNT = {}, INFO = {}, USER_ACCOUNT = [], USER_ACCOUNT_MAP = {}, ACCOUNT_OPEN_NUM = 0, WasStartInit = 0,
WasStartInit2 = 0, eventInit = new Event("Init"), eventInfo = new Event("UpdateInfo");

function UpdateDappInfo()
{
    GetInfo(function (e,t)
    {
        if(e)
            SetError("Error Info");
        else
        {
            SMART = (INFO = t).Smart, BASE_ACCOUNT = t.Account, ACCOUNT_OPEN_NUM = t.ACCOUNT_OPEN_NUM, SetBlockChainConstant(t), USER_ACCOUNT = t.WalletList,
            USER_ACCOUNT_MAP = {};
            for(var a = 0; a < USER_ACCOUNT.length; a++)
                USER_ACCOUNT_MAP[USER_ACCOUNT[a].Num] = USER_ACCOUNT[a];
            window.OnInit && !WasStartInit ? (WasStartInit = 1, window.OnInit(1)) : window.OnUpdateInfo && window.OnUpdateInfo(), WasStartInit2 || (WasStartInit2 = 1,
            window.dispatchEvent(eventInit)), window.dispatchEvent(eventInfo);
        }
    });
};
UpdateDappInfo(), setInterval(UpdateDappInfo, 1e3);
