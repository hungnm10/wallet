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
require('./library');
require('./crypto-library');
const RBTree = require('bintrees').RBTree;
global.CAN_START = false;
global.StrWarn = "";
global.SUM_LIST_LENGTH = 2 * BLOCK_PROCESSING_LENGTH;
global.CONSENSUS_TIK_TIME = CONSENSUS_PERIOD_TIME / 10;
global.CONSENSUS_CHECK_TIME = CONSENSUS_PERIOD_TIME / 20;
const PERIOD_FOR_NEXT_SEND = CONSENSUS_TIK_TIME * 3;
global.BLOCK_DELTA_ACTIVATE = 0;
global.TIME_END_EXCHANGE =  - 3;
global.TIME_START_POW =  - 4;
global.TIME_START_POW_EXCHANGE =  - 5;
global.TIME_END_EXCHANGE_POW =  - 7;
global.TIME_START_SAVE =  - 8;
global.TIME_START_LOAD =  - 12;
const FORMAT_DATA_TRANSFER = "{\
    Version:uint16,\
    BlockNum:uint,\
    Array:[{body:tr}],\
    MaxPOW:[{BlockNum:uint,AddrHash:hash,SeqHash:hash}],\
    MaxSum:[{BlockNum:uint,SumHash:hash,SumList:[{AddrHash:hash,SeqHash:hash}]}],\
    BaseBlockNum:uint,\
    }";
