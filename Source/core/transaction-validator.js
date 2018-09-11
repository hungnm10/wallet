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
require("../dapp/dapp");
require("../dapp/accounts");
require("../dapp/smart");
require("../dapp/messager");
require("../dapp/names");
require("./wallet");
const RBTree = require('bintrees').RBTree;
module.exports = class CSmartContract extends require("./block-exchange")
{
    constructor(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
    {
        super(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
        this.BufHashTree = new RBTree(CompareArr)
        this.BufHashTree.LastAddNum = 0
    }
    AddBlockToHashTree(Block)
    {
        this.BufHashTree.LastAddNum = Block.BlockNum
        var arr = Block.arrContent;
        if(arr)
        {
            for(var i = 0; i < arr.length; i++)
            {
                var HASH = shaarr(arr[i]);
                this.BufHashTree.insert(HASH)
            }
        }
    }
    DeleteBlockFromHashTree(Block)
    {
        var arr = Block.arrContent;
        if(arr)
        {
            for(var i = 0; i < arr.length; i++)
            {
                var HASH = shaarr(arr[i]);
                this.BufHashTree.remove(HASH)
            }
        }
    }
    OnWriteBlock(Block)
    {
        if(Block.BlockNum < 1)
            return ;
        var COUNT_MEM_BLOCKS = 0;
        var NUM1 = 1240000;
        var NUM2 = 1400000;
        if(global.LOCAL_RUN)
        {
            NUM1 = 15
            NUM2 = 100
        }
        if(Block.BlockNum > NUM1)
        {
            COUNT_MEM_BLOCKS = 1
            if(Block.BlockNum > NUM2)
                COUNT_MEM_BLOCKS = 60
            if(this.BufHashTree.LastAddNum !== Block.BlockNum - 1)
            {
                this.BufHashTree.clear()
                for(var num = COUNT_MEM_BLOCKS; num >= 1; num--)
                {
                    var Block2 = this.ReadBlockDB(Block.BlockNum - num);
                    if(Block2)
                    {
                        this.AddBlockToHashTree(Block2)
                    }
                }
            }
        }
        for(var key in DApps)
        {
            DApps[key].OnWriteBlockStart(Block)
        }
        var BlockNum = Block.BlockNum;
        var arr = Block.arrContent;
        if(arr)
            for(var i = 0; i < arr.length; i++)
            {
                var HASH = shaarr(arr[i]);
                if(this.BufHashTree.find(HASH))
                {
                    continue;
                }
                var App = DAppByType[arr[i][0]];
                if(App)
                {
                    var Result = App.OnWriteTransaction(arr[i], BlockNum, i);
                }
            }
        if(COUNT_MEM_BLOCKS)
        {
            var Block2 = this.ReadBlockDB(Block.BlockNum - COUNT_MEM_BLOCKS);
            if(Block2)
                this.DeleteBlockFromHashTree(Block2)
            this.AddBlockToHashTree(Block)
        }
        for(var key in DApps)
        {
            DApps[key].OnWriteBlockFinish(Block)
        }
    }
    OnDelete(Block)
    {
        this.BufHashTree.LastAddNum = 0
        for(var key in DApps)
        {
            DApps[key].OnDeleteBlock(Block)
        }
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
    IsValidTransaction(Tr, BlockNum)
    {
        if(!Tr.body || Tr.body.length < MIN_TRANSACTION_SIZE || Tr.body.length > MAX_TRANSACTION_SIZE)
            return  - 1;
        this.CheckCreateTransactionHASH(Tr)
        if(Tr.power - Math.log2(Tr.body.length / 128) < MIN_POWER_POW_TR)
            return  - 2;
        if(Tr.num > BlockNum)
            return  - 3;
        if(Tr.body[0] === TYPE_TRANSACTION_ACC_HASH)
            return  - 4;
        return 1;
    }
    ReWriteDAppTransactions(Length)
    {
        if(!Length)
            return 0;
        var StartNum = this.BlockNumDB - Length + 1;
        if(StartNum < 0)
            StartNum = 0
        var EndNum = this.BlockNumDB;
        var MinBlock = DApps.Accounts.GetMinBlockAct();
        if(MinBlock > StartNum)
        {
            ToLog("Cant rewrite transactions. Very long length of the rewriting chain. Max length=" + (this.BlockNumDB - MinBlock))
            return 0;
        }
        var startTime = process.hrtime();
        ToLog("Rewrite from: " + StartNum + " to " + EndNum)
        for(var Num = StartNum; Num <= EndNum; Num++)
        {
            if(Num > BLOCK_PROCESSING_LENGTH2)
            {
                var Block = this.ReadBlockDB(Num);
                if(Block)
                    this.OnWriteBlock(Block)
            }
        }
        var Time = process.hrtime(startTime);
        var deltaTime = (Time[0] * 1000 + Time[1] / 1e6) / 1000;
        ToLog("Rewriting complete: " + deltaTime + " sec")
        return 1;
    }
    AddDAppTransactions(BlockNum, Arr)
    {
        if(BlockNum % PERIOD_ACCOUNT_HASH !== 0)
            return ;
        var BlockNumHash = BlockNum - DELTA_BLOCK_ACCOUNT_HASH;
        if(BlockNumHash < 0)
            return ;
        var Hash = DApps.Accounts.GetHashOrUndefined(BlockNumHash);
        if(Hash)
        {
            var Body = [TYPE_TRANSACTION_ACC_HASH];
            WriteUintToArr(Body, BlockNumHash)
            WriteArrToArr(Body, Hash, 32)
            var Tr = {body:Body};
            this.CheckCreateTransactionHASH(Tr)
            Arr.unshift(Tr)
        }
        else
        {
        }
    }
};
