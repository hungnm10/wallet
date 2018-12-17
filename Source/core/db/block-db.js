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
const fs = require('fs');
const DBLib = require("./db");
global.BlockDB = new DBLib();
global.BLOCK_HEADER_SIZE = 150;
const FILE_NAME_HEADER = "block-header";
const FILE_NAME_BODY = "block-body";
module.exports = class CDB extends require("../code")
{
    constructor(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
    {
        super(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
        this.BlockNumDB = 0
        this.ClearBufMap()
    }
    LoadMemBlocksOnStart()
    {
        this.CurrentBlockNum = GetCurrentBlockNumByTime()
        for(var i = this.BlockNumDB - BLOCK_COUNT_IN_MEMORY; i <= this.BlockNumDB; i++)
            if(i >= 0)
            {
                if(i >= this.BlockNumDB - BLOCK_PROCESSING_LENGTH * 5)
                    this.GetBlock(i, true, true)
                else
                    this.GetBlock(i, true, false)
            }
    }
    GetMaxNumBlockDB()
    {
        var FI = BlockDB.OpenDBFile(FILE_NAME_HEADER);
        var BlockNum = (FI.size / BLOCK_HEADER_SIZE) - 1;
        return BlockNum;
    }
    FindStartBlockNum()
    {
        var BlockNum = this.GetMaxNumBlockDB();
        if(global.NO_CHECK_BLOCKNUM_ONSTART)
        {
            this.BlockNumDB = this.CheckBlocksOnStartFoward(BlockNum - 2, 0)
            ToLog("START_BLOCK_NUM:" + this.BlockNumDB)
            return ;
        }
        BlockNum = this.CheckBlocksOnStartReverse(BlockNum)
        this.BlockNumDB = this.CheckBlocksOnStartFoward(BlockNum - 2000, 0)
        this.BlockNumDB = this.CheckBlocksOnStartFoward(this.BlockNumDB - 100, 1)
        var startTime = process.hrtime();
        if(this.BlockNumDB >= BLOCK_PROCESSING_LENGTH2)
        {
            this.TruncateBlockDB(this.BlockNumDB)
        }
        var Time = process.hrtime(startTime);
        var deltaTime = (Time[0] * 1000 + Time[1] / 1e6) / 1000;
        ToLog("********************TIME BUFFER: " + deltaTime + " s")
        if(this.BlockNumDB > 100)
            this.ReWriteDAppTransactions(100)
        ToLog("START_BLOCK_NUM:" + this.BlockNumDB)
    }
    CheckBlocksOnStartReverse(StartNum)
    {
        var delta = 1;
        var Count = 0;
        var PrevBlock;
        for(var num = StartNum; num >= BLOCK_PROCESSING_LENGTH; num -= delta)
        {
            var Block = this.ReadBlockHeaderDB(num);
            if(!Block || IsZeroArr(Block.SumHash))
            {
                delta++
                Count = 0
                continue;
            }
            var PrevBlock = this.ReadBlockHeaderDB(num - 1);
            if(!PrevBlock || IsZeroArr(PrevBlock.SumHash))
            {
                Count = 0
                continue;
            }
            delta = 1
            var SumHash = shaarr2(PrevBlock.SumHash, Block.Hash);
            if(CompareArr(SumHash, Block.SumHash) === 0)
            {
                Count++
                if(Count > COUNT_BLOCKS_FOR_LOAD / 10)
                    return num;
            }
            else
            {
                Count = 0
            }
        }
        return 0;
    }
    CheckBlocksOnStartFoward(StartNum, bCheckBody)
    {
        var PrevBlock;
        if(StartNum < BLOCK_PROCESSING_LENGTH2)
            StartNum = BLOCK_PROCESSING_LENGTH2
        var MaxNum = DApps.Accounts.GetHashedMaxBlockNum();
        var BlockNumTime = GetCurrentBlockNumByTime();
        if(BlockNumTime < MaxNum)
            MaxNum = BlockNumTime
        var arr = [];
        for(var num = StartNum; num <= MaxNum; num++)
        {
            var Block;
            if(bCheckBody)
                Block = this.ReadBlockDB(num)
            else
                Block = this.ReadBlockHeaderDB(num)
            if(!Block)
                return num > 0 ? num - 1 : 0;
            if(num % 100000 === 0)
                ToLog("CheckBlocksOnStartFoward: " + num)
            if(bCheckBody)
            {
                var TreeHash = CalcTreeHashFromArrBody(Block.arrContent);
                if(CompareArr(Block.TreeHash, TreeHash) !== 0)
                {
                    ToLog("BAD TreeHash block=" + Block.BlockNum)
                    return num > 0 ? num - 1 : 0;
                }
            }
            if(PrevBlock)
            {
                if(arr.length !== BLOCK_PROCESSING_LENGTH)
                {
                    var start = num - BLOCK_PROCESSING_LENGTH2;
                    for(var n = 0; n < BLOCK_PROCESSING_LENGTH; n++)
                    {
                        var Prev = this.ReadBlockHeaderDB(start + n);
                        arr.push(Prev.Hash)
                    }
                }
                else
                {
                    arr.shift()
                    var Prev = this.ReadBlockHeaderDB(num - BLOCK_PROCESSING_LENGTH - 1);
                    arr.push(Prev.Hash)
                }
                var PrevHash = CalcHashFromArray(arr, true);
                var SeqHash = this.GetSeqHash(Block.BlockNum, PrevHash, Block.TreeHash);
                var Value = GetHashFromSeqAddr(SeqHash, Block.AddrHash, Block.BlockNum, PrevHash);
                if(CompareArr(Value.Hash, Block.Hash) !== 0)
                {
                    ToLog("=================== FIND ERR Hash in " + Block.BlockNum + "  bCheckBody=" + bCheckBody)
                    return num > 0 ? num - 1 : 0;
                }
                var SumHash = shaarr2(PrevBlock.SumHash, Block.Hash);
                if(CompareArr(SumHash, Block.SumHash) !== 0)
                {
                    ToLog("=================== FIND ERR SumHash in " + Block.BlockNum)
                    return num > 0 ? num - 1 : 0;
                }
            }
            PrevBlock = Block
        }
        return num > 0 ? num - 1 : 0;
    }
    GetChainFileNum(chain)
    {
        return 0;
    }
    WriteBlockDB(Block)
    {
        var startTime = process.hrtime();
        if(Block.TrCount === 0 && !IsZeroArr(Block.TreeHash))
        {
            ToLogTrace("ERROR WRITE TrCount BLOCK:" + Block.BlockNum)
            throw "ERROR WRITE";
        }
        var Ret = this.WriteBodyDB(Block);
        if(Ret)
        {
            Ret = this.WriteBlockDBFinaly(Block)
        }
        ADD_TO_STAT_TIME("MAX:WriteBlockDB", startTime)
        ADD_TO_STAT_TIME("WriteBlockDB", startTime)
        return Ret;
    }
    WriteBlockDBFinaly(Block)
    {
        var Ret = this.WriteBlockHeaderDB(Block);
        if(Ret)
        {
            if(Block.TrDataLen === 0 && !IsZeroArr(Block.TreeHash))
            {
                ToLogTrace("ERROR WRITE FINAL TrDataLen BLOCK")
                throw "ERROR WRITE";
            }
            this.OnWriteBlock(Block)
            this.BlockNumDB = Block.BlockNum
            Block.bSave = true
        }
        return Ret;
    }
    SaveDataTreeToDB(Block)
    {
        var Ret = this.WriteBodyDB(Block);
        if(Ret)
        {
            var BufWrite = BufLib.GetNewBuffer(BLOCK_HEADER_SIZE);
            this.BlockHeaderToBuf(BufWrite, Block)
            Ret = this.WriteBufHeaderDB(BufWrite, Block.BlockNum)
        }
        return Ret;
    }
    WriteBodyDB(Block)
    {
        var FileItem = BlockDB.OpenDBFile(FILE_NAME_BODY, 1);
        var FD = FileItem.fd;
        var Position = FileItem.size;
        Block.TrDataPos = Position
        var arrTr = Block.arrContent;
        if(!arrTr || arrTr.length === 0)
        {
            Block.TrCount = 0
            Block.TrDataLen = 0
            return true;
        }
        var TrDataLen = 4;
        var arrSize = [];
        for(var i = 0; i < arrTr.length; i++)
        {
            var body = arrTr[i];
            arrSize[i] = 2 + body.length
            TrDataLen += arrSize[i]
        }
        var BufWrite = BufLib.GetNewBuffer(TrDataLen);
        BufWrite.Write(arrTr.length, "uint16")
        BufWrite.Write(0, "uint16")
        for(var i = 0; i < arrTr.length; i++)
        {
            var body = arrTr[i];
            BufWrite.Write(body, "tr")
        }
        var written = fs.writeSync(FD, BufWrite, 0, BufWrite.length, Position);
        if(written !== BufWrite.length)
        {
            TO_ERROR_LOG("DB", 240, "Error write to file block-chain : " + written + " <> " + BufWrite.length)
            return false;
        }
        FileItem.size += TrDataLen
        Block.TrCount = arrTr.length
        Block.TrDataLen = TrDataLen
        return true;
    }
    WriteBlockHeaderDB(Block)
    {
        if(Block.BlockNum > 0)
        {
            this.TruncateBlockDBInner(Block)
            this.BlockNumDB = Block.BlockNum - 1
            var PrevBlock = this.ReadBlockHeaderDB(Block.BlockNum - 1);
            if(!PrevBlock)
            {
                ToLogTrace("Cant write header block:" + Block.BlockNum + "  prev block not found")
                throw "ERR: PREV BLOCK NOT FOUND";
                return false;
            }
            Block.SumHash = shaarr2(PrevBlock.SumHash, Block.Hash)
            Block.SumPow = PrevBlock.SumPow + GetPowPower(Block.PowHash)
            if(USE_CHECK_SAVE_DB)
                if(!this.CheckSeqHashDB(Block, "WriteBlockHeaderDB"))
                    return false;
        }
        var BufWrite = BufLib.GetNewBuffer(BLOCK_HEADER_SIZE);
        this.BlockHeaderToBuf(BufWrite, Block)
        var Res = this.WriteBufHeaderDB(BufWrite, Block.BlockNum);
        return Res;
    }
    WriteBufHeaderDB(BufWrite, BlockNum)
    {
        BlockNum = Math.trunc(BlockNum)
        this.ClearBufMap()
        var Position = BlockNum * BLOCK_HEADER_SIZE;
        var FI = BlockDB.OpenDBFile(FILE_NAME_HEADER, 1);
        var written = fs.writeSync(FI.fd, BufWrite, 0, BufWrite.length, Position);
        if(Position >= FI.size)
        {
            FI.size = Position + BufWrite.length
        }
        if(written !== BufWrite.length)
        {
            TO_ERROR_LOG("DB", 260, "Error write to file block-header :" + written + " <> " + Info.key_width)
            return false;
        }
        else
        {
            return true;
        }
    }
    ReadBlockDB(Num)
    {
        if(!Num)
            Num = 0
        Num = Math.trunc(Num)
        var Block = this.ReadBlockHeaderDB(Num);
        if(Block && Block.TrDataLen)
        {
            var Ret = this.ReadBlockBodyDB(Block);
            if(!Ret)
                return undefined;
        }
        else
        {
            if(Block && !IsZeroArr(Block.TreeHash))
            {
                ToLogTrace("ERROR arrContent on BlockNum=" + Num)
                return undefined;
            }
        }
        return Block;
    }
    ReadBlockBodyDB(Block)
    {
        var FileItem = BlockDB.OpenDBFile(FILE_NAME_BODY);
        var FD = FileItem.fd;
        if(Block.TrDataLen > MAX_BLOCK_SIZE * 2)
        {
            ToLogTrace("Error value TrDataLen, BlockNum=" + Block.BlockNum)
            return false;
        }
        var Position = Block.TrDataPos;
        var BufRead = BufLib.GetNewBuffer(Block.TrDataLen);
        var bytesRead = fs.readSync(FD, BufRead, 0, BufRead.length, Position);
        if(bytesRead !== BufRead.length)
        {
            TO_ERROR_LOG("DB", 272, "Error read block-body file: " + FileItem.name + "  from POS:" + Position + "  bytesRead=" + bytesRead + " of " + BufRead.length + "  BlockNum=" + Block.BlockNum)
            return false;
        }
        Block.arrContent = []
        var TrCount = BufRead.Read("uint16");
        var TrCountDapp = BufRead.Read("uint16");
        if(TrCount <= MAX_TRANSACTION_COUNT)
        {
            for(var i = 0; i < TrCount; i++)
            {
                var body = BufRead.Read("tr");
                if(!body)
                    break;
                Block.arrContent[i] = body
            }
        }
        Block.TrCount = Block.arrContent.length
        return true;
    }
    ReadBlockHeaderDB(Num)
    {
        if(Num < 0)
        {
            return undefined;
        }
        Num = Math.trunc(Num)
        var BufRead = BufLib.GetNewBuffer(BLOCK_HEADER_SIZE);
        var Position = Num * BLOCK_HEADER_SIZE;
        var FD = BlockDB.OpenDBFile(FILE_NAME_HEADER).fd;
        var bytesRead = fs.readSync(FD, BufRead, 0, BufRead.length, Position);
        if(bytesRead !== BufRead.length)
            return undefined;
        var Block = this.BufToBlockHeader(BufRead, Num);
        if(Block)
        {
            Block.bSave = true
            Block.Prepared = true
        }
        return Block;
    }
    ReadBlockHeaderFromMapDB(Num)
    {
        var Block = this.MapHeader[Num];
        if(!Block)
        {
            Block = this.ReadBlockHeaderDB(Num)
            this.MapHeader[Num] = Block
        }
        return Block;
    }
    SetTruncateBlockDB(Num)
    {
        Num = Math.trunc(Num)
        if(this.UseTruncateBlockDB)
        {
            if(Num < this.UseTruncateBlockDB)
                this.UseTruncateBlockDB = Num
        }
        else
        {
            this.UseTruncateBlockDB = Num
        }
    }
    TruncateBlockDB(LastBlockNum)
    {
        this.UseTruncateBlockDB = undefined
        var Block = this.ReadBlockDB(LastBlockNum);
        if(!Block)
        {
            ToLog("************ ERROR TruncateBlockDB - not found block=" + LastBlockNum)
            return ;
        }
        this.WriteBlockDB(Block)
    }
    TruncateBlockDBInner(LastBlock)
    {
        var FItem1 = BlockDB.OpenDBFile(FILE_NAME_HEADER, 1);
        var size = (LastBlock.BlockNum + 1) * BLOCK_HEADER_SIZE;
        if(size < 0)
            size = 0
        if(FItem1.size > size)
        {
            FItem1.size = size
            fs.ftruncateSync(FItem1.fd, FItem1.size)
        }
        this.TruncateStat(LastBlock.BlockNum)
    }
    TruncateBlockBodyDBInner()
    {
        var FItem2 = BlockDB.OpenDBFile(FILE_NAME_BODY, 1);
        var size2 = 0;
        if(FItem2.size !== size2)
        {
            this.ClearBufMap()
            FItem2.size = size2
            fs.ftruncateSync(FItem2.fd, FItem2.size)
        }
    }
    TruncateFileBuf(Tree, size)
    {
        while(true)
        {
            var Item = Tree.max();
            if(Item === null)
                break;
            if(Item.Position >= size)
            {
                Tree.remove(Item)
            }
            else
            {
                break;
            }
        }
    }
    ClearDataBase()
    {
        var FItem1 = BlockDB.OpenDBFile(FILE_NAME_HEADER, 1);
        FItem1.size = 0
        fs.ftruncateSync(FItem1.fd, FItem1.size)
        var FItem2 = BlockDB.OpenDBFile(FILE_NAME_BODY, 1);
        FItem2.size = 0
        fs.ftruncateSync(FItem2.fd, FItem2.size)
        for(var key in DApps)
        {
            DApps[key].ClearDataBase()
        }
        this.BlockNumDB = 0
        this.ClearBufMap()
        this.ClearStat()
        this.CreateGenesisBlocks()
    }
    ClearBufMap()
    {
        this.MapHeader = {}
    }
    RewriteAllTransactions()
    {
        for(var key in DApps)
        {
            DApps[key].ClearDataBase()
        }
        for(var Num = 0; Num <= this.BlockNumDB; Num++)
        {
            if(Num > BLOCK_PROCESSING_LENGTH2)
            {
                if(Num % 100000 === 0)
                    ToLog("Write " + Num)
                var Block = this.ReadBlockDB(Num);
                if(Block)
                    this.OnWriteBlock(Block)
            }
        }
        return 1;
    }
    BlockHeaderToBuf(BufWrite, Block)
    {
        Block.BodyFileNum = 0
        var len = BufWrite.len;
        BufWrite.Write(Block.TreeHash, "hash")
        BufWrite.Write(Block.AddrHash, "hash")
        BufWrite.Write(Block.PrevHash, "hash")
        BufWrite.Write(Block.SumHash, "hash")
        BufWrite.Write(Block.SumPow, "uint")
        BufWrite.Write(Block.BodyFileNum, "uint")
        BufWrite.Write(Block.TrDataPos, "uint")
        BufWrite.Write(Block.TrDataLen, "uint32")
        BufWrite.len = len + BLOCK_HEADER_SIZE
    }
    BufToBlockHeader(BufRead, Num)
    {
        var Block = {};
        Block.AddInfo = AddInfoBlock.bind(Block)
        Block.Info = ""
        var len = BufRead.len;
        Block.TreeHash = BufRead.Read("hash")
        Block.AddrHash = BufRead.Read("hash")
        Block.PrevHash = BufRead.Read("hash")
        Block.SumHash = BufRead.Read("hash")
        Block.SumPow = BufRead.Read("uint")
        Block.BodyFileNum = BufRead.Read("uint")
        Block.TrDataPos = BufRead.Read("uint")
        Block.TrDataLen = BufRead.Read("uint32")
        Block.TrCount = 0
        BufRead.len = len + BLOCK_HEADER_SIZE
        Block.BlockNum = Num
        Block.SeqHash = this.GetSeqHash(Block.BlockNum, Block.PrevHash, Block.TreeHash)
        if(Block.BlockNum >= BLOCK_PROCESSING_LENGTH2)
        {
            CalcHashBlockFromSeqAddr(Block)
        }
        else
        {
            Block.Hash = this.GetHashGenesis(Block.BlockNum)
            Block.PowHash = Block.Hash
        }
        Block.Power = GetPowPower(Block.PowHash)
        if(IsZeroArr(Block.Hash))
            return undefined;
        return Block;
    }
    GetRows(start, count, Filter)
    {
        var MaxAccount = DApps.Accounts.GetMaxAccount();
        var WasError = 0;
        var arr = [];
        for(var num = start; true; num++)
        {
            var Block = this.ReadBlockHeaderDB(num);
            if(!Block)
                break;
            Block.Num = Block.BlockNum
            if(Block.AddrHash)
            {
                Block.Miner = ReadUintFromArr(Block.AddrHash, 0)
                if(Block.BlockNum < 16 || Block.Miner > MaxAccount)
                    Block.Miner = 0
                var Value = GetHashFromSeqAddr(Block.SeqHash, Block.AddrHash, Block.BlockNum, Block.PrevHash);
                Block.Hash1 = Value.Hash1
                Block.Hash2 = Value.Hash2
            }
            if(Filter)
            {
                var Num = Block.BlockNum;
                var Bytes = Block.TrDataLen;
                var Pow = Block.Power;
                var Miner = Block.Miner;
                var Date = DateFromBlock(Block.BlockNum);
                try
                {
                    if(!eval(Filter))
                        continue;
                }
                catch(e)
                {
                    if(!WasError)
                        ToLog(e)
                    WasError = 1
                }
            }
            arr.push(Block)
            count--
            if(count < 1)
                break;
        }
        return arr;
    }
    GetTrRows(BlockNum, start, count)
    {
        var arr = [];
        var Block = this.ReadBlockDB(BlockNum);
        if(Block && Block.arrContent)
            for(var num = start; num < start + count; num++)
            {
                if(num < 0)
                    continue;
                if(num >= Block.arrContent.length)
                    break;
                var Tr = {body:Block.arrContent[num]};
                this.CheckCreateTransactionHASH(Tr)
                Tr.Num = num
                Tr.Type = Tr.body[0]
                Tr.Length = Tr.body.length
                Tr.Body = []
                for(var j = 0; j < Tr.body.length; j++)
                    Tr.Body[j] = Tr.body[j]
                var App = DAppByType[Tr.Type];
                if(App)
                {
                    Tr.Script = App.GetScriptTransaction(Tr.body)
                    Tr.Verify = App.GetVerifyTransaction(BlockNum, Tr.Num, Tr.body)
                    if(Tr.Verify == 1)
                        Tr.VerifyHTML = "<B style='color:green'>✔</B>"
                    else
                        if(Tr.Verify ==  - 1)
                            Tr.VerifyHTML = "<B style='color:red'>✘</B>"
                        else
                            Tr.VerifyHTML = ""
                }
                else
                {
                    Tr.Script = ""
                    Tr.VerifyHTML = ""
                }
                arr.push(Tr)
            }
        return arr;
    }
    ClearStat()
    {
        var MAX_ARR_PERIOD = MAX_STAT_PERIOD * 2 + 10;
        this.StatMap = {StartPos:0, StartBlockNum:0, Length:0, "ArrPower":new Float64Array(MAX_ARR_PERIOD), "ArrPowerMy":new Float64Array(MAX_ARR_PERIOD),
        }
    }
    TruncateStat(LastBlockNum)
    {
        if(this.StatMap)
        {
            var LastNumStat = this.StatMap.StartBlockNum + this.StatMap.Length;
            var Delta = LastNumStat - LastBlockNum;
            if(Delta > 0)
            {
                this.StatMap.Length -= Delta
                if(this.StatMap.Length < 0)
                    this.StatMap.Length = 0
            }
            this.StatMap.CaclBlockNum = 0
        }
    }
    GetStatBlockchainPeriod(Param)
    {
        var StartNum = Param.BlockNum;
        if(!Param.Count || Param.Count < 0)
            Param.Count = 1000
        if(!Param.Miner)
            Param.Miner = 0
        if(!Param.Adviser)
            Param.Adviser = 0
        var Map = {};
        var ArrList = new Array(Param.Count);
        var i = 0;
        for(var num = StartNum; num < StartNum + Param.Count; num++)
        {
            var Power = 0, PowerMy = 0, Nonce = 0;
            if(num <= this.BlockNumDB)
            {
                var Block = this.ReadBlockHeaderDB(num);
                if(Block)
                {
                    Power = GetPowPower(Block.PowHash)
                    var Miner = ReadUintFromArr(Block.AddrHash, 0);
                    var Nonce = ReadUintFromArr(Block.AddrHash, 6);
                    if(Param.Miner < 0)
                    {
                        if(Param.Adviser)
                        {
                            var Adviser = DApps.Accounts.GetAdviserByMiner(Map, Miner);
                            if(Adviser === Param.Adviser)
                                PowerMy = Power
                        }
                        else
                        {
                            PowerMy = Power
                        }
                    }
                    else
                        if(Miner === Param.Miner && !Param.bMinerLess)
                        {
                            PowerMy = Power
                        }
                        else
                            if(Miner <= Param.Miner && Param.bMinerLess)
                            {
                                PowerMy = Power
                            }
                }
            }
            ArrList[i] = PowerMy
            if(Param.bNonce && PowerMy)
                ArrList[i] = Nonce
            i++
        }
        var AvgValue = 0;
        for(var j = 0; j < ArrList.length; j++)
        {
            if(ArrList[j])
                AvgValue += ArrList[j]
        }
        if(ArrList.length > 0)
            AvgValue = AvgValue / ArrList.length
        const MaxSizeArr = 1000;
        var StepTime = 1;
        while(ArrList.length >= MaxSizeArr)
        {
            if(Param.bNonce)
                ArrList = ResizeArrMax(ArrList)
            else
                ArrList = ResizeArrAvg(ArrList)
            StepTime = StepTime * 2
        }
        return {ArrList:ArrList, AvgValue:AvgValue, steptime:StepTime};
    }
    GetStatBlockchain(name, MinLength)
    {
        if(!MinLength)
            return [];
        var MAX_ARR_PERIOD = MAX_STAT_PERIOD * 2 + 10;
        if(!this.StatMap)
        {
            this.ClearStat()
        }
        var MaxNumBlockDB = this.GetMaxNumBlockDB();
        if(this.StatMap.CaclBlockNum !== MaxNumBlockDB || this.StatMap.CalcMinLength !== MinLength)
        {
            this.StatMap.CaclBlockNum = MaxNumBlockDB
            this.StatMap.CalcMinLength = MinLength
            var start = MaxNumBlockDB - MinLength + 1;
            var finish = MaxNumBlockDB + 1;
            var StartPos = this.StatMap.StartPos;
            var ArrPower = this.StatMap.ArrPower;
            var ArrPowerMy = this.StatMap.ArrPowerMy;
            var StartNumStat = this.StatMap.StartBlockNum;
            var FinishNumStat = this.StatMap.StartBlockNum + this.StatMap.Length - 1;
            var CountReadDB = 0;
            var arr = new Array(MinLength);
            var arrmy = new Array(MinLength);
            for(var num = start; num < finish; num++)
            {
                var i = num - start;
                var i2 = (StartPos + i) % MAX_ARR_PERIOD;
                if(num >= StartNumStat && num <= FinishNumStat && (num < finish - 10))
                {
                    arr[i] = ArrPower[i2]
                    arrmy[i] = ArrPowerMy[i2]
                }
                else
                {
                    CountReadDB++
                    var Power = 0, PowerMy = 0;
                    if(num <= MaxNumBlockDB)
                    {
                        var Block = this.ReadBlockHeaderDB(num);
                        if(Block)
                        {
                            Power = GetPowPower(Block.PowHash)
                            var Miner = ReadUintFromArr(Block.AddrHash, 0);
                            if(Miner === GENERATE_BLOCK_ACCOUNT)
                            {
                                PowerMy = Power
                            }
                        }
                    }
                    arr[i] = Power
                    arrmy[i] = PowerMy
                    ArrPower[i2] = arr[i]
                    ArrPowerMy[i2] = arrmy[i]
                    if(num > FinishNumStat)
                    {
                        this.StatMap.StartBlockNum = num - this.StatMap.Length
                        this.StatMap.Length++
                        if(this.StatMap.Length > MAX_ARR_PERIOD)
                        {
                            this.StatMap.Length = MAX_ARR_PERIOD
                            this.StatMap.StartBlockNum++
                            this.StatMap.StartPos++
                        }
                    }
                }
            }
            this.StatMap["POWER_BLOCKCHAIN"] = arr
            this.StatMap["POWER_MY_WIN"] = arrmy
        }
        var arr = this.StatMap[name];
        if(!arr)
            arr = []
        var arrT = this.StatMap["POWER_BLOCKCHAIN"];
        for(var i = 0; i < arrT.length; i++)
            if(!arrT[i])
            {
                this.StatMap = undefined
                break;
            }
        return arr;
    }
    GetHashGenesis(Num)
    {
        return [Num + 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Num + 1];
    }
    GetSeqHash(BlockNum, PrevHash, TreeHash)
    {
        var arr = [GetArrFromValue(BlockNum), PrevHash, TreeHash];
        var SeqHash = CalcHashFromArray(arr, true);
        return SeqHash;
    }
    CheckCreateTransactionHASH(Tr)
    {
        if(!Tr.hashPow)
        {
            Tr.num = ReadUintFromArr(Tr.body, Tr.body.length - 12)
            Tr.hashPow = shaarr(Tr.body)
            Tr.HASH = Tr.hashPow
            Tr.power = GetPowPower(Tr.hashPow)
            Tr.TimePow = Tr.num + Tr.power - Math.log2(Tr.body.length / 128)
        }
    }
    BlockChainToBuf(WriteNum, StartNum, EndBlockNum)
    {
        if(StartNum === undefined)
            return BufLib.GetNewBuffer(10);
        var GetLength = EndBlockNum - StartNum + 1;
        var PrevBlock;
        if(StartNum > 0)
            PrevBlock = this.ReadBlockHeaderDB(StartNum - 1)
        var arr = [];
        var arr0 = this.PrevBlockChainArr;
        if(arr0 && arr0.length === GetLength)
        {
            var StartNumArr =  - 1;
            var EndNumArr =  - 1;
            for(var i = 0; i < arr0.length; i++)
            {
                var BlockArr = arr0[i];
                if(BlockArr.BlockNum === StartNum)
                {
                    StartNumArr = i
                }
                if(BlockArr.BlockNum <= EndBlockNum)
                {
                    EndNumArr = i
                }
            }
            if(StartNumArr >= 0 && EndNumArr > StartNumArr)
            {
                var BlockArr = arr0[EndNumArr];
                var Block = this.ReadBlockHeaderDB(BlockArr.BlockNum);
                if(Block)
                    if(CompareArr(BlockArr.SumHash, Block.SumHash) == 0)
                    {
                        arr0.splice(EndNumArr + 1, arr.length)
                        if(StartNumArr > 0)
                            arr0.splice(StartNumArr - 1, StartNumArr)
                        arr = arr0
                        PrevBlock = Block
                        StartNum = Block.BlockNum + 1
                    }
            }
        }
        for(var num = StartNum; num <= EndBlockNum; num++)
        {
            var Block = this.ReadBlockHeaderDB(num);
            if(!Block || !Block.Prepared || !Block.Hash)
                break;
            if(PrevBlock)
            {
                if(!PrevBlock.SumHash)
                    break;
                var SumHash = shaarr2(PrevBlock.SumHash, Block.Hash);
                Block.SumHash = SumHash
            }
            arr.push(Block)
            PrevBlock = Block
        }
        this.PrevBlockChainArr = arr
        return this.ArrHeaderToBuf(WriteNum, arr);
    }
    ArrHeaderToBuf(StartNum, arr)
    {
        var CountSend = arr.length - BLOCK_PROCESSING_LENGTH2;
        var BufWrite;
        if(CountSend <= 0)
        {
            BufWrite = BufLib.GetNewBuffer(10)
        }
        else
        {
            var BufSize = 6 + 4 + BLOCK_PROCESSING_LENGTH2 * 32 + 32 + 6 + CountSend * 64;
            BufWrite = BufLib.GetNewBuffer(BufSize)
            BufWrite.Write(StartNum, "uint")
            BufWrite.Write(CountSend, "uint32")
            for(var i = 0; i < arr.length; i++)
            {
                var Block = arr[i];
                if(i < BLOCK_PROCESSING_LENGTH2)
                {
                    BufWrite.Write(Block.Hash, "hash")
                }
                else
                {
                    if(i === BLOCK_PROCESSING_LENGTH2)
                    {
                        BufWrite.Write(Block.SumHash, "hash")
                        BufWrite.Write(Block.SumPow, "uint")
                    }
                    BufWrite.Write(Block.TreeHash, "hash")
                    BufWrite.Write(Block.AddrHash, "hash")
                }
            }
        }
        return BufWrite;
    }
};

function AddInfo(Block,Str,BlockNumStart)
{
    if(!global.STAT_MODE)
        return ;
    if(!Block.Info)
        Block.Info = Str;
    else
        if(Block.Info.length < 2000)
        {
            var timesend = "" + SERVER.CurrentBlockNum - BlockNumStart;
            var now = GetCurrentTime();
            timesend += ".[" + now.getSeconds().toStringZ(2) + "." + now.getMilliseconds().toStringZ(3) + "]";
            Str = timesend + ": " + Str;
            Block.Info += "\n" + Str;
        }
};
global.AddInfoChain = function (Str)
{
    if(!global.STAT_MODE)
        return ;
    if(this.BlockNumStart > GetCurrentBlockNumByTime() - HISTORY_BLOCK_COUNT)
        AddInfo(this, Str, this.BlockNumStart);
};
global.AddInfoBlock = function (Block,Str)
{
    if(!global.STAT_MODE)
        return ;
    if(Block && Block.BlockNum && Block.BlockNum > GetCurrentBlockNumByTime() - HISTORY_BLOCK_COUNT)
        AddInfo(Block, Str, Block.BlockNum);
};
global.GetNodeStrPort = function (Node)
{
    if(!Node)
        return "";
    if(LOCAL_RUN)
        return "" + Node.port;
    else
    {
        if(!Node.ip)
            return "";
        var arr = Node.ip.split(".");
        return "" + arr[2] + "." + arr[3];
    }
};