const WorkStructSend = {};
module.exports = class CConsensus extends require("./block-loader")
{
    constructor(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
    {
        super(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
        this.CurrentBlockNum = 0
        this.RelayMode = false
        this.SendCount = 0
        this.TreeSendPacket = new RBTree(CompareItemHash)
        this.MapMining = undefined
        if(!global.ADDRLIST_MODE && !this.VirtualMode)
        {
            this.idBlockChainTimer = setInterval(this.StartBlockChain.bind(this), CONSENSUS_PERIOD_TIME - 5)
            setInterval(this.DoTransfer.bind(this), CONSENSUS_CHECK_TIME)
        }
    }
    StartBlockChain()
    {
        this.OnStartSecond()
        var CurTimeNum = GetCurrentTime() - CONSENSUS_PERIOD_TIME / 2;
        var StartTimeNum = Math.floor((CurTimeNum + CONSENSUS_PERIOD_TIME) / CONSENSUS_PERIOD_TIME) * CONSENSUS_PERIOD_TIME;
        var DeltaForStart = StartTimeNum - CurTimeNum;
        if(DeltaForStart < (CONSENSUS_PERIOD_TIME - 5))
        {
            var self = this;
            if(self.idBlockChainTimer)
                clearInterval(self.idBlockChainTimer)
            self.idBlockChainTimer = 0
            setTimeout(function ()
            {
                self.idBlockChainTimer = setInterval(self.StartBlockChain.bind(self), CONSENSUS_PERIOD_TIME)
                self.OnStartSecond()
            }, DeltaForStart)
        }
    }
    OnStartSecond()
    {
        PrepareStatEverySecond()
        this.AddStatOnTimer()
        this.DoBlockChain()
    }
    CreateBlockContext()
    {
        var Context = {};
        Context.AddInfo = AddInfoBlock.bind(Context)
        Context.Active = false
        Context.TransferFromAddr = {}
        Context.LevelsTransfer = []
        Context.ErrRun = ""
        Context.PowTree = new RBTree(CompareItemTimePow)
        Context.bSave = false
        Context.PrevHash = undefined
        Context.TreeHash = undefined
        Context.MaxPOW = {}
        Context.MaxSum = {}
        Context.SumPow = 0
        Context.Power = 0
        Context.TrCount = 0
        Context.TrDataPos = 0
        Context.TrDataLen = 0
        Context.Info = "Create at:" + GetStrOnlyTimeUTC()
        var Transfer;
        var TransferM2;
        var LocalLevel = 0;
        var Levels = this.LevelNodes;
        for(let L = 0; L < Levels.length; L++)
        {
            var arr = Levels[L];
            if(arr && arr.length > 0)
            {
                Transfer = {LocalLevel:LocalLevel, TreeLevel:L, SendCount:0, GetCount:0, TransferNodes:{}, WasGet:false, WasSend:false, MustDeltaTime:CONSENSUS_TIK_TIME * (2 + MAX_LEVEL_SPECIALIZATION - L),
                }
                LocalLevel++
                Context.LevelsTransfer.push(Transfer)
                Context.StartLevel = Context.LevelsTransfer.length - 1
                for(let j = 0; j < arr.length; j++)
                {
                    var Node = arr[j];
                    var Addr = Node.addrStr;
                    if(!Transfer.TransferNodes[Addr])
                    {
                        let Item = {Node:Node, SendCount:0, GetCount:0, addrStr:Addr, TreeLevel:L, GetTiming:3 * CONSENSUS_PERIOD_TIME, };
                        Transfer.TransferNodes[Addr] = Item
                    }
                    Context.TransferFromAddr[Addr] = Transfer
                }
            }
        }
        Context.MLevelSend = Context.StartLevel
        return Context;
    }
    StartConsensus()
    {
        if(!CAN_START)
            return ;
        var StartBlockNum = GetCurrentBlockNumByTime();
        if(StartBlockNum < BLOCK_PROCESSING_LENGTH2)
            return ;
        this.CurrentBlockNum = StartBlockNum
        var Block0 = this.GetBlockContext(StartBlockNum - BLOCK_DELTA_ACTIVATE);
        if(!Block0.Active)
        {
            AddInfoBlock(Block0, "Activate")
            this.StartBlock(Block0)
        }
        else
        {
            AddInfoBlock(Block0, "Was Active")
        }
        var Block = this.GetBlockContext(StartBlockNum);
        Block.MLevelSend = Block.StartLevel
        if(!Block.bSave)
            this.MemPoolToTransfer(Block)
        else
            ToLog("BlockNum=" + StartBlockNum + " was saved!")
        this.SendCount = 0
    }
    GetMinTrPow(BlockNum)
    {
        var arrMax, lengthMax = 0;
        for(var num = 0; num < BLOCK_PROCESSING_LENGTH2; num++)
        {
            var power = 0;
            var BlockPrev = this.GetBlock(BlockNum - BLOCK_PROCESSING_LENGTH * 3 - num);
            if(BlockPrev && BlockPrev.arrContent && BlockPrev.arrContent.length)
            {
                if(BlockPrev.arrContent.length > lengthMax)
                {
                    arrMax = BlockPrev.arrContent
                    lengthMax = arrMax.length
                }
            }
        }
        if(arrMax)
        {
            var KK, body;
            if(arrMax.length >= AVG_TRANSACTION_COUNT)
            {
                KK = 1
                body = arrMax[AVG_TRANSACTION_COUNT - 1]
            }
            else
            {
                KK = arrMax.length / AVG_TRANSACTION_COUNT
                body = arrMax[arrMax.length - 1]
            }
            var HASH = shaarr(body);
            var power = GetPowPower(HASH);
            power = power * KK
            return power;
        }
        else
        {
            return 0;
        }
    }
    MemPoolToTransfer(Block)
    {
        var it = this.TreePoolTr.iterator(), item;
        while((item = it.next()) !== null)
        {
            var Res = this.AddTrToBlockQuote(Block, item);
        }
        this.TreePoolTr.clear()
    }
    TRANSFER(Info, CurTime)
    {
        var startTime = process.hrtime();
        var Data = this.DataFromF(Info);
        var Node = Info.Node;
        var Block = this.GetBlockContext(Data.BlockNum);
        if(!Block || Block.StartLevel === undefined)
        {
            ADD_TO_STAT("TRANSFER_ERR_STARTLEVEL")
            this.AddCheckErrCount(Node, 1, "Err GetBlockContext")
            return ;
        }
        var Key = Node.addrStr;
        var Transfer = Block.TransferFromAddr[Key];
        if(!Transfer)
        {
            ADD_TO_STAT("NO_TRANSFER")
            this.AddCheckErrCount(Node, 1, "Err Transfer")
            return ;
        }
        Transfer.WasGet = true
        for(var i = 0; i < Data.Array.length; i++)
        {
            this.AddTrToBlockQuote(Block, Data.Array[i])
        }
        this.ToMaxPOWList(Data.MaxPOW, Node)
        this.ToMaxSumList(Data.MaxSum, Node)
        var MinNumber;
        for(var i = 0; i < Data.MaxPOW.length; i++)
        {
            var Item = Data.MaxPOW[i];
            if(!MinNumber || MinNumber < Item.BlockNum)
            {
                MinNumber = Item.BlockNum
            }
        }
        ADD_TO_STAT_TIME("TRANSFER_MS", startTime)
        var Delta = (new Date()) - this.StartLoadBlockTime;
        if(Delta > 10 * 1000 && Node.TransferCount > 10)
        {
            Node.BlockProcessCount++
            Node.NextHotDelta = 10 * 1000
        }
        Node.TransferCount++
        Node.LastTimeTransfer = GetCurrentTime() - 0
        var Item = Transfer.TransferNodes[Key];
        Item.GetTiming = GetCurrentTime(Block.DELTA_CURRENT_TIME) - Block.StartTimeNum
    }
    TrToInfo(Block, Array, StrInfo)
    {
        var Str = "";
        for(var i = 0; i < Array.length; i++)
        {
            var Item = Array[i];
            this.CheckCreateTransactionHASH(Item)
            Str += this.GetStrFromHashShort(shaarr(Item.body)) + "(" + Item.body.length + "),"
        }
        AddInfoBlock(Block, "" + StrInfo + ": Arr=[" + Str + "]")
    }
    DoTransfer()
    {
        if(glStopNode)
            return ;
        if(!CAN_START)
            return ;
        var MaxPOWList = this.GetMaxPOWList();
        var MaxSumList = this.GetMaxSumList();
        var start = this.CurrentBlockNum - BLOCK_PROCESSING_LENGTH;
        var finish = this.CurrentBlockNum;
        for(var b = start; b <= finish; b++)
        {
            var Block = this.GetBlock(b);
            if(!Block)
                continue;
            if(Block.StartLevel === undefined || Block.MLevelSend === undefined)
                continue;
            if(!Block.Active)
                continue;
            if(Block.MLevelSend < 0)
                continue;
            if(Block.EndExchange)
                continue;
            var Transfer = Block.LevelsTransfer[Block.MLevelSend];
            if(!Transfer.WasSend)
            {
                var arrTr = this.GetArrayFromTree(Block, "DoTransfer");
                var BufData = this.CreateTransferBuffer(arrTr, MaxPOWList, MaxSumList, Block);
                this.SendData(Transfer, BufData, 1)
                if(Block.MLevelSend === 0 && Block.MLevelSend < Block.StartLevel)
                {
                    var TreeHash = this.CalcTreeHashFromArrTr(arrTr);
                    for(var L = Block.StartLevel; L > Block.MLevelSend; L--)
                    {
                        var Transfer2 = Block.LevelsTransfer[L];
                        if(Transfer2)
                        {
                            this.SendControlData(Transfer2, BufData, Block.BlockNum, TreeHash, 1)
                        }
                    }
                }
            }
            Transfer.WasSend = true
            var bNext = Transfer.WasGet;
            if(!bNext)
            {
                var CurTimeNum = GetCurrentTime(Block.DELTA_CURRENT_TIME) - 0;
                var DeltaTime = CurTimeNum - Block.StartTimeNum;
                if(DeltaTime > Transfer.MustDeltaTime)
                {
                    bNext = true
                    Block.ErrRun = "" + Transfer.LocalLevel + " " + Block.ErrRun
                    for(var Addr in Transfer.TransferNodes)
                    {
                        var Item = Transfer.TransferNodes[Addr];
                        ADD_TO_STAT("TRANSFER_TIME_OUT")
                        this.AddCheckErrCount(Item.Node, 1, "TRANSFER_TIME_OUT")
                    }
                    ADD_TO_STAT("TimeOutLevel")
                }
            }
            if(bNext)
            {
                if(Block.MLevelSend === 0)
                {
                    this.CreateTreeHash(Block)
                }
                Block.MLevelSend--
            }
        }
    }
    SendData(Transfer, BufData, typedata)
    {
        for(var Addr in Transfer.TransferNodes)
        {
            var Item = Transfer.TransferNodes[Addr];
            Transfer.SendCount++
            this.SendCount++
            var SendData = {"Method":"TRANSFER", "Data":BufData};
            this.Send(Item.Node, SendData, typedata)
        }
    }
    SendControlData(Transfer, BufData, BlockNum, TreeHash, typedata)
    {
        return ;
        for(var Addr in Transfer.TransferNodes)
        {
            var Item = Transfer.TransferNodes[Addr];
            Transfer.SendCount++
            this.SendCount++
            var SendData = {"Method":"CONTROLHASH", "Context":{BufData:BufData}, "Data":{TreeHash:TreeHash, BlockNum:BlockNum, }};
            this.SendF(Item.Node, SendData)
        }
    }
    static
    CONTROLHASH_F()
    {
        return "{TreeHash:hash,BlockNum:uint}";
    }
    CONTROLHASH(Info, CurTime)
    {
        return ;
        var Data = this.DataFromF(Info);
        var Block = this.GetBlockContext(Data.BlockNum);
        if(!Block || Block.StartLevel === undefined)
            return ;
        var arrTr = this.GetArrayFromTree(Block);
        var TreeHash = this.CalcTreeHashFromArrTr(arrTr);
        if(CompareArr(TreeHash, Data.TreeHash) !== 0)
        {
            this.SendF(Info.Node, {"Method":"GETTRANSFER", "Context":Info.Context, "Data":{BlockNum:Block.BlockNum, }})
        }
        else
        {
        }
    }
    static
    GETTRANSFER_F()
    {
        return "{BlockNum:uint}";
    }
    GETTRANSFER(Info, CurTime)
    {
        return ;
        var Data = this.DataFromF(Info);
        var Block = this.GetBlockContext(Data.BlockNum);
        if(!Block || Block.StartLevel === undefined)
            return ;
        var MaxPOWList = this.GetMaxPOWList();
        var MaxSumList = this.GetMaxSumList();
        var arrTr = this.GetArrayFromTree(Block);
        var BufData = this.CreateTransferBuffer(arrTr, MaxPOWList, MaxSumList, Block);
        var SendData = {"Method":"TRANSFER", "Data":BufData};
        this.Send(Info.Node, SendData, 1)
    }
    CreateTransferBuffer(arrTr, MaxPOWList, MaxSumList, Block)
    {
        if(!Block.PrevHash || IsZeroArr(Block.PrevHash))
        {
            Block.PrevHash = this.GetPrevHash(Block)
        }
        var Data = {"Version":2, "BlockNum":Block.BlockNum, "Array":arrTr, "MaxPOW":MaxPOWList, "MaxSum":MaxSumList, "BaseBlockNum":this.CurrentBlockNum - Block.BlockNum,
        };
        var BufWrite = BufLib.GetBufferFromObject(Data, FORMAT_DATA_TRANSFER, MAX_BLOCK_SIZE + 30000, WorkStructSend);
        return BufWrite;
    }
    static
    TRANSFER_F()
    {
        return FORMAT_DATA_TRANSFER;
    }
    CheckingMaxPowOther(Block)
    {
        var POW = Block.MaxPOW;
        if(POW && POW.Hash && CompareArr(POW.PowHash, Block.PowHash) < 0)
        {
            var LoadBlockNum = Block.BlockNum;
            var LoadHash = POW.Hash;
            var StrKey = this.GetStrFromHashShort(LoadHash);
            var StrHashWas = this.GetStrFromHashShort(Block.Hash);
            this.StartLoadBlockHeader(LoadHash, LoadBlockNum, "START OTHER:" + StrKey + " WAS:" + StrHashWas, false)
            AddInfoBlock(Block, "REQ OTHER: " + StrKey)
        }
        Block.CheckMaxPow = true
    }
    IsPoolMiner(Num, BlockNum)
    {
        if(global.DECENTRALIZATION_LENGTH_FACTOR && this.MapMining)
        {
            var LastBlockNum = this.MapMining[Num];
            if(LastBlockNum && LastBlockNum >= BlockNum - global.DECENTRALIZATION_LENGTH_FACTOR)
            {
                return 1;
            }
        }
        return 0;
    }
    AddToMaxPOW(Block, item, Node)
    {
        if(Block && item)
        {
            if(!Block.MaxPOW)
                Block.MaxPOW = {}
            var POW = Block.MaxPOW;
            item.BlockNum = Block.BlockNum
            CalcHashBlockFromSeqAddr(item, Block.PrevHash)
            var MinerID = ReadUintFromArr(item.AddrHash, 0);
            if(this.IsPoolMiner(MinerID, Block.BlockNum))
            {
                return ;
            }
            if(POW.SeqHash === undefined || CompareArr(item.PowHash, POW.PowHash) < 0)
            {
                POW.AddrHash = item.AddrHash
                POW.Hash = item.Hash
                POW.PowHash = item.PowHash
                POW.PrevHash = item.PrevHash
                POW.TreeHash = item.TreeHash
                POW.SeqHash = item.SeqHash
                if(Node)
                {
                    if(!Node.BLockMaxPOW || Node.BLockMaxPOW.BlockNum <= Block.BlockNum)
                        Node.BLockMaxPOW = {BlockNum:Block.BlockNum, AddrHash:item.AddrHash, SeqHash:item.SeqHash}
                }
            }
            if(Block.SeqHash && CompareArr(item.SeqHash, Block.SeqHash) === 0)
            {
                if(POW.LocalSeqHash === undefined || CompareArr(POW.LocalSeqHash, Block.SeqHash) !== 0 || CompareArr(item.PowHash, POW.PowLocalHash) < 0)
                {
                    POW.LocalAddrHash = item.AddrHash
                    POW.PowLocalHash = item.PowHash
                    POW.LocalSeqHash = Block.SeqHash
                }
            }
            this.AddPOWToMaxTree(POW, item)
        }
    }
    AddPOWToMaxTree(POW, item)
    {
        if(!POW.MaxTree)
        {
            POW.MaxTree = new RBTree(function (a,b)
            {
                return CompareArr(a.PowHash, b.PowHash);
            })
        }
        if(!POW.MaxTree.find(item))
        {
            POW.MaxTree.insert(item)
            if(POW.MaxTree.size > 12)
            {
                var maxitem = POW.MaxTree.max();
                POW.MaxTree.remove(maxitem)
            }
        }
    }
    GetMaxPOWList()
    {
        var arr = [];
        var start = this.CurrentBlockNum + TIME_START_POW - 2;
        var finish = this.CurrentBlockNum + TIME_START_POW - 0;
        for(var b = start; b < finish; b++)
        {
            var Block = this.GetBlock(b);
            if(Block && Block.Prepared && Block.MaxPOW)
            {
                if(Block.MaxPOW && Block.MaxPOW.MaxTree)
                {
                    var it = Block.MaxPOW.MaxTree.iterator(), Item;
                    while((Item = it.next()) !== null)
                    {
                        Item.BlockNum = Block.BlockNum
                        arr.push(Item)
                    }
                }
            }
        }
        return arr;
    }
    ToMaxPOWList(Arr, Node)
    {
        for(var i = 0; i < Arr.length; i++)
        {
            var item = Arr[i];
            if(item && item.BlockNum >= this.CurrentBlockNum - BLOCK_PROCESSING_LENGTH && item.BlockNum < this.CurrentBlockNum)
            {
                var Block = this.GetBlock(item.BlockNum);
                this.AddToMaxPOW(Block, item, Node)
            }
        }
    }
    CheckMaxSum(Block)
    {
        var POW = Block.MaxSum;
        var List = this.GetBlockList(Block.BlockNum);
        var SumPow = this.GetSumFromList(List, Block.BlockNum);
        if(POW && POW.SumHash && POW.SumPow > SumPow)
        {
            var LoadBlockNum = Block.BlockNum;
            var LoadHash = POW.SumHash;
            var StrKey = this.GetStrFromHashShort(LoadHash);
            this.StartLoadBlockHeader(LoadHash, LoadBlockNum, "START POW:" + POW.SumPow + ">" + SumPow + " SH:" + StrKey, true)
            AddInfoBlock(Block, "REQ SUMHASH: " + StrKey)
            Block.CheckMaxSum = true
        }
    }
    AddToMaxSum(Block, item)
    {
        if(Block && item)
        {
            if(!Block.MaxSum)
                Block.MaxSum = {}
            var POW = Block.MaxSum;
            var SumPow = this.GetSumFromList(item.SumList, Block.BlockNum);
            if(POW.SumHash === undefined || SumPow > POW.SumPow)
            {
                POW.SumPow = SumPow
                POW.SumHash = item.SumHash
                POW.SumList = item.SumList
            }
        }
    }
    GetMaxSumList()
    {
        var arr = [];
        var start = this.CurrentBlockNum + TIME_START_SAVE - 0;
        var finish = this.CurrentBlockNum + TIME_START_SAVE;
        for(var b = start; b <= finish; b++)
        {
            var Block = this.GetBlock(b);
            if(Block && Block.bSave && Block.MaxSum && Block.MaxSum.SumHash)
            {
                var POW = Block.MaxSum;
                var item = {BlockNum:Block.BlockNum, SumHash:POW.SumHash, SumList:POW.SumList, };
                arr.push(item)
            }
        }
        return arr;
    }
    ToMaxSumList(Arr)
    {
        var start = this.CurrentBlockNum + TIME_START_SAVE - 4;
        var finish = this.CurrentBlockNum + TIME_START_SAVE;
        for(var i = 0; i < Arr.length; i++)
        {
            var item = Arr[i];
            if(item && item.BlockNum >= start && item.BlockNum <= finish)
            {
                var Block = this.GetBlock(item.BlockNum);
                this.AddToMaxSum(Block, item)
            }
        }
    }
    GetBlockList(CurBlockNum)
    {
        var arr = [];
        for(var b = CurBlockNum - SUM_LIST_LENGTH + 1; b <= CurBlockNum; b++)
        {
            var Block = this.GetBlock(b);
            if(Block && Block.bSave)
            {
                var item = {AddrHash:Block.AddrHash, SeqHash:Block.SeqHash, };
                arr.push(item)
            }
            else
            {
                return [];
            }
        }
        return arr;
    }
    GetSumFromList(arr, CurBlockNum)
    {
        var SumPow = 0;
        if(arr.length !== SUM_LIST_LENGTH)
            return SumPow;
        var CountLoad = 0;
        var BlockNumStart = CurBlockNum - arr.length + 1;
        for(var i = 0; i < arr.length; i++)
        {
            var Block = arr[i];
            if(Block)
            {
                Block.BlockNum = BlockNumStart + i
                SumPow += this.GetBlockPowerWithPoolFactor(Block)
            }
            else
            {
                break;
            }
        }
        return SumPow;
    }
    GetBlockPowerWithPoolFactor(Item)
    {
        var MinerID = ReadUintFromArr(Item.AddrHash, 0);
        var Value = GetHashFromSeqAddr(Item.SeqHash, Item.AddrHash, Item.BlockNum);
        var Sum = GetPowPower(Value.PowHash);
        if(this.IsPoolMiner(MinerID, Item.BlockNum))
        {
            Sum = Math.trunc(Sum / 2)
        }
        return Sum;
    }
    GetArrayFromTree(Block)
    {
        if(!Block.PowTree)
            return [];
        var BufLength = 0;
        var MaxSize = MAX_BLOCK_SIZE;
        var arr = [];
        var it = Block.PowTree.iterator(), Item;
        while((Item = it.next()) !== null)
        {
            arr.push(Item)
            BufLength += Item.body.length
            if(BufLength > MaxSize)
                break;
        }
        return arr;
    }
    AddTrToQuote(PowTree, Tr, MaxTransactionCount)
    {
        this.CheckCreateTransactionHASH(Tr)
        var Tr0 = PowTree.find(Tr);
        if(Tr0)
        {
            return 3;
        }
        else
        {
            PowTree.insert(Tr)
            if(PowTree.size > MaxTransactionCount)
            {
                var maxitem = PowTree.max();
                PowTree.remove(maxitem)
                if(CompareArr(maxitem.HASH, Tr.HASH) === 0)
                    return 0;
            }
            return 1;
        }
    }
    AddTrToBlockQuote(Block, Tr)
    {
        if(Block.PowTree)
        {
            if(Block.MinTrPow === undefined)
                Block.MinTrPow = this.GetMinTrPow(Block.BlockNum)
            var Res = this.IsValidTransaction(Tr, Block.BlockNum);
            if(Res >= 1)
            {
                if(!this.RelayMode)
                    if(Tr.power < Block.MinTrPow)
                        return  - 1;
                Res = this.AddTrToQuote(Block.PowTree, Tr, MAX_TRANSACTION_COUNT)
            }
            return Res;
        }
    }
    GetBlockContext(BlockNum)
    {
        if(BlockNum === undefined || !this.IsCorrectBlockNum(BlockNum))
            return undefined;
        var Context = this.GetBlock(BlockNum);
        if(!Context || !Context.StartTimeNum)
        {
            Context = this.CreateBlockContext()
            Context.BlockNum = BlockNum
            Context.DELTA_CURRENT_TIME = GetDeltaCurrentTime()
            Context.StartTimeNum = (BlockNum - 1 + BLOCK_DELTA_ACTIVATE) * CONSENSUS_PERIOD_TIME + START_NETWORK_DATE
            this.BlockChain[BlockNum] = Context
        }
        if(!Context.TransferFromAddr)
        {
            Context.TransferFromAddr = {}
            Context.LevelsTransfer = []
        }
        return Context;
    }
    StartBlock(Block)
    {
        Block.Active = true
    }
    IsCorrectBlockNum(BlockNum)
    {
        var start = this.CurrentBlockNum - BLOCK_PROCESSING_LENGTH;
        var finish = this.CurrentBlockNum;
        if(BlockNum < start || BlockNum > finish)
        {
            return false;
        }
        return true;
    }
    GetStrSendCount(Block)
    {
        if(!Block)
            return "";
        var Str = "";
        var Count = 0;
        for(var L = 0; L < Block.LevelsTransfer.length; L++)
        {
            var Transfer = Block.LevelsTransfer[L];
            Str = Str + "," + Transfer.SendCount
            if(typeof Transfer.SendCount === "number")
                Count = Count + Transfer.SendCount
        }
        return "" + Count + ":[" + Str.substr(1) + "]";
    }
    GetStrGetCount(Block)
    {
        if(!Block)
            return "";
        var Str = "";
        var Count = 0;
        for(var L = 0; L < Block.LevelsTransfer.length; L++)
        {
            var Transfer = Block.LevelsTransfer[L];
            Str = Str + "," + Transfer.GetCount
            Count = Count + Transfer.GetCount
        }
        return "" + Count + ":[" + Str.substr(1) + "]";
    }
    ToStrBlocks(DopStr)
    {
        var num = Math.floor(this.CurrentBlockNum / 3) * 3;
        var start = num - BLOCK_PROCESSING_LENGTH2 + 2;
        var finish = this.CurrentBlockNum;
        if(!DopStr)
            DopStr = ""
        var Str = "";
        for(var b = start; b <= finish; b++)
        {
            var hashStr = "";
            var Block = this.GetBlock(b);
            if(Block && Block.ErrRun)
            {
                if(Block.ErrRun)
                    hashStr = Block.ErrRun.substr(0, 5)
                else
                    if(Block && Block.TreeHash)
                        hashStr = "-" + GetHexFromAddres(Block.TreeHash).substr(0, 3) + "-"
            }
            else
                if(Block && Block.TreeHash)
                {
                    hashStr = GetHexFromAddres(Block.TreeHash).substr(0, 5)
                }
            Str = Str + "|" + (hashStr + "     ").substr(0, 5)
        }
        Str = Str.substr(1)
        ToInfo("" + finish + " -> " + Str + " " + DopStr)
    }
    PreparePOWHash(Block, bSimplePow, bFast)
    {
        if(this.RelayMode)
            bSimplePow = true
        if(Block.StartMining && !bSimplePow)
            return true;
        var WasHash = Block.Hash;
        if(!Block.TreeHash)
            Block.TreeHash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        var PrevHash = this.GetPrevHash(Block);
        if(!PrevHash)
            return false;
        Block.PrevHash = PrevHash
        Block.SeqHash = this.GetSeqHash(Block.BlockNum, Block.PrevHash, Block.TreeHash)
        if(bSimplePow)
            this.CreatePOWNew(Block, 1)
        else
            this.CreatePOWNew(Block, (1 << MIN_POWER_POW_BL))
        if(!WasHash || CompareArr(WasHash, Block.Hash) !== 0)
            AddInfoBlock(Block, "HASH:" + this.GetStrFromHashShort(WasHash) + "->" + this.GetStrFromHashShort(Block.Hash))
        Block.Prepared = true
        if(!bSimplePow)
        {
            Block.StartMining = true
            if(global.SetCalcPOW)
                global.SetCalcPOW(Block, "SetBlock")
        }
        return true;
    }
    ReloadTrTable(Block)
    {
        if(!this.IsCorrectBlockNum(Block.BlockNum))
            return ;
        var arrTr = this.GetArrayFromTree(Block);
        var bWasError = false;
        for(var i = 0; i < arrTr.length; i++)
        {
            if(!this.IsValidTransaction(arrTr[i], Block.BlockNum) >= 1)
            {
                bWasError = true
                break;
            }
        }
        if(!bWasError)
            return ;
        this.AddDAppTransactions(Block.BlockNum, arrTr)
        var arrContent = [];
        var arrHASH = [];
        Block.PowTree.clear()
        for(var i = 0; i < arrTr.length; i++)
        {
            var Tr = arrTr[i];
            if(this.IsValidTransaction(Tr, Block.BlockNum) >= 1)
            {
                if(Block.EndExchange)
                {
                    arrContent.push(Tr.body)
                    arrHASH.push(Tr.HASH)
                }
                this.AddTrToBlockQuote(Block, Tr)
            }
        }
        if(!Block.EndExchange)
            return ;
        var Tree = CalcMerklFromArray(arrHASH);
        if(!Block.TreeHash || CompareArr(Block.TreeHash, Tree.Root) !== 0)
        {
            Block.Prepared = false
            AddInfoBlock(Block, "Set not Prepared")
            if(Block.MaxPOW && Block.MaxPOW.Hash && CompareArr(Block.MaxPOW.Hash, Block.Hash) !== 0)
            {
                this.ClearMaxInBlock(Block)
                AddInfoBlock(Block, "--clear max2--")
            }
            Block.TreeHash = Tree.Root
            Block.arrContent = arrContent
            Block.TrCount = Block.arrContent.length
        }
    }
    CalcTreeHashFromArrTr(arrTr)
    {
        var arrHASH = [];
        for(var i = 0; i < arrTr.length; i++)
        {
            var Tr = arrTr[i];
            arrHASH.push(Tr.HASH)
        }
        var Tree = CalcMerklFromArray(arrHASH);
        return Tree.Root;
    }
    CalcTreeHashFromArrBody(arrContent)
    {
        if(arrContent)
        {
            var arrHASH = [];
            for(var i = 0; i < arrContent.length; i++)
            {
                var HASH = shaarr(arrContent[i]);
                arrHASH.push(HASH)
            }
            var Tree = CalcMerklFromArray(arrHASH);
            return Tree.Root;
        }
        else
        {
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
    }
    CreateTreeHash(Block)
    {
        if(Block.EndExchange)
            return ;
        Block.EndExchange = true
        if(Block.bSave)
            return ;
        var PrevBlock = this.GetBlock(Block.BlockNum - 1);
        if(PrevBlock && !PrevBlock.EndExchange && !PrevBlock.bSave)
        {
            AddInfoBlock(Block, "Prev Not End Exchange")
            return ;
        }
        AddInfoBlock(Block, "End Exchange")
        var arrContent = [];
        var arrHASH = [];
        var arrTr = this.GetArrayFromTree(Block);
        this.AddDAppTransactions(Block.BlockNum, arrTr)
        for(var i = 0; i < arrTr.length; i++)
        {
            var Tr = arrTr[i];
            arrContent.push(Tr.body)
            arrHASH.push(Tr.HASH)
        }
        var Tree = CalcMerklFromArray(arrHASH);
        Block.TreeHash = Tree.Root
        Block.arrContent = arrContent
        Block.TrCount = Block.arrContent.length
    }
    InitMapMining()
    {
        if(!global.DECENTRALIZATION_LENGTH_FACTOR)
            return ;
        this.MapMining = {}
        for(var Num = this.BlockNumDB - global.DECENTRALIZATION_LENGTH_FACTOR; Num <= this.BlockNumDB; Num++)
        {
            var Block = this.ReadBlockHeaderFromMapDB(Num);
            if(Block)
            {
                this.AddToMapMining(Block)
            }
        }
    }
    AddToMapMining(Block)
    {
        if(!global.DECENTRALIZATION_LENGTH_FACTOR)
            return ;
        if(!this.MapMining)
            this.InitMapMining()
        var MinerID = ReadUintFromArr(Block.AddrHash, 0);
        this.MapMining[MinerID] = Block.BlockNum
    }
    DeleteHeadMapMining()
    {
        for(var Key in this.MapMining)
        {
            var Num = this.MapMining[Key];
            if(Num < this.BlockNumDB - global.DECENTRALIZATION_LENGTH_FACTOR)
            {
                delete this.MapMining[Key]
            }
        }
    }
    DoBlockChain()
    {
        if(glStopNode)
            return ;
        if(!CAN_START)
            return ;
        this.StartConsensus()
        var CURRENTBLOCKNUM = this.CurrentBlockNum;
        if(GrayConnect())
        {
            if(!this.LoadHistoryMode)
                this.StartLoadHistory(undefined, 1)
            return ;
        }
        if(this.LoadHistoryMode)
            return ;
        var bWasSave = false;
        var LoadBlockNum;
        var LoadHash;
        var start_save = CURRENTBLOCKNUM + TIME_START_SAVE;
        for(var i = CURRENTBLOCKNUM - BLOCK_PROCESSING_LENGTH2; i > BLOCK_PROCESSING_LENGTH2 && i < CURRENTBLOCKNUM; i++)
        {
            var Block = this.GetBlock(i);
            if(!Block)
            {
                Block = this.GetBlockContext(i)
                if(!Block)
                {
                    continue;
                }
            }
            if(Block.bSave)
            {
                bWasSave = true
                if(i >= CURRENTBLOCKNUM + TIME_START_LOAD && Block.MaxSum && !Block.CheckMaxSum)
                {
                    AddInfoBlock(Block, "CheckMaxSum")
                    this.CheckMaxSum(Block)
                }
                if(i <= CURRENTBLOCKNUM - BLOCK_PROCESSING_LENGTH * 4)
                {
                    Block.TransferFromAddr = undefined
                    Block.LevelsTransfer = undefined
                    Block.mapData = undefined
                    Block.MaxPOW = undefined
                    Block.MaxSum = undefined
                    Block.arrContent = undefined
                    if(Block.PowTree)
                    {
                        Block.PowTree.clear()
                        Block.PowTree = undefined
                    }
                }
                continue;
            }
            var PrevBlock = this.GetBlock(i - 1);
            if(!PrevBlock)
            {
                Block.HasErr = 1
                AddInfoBlock(Block, "!PrevBlock")
                continue;
            }
            if(i >= CURRENTBLOCKNUM + TIME_END_EXCHANGE)
            {
                if(Block.EndExchange)
                    AddInfoBlock(Block, "WAIT")
                else
                    if(Block.Active)
                        AddInfoBlock(Block, "WAIT EXCHANGE")
                    else
                        AddInfoBlock(Block, "NOT ACTIVE")
                continue;
            }
            if(!Block.EndExchange)
            {
                AddInfoBlock(Block, "!EndExchange")
                Block.HasErr = 1
                this.CreateTreeHash(Block)
                this.PreparePOWHash(Block, true)
                this.AddToMaxPOW(Block)
            }
            if(i === CURRENTBLOCKNUM + TIME_START_POW)
            {
                if(!Block.EndExchange)
                    this.CreateTreeHash(Block)
                Block.StartPOW = 1
                AddInfoBlock(Block, "Start POW")
                this.PreparePOWHash(Block)
                if(!Block.Prepared)
                    AddInfoBlock(Block, "!!Prepared")
                continue;
            }
            if(!Block.Prepared)
            {
                Block.HasErr = 1
                AddInfoBlock(Block, "Not was Prepared")
                this.PreparePOWHash(Block, true)
            }
            if(i >= CURRENTBLOCKNUM + TIME_END_EXCHANGE_POW)
            {
                AddInfoBlock(Block, "WAIT EXCH.POW")
            }
            {
                var PrevHash = this.GetPrevHash(Block);
                if(!PrevHash)
                {
                    Block.HasErr = 1
                    continue;
                }
                var SeqHash = this.GetSeqHash(Block.BlockNum, PrevHash, Block.TreeHash);
                if(CompareArr(SeqHash, Block.SeqHash) !== 0)
                {
                    Block.HasErr = 1
                    AddInfoBlock(Block, "New simple pow")
                    this.PreparePOWHash(Block, true, 1)
                    this.AddToMaxPOW(Block)
                }
                if(Block.MaxPOW && Block.MaxPOW.SeqHash && Block.MaxPOW.AddrHash && Block.MaxPOW.LocalSeqHash)
                {
                    if(CompareArr(Block.SeqHash, Block.MaxPOW.SeqHash) === 0 && CompareArr(Block.AddrHash, Block.MaxPOW.AddrHash) !== 0)
                    {
                        Block.AddrHash = Block.MaxPOW.AddrHash
                        CalcHashBlockFromSeqAddr(Block, Block.PrevHash)
                        AddInfoBlock(Block, "->Max lider")
                    }
                    if(CompareArr(Block.SeqHash, Block.MaxPOW.LocalSeqHash) === 0 && CompareArr(Block.MaxPOW.PowLocalHash, Block.PowHash) < 0)
                    {
                        Block.AddrHash = Block.MaxPOW.LocalAddrHash
                        CalcHashBlockFromSeqAddr(Block, Block.PrevHash)
                        AddInfoBlock(Block, "->Local lider")
                    }
                }
                else
                {
                    Block.HasErr = 1
                    AddInfoBlock(Block, "NO MaxPOW")
                }
                if(Block.MaxPOW && Block.MaxPOW.SeqHash && !Block.CheckMaxPow && !Block.CheckMaxSum && CompareArr(Block.SeqHash, Block.MaxPOW.SeqHash) !== 0)
                {
                    AddInfoBlock(Block, "CheckMaxPow")
                    this.CheckingMaxPowOther(Block)
                }
                if(i > start_save)
                    continue;
                if(PrevBlock.bSave && this.BlockNumDB + 1 >= Block.BlockNum)
                {
                    this.AddToStatBlockConfirmation(Block)
                    if(this.WriteBlockDB(Block))
                    {
                        this.AddToMapMining(Block)
                        this.DeleteHeadMapMining()
                        if(Block.arrContent && Block.arrContent.length)
                            ADD_TO_STAT("MAX:TRANSACTION_COUNT", Block.arrContent.length)
                        AddInfoBlock(Block, "SAVE TO DB: " + this.GetStrFromHashShort(Block.SumHash))
                    }
                    else
                    {
                        Block.HasErr = 1
                        AddInfoBlock(Block, "ERROR WRITE DB")
                    }
                    this.AddToMaxSum(Block, {SumHash:Block.SumHash, SumList:this.GetBlockList(Block.BlockNum), })
                }
                else
                {
                    Block.HasErr = 1
                    AddInfoBlock(Block, "Prev block not saved")
                }
            }
        }
        for(var i = CURRENTBLOCKNUM - BLOCK_PROCESSING_LENGTH2; i > BLOCK_PROCESSING_LENGTH2 && i < start_save; i++)
        {
            var Block = this.GetBlock(i);
            if(Block && !Block.bSave && Block.TrCount && Block.TreeHash && !IsZeroArr(Block.TreeHash) && !Block.WasSaveDataTree)
            {
                this.SaveDataTreeToDB(Block)
                Block.WasSaveDataTree = 1
                AddInfoBlock(Block, "*SAVE DATA TREE*")
            }
        }
        this.RelayMode = !bWasSave
        this.FREE_MEM_BLOCKS(CURRENTBLOCKNUM - BLOCK_COUNT_IN_MEMORY)
    }
    CreatePOWNew(Block, CountNonce)
    {
        var Result = CreateHashMinimal(Block, GENERATE_BLOCK_ACCOUNT);
        if(!Result)
        {
            throw "ERROR CreateHashMinimal!!";
        }
        this.AddToMaxPOW(Block, {SeqHash:Block.SeqHash, AddrHash:Block.AddrHash, PrevHash:Block.PrevHash, TreeHash:Block.TreeHash,
        })
    }
    MiningProcess(msg)
    {
        var BlockMining = this.GetBlock(msg.BlockNum);
        if(!BlockMining || !BlockMining.StartMining)
        {
            return ;
        }
        if(BlockMining && BlockMining.Hash && BlockMining.SeqHash && CompareArr(BlockMining.SeqHash, msg.SeqHash) === 0)
        {
            var ValueOld = GetHashFromSeqAddr(BlockMining.SeqHash, BlockMining.AddrHash, BlockMining.BlockNum);
            var ValueMsg = GetHashFromSeqAddr(msg.SeqHash, msg.AddrHash, BlockMining.BlockNum);
            var bWas = 0;
            if(CompareArr(ValueOld.Hash1, ValueMsg.Hash1) > 0)
            {
                var Nonce1 = ReadUintFromArr(msg.AddrHash, 12);
                var DeltaNum1 = ReadUint16FromArr(msg.AddrHash, 24);
                WriteUintToArrOnPos(BlockMining.AddrHash, Nonce1, 12)
                WriteUint16ToArrOnPos(BlockMining.AddrHash, DeltaNum1, 24)
                bWas += 1
            }
            if(CompareArr(ValueOld.Hash2, ValueMsg.Hash2) > 0)
            {
                var Nonce0 = ReadUintFromArr(msg.AddrHash, 6);
                var Nonce2 = ReadUintFromArr(msg.AddrHash, 18);
                var DeltaNum2 = ReadUint16FromArr(msg.AddrHash, 26);
                WriteUintToArrOnPos(BlockMining.AddrHash, Nonce0, 6)
                WriteUintToArrOnPos(BlockMining.AddrHash, Nonce2, 18)
                WriteUint16ToArrOnPos(BlockMining.AddrHash, DeltaNum2, 26)
                bWas += 2
            }
            if(!bWas)
                return ;
            var ValueNew = GetHashFromSeqAddr(BlockMining.SeqHash, BlockMining.AddrHash, BlockMining.BlockNum);
            BlockMining.Hash = ValueNew.Hash
            BlockMining.PowHash = ValueNew.PowHash
            BlockMining.Power = GetPowPower(BlockMining.PowHash)
            ADD_TO_STAT("MAX:POWER", BlockMining.Power)
            this.AddToMaxPOW(BlockMining, {SeqHash:BlockMining.SeqHash, AddrHash:BlockMining.AddrHash, PrevHash:BlockMining.PrevHash, TreeHash:BlockMining.TreeHash,
            })
        }
    }
};
global.GetCurrentBlockNumByTime = function GetCurrentBlockNumByTime()
{
    var CurTimeNum = GetCurrentTime() - FIRST_TIME_BLOCK;
    var StartBlockNum = Math.trunc((CurTimeNum + CONSENSUS_PERIOD_TIME) / CONSENSUS_PERIOD_TIME);
    return StartBlockNum;
};
var PrevTimeIdle = 0;
OnTimeIdle();

function OnTimeIdle()
{
    var CurTime = new Date() - 0;
    var Delta = CurTime - PrevTimeIdle;
    if(Delta <= 51)
    {
        ADD_TO_STAT("TIME_IDLE", 5);
    }
    setTimeout(OnTimeIdle, 49);
    PrevTimeIdle = CurTime;
};
