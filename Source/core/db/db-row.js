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
module.exports = class CDBState extends require("./db")
{
    constructor(FileName, DataSize, Format)
    {
        super()
        this.FileName = FileName
        this.DataSize = DataSize
        this.Format = Format
        this.WorkStruct = {}
        var FI = this.OpenDBFile(this.FileName);
        this.FileNameFull = FI.fname
        this.LastHash = undefined
        this.WasUpdate = 1
        this.BufMap = {}
        this.BufMapCount = 0
        setInterval(this.CheckBufMap.bind(this), 1000)
    }
    GetMaxNum()
    {
        var FI = this.OpenDBFile(this.FileName);
        var Num = Math.floor(FI.size / this.DataSize) - 1;
        return Num;
    }
    CheckNewNum(Data)
    {
        if(Data.Num === undefined)
            Data.Num = this.GetMaxNum() + 1
    }
    Write(Data, RetBuf)
    {
        this.LastHash = undefined
        this.WasUpdate = 1
        this.CheckNewNum(Data)
        this.DeleteMap(Data.Num)
        var BufWrite = BufLib.GetBufferFromObject(Data, this.Format, this.DataSize, this.WorkStruct, 1);
        var Position = Data.Num * this.DataSize;
        var FI = this.OpenDBFile(this.FileName, 1);
        var written = fs.writeSync(FI.fd, BufWrite, 0, BufWrite.length, Position);
        if(written !== BufWrite.length)
        {
            TO_ERROR_LOG("DB-STATE", 10, "Error write to file:" + written + " <> " + BufWrite.length)
            return false;
        }
        if(RetBuf)
        {
            RetBuf.Buf = BufWrite
        }
        if(Position >= FI.size)
        {
            FI.size = Position + this.DataSize
        }
        return true;
    }
    Read(Num, GetBufOnly)
    {
        var Data;
        if(isNaN(Num) || Num < 0 || Num > this.GetMaxNum())
        {
            return undefined;
        }
        var BufRead = this.GetMap(Num);
        if(!BufRead)
        {
            BufRead = BufLib.GetNewBuffer(this.DataSize)
            var Position = Num * this.DataSize;
            var FI = this.OpenDBFile(this.FileName);
            var bytesRead = fs.readSync(FI.fd, BufRead, 0, BufRead.length, Position);
            if(bytesRead !== BufRead.length)
                return undefined;
            this.SetMap(Num, BufRead)
        }
        if(GetBufOnly)
        {
            return BufRead;
        }
        try
        {
            Data = BufLib.GetObjectFromBuffer(BufRead, this.Format, this.WorkStruct)
        }
        catch(e)
        {
            ToLog("DBROW:" + e)
            return undefined;
        }
        Data.Num = Num
        return Data;
    }
    GetRows(start, count)
    {
        var arr = [];
        for(var num = start; num < start + count; num++)
        {
            var Data = this.Read(num);
            if(!Data)
                break;
            arr.push(Data)
        }
        return arr;
    }
    Truncate(LastNum)
    {
        var Position = (LastNum + 1) * this.DataSize;
        if(Position < 0)
            Position = 0
        var FI = this.OpenDBFile(this.FileName, 1);
        if(Position < FI.size)
        {
            this.LastHash = undefined
            this.WasUpdate = 1
            if(LastNum < 0)
                ToLog("Truncate " + this.FileName + " from 0")
            FI.size = Position
            fs.ftruncateSync(FI.fd, FI.size)
            this.BufMap = {}
            this.BufMapCount = 0
        }
    }
    DeleteHistory(BlockNumFrom)
    {
        var MaxNum = this.GetMaxNum();
        if(MaxNum ===  - 1)
            return ;
        for(var num = MaxNum; num >= 0; num--)
        {
            var ItemCheck = this.Read(num);
            if(!ItemCheck)
                break;
            if(ItemCheck.BlockNum < BlockNumFrom)
            {
                if(num < MaxNum)
                {
                    this.Truncate(num)
                }
                return ;
            }
        }
        this.Truncate( - 1)
    }
    FastFindBlockNum(BlockNum)
    {
        var MaxNum = this.GetMaxNum();
        if(MaxNum ===  - 1)
            return ;
        var StartNum = 0;
        var EndNum = MaxNum;
        var CurNum = Math.trunc(MaxNum / 2);
        while(true)
        {
            var Item = this.Read(CurNum);
            if(Item)
            {
                if(Item.BlockNum > BlockNum)
                {
                    EndNum = CurNum - 1
                    var Delta = CurNum - StartNum;
                    if(Delta === 0)
                        return ;
                    Delta = Math.trunc((1 + Delta) / 2)
                    CurNum = CurNum - Delta
                }
                else
                    if(Item.BlockNum < BlockNum)
                    {
                        StartNum = CurNum + 1
                        var Delta = EndNum - CurNum;
                        if(Delta === 0)
                            return ;
                        Delta = Math.trunc((1 + Delta) / 2)
                        CurNum = CurNum + Delta
                    }
                    else
                        if(Item.BlockNum === BlockNum)
                            break;
            }
            else
            {
                throw "Error read num";
                return ;
            }
        }
        var num = CurNum;
        while(true)
        {
            num--
            if(num < 0)
                return CurNum;
            var Item = this.Read(num);
            if(Item)
            {
                if(Item.BlockNum === BlockNum)
                    CurNum = num
                else
                    return CurNum;
            }
            else
            {
                throw "Error read num";
                return ;
            }
        }
    }
    SetMap(Num, Value)
    {
        this.BufMap[Num] = Value
        this.BufMapCount++
    }
    GetMap(Num)
    {
        return this.BufMap[Num];
    }
    DeleteMap(Num)
    {
        if(this.BufMap[Num])
        {
            delete this.BufMap[Num]
            this.BufMapCount--
        }
    }
    CheckBufMap()
    {
        if(this.BufMapCount > 1000)
        {
            this.BufMap = {}
            this.BufMapCount = 0
        }
    }
};
