/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/


function SendPay(t)
{
    t.cmd = "pay", SendData(t);
};

function SetStorage(t,e)
{
    SendData({cmd:"setstorage", Key:t, Value:e});
};

function GetStorage(t,e)
{
    SendData({cmd:"getstorage", Key:t}, e);
};

function SetCommon(t,e)
{
    SendData({cmd:"setcommon", Key:t, Value:e});
};

function GetCommon(t,e)
{
    SendData({cmd:"getcommon", Key:t}, e);
};

function GetInfo(t)
{
    SendData({cmd:"DappInfo"}, t);
};

function Call(t,e,a,n)
{
    SendData({cmd:"DappCall", MethodName:e, Params:a, Account:t}, n);
};

function SendCall(t,e,a,n)
{
    return INFO.WalletCanSign ? (SendData({cmd:"DappSendCall", MethodName:e, Params:a, Account:t, FromNum:n}), 1) : (SetError("Pls, open wallet"),
    0);
};

function GetWalletAccounts(t)
{
    SendData({cmd:"DappWalletList"}, t);
};

function GetAccountList(t,e)
{
    SendData({cmd:"DappAccountList", Params:t}, e);
};

function GetSmartList(t,e)
{
    SendData({cmd:"DappSmartList", Params:t}, e);
};

function GetBlockList(t,e)
{
    SendData({cmd:"DappBlockList", Params:t}, e);
};

function GetTransactionList(t,e)
{
    SendData({cmd:"DappTransactionList", Params:t}, e);
};

function DappSmartHTMLFile(t,e)
{
    SendData({cmd:"DappSmartHTMLFile", Params:{Smart:t}}, e);
};

function DappBlockFile(t,e,a)
{
    SendData({cmd:"DappBlockFile", Params:{BlockNum:t, TrNum:e}}, a);
};

function SetStatus(t)
{
    SendData({cmd:"SetStatus", Message:t});
};

function SetError(t)
{
    SendData({cmd:"SetError", Message:t});
};

function CheckInstall()
{
    SendData({cmd:"CheckInstall"});
};

function CurrencyName(t)
{
    var n = MapCurrency[t];
    return n || (GetSmartList({StartNum:t, CountNum:1, TokenGenerate:1}, function (t,e)
    {
        if(!t && 0 !== e.length)
        {
            var a = e[0];
            n = GetTokenName(a.Num, a.ShortName), MapCurrency[a.Num] = n;
        }
    }), n = GetTokenName(t, "")), n;
};
var SendCountUpdate = 0;

function FindAllCurrency()
{
    SendCountUpdate++, GetSmartList({StartNum:8, CountNum:100, TokenGenerate:1}, function (t,e)
    {
        if(SendCountUpdate--, !t)
            for(var a = 0; a < e.length; a++)
            {
                var n = e[a];
                if(!MapCurrency[n.Num])
                {
                    var o = GetTokenName(n.Num, n.ShortName);
                    MapCurrency[n.Num] = o;
                }
            }
    });
};

function GetState(t,n,o)
{
    SendCountUpdate++, GetAccountList({StartNum:t, CountNum:1}, function (t,e)
    {
        if(SendCountUpdate--, !t && e.length)
        {
            var a = e[0].SmartState;
            if(a)
                return void n(a);
        }
        o && o();
    });
};
var glMapF = {}, glKeyF = 0;

function SendData(t,e)
{
    window.parent && (e && (glKeyF++, t.CallID = glKeyF, glMapF[glKeyF] = e), window.parent.postMessage(t, "*"));
};

function listener(t)
{
    var e = t.data;
    if(e && "object" == typeof e)
    {
        var a = e.CallID, n = e.cmd;
        if(a)
        {
            var o = glMapF[a];
            if(o)
            {
                switch(delete e.CallID, delete e.cmd, n)
                {
                    case "getstorage":
                    case "getcommon":
                        o(e.Key, e.Value);
                        break;
                    case "DappCall":
                        o(e.Err, e.RetValue);
                        break;
                    case "DappInfo":
                        o(e.Err, e);
                        break;
                    case "DappWalletList":
                    case "DappAccountList":
                    case "DappSmartList":
                    case "DappBlockList":
                    case "DappTransactionList":
                        o(e.Err, e.arr);
                        break;
                    case "DappBlockFile":
                    case "DappSmartHTMLFile":
                        o(e.Err, e.Body);
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
                window.OnEvent && window.OnEvent(e);
                var r = new CustomEvent("Event", {detail:e});
                window.dispatchEvent(r);
            }
    }
};

function OpenRefFile(t)
{
    var e = ParseFileName(t);
    DappBlockFile(e.BlockNum, e.TrNum, function (t,e)
    {
        document.write(e);
    });
};

function SaveToStorageByArr(t)
{
    SetStorage("VerSave", "1");
    for(var e = 0; e < t.length; e++)
    {
        var a = t[e], n = $(a);
        "checkbox" === n.type ? SetStorage(a, 0 + n.checked) : SetStorage(a, n.value);
    }
};

function LoadFromStorageByArr(n,o)
{
    GetStorage("VerSave", function (t,e)
    {
        if("1" === e)
            for(var a = 0; a < n.length; a++)
                a === n.length - 1 ? LoadFromStorageById(n[a], o) : LoadFromStorageById(n[a]);
    });
};

function LoadFromStorageById(n,o)
{
    GetStorage(n, function (t,e)
    {
        var a = document.getElementById(n);
        "checkbox" === a.type ? a.checked = parseInt(e) : a.value = e, o && o(t, e);
    });
};
document.addEventListener("DOMContentLoaded", function ()
{
    for(var t = document.getElementsByTagName("A"), e = 0, a = t.length; e < a; e++)
        0 <= t[e].href.indexOf("/file/") && (t[e].onclick = function ()
        {
            OpenRefFile(this.href);
        });
}), window.addEventListener ? window.addEventListener("message", listener) : window.attachEvent("onmessage", listener);
var SMART = {}, BASE_ACCOUNT = {}, INFO = {}, USER_ACCOUNT = [], USER_ACCOUNT_MAP = {}, ACCOUNT_OPEN_NUM = 0, WasStartInit = 0,
WasStartInit2 = 0, eventInit = new Event("Init"), eventInfo = new Event("UpdateInfo");

function UpdateDappInfo()
{
    GetInfo(function (t,e)
    {
        if(t)
            SetError("Error Info");
        else
        {
            SMART = (INFO = e).Smart, BASE_ACCOUNT = e.Account, ACCOUNT_OPEN_NUM = e.ACCOUNT_OPEN_NUM, SetBlockChainConstant(e), USER_ACCOUNT = e.WalletList,
            USER_ACCOUNT_MAP = {};
            for(var a = 0; a < USER_ACCOUNT.length; a++)
                USER_ACCOUNT_MAP[USER_ACCOUNT[a].Num] = USER_ACCOUNT[a];
            window.OnInit && !WasStartInit ? (WasStartInit = 1, window.OnInit(1)) : window.OnUpdateInfo && window.OnUpdateInfo(), WasStartInit2 || (WasStartInit2 = 1,
            window.dispatchEvent(eventInit)), window.dispatchEvent(eventInfo);
        }
    });
};
UpdateDappInfo(), setInterval(UpdateDappInfo, 1e3);
