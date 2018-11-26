/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/


function StartWebWallet()
{
    OnInitWebWallet(), ConnectWebWallet();
};
var COUNT_BLOCK_PROOF = 300, MIN_SUM_POWER = 35 * COUNT_BLOCK_PROOF, MainServer = void 0, MaxConnectedCount = 10, MaxTimeConnecting = 3e3,
StartTimeConnecting = 0, ConnectedCount = 0, NETWORK = "TERA-MAIN", ServerMap = {"127.0.0.1":{ip:"127.0.0.1", port:80, Name:"LOCAL"},
    "terafoundation.org":{ip:"terafoundation.org", port:80, Name:"TERA"}, "91.235.136.81":{ip:"91.235.136.81", port:80, Name:"SUPPORT1"},
    "149.154.70.158":{ip:"149.154.70.158", port:80, Name:"SUPPORT2"}};

function OnInitWebWallet()
{
    var e = localStorage.getItem("NodesArrayList");
    if(e)
        for(var t = JSON.parse(e), n = 0; n < t.length; n++)
            ServerMap[t[n].ip] = t[n];
};

function SaveServerMap()
{
    var e = [];
    for(var t in ServerMap)
    {
        var n = ServerMap[t];
        n.SumPower >= MIN_SUM_POWER && e.push({ip:n.ip, port:n.port});
    }
    localStorage.setItem("NodesArrayList", JSON.stringify(e));
};

function SetStatus(e)
{
    $("idStatus").innerHTML = e;
};

function SetError(e,t)
{
    SetStatus("<DIV  align='left' style='color:red'><B>" + e + "</B></DIV>");
};

function ConnectWebWallet()
{
    for(var e in StartTimeConnecting = new Date - 0, ConnectedCount = 0, ServerMap)
    {
        ServerMap[e].SendHandShake = 0;
    }
    SetStatus("Connecting..."), LoopHandShake(), setTimeout(LoopWalletInfo, 1500);
};
var Stage = 0;

function LoopHandShake()
{
    for(var e in SetStatus("Connecting: " + ++Stage + "..."), ServerMap)
    {
        var t = ServerMap[e];
        !t.SendHandShake && t.port && DoNodeList(t);
    }
};

function DoNodeList(a)
{
    a.SendHandShake = 1, GetData("http://" + a.ip + ":" + a.port + "/GetNodeList", {}, function (e)
    {
        if(e && e.result)
        {
            ConnectedCount++, a.GetHandShake = 1, a.BlockChain = e.BlockChain;
            for(var t = 0, n = 0; n < e.arr.length; n++)
            {
                var r = e.arr[n];
                !ServerMap[r.ip] && r.port && (ServerMap[r.ip] = r, t = 1);
            }
            t && ConnectedCount < MaxConnectedCount && new Date - StartTimeConnecting < MaxTimeConnecting && setTimeout(LoopHandShake,
            100);
        }
    });
};

function LoopWalletInfo()
{
    for(var e in SetStatus("Get wallets info..."), ServerMap)
    {
        var t = ServerMap[e];
        t.port && DoWalletInfo(t);
    }
    setTimeout(FindLider, 500);
};

function DoWalletInfo(t)
{
    t.StartTime = new Date - 0, t.SendWalletInfo = 1, GetData("http://" + t.ip + ":" + t.port + "/GetCurrentInfo", {BlockChain:1},
    
function (e)
    {
        e && e.result && e.BlockChain && e.NETWORK === NETWORK && (t.Name = e.NODES_NAME, t.GetWalletInfo = 1, t.DeltaTime = new Date - t.StartTime,
        t.BlockChain = e.BlockChain, t.MaxNumBlockDB = e.MaxNumBlockDB);
    });
};

function FindLider()
{
    MainServer = void 0, SetStatus("Server not found");
    var e = [], t = {};
    for(var n in ServerMap)
    {
        if((i = ServerMap[n]).GetWalletInfo)
        {
            if(i.SumPower = CalcPowFromBlockChain(i.BlockChain.data), i.SumPower < MIN_SUM_POWER)
                continue;
            t[i.SumPower] || (t[i.SumPower] = 0), t[i.SumPower]++, e.push(i);
        }
    }
    if(e.length)
    {
        var r, a = 0;
        for(var n in t)
            t[n] >= a && (a = t[n], r = parseInt(n));
        e.sort(function (e,t)
        {
            return e.DeltaTime - t.DeltaTime;
        });
        for(var o = 0; o < e.length; o++)
        {
            var i;
            if((i = e[o]).SumPower === r)
                return SetStatus("Find " + i.ip + ":" + i.port + " with pow=" + i.SumPower + " " + a + "  ping=" + i.DeltaTime), MainServer = i,
                SaveServerMap(), void OnFindServer();
        }
    }
};

function CalcPowFromBlockChain(e)
{
    var t = 0, n = GetBlockArrFromBuffer(e);
    if(n.length === COUNT_BLOCK_PROOF)
        for(var r = 0; r < n.length; r++)
            t += n[r].Power;
    return t;
};
