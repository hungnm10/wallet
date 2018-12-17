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
const fs = require("fs");
const crypto = require('crypto');
const RBTree = require('bintrees').RBTree;
const STAT_BLOCK_LOAD_PERIOD = CONSENSUS_PERIOD_TIME / 5;
global.PERIOD_GET_BLOCK = 300;
if(global.LOCAL_RUN || global.TEST_NETWORK)
{
    global.COUNT_BLOCKS_FOR_LOAD = global.DELTA_BLOCK_ACCOUNT_HASH / 2;
}
global.COUNT_HISTORY_BLOCKS_FOR_LOAD = 3000;
global.COUNT_BLOCKS_FOR_CHECK_POW = 100;
global.MAX_COUNT_CHAIN_LOAD = 120;
global.PACKET_ALIVE_PERIOD = 4 * CONSENSUS_PERIOD_TIME;
global.PACKET_ALIVE_PERIOD_NEXT_NODE = PACKET_ALIVE_PERIOD / 2;
global.MAX_BLOCK_SEND = 8;
global.COUNT_TASK_FOR_NODE = 10;
const Formats = {BLOCK_TRANSFER:"{\
            BlockNum:uint,\
            TreeHash:hash,\
            arrContent:[tr],\
            }",
    WRK_BLOCK_TRANSFER:{}, };
