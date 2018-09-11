/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

"use strict";
const RBTree = require('bintrees').RBTree;
const MAX_MESSAGE_COUNT = 1000;
module.exports = class CMessages extends require("./transaction-validator")
{
    constructor(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
    {
        super(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
        this.TreePoolTr = new RBTree(CompareItemTimePow)
        this.MemPoolMsg = []
        for(var i = 0; i <= MAX_LEVEL_SPECIALIZATION; i++)
            this.MemPoolMsg[i] = new RBTree(CompareItemTimePow)
        this.TimePoolTransaction = []
        if(!global.ADDRLIST_MODE && !this.VirtualMode)
        {
            setInterval(this.CheckTimePoolTransaction.bind(this), 50)
        }
    }
    AddMsgToQuote(Msg)
    {
        var Tree = this.MemPoolMsg[Msg.Level];
        if(Tree)
        {
            if(Tree.insert(Msg))
            {
                if(Tree.size > MEM_POOL_MSG_COUNT)
                {
                    var maxitem = Tree.max();
                    Tree.remove(maxitem)
                    if(maxitem === Msg)
                        return 0;
                }
                return 1;
            }
            else
            {
                return 3;
            }
        }
        return 0;
    }
    IsValidMsg(Msg)
    {
        this.CheckCreateMsgHASH(Msg)
        if(Msg.power < MIN_POWER_POW_MSG)
            return  - 1;
        if(Msg.time > this.CurrentBlockNum)
            return  - 1;
        return 1;
    }
    CheckCreateMsgHASH(Msg)
    {
        if(!Msg.hashPow)
        {
            Msg.HASH = shaarr(Msg.body)
            Msg.hashPow = GetHashWithValues(Msg.HASH, Msg.nonce, Msg.time)
            Msg.power = GetPowPower(Msg.hashPow)
            Msg.TimePow = Msg.time + Msg.power
            Msg.Level = AddrLevelArr(this.addrArr, Msg.addrArr)
            if(Msg.Level >= MAX_LEVEL_SPECIALIZATION)
                Msg.Level = MAX_LEVEL_SPECIALIZATION
        }
    }
    CreateMsgFromBody(Body, ToAddr)
    {
        var HASH = shaarr(Body);
        var Msg = {HASH:HASH, body:Body, addrArr:ToAddr, nonce:CreateNoncePOWExtern(HASH, this.CurrentBlockNum, 3 * (1 << MIN_POWER_POW_MSG)),
            time:this.CurrentBlockNum, };
        this.CheckCreateMsgHASH(Msg)
        return Msg;
    }
    SendMessage(Body, ToAddr)
    {
        var Msg = this.CreateMsgFromBody(Body, ToAddr);
        this.SendMessageNext(Msg)
    }
    SendMessageNext(Msg)
    {
        var CountNodes = 3;
        var LevelStart = Msg.Level;
        if(CompareArr(this.addrArr, Msg.addrArr) === 0)
            return false;
        for(var L = LevelStart; L >= 0; L--)
            if(this.LevelNodes[L] && this.LevelNodes[L].length)
            {
                var arr = this.LevelNodes[L];
                for(var j = 0; arr && j < arr.length; j++)
                {
                    var Node = arr[j];
                    this.SendF(Node, {"Method":"MESSAGE", "Data":{Arr:[Msg]}})
                    CountNodes--
                    if(CountNodes <= 0)
                        break;
                }
            }
        return true;
    }
    static
    MESSAGE_F()
    {
        return "{Arr:[{addrArr:hash,body:tr,nonce:uint,time:uint}]}";
    }
    MESSAGE(Info, CurTime)
    {
        var Data = this.DataFromF(Info);
        var arr = Data.Arr;
        for(var i = 0; i < arr.length; i++)
        {
            var Msg = arr[i];
            if(this.IsValidMsg(Msg))
            {
                if(CompareArr(this.addrArr, Msg.addrArr) === 0)
                {
                    var App = DAppByType[Msg.body[0]];
                    if(App)
                    {
                        App.OnMessage(Msg, BlockNum, i)
                    }
                }
                else
                {
                    if(this.AddMsgToQuote(Msg) === 1)
                    {
                        this.SendMessageNext(Msg)
                    }
                }
            }
        }
    }
    SendGetMessage(Node)
    {
        var Context = {"SendGetMessage":1};
        this.Send(Node, {"Method":"GETMESSAGE", "Context":Context, "Data":undefined})
    }
    GETMESSAGE(Info, CurTime)
    {
        var arr = [];
        var BufLength = 300;
        var Level = AddrLevelArr(this.addrArr, Info.Node.addrArr);
        var Tree = this.MemPoolMsg[Level];
        if(Tree)
        {
            var it = Tree.iterator(), Item;
            while((Item = it.next()) !== null)
            {
                if(arr.length >= MAX_MESSAGE_COUNT)
                    break;
                arr.push(Item)
                BufLength += Item.body.length + 50
            }
        }
        this.SendF(Info.Node, {"Method":"MESSAGE", "Context":Info.Context, "Data":{Arr:arr}}, BufLength)
    }
    AddTransaction(Tr)
    {
        var Res = this.IsValidTransaction(Tr, this.CurrentBlockNum);
        if(Res <= 0 && Res !==  - 3)
            return Res;
        this.SendTransaction(Tr)
        if(Res ===  - 3)
        {
            var delta = Tr.num - this.CurrentBlockNum;
            if(delta > 0)
            {
                this.TimePoolTransaction.push(Tr)
                ToLogClient("Added " + TrName(Tr) + " to time pool. Send transaction after " + (delta) + " sec")
                return 4;
            }
        }
        Res = this.AddTrToQuote(this.TreePoolTr, Tr, MAX_TRANSACTION_COUNT)
        ToLogContext("Add " + TrName(Tr) + " for Block: " + this.CurrentBlockNum + " Res=" + Res)
        return Res;
    }
    CheckTimePoolTransaction()
    {
        for(var i = this.TimePoolTransaction.length - 1; i >= 0; i--)
        {
            var Tr = this.TimePoolTransaction[i];
            if(Tr.num <= this.CurrentBlockNum)
            {
                this.TimePoolTransaction.splice(i, 1)
                var Res = this.AddTrToQuote(this.TreePoolTr, Tr, MAX_TRANSACTION_COUNT);
                ToLogContext("Add " + TrName(Tr) + " for Block: " + this.CurrentBlockNum + " Res=" + Res)
            }
        }
    }
    SendTransaction(Tr)
    {
        return ;
        var CurTime = GetCurrentTime(0) - 0;
        var ArrNodes = this.GetHotTimeNodes();
        for(var i = 0; i < ArrNodes.length; i++)
        {
            var Node = ArrNodes[i];
            if(!Node)
                continue;
            if(Node.TaskLastSend)
            {
                var Delta = CurTime - Node.TaskLastSend;
                if(Delta < global.PERIOD_GET_BLOCK || Node.StopGetBlock)
                {
                    continue;
                }
            }
            Node.TaskLastSend = CurTime
            this.SendF(Node, {"Method":"TRANSACTION", "Data":Tr})
            ToLogContext("Send " + TrName(Tr) + " to " + NodeName(Node))
        }
    }
    static
    TRANSACTION_F()
    {
        return "{body:tr}";
    }
    TRANSACTION(Info, CurTime)
    {
        var Tr = this.DataFromF(Info);
        var Res = this.IsValidTransaction(Tr, this.CurrentBlockNum);
        if(Res ===  - 3)
        {
            var delta = Tr.num - this.CurrentBlockNum;
            if(delta > 0)
            {
                if(delta < 3 && this.TimePoolTransaction.length < 50)
                {
                    this.TimePoolTransaction.push(Tr)
                    ToLogContext("Receive " + TrName(Tr) + " from " + NodeName(Info.Node) + " added to time pool. Send transaction after " + (delta) + " sec")
                }
                else
                {
                    ToLogContext("Receive " + TrName(Tr) + " from " + NodeName(Info.Node) + " NOT ADD TO POOL")
                }
                return ;
            }
        }
        if(Res > 0)
        {
            var Res = this.AddTrToQuote(this.TreePoolTr, Tr, MAX_TRANSACTION_COUNT);
            ToLogContext("Receive " + TrName(Tr) + " from " + NodeName(Info.Node) + " added to current pool for Block: " + this.CurrentBlockNum + "  Res=" + Res)
        }
        else
        {
            ToLogContext("Receive " + TrName(Tr) + " from " + NodeName(Info.Node) + " NOT ADD TO POOL")
        }
    }
};
function ToLogContext(Str)
{
};
function TrName(Tr)
{
    if(!Tr.HASH)
        SERVER.CheckCreateTransactionHASH(Tr);
    var Str = GetHexFromArr(Tr.HASH);
    return Str.substr(0, 8);
};
global.TrName = TrName;