module.exports = class CBlock extends require("./db/block-db")
{
    constructor(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
    {
        super(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
        this.MapMapLoaded = {}
        this.BlockChain = {}
        this.ChainID = 0
        this.BlockID = 0
        this.TaskNodeIndex = 0
        this.LoadedChainList = []
        this.LastChainLoad = undefined
        this.StartLoadBlockTime = 0
        this.LoadHistoryMode = false
        this.MapBlockBodyLoad = {}
        if(!global.ADDRLIST_MODE && !this.VirtualMode)
        {
            let Self = this;
            setTimeout(function ()
            {
                Self.CheckStartedBlocks()
                setInterval(Self.LoopChainLoad.bind(Self), 100)
                setInterval(Self.LoopBlockLoad.bind(Self), 10)
                setInterval(Self.LoopBlockBodyLoad.bind(Self), 1 * 1000)
            }, 1000)
        }
    }
    StopNode()
    {
        global.glStopNode = true
    }
    GenesisBlockHeaderDB(Num)
    {
        if(Num < 0)
            return undefined;
        var Block = {BlockNum:Num, TreeHash:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0], AddrHash:DEVELOP_PUB_KEY0, Hash:this.GetHashGenesis(Num), PowHash:this.GetHashGenesis(Num), PrevHash:[0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], SeqHash:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], SumHash:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], Comment1:"GENESIS", Comment2:"", TrCount:0, TrDataPos:0, TrDataLen:0, };
        Block.SeqHash = this.GetSeqHash(Block.BlockNum, Block.PrevHash, Block.TreeHash)
        Block.SumPow = 0
        Block.bSave = true
        return Block;
    }
    CheckStartedBlocks()
    {
        this.FindStartBlockNum()
        if(this.UseTruncateBlockDB)
            this.TruncateBlockDB(this.UseTruncateBlockDB)
        var CurNum = GetCurrentBlockNumByTime();
        if(CurNum <= this.BlockNumDB)
        {
            this.TruncateBlockDB(CurNum)
        }
        if(this.BlockNumDB < BLOCK_PROCESSING_LENGTH2)
            this.CreateGenesisBlocks()
        if(fs.existsSync(GetCodePath("EXPERIMENTAL/_run.js")))
        {
            require(GetCodePath("EXPERIMENTAL/_run.js")).Run()
        }
        this.LoadMemBlocksOnStart()
    }
    CreateGenesisBlocks()
    {
        ToLog("====CreateGenesisBlock====")
        var PrevArr = [];
        for(var n = 0; n < BLOCK_PROCESSING_LENGTH2; n++)
        {
            var Block = this.GenesisBlockHeaderDB(n);
            PrevArr[n] = Block
            this.WriteBlockDB(Block)
        }
        return PrevArr;
    }
    GetPrevHash(Block)
    {
        var startPrev = Block.BlockNum - BLOCK_PROCESSING_LENGTH2;
        var Sum = 0;
        var arr = [];
        for(var i = 0; i < BLOCK_PROCESSING_LENGTH; i++)
        {
            var PrevBlock = this.GetBlock(startPrev + i);
            if(PrevBlock && PrevBlock.bSave)
            {
                Sum = Sum + PrevBlock.SumPow
                arr.push(PrevBlock.Hash)
            }
            else
            {
                return undefined;
            }
        }
        var PrevHash = CalcHashFromArray(arr, true);
        return PrevHash;
    }
    StartLoadHistory(Node, bSilent)
    {
        this.FREE_ALL_MEM_CHAINS()
        if(global.NO_HISTORY_MODE)
        {
            this.LoadHistoryMode = 0
            return ;
        }
        if(global.CREATE_ON_START && !LOCAL_RUN)
            return ;
        if(!GrayConnect())
            this.RelayMode = true
        else
            this.RelayMode = false
        if(!bSilent)
            this.RelayMode = true
        this.LoadHistoryMode = true
        this.LoadHistoryMessage = !bSilent
        this.LoadHistoryContext = {Node:Node, BlockNum:this.BlockNumDB, MapSend:{}, Foward:1, Pause:0, DeltaBlockNum:10}
        if(!this.ActualNodes.size)
        {
            ToLog("There is no connections to other nodes")
            return ;
        }
        else
        {
            if(this.LoadHistoryMessage)
            {
                ToLog("Start synchronization")
            }
        }
    }
    StartLoadBlockHeader(LoadHash, Num, StrInfo, bIsSum)
    {
        if(this.LoadHistoryMode)
            return ;
        if(global.NO_HISTORY_MODE)
            return ;
        this.StartLoadBlockTime = Date.now()
        if(Num > this.CurrentBlockNum + TIME_START_SAVE)
        {
            return ;
        }
        bIsSum = bIsSum || false
        var Tree = this.GetHistoryTree("StartLoadBlockHeader");
        if(Tree.find({hash:LoadHash}))
            return false;
        Tree.insert({hash:LoadHash})
        var chain = {id:0, Count:16, BlockNum:Num, IsSum:bIsSum, Hash:LoadHash, time:undefined, FindBlockDB:false, LoadDB:false, LoadCountDB:0,
            LoadSumDB:0, LoadSum:0, ParentChain:undefined, RootChain:undefined, BlockNumStart:Num, HashStart:LoadHash, IsSumStart:bIsSum,
            BlockHead:undefined, MapSend:{}, Comment2:"", StopSend:false, Info:"", Error:false, };
        this.ChainBindMethods(chain)
        chain.AddInfo(StrInfo)
        this.SetChainNum(chain)
        var max = 3;
        while(max > 0)
        {
            max--
            if(!this.SendChainNext(chain, false))
                break;
        }
        return true;
    }
    LoopHistoryLoad()
    {
        if(!this.ActualNodes.size)
            return ;
        var Context = this.LoadHistoryContext;
        if(Context.PrevBlockNum === Context.BlockNum)
        {
            var DeltaTime = Date.now() - Context.StartTimeHistory;
            if(DeltaTime > 10 * 1000)
            {
                ToLog("DETECT TIMEOUT LOADHISTORY")
                this.StartLoadHistory()
                return ;
            }
        }
        else
        {
            Context.PrevBlockNum = Context.BlockNum
            Context.StartTimeHistory = Date.now()
        }
        if(Context.Pause)
        {
            if(this.LoadedChainList.length)
            {
                return ;
            }
            Context.Pause = 0
            Context.BlockNum = this.BlockNumDB
        }
        var BlockDB = this.ReadBlockHeaderDB(Context.BlockNum);
        if(!BlockDB || this.BlockNumDB >= GetCurrentBlockNumByTime() - BLOCK_PROCESSING_LENGTH - 2)
        {
            this.LoadHistoryMode = false
            if(this.LoadHistoryMessage)
                ToLog("Finish synchronization")
            if(!BlockDB)
                return ;
        }
        var Ret = this.GetNextNode(Context, Context.BlockNum, 1);
        if(Ret.Result)
        {
            var Node = Ret.Node;
            this.SendF(Node, {"Method":"GETBLOCKHEADER", "Context":Context, "Data":{Foward:1, BlockNum:Context.BlockNum, Hash:BlockDB.SumHash}})
        }
    }
    SetChainNum(chain)
    {
        if(!chain.id)
        {
            this.ChainID++
            chain.id = this.ChainID
        }
        this.LoadedChainList.push(chain)
    }
    LoopChainLoad()
    {
        if(glStopNode)
            return ;
        if(this.UseTruncateBlockDB)
            this.TruncateBlockDB(this.UseTruncateBlockDB)
        if(this.LoadHistoryMode)
        {
            this.LoopHistoryLoad()
            return ;
        }
        if(this.BlockNumDB < this.CurrentBlockNum - BLOCK_PROCESSING_LENGTH2)
        {
            this.StartLoadHistory()
            return ;
        }
        var CountStopSend = 0;
        var min_num = this.CurrentBlockNum - MAX_COUNT_CHAIN_LOAD;
        var min_num_load = this.CurrentBlockNum;
        for(var i = 0; i < this.LoadedChainList.length; i++)
        {
            var chain = this.LoadedChainList[i];
            if(!chain)
            {
                this.LoadedChainList.splice(i, 1)
                continue;
            }
            var RootChain = chain.GetRootChain();
            if(chain.RootChain)
                chain.RootChain = RootChain
            if(RootChain.BlockNum < min_num_load)
                min_num_load = RootChain.BlockNum
            if(!chain.StopSend)
            {
                if(chain.BlockHead)
                {
                    if(chain.BlockNum < this.CurrentBlockNum - COUNT_HISTORY_BLOCKS_FOR_LOAD)
                    {
                        ToLog("Very long length of blocks to load history, stop chain with id=" + chain.id + "  (" + chain.BlockNum + "-" + chain.BlockNumMax + ")")
                        chain.StopSend = true
                        chain.AddInfo("Stop load #1")
                        this.BlockNumDB = chain.BlockNum
                        this.TruncateBlockDB(chain.BlockNum)
                        this.StartLoadHistory()
                        return ;
                    }
                    else
                        if(chain.BlockNumMax < min_num)
                        {
                            ToLog("Timeout - stop load chain with id=" + chain.id + "  (" + chain.BlockNum + "-" + chain.BlockNumMax + ")")
                            chain.StopSend = true
                            chain.AddInfo("Stop load #2")
                            this.ClearChains(chain, true)
                        }
                }
            }
            if(chain && !chain.IsSum && !chain.StopSend)
            {
                var StrKey = "H:" + GetHexFromArr(chain.Hash);
                var Map = this.GetMapLoadedFromChain(chain);
                var WasBlock = Map[StrKey];
                if(WasBlock && WasBlock.chain !== chain && CompareArr(WasBlock.Hash, chain.Hash) === 0 && !WasBlock.chain.Deleted)
                {
                    ToLog("Was hash in chain " + WasBlock.chain.id + " - stop load chain with id=" + chain.id + "  (" + chain.BlockNum + ")")
                    chain.Comment2 = "was hash"
                    chain.StopSend = true
                }
            }
            if(chain && chain.StopSend)
                CountStopSend++
            chain = this.LoadedChainList[i]
            if(chain && !chain.GetFindDB() && !chain.StopSend)
            {
                this.SendChainNext(chain, true)
            }
        }
        ADD_TO_STAT("MAX:LOADEDCHAINLIST", this.LoadedChainList.length)
        this.FREE_MEM_CHAINS(min_num_load)
        this.LastLoadedBlockNum = 0
        if(this.LoadedChainList.length > COUNT_HISTORY_BLOCKS_FOR_LOAD / 3)
        {
            ToLog("LoadedChainList>COUNT_HISTORY_BLOCKS_FOR_LOAD/3 - FREE_ALL_MEM_CHAINS")
            this.FREE_ALL_MEM_CHAINS()
        }
    }
    GetNextNode(task, keyid, checktime, BlockNum)
    {
        var CurTime = GetCurrentTime(0) - 0;
        if(checktime && task.time)
        {
            var Delta = CurTime - task.time;
            if(Delta < PACKET_ALIVE_PERIOD_NEXT_NODE)
                return {Result:false, timewait:true};
        }
        task.time = undefined
        var StartI = 0;
        if(task.Node)
            StartI =  - 1
        var timewait = false;
        var arr = this.GetActualNodes();
        arr.sort(function (a,b)
        {
            return b.BlockProcessCount - a.BlockProcessCount;
        })
        if(arr.length > 40)
            arr.length = 40
        for(var i = StartI; i < arr.length; i++)
        {
            var Node;
            if(i ===  - 1)
            {
                Node = task.Node
                task.Node = undefined
            }
            else
            {
                this.TaskNodeIndex++
                Node = arr[this.TaskNodeIndex % arr.length]
            }
            if(Node.Active)
            {
                if(!Node.INFO || !Node.INFO.WasPing || Node.StopGetBlock || (Node.INFO.CheckPointHashDB && CHECK_POINT.BlockNum && CompareArr(CHECK_POINT.Hash,
                Node.INFO.CheckPointHashDB) !== 0))
                {
                    timewait = true
                    continue;
                }
                if(BlockNum !== undefined && Node.INFO && BlockNum > Node.INFO.BlockNumDB)
                {
                    timewait = true
                    continue;
                }
                if(Node.TaskLastSend)
                {
                    var Delta = CurTime - Node.TaskLastSend;
                    if(Delta < global.PERIOD_GET_BLOCK)
                    {
                        timewait = true
                        continue;
                    }
                }
                var keysend = "" + Node.addrStr + ":" + keyid;
                if(task.MapSend[keysend])
                    continue;
                Node.TaskLastSend = CurTime
                task.time = CurTime
                return {Result:true, Node:Node, timewait:timewait};
            }
        }
        if(!task.RestartGetNextNode)
            task.RestartGetNextNode = 0
        if(!timewait && task.RestartGetNextNode < 3)
        {
            if(!task.LastTimeRestartGetNextNode)
                task.LastTimeRestartGetNextNode = 0
            var Delta = Date.now() - task.LastTimeRestartGetNextNode;
            if(Delta > 3000)
            {
                task.RestartGetNextNode++
                task.LastTimeRestartGetNextNode = Date.now()
                task.MapSend = {}
                return {Result:false, timewait:true};
            }
        }
        return {Result:false, timewait:timewait};
    }
    SendChainNext(chain, checktime)
    {
        var Ret = this.GetNextNode(chain, chain.BlockNum, checktime);
        if(Ret.Result)
        {
            if(!chain.Context)
                chain.Context = {Chain:chain}
            var Node = Ret.Node;
            this.SendF(Node, {"Method":"GETBLOCKHEADER", "Context":chain.Context, "Data":{Foward:0, BlockNum:chain.BlockNum, Hash:chain.Hash,
                    IsSum:chain.IsSum, Count:chain.Count}})
            var DopStr = "";
            if(chain.IsSum)
                DopStr = "SUM:"
            chain.AddInfo(chain.BlockNum + "/" + DopStr + this.GetStrFromHashShort(chain.Hash) + "->" + GetNodeStrPort(Node))
            return true;
        }
        return false;
    }
    static
    GETBLOCKHEADER_F()
    {
        return "{\
                Foward:byte,\
                BlockNum:uint,\
                Hash:hash,\
                Count:uint,\
                IsSum:byte\
            }";
    }
    GetBlockArrFromBuffer_Load(BufRead, Info)
    {
        var BlockArr = GetBlockArrFromBuffer(BufRead, Info);
        if(BlockArr.length > 0 && BlockArr[0].BlockNum === BLOCK_PROCESSING_LENGTH2)
            BlockArr.unshift(this.ReadBlockHeaderDB(BLOCK_PROCESSING_LENGTH2 - 1))
        return BlockArr;
    }
    RETBLOCKHEADER_FOWARD(Info, CurTime)
    {
        if(!Info.Context.Foward)
            return ;
        var Context = this.LoadHistoryContext;
        Context.time = undefined
        var BufRead = BufLib.GetReadBuffer(Info.Data);
        var arr = this.GetBlockArrFromBuffer_Load(BufRead, Info);
        var arr2 = [];
        var bFindDB = 0;
        if(arr.length > 1)
            for(var i = 0; i < arr.length; i++)
            {
                var Block = arr[i];
                if(!Block)
                    return ;
                if(Block.BlockNum === CHECK_POINT.BlockNum && !IsZeroArr(CHECK_POINT.Hash))
                {
                    if(CompareArr(CHECK_POINT.Hash, Block.Hash) !== 0)
                    {
                        break;
                    }
                    Context.FindCheckPoint = true
                }
                if(Block.BlockNum < this.BlockNumDB)
                {
                    break;
                }
                if(!bFindDB)
                {
                    var BlockDB = this.ReadBlockHeaderDB(Block.BlockNum);
                    if(BlockDB && CompareArr(BlockDB.SumHash, Block.SumHash) === 0)
                    {
                        bFindDB = 1
                        arr2.push(Block)
                    }
                }
                else
                    if(bFindDB)
                    {
                        arr2.push(Block)
                    }
            }
        if(arr2.length > 1)
        {
            Context.WasLoadNum = 1
            var chain = {id:0, StopSend:1, WriteToDBAfterLoad:1};
            this.ChainBindMethods(chain)
            this.SetChainNum(chain)
            this.PrepareTransactionsForLoad(chain, arr2)
            Context.BlockNum = Block.BlockNum
            Context.Pause = 1
        }
        else
        {
            if(!Context.WasLoadNum)
            {
                Context.BlockNum = Math.floor(Context.BlockNum - Context.DeltaBlockNum)
                Context.DeltaBlockNum = Context.DeltaBlockNum * 1.2
                if(Context.BlockNum < BLOCK_PROCESSING_LENGTH2)
                    Context.BlockNum = BLOCK_PROCESSING_LENGTH2 - 1
                this.BlockNumDB = Context.BlockNum
                this.SetTruncateBlockDB(Context.BlockNum)
            }
            else
            {
                var keysend = "" + Info.Node.addrStr + ":" + Context.BlockNum;
                Context.MapSend[keysend] = 1
            }
        }
    }
    RETBLOCKHEADER(Info, CurTime)
    {
        Info.Node.NextPing = MIN_PERIOD_PING
        if(Info.Context.Foward)
            return this.RETBLOCKHEADER_FOWARD(Info, CurTime);
        var chain = Info.Context.Chain;
        if(chain && !chain.StopSend && !chain.Deleted)
        {
            var BufRead = BufLib.GetReadBuffer(Info.Data);
            chain.time = undefined
            var arr = this.GetBlockArrFromBuffer_Load(BufRead, Info);
            if(arr.length <= 1)
            {
                var keysend = "" + Info.Node.addrStr + ":" + chain.BlockNum;
                chain.MapSend[keysend] = 1
                chain.AddInfo("NO:" + GetNodeStrPort(Info.Node))
                return ;
            }
            chain.AddInfo("L=" + arr.length + " from:" + GetNodeStrPort(Info.Node))
            var NextLoadBlock;
            var PrevBlock;
            for(var i = arr.length - 1; i >= 0; i--)
            {
                var Block = arr[i];
                var StrKey = GetHexFromArr(Block.SumHash);
                var MapBlockLoaded = this.GetMapLoaded(Block.BlockNum);
                var BlockFind = MapBlockLoaded[StrKey];
                if(BlockFind && BlockFind.chain !== chain && BlockFind.chain.Deleted)
                {
                    delete MapBlockLoaded[StrKey]
                    BlockFind = undefined
                }
                if(!chain.BlockHead)
                    chain.BlockHead = Block
                if(!chain.BlockNumMax)
                    chain.BlockNumMax = Block.BlockNum
                var PrevBlock0 = PrevBlock;
                if(BlockFind)
                {
                    if(PrevBlock)
                    {
                        PrevBlock.BlockDown = BlockFind
                        PrevBlock.Send = undefined
                    }
                    PrevBlock = BlockFind
                }
                else
                {
                    if(PrevBlock)
                    {
                        PrevBlock.BlockDown = Block
                        PrevBlock.Send = undefined
                    }
                    PrevBlock = Block
                }
                if(BlockFind && BlockFind.chain !== chain)
                {
                    chain.ParentChain = BlockFind.chain
                    chain.RootChain = BlockFind.chain.GetRootChain()
                    if(chain.RootChain)
                        chain.RootChain.BlockNumMax = chain.BlockHead.BlockNum
                    chain.StopSend = true
                    chain.AddInfo("StopSend - Find load Block")
                    break;
                }
                else
                    if(!BlockFind)
                    {
                        Block.chain = chain
                        Block.Node = Info.Node
                        var StrSumHash = GetHexFromArr(Block.SumHash);
                        MapBlockLoaded[StrSumHash] = Block
                        var StrHash = GetHexFromArr(Block.Hash);
                        MapBlockLoaded["H:" + StrHash] = Block
                        var StrTreeHash = GetHexFromArr(Block.TreeHash);
                        MapBlockLoaded["TH:" + StrTreeHash] = Block
                        var BlockDB = this.ReadBlockHeaderDB(Block.BlockNum);
                        if(BlockDB)
                        {
                            Block.Power = GetPowPower(Block.PowHash)
                            chain.LoadCountDB++
                            chain.LoadSumDB += BlockDB.Power
                            chain.LoadSum += Block.Power
                            if(CompareArr(BlockDB.SumHash, Block.SumHash) === 0)
                            {
                                Block.FindBlockDB = true
                                Block.SumPow = BlockDB.SumPow
                                chain.FindBlockDB = true
                                chain.StopSend = true
                                chain.AddInfo("BlockFind - Find Block in DB")
                                NextLoadBlock = undefined
                                break;
                            }
                        }
                        NextLoadBlock = Block
                    }
            }
            if(NextLoadBlock && !NextLoadBlock.chain.StopSend)
            {
                if(arr.length >= chain.Count)
                {
                    chain.Count = chain.Count * 2
                    if(chain.Count > COUNT_BLOCKS_FOR_LOAD)
                        chain.Count = COUNT_BLOCKS_FOR_LOAD
                }
                if(chain.LoadCountDB >= COUNT_BLOCKS_FOR_CHECK_POW)
                {
                    if(chain.LoadSumDB - chain.LoadSum > COUNT_BLOCKS_FOR_CHECK_POW)
                    {
                        var Str = "ERR LOADED SUM POW chains: SumDB > Sum loaded from: " + NodeInfo(Info.Node);
                        chain.StopSend = true
                        chain.AddInfo(Str)
                        ToLog("======================================================" + Str)
                    }
                }
                if(!chain.StopSend)
                    this.BlockChainLoad(NextLoadBlock)
            }
            if(chain.GetFindDB())
                this.CheckToStartLoadBlockData(chain)
        }
    }
    BlockChainLoad(Block)
    {
        var chain = Block.chain;
        Block.Send = undefined
        chain.BlockNum = Block.BlockNum
        chain.Hash = Block.SumHash
        chain.IsSum = true
        chain.StopSend = false
        chain.FindBlockDB = false
        chain.RootChain = undefined
        chain.ParentChain = undefined
        chain.AddInfo("SetChainSend:" + chain.BlockNum)
    }
    CheckToStartLoadBlockData(chain)
    {
        if(chain.Deleted)
            return ;
        var arr = this.GetArrFromChain(chain);
        if(arr.length < 2)
            return ;
        var BlockMax = arr[arr.length - 1];
        var BlockMin = arr[0];
        var PrevBlock = BlockMin;
        for(var i = 1; i < arr.length; i++)
        {
            var Block = arr[i];
            Block.Power = GetPowPower(Block.PowHash)
            Block.SumPow = PrevBlock.SumPow + Block.Power
            PrevBlock = Block
        }
        var BlockNow = this.ReadBlockHeaderDB(BlockMax.BlockNum);
        if(BlockNow && (BlockMax.SumPow < BlockNow.SumPow || BlockMax.SumPow === BlockNow.SumPow && CompareArr(BlockMax.PowHash, BlockNow.PowHash) < 0))
        {
            var Str = "Low SumPow";
            chain.AddInfo(Str)
            return ;
        }
        var Str = "Start Load blocks: " + (BlockMin.BlockNum + 1) + "  -  " + BlockMax.BlockNum;
        chain.AddInfo(Str)
        this.PrepareTransactionsForLoad(chain, arr)
    }
    GetArrFromChain(chain)
    {
        var arr = [];
        var Block = chain.BlockHead;
        while(Block)
        {
            arr.unshift(Block)
            if(Block.AddToLoad || Block.FindBlockDB || Block.LoadDBFinaly)
            {
                break;
            }
            Block = Block.BlockDown
        }
        return arr;
    }
    CopyBlockToMem(Block, chain)
    {
        var BlockMem = this.BlockChain[Block.BlockNum];
        this.BlockChain[Block.BlockNum] = Block
        if(BlockMem)
        {
            Block.MaxPOW = BlockMem.MaxPOW
            Block.MaxSum = BlockMem.MaxSum
            Block.Info = BlockMem.Info
            AddInfoBlock(Block, "--copy mem--")
        }
        else
        {
            this.ClearMaxInBlock(Block)
            if(BlockMem)
            {
                Block.Info = BlockMem.Info
                AddInfoBlock(Block, "--clear max--")
            }
            else
            {
                AddInfoBlock(Block, "--create mem--")
            }
        }
        Block.Prepared = true
        Block.MinTrPow = undefined
        if(chain)
            chain.AddInfo("LOAD:" + this.GetStrFromHashShort(Block.SumHash) + "  id:" + chain.id)
        this.AddToStatBlockConfirmation(Block)
    }
    ClearMaxInBlock(Block)
    {
        Block.MaxPOW = {}
        var POW = Block.MaxPOW;
        POW.SeqHash = Block.SeqHash
        POW.AddrHash = Block.AddrHash
        POW.PrevHash = Block.PrevHash
        POW.TreeHash = Block.TreeHash
        POW.Hash = Block.Hash
        POW.PowHash = Block.PowHash
        POW.SumPow = Block.SumPow
        POW.port = 0
        Block.MaxSum = {}
        POW = Block.MaxSum
        POW.SeqHash = Block.SeqHash
        POW.AddrHash = Block.AddrHash
        POW.PrevHash = Block.PrevHash
        POW.TreeHash = Block.TreeHash
        POW.Hash = Block.Hash
        POW.PowHash = Block.PowHash
        POW.SumHash = Block.SumHash
        POW.SumPow = Block.SumPow
        POW.port = 0
    }
    AddToStatBlockConfirmation(Block)
    {
        if(Block.BlockNum > START_BLOCK_RUN + BLOCK_PROCESSING_LENGTH2)
        {
            var TimeDelta = this.CurrentBlockNum - Block.BlockNum;
            ADD_TO_STAT("MAX:BlockConfirmation", TimeDelta)
        }
        else
        {
            ADD_TO_STAT("MAX:BlockConfirmation", BLOCK_PROCESSING_LENGTH)
        }
    }
    PrepareTransactionsForLoad(chain, arr, bNoSlice)
    {
        if(!bNoSlice)
            arr = arr.slice(1)
        chain.arr = arr
        if(arr.length > 0)
        {
            for(var i = 0; i < arr.length; i++)
                arr[i].AddToLoad = 1
            chain.CurNumArrLoad = 0
        }
    }
    LoopBlockLoad()
    {
        if(glStopNode)
            return ;
        var CountSend = 0;
        for(var num = 0; num < this.LoadedChainList.length; num++)
        {
            var chain = this.LoadedChainList[num];
            if(chain && chain.arr && chain.arr.length && chain.StopSend)
            {
                var Count = 0;
                for(var i = chain.CurNumArrLoad; i < chain.arr.length; i++)
                {
                    Count++
                    var Block = chain.arr[i];
                    if(!IsZeroArr(Block.TreeHash) && !Block.TreeEq && !Block.LoadDBFinaly)
                    {
                        if(!Block.MapSend)
                        {
                            if(!Block.BodyLoad)
                            {
                                var BlockDB = this.ReadBlockHeaderDB(Block.BlockNum);
                                if(BlockDB)
                                {
                                    if(CompareArr(BlockDB.TreeHash, Block.TreeHash) == 0)
                                    {
                                        Block.TreeEq = true
                                        Block.BodyFileNum = BlockDB.BodyFileNum
                                        Block.TrDataPos = BlockDB.TrDataPos
                                        Block.TrDataLen = BlockDB.TrDataLen
                                        continue;
                                    }
                                }
                            }
                            Block.MapSend = {}
                        }
                        if(this.SendBlockNext(Block))
                        {
                            CountSend++
                            if(CountSend >= MAX_BLOCK_SEND)
                                return ;
                        }
                    }
                    else
                        if(i === chain.CurNumArrLoad)
                        {
                            chain.CurNumArrLoad++
                            Block.LoadDBFinaly = true
                            Count = 0
                        }
                }
                this.CheckAndWriteLoadedChain(chain)
            }
        }
    }
    CheckAndWriteLoadedChain(chain)
    {
        if(chain.CurNumArrLoad >= chain.arr.length)
        {
            var Block = chain.arr[chain.arr.length - 1];
            if(chain.WriteToDBAfterLoad || Block.BlockNum >= this.CurrentBlockNum + TIME_START_SAVE - 1)
            {
                var bAllLoaded = true;
                if(!chain.WriteToDBAfterLoad)
                {
                    var cur_parent = chain.ParentChain;
                    while(cur_parent)
                    {
                        if(cur_parent.arr && cur_parent.CurNumArrLoad < cur_parent.arr.length)
                        {
                            bAllLoaded = false
                            break;
                        }
                        cur_parent = cur_parent.ParentChain
                    }
                }
                if(bAllLoaded)
                {
                    var arr = [];
                    var cur_chain = chain;
                    while(cur_chain)
                    {
                        if(cur_chain.arr)
                            for(var i = cur_chain.arr.length - 1; i >= 0; i--)
                            {
                                var Block = cur_chain.arr[i];
                                arr.unshift(Block)
                            }
                        cur_chain = cur_chain.ParentChain
                    }
                    this.WriteLoadedBlockArr(arr)
                }
            }
        }
    }
    WriteLoadedBlockArr(arr)
    {
        if(!arr.length)
            return ;
        var startTime = process.hrtime();
        if(this.LoadHistoryMessage)
            ToLog("WRITE DATA Count:" + arr.length + "  " + arr[0].BlockNum + "-" + arr[arr.length - 1].BlockNum)
        var CurrentBlockNum = GetCurrentBlockNumByTime();
        var Block, FirstBlock;
        for(var i = 0; i < arr.length; i++)
        {
            if(arr[i].BlockNum > this.BlockNumDB + 1)
                break;
            Block = arr[i]
            if(!FirstBlock)
                FirstBlock = Block
            Block.BlockDown = undefined
            var Res = 0;
            if(Block.TreeEq)
            {
                this.ReadBlockBodyDB(Block)
                Res = this.WriteBlockDBFinaly(Block)
            }
            else
            {
                if(IsZeroArr(Block.TreeHash))
                {
                    Block.BodyFileNum = 0
                    Res = this.WriteBlockDB(Block)
                }
                else
                {
                    ToLogTrace("IsZeroArr(Block.TreeHash)")
                    throw "IsZeroArr(Block.TreeHash)";
                }
            }
            if(!Res)
            {
                ToLog("ERROR WRITE DB, NUM=" + Block.BlockNum)
                this.FREE_ALL_MEM_CHAINS()
                return ;
            }
            Block.LoadDB = true
            if(Block.BlockNum >= CurrentBlockNum - BLOCK_COUNT_IN_MEMORY)
            {
                this.CopyBlockToMem(Block)
            }
            else
            {
                if(Block.arrContent)
                    Block.arrContent.length = 0
                Block.arrContent = undefined
            }
        }
        if(Block && FirstBlock)
        {
            var CurNumStart = FirstBlock.BlockNum + 8;
            var CurNum = Block.BlockNum + 1;
            while(true)
            {
                var BlockMem = this.BlockChain[CurNum];
                if(BlockMem)
                {
                    BlockMem.bSave = false
                    if(USE_FAST_CALC_BLOCK)
                    {
                        if(CurNum >= CurNumStart)
                        {
                            this.ReloadTrTable(BlockMem)
                            AddInfoBlock(BlockMem, "--reload old table--")
                        }
                        else
                        {
                            AddInfoBlock(BlockMem, "--skip reload old--")
                        }
                    }
                    else
                    {
                        this.ReloadTrTable(BlockMem)
                        AddInfoBlock(BlockMem, "--reload old table--")
                    }
                }
                if(!BlockMem)
                    break;
                CurNum++
            }
            ADD_TO_STAT("WRITECHAIN_TO_DB_COUNT", arr.length)
        }
        this.FREE_ALL_MEM_CHAINS()
        ADD_TO_STAT_TIME("WRITECHAIN_TO_DB_TIME", startTime)
    }
    SendBlockNext(Block)
    {
        var SendResult = 0;
        var Key = GetHexFromArr(Block.TreeHash);
        while(true)
        {
            var Ret = this.GetNextNode(Block, Key, true, Block.BlockNum);
            if(Ret.Result)
            {
                var Node = Ret.Node;
                if(!Block.Context)
                    Block.Context = {Block:Block}
                this.SendF(Node, {"Method":"GETBLOCK", "Context":Block.Context, "Data":{BlockNum:Block.BlockNum, TreeHash:Block.TreeHash}})
                Node.SendBlockCount++
                SendResult = 1
                AddInfoBlock(Block, "SendNext")
                if(Block.chain)
                    Block.chain.AddInfo("QUERY BL:" + Block.BlockNum + "/" + this.GetStrFromHashShort(Block.TreeHash) + " TO:" + GetNodeStrPort(Node))
            }
            else
            {
                if(!Ret.timewait)
                {
                    this.ClearChains(Block.chain, true)
                }
            }
            break;
        }
        return SendResult;
    }
    ClearChains(DeleteChain, bShow)
    {
        if(!DeleteChain)
        {
            this.FREE_ALL_MEM_CHAINS()
            return this.LoadedChainList.length;
        }
        var allsum = this.LoadedChainList.length;
        var Sum = 0;
        for(var i = 0; i < this.LoadedChainList.length; i++)
        {
            var chain = this.LoadedChainList[i];
            if(chain)
            {
                if(chain === DeleteChain)
                {
                    chain.Deleted = true
                    this.LoadedChainList[i] = undefined
                    Sum++
                }
                if(chain.ParentChain === DeleteChain)
                {
                    Sum += this.ClearChains(chain)
                }
            }
        }
        if(bShow)
        {
            ToLog("===========ClearChains================= " + DeleteChain.id + " count=" + Sum + "/" + allsum)
        }
        return Sum;
    }
    RecalcLoadBlockStatictic()
    {
        return ;
        var TimeNum = Math.floor(((new Date) - 0) / STAT_BLOCK_LOAD_PERIOD);
        if(this.LoadBlockStatNum === TimeNum)
            return ;
        this.LoadBlockStatNum = TimeNum
        const PeriodSec = 5;
        const Period = CONSENSUS_PERIOD_TIME / STAT_BLOCK_LOAD_PERIOD;
        const PeriodCount = PeriodSec * Period;
        var FreeGet = 64;
        var it = this.ActualNodes.iterator(), Node;
        while((Node = it.next()) !== null)
        {
            var arr = Node.SendBlockArr;
            arr.push(Node.SendBlockCount)
            if(arr.length > PeriodCount)
            {
                arr.shift()
            }
            arr = Node.LoadBlockArr
            arr.push(Node.LoadBlockCount)
            if(arr.length > PeriodCount)
            {
                arr.shift()
            }
            var SendPackets = 0;
            var LoadPackets = 0;
            for(var i = 0; i < Node.SendBlockArr.length; i++)
                SendPackets += Node.SendBlockArr[i]
            for(var i = 0; i < Node.LoadBlockArr.length; i++)
                LoadPackets += Node.LoadBlockArr[i]
            Node.SendBlockCountAll = SendPackets
            Node.LoadBlockCountAll = LoadPackets
            var Nuts = Math.floor(LoadPackets / PeriodSec);
            var RestPackets = SendPackets - LoadPackets;
            var CountGet = 1 + Math.floor(Math.max(0, (Nuts - RestPackets / Period)));
            Node.CanGetBlocks = Math.min(FreeGet, CountGet)
            FreeGet -= Node.CanGetBlocks
            Node.SendBlockCount = 0
            Node.LoadBlockCount = 0
            ADD_TO_STAT("NODE_CAN_GET:" + NodeName(Node), Node.CanGetBlocks, 1)
        }
    }
    static
    GETBLOCK_F()
    {
        return "{\
                    BlockNum:uint,\
                    TreeHash:hash,\
                }";
    }
    RETGETBLOCK(Info, CurTime)
    {
        Info.Node.NextPing = MIN_PERIOD_PING
        var Block = Info.Context.Block;
        if(Block && !Block.TreeEq)
        {
            var Data = BufLib.GetObjectFromBuffer(Info.Data, Formats.BLOCK_TRANSFER, Formats.WRK_BLOCK_TRANSFER);
            Info.Data = undefined
            if(Data.BlockNum !== Block.BlockNum || CompareArr(Data.TreeHash, Block.TreeHash) !== 0)
            {
                this.SetBlockNOSendToNode(Block, Info.Node, "NO")
                return ;
            }
            if(Block.chain)
            {
                Block.chain.AddInfo("Load TR:" + Data.BlockNum + "/" + this.GetStrFromHashShort(Data.TreeHash) + " from:" + GetNodeStrPort(Info.Node))
                AddInfoBlock(Block, "LOAD TR OK")
            }
            var arrContent = Data.arrContent;
            var TreeHash = CalcTreeHashFromArrBody(arrContent);
            if(CompareArr(Block.TreeHash, TreeHash) !== 0)
            {
                ToLog("2. BAD CMP TreeHash block=" + Block.BlockNum + " from:" + NodeName(Info.Node) + "  TreeHash=" + GetHexFromArr(TreeHash) + "  BlockTreeHash=" + GetHexFromArr(Block.TreeHash))
                this.SetBlockNOSendToNode(Block, Info.Node, "BAD CMP TreeHash")
                return ;
            }
            if(arrContent.length > 0 && Data.BlockNum % PERIOD_ACCOUNT_HASH === 0)
            {
                var TR = arrContent[0];
                if(TR[0] === TYPE_TRANSACTION_ACC_HASH)
                {
                    if(!DApps.Accounts.TRCheckAccountHash(TR, Data.BlockNum))
                    {
                        ToLog("**** BAD ACCOUNT Hash in block=" + Block.BlockNum + " from:" + NodeName(Info.Node) + " ****")
                        ToLog("May be need to Rewrite transactions from: " + (Block.BlockNum - 2 * DELTA_BLOCK_ACCOUNT_HASH))
                        this.SetBlockNOSendToNode(Block, Info.Node, "BAD CMP ACC HASH")
                        if(CHECK_POINT.BlockNum > Data.BlockNum)
                        {
                        }
                        else
                        {
                        }
                        return ;
                    }
                }
            }
            Block.BodyFileNum = this.GetChainFileNum(Block.chain)
            Block.arrContent = arrContent
            var Ret = this.WriteBodyDB(Block);
            Block.TrCount = 0
            Block.arrContent.length = 0
            Block.arrContent = undefined
            if(!Ret)
            {
                this.SetBlockNOSendToNode(Block, Info.Node, "Error write")
                return ;
            }
            Block.TreeEq = true
            Block.Send = undefined
            ADD_TO_STAT("BLOCK_LOADED", 1)
            Info.Node.LoadBlockCount++
            if(GrayConnect())
                Info.Node.BlockProcessCount++
            if(this.LoadHistoryMode)
            {
                var Context = this.LoadHistoryContext;
                Context.PrevBlockNum = Context.BlockNum
                Context.StartTimeHistory = Date.now()
            }
        }
    }
    SendCanBlock(Node, Block)
    {
        Node.SendBlockCount++
        if(!Node.INFO.BlockNumDB)
            return ;
        if(Node.INFO.BlockNumDB >= Block.BlockNum)
        {
            this.SendF(Node, {"Method":"CANBLOCK", "Data":{BlockNum:Block.BlockNum}})
        }
    }
    static
    CANBLOCK_F()
    {
        return "{BlockNum:uint}";
    }
    CANBLOCK(Info, CurTime)
    {
        var Data = this.DataFromF(Info);
        this.SendF(Info.Node, {"Method":"RETCANBLOCK", "Data":{Result:1}})
    }
    static
    RETCANBLOCK_F()
    {
        return "{Result:byte}";
    }
    RETCANBLOCK(Info, CurTime)
    {
        var Data = this.DataFromF(Info);
        if(Data.Result === 1)
        {
            Info.Node.LoadBlockCount++
        }
    }
    SetBlockNOSendToNode(Block, Node, Str)
    {
        var Str = GetHexFromArr(Block.TreeHash);
        var Str2 = this.GetStrFromHashShort(Block.TreeHash);
        var keysend = "" + Node.addrStr + ":" + Str;
        Block.MapSend[keysend] = 1
        if(Block.chain)
            Block.chain.AddInfo("" + Block.BlockNum + " " + Str2 + "<-" + GetNodeStrPort(Node))
    }
    FindBlockInLoadedChain(BlockNum, TreeHash)
    {
        var StrTreeHash = GetHexFromArr(TreeHash);
        var MapBlockLoaded = this.GetMapLoaded(BlockNum);
        var BlockFind = MapBlockLoaded["TH:" + StrTreeHash];
        if(BlockFind && BlockFind.TreeEq)
            return BlockFind;
        else
            return undefined;
    }
    CheckSeqHashDB(Block, StrError)
    {
        if(Block.BlockNum < BLOCK_PROCESSING_LENGTH2)
            return true;
        var startPrev = Block.BlockNum - BLOCK_PROCESSING_LENGTH2;
        var arr = [];
        for(var i = 0; i < BLOCK_PROCESSING_LENGTH; i++)
        {
            var num = startPrev + i;
            var PrevBlock = this.ReadBlockHeaderDB(num);
            if(!PrevBlock || !PrevBlock.bSave)
            {
                ToError(StrError + " ERROR CALC BLOCK: " + Block.BlockNum + " - prev block not found: " + num)
                return false;
            }
            arr.push(PrevBlock.Hash)
        }
        var PrevHash = CalcHashFromArray(arr, true);
        var testSeqHash = this.GetSeqHash(Block.BlockNum, PrevHash, Block.TreeHash);
        var TestValue = GetHashFromSeqAddr(testSeqHash, Block.AddrHash, Block.BlockNum, PrevHash);
        if(CompareArr(TestValue.Hash, Block.Hash) !== 0)
        {
            var Str = StrError + " #2 ERROR HASH - block num: " + Block.BlockNum;
            ToError(Str)
            return false;
        }
        return true;
    }
    ToLogBlock(Block, StrInfo, arr)
    {
        ToLog("-------------" + StrInfo)
        ToLog("BlockNum=" + (Block.BlockNum))
        ToLog("Hash=" + GetHexFromArr(Block.Hash))
        ToLog("SeqHash=" + GetHexFromArr(Block.SeqHash))
        ToLog("PrevHash=" + GetHexFromArr(Block.PrevHash))
        ToLog("TreeHash=" + GetHexFromArr(Block.TreeHash))
        ToLog("AddrHash=" + GetHexFromArr(Block.AddrHash))
        ToLog("SumHash=" + GetHexFromArr(Block.SumHash))
        ToLog("SumPow=" + Block.SumPow)
        for(var i = 0; i < arr.length; i++)
        {
            ToLog("arr[" + i + "]=" + GetHexFromArr(arr[i]))
        }
    }
    GetBlock(num, bToMem, bReadBody)
    {
        bToMem = bToMem | true
        if(num < this.CurrentBlockNum - BLOCK_COUNT_IN_MEMORY)
            bToMem = false
        var Block = this.BlockChain[num];
        if(!Block)
        {
            if(bReadBody)
                Block = this.ReadBlockDB(num)
            else
                Block = this.ReadBlockHeaderDB(num)
            if(bToMem)
            {
                this.BlockChain[num] = Block
            }
        }
        return Block;
    }
    GetMapLoaded(num)
    {
        if(num < 0)
            num = 0
        var index = Math.floor(num / BLOCK_COUNT_IN_MEMORY);
        var map = this.MapMapLoaded[index];
        if(!map)
        {
            map = {}
            this.MapMapLoaded[index] = map
        }
        return map;
    }
    GetMapLoadedFromChain(chain)
    {
        return this.GetMapLoaded(chain.BlockNumStart);
    }
    FREE_MEM_BLOCKS(NumMax)
    {
        for(var key in this.BlockChain)
        {
            var Block = this.BlockChain[key];
            if(!Block || Block.BlockNum < NumMax)
            {
                delete this.BlockChain[key]
            }
        }
    }
    FREE_MEM_CHAINS(NumMax)
    {
        this.FREE_MEM_BLOCKS(NumMax - BLOCK_COUNT_IN_MEMORY)
        var maxArrMap = Math.floor(NumMax / BLOCK_COUNT_IN_MEMORY) - 1;
        if(maxArrMap >= 0)
        {
            var nWasCount = 0;
            for(var key in this.MapMapLoaded)
                if(key < maxArrMap)
                {
                    nWasCount++
                    delete this.MapMapLoaded[key]
                }
        }
    }
    FREE_ALL_MEM_CHAINS()
    {
        this.FREE_MEM_BLOCKS(this.BlockNumDB - BLOCK_COUNT_IN_MEMORY)
        for(var i = 0; i < this.LoadedChainList.length; i++)
        {
            var chain = this.LoadedChainList[i];
            if(chain)
            {
                chain.Deleted = true
                chain.ChainMax = undefined
            }
        }
        if(!this.LoadHistoryMode)
        {
            this.AddValueToHistory("LoadedChainList", this.LoadedChainList)
            this.AddValueToHistory("MapMapLoaded", this.MapMapLoaded)
        }
        this.LoadedChainList = []
        this.MapMapLoaded = {}
        if(typeof gc === "function")
            gc()
    }
    AddValueToHistory(typedata, val)
    {
        var Arr = this.HistoryBlockBuf.LoadValue(typedata, 1);
        if(!Arr)
        {
            Arr = []
            this.HistoryBlockBuf.SaveValue(typedata, Arr)
        }
        Arr.push(val)
    }
    GetHistoryTree(typedata)
    {
        var Tree = this.HistoryBlockBuf.LoadValue(typedata, 1);
        if(!Tree)
        {
            Tree = new RBTree(CompareItemHash)
            this.HistoryBlockBuf.SaveValue(typedata, Tree)
        }
        return Tree;
    }
    ChainBindMethods(chain)
    {
        
function GetRootChain()
        {
            var Count = 0;
            var root_chain = this;
            while(root_chain.RootChain)
            {
                Count++
                root_chain = root_chain.RootChain
                if(Count > MAX_COUNT_CHAIN_LOAD)
                {
                    TO_ERROR_LOG("BLOCK", 10, "Error COUNT GetRootChain")
                    SERVER.FREE_ALL_MEM_CHAINS()
                    return undefined;
                }
            }
            return root_chain;
        };
        
function GetFindDB()
        {
            var Root = this.GetRootChain();
            if(Root)
                return Root.FindBlockDB;
            else
                return false;
        };
        chain.GetRootChain = GetRootChain.bind(chain)
        chain.GetFindDB = GetFindDB.bind(chain)
        chain.AddInfo = AddInfoChain.bind(chain)
    }
    GetMemoryStamp(Str)
    {
        return Str + ":##:" + Math.floor(this.CurrentBlockNum / BLOCK_COUNT_IN_MEMORY);
    }
    GetStrFromHashShort(Hash)
    {
        var Str = GetHexFromArr(Hash);
        if(typeof Str === "string")
            return Str.substr(0, 6);
        else
            return "";
    }
    ToLogTime(startTime, Str)
    {
        const Time = process.hrtime(startTime);
        var deltaTime = (Time[0] * 1000 + Time[1] / 1e6);
        ToLog(Str + " : " + deltaTime + "ms")
    }
    AddBlockToLoadBody(Block)
    {
        if(!this.MapBlockBodyLoad[Block.BlockNum])
        {
            this.MapBlockBodyLoad[Block.BlockNum] = Block
        }
    }
    LoopBlockBodyLoad()
    {
        var arr = [];
        for(var key in this.MapBlockBodyLoad)
        {
            var Block = this.MapBlockBodyLoad[key];
            if(!Block.BodyLoad)
            {
                Block.BodyLoad = 1
                arr.push(Block)
            }
        }
        this.MapBlockBodyLoad = {}
        if(!arr.length)
            return ;
        var chain = {StopSend:1, WriteToDBAfterLoad:1, BodyLoad:1};
        this.ChainBindMethods(chain)
        this.SetChainNum(chain)
        this.PrepareTransactionsForLoad(chain, arr, 1)
    }
};
