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
const DBRow = require("../core/db/db-row");
const TYPE_TRANSACTION_SMART_CREATE = 130;
global.FORMAT_SMART_CREATE = "{\
    Type:byte,\
    Reserve1:arr12,\
    Name:str40,\
    Code:str,\
    Account:uint,\
    Reserve2:arr40,\
    Sign:arr64\
    }";
class SmartApp extends require("./dapp")
{
    constructor()
    {
        super()
        this.FORMAT_ROW = "{\
            BlockNum:uint,\
            Reserve1:arr12,\
            Name:str40,\
            Code:str8098,\
            Reserve2:arr36,\
            }"
        this.ROW_SIZE = 6 + 12 + 40 + 8098 + 36
        this.DBSmart = new DBRow("smart", this.ROW_SIZE, this.FORMAT_ROW)
    }
    ClearDataBase()
    {
        this.DBSmart.Truncate( - 1)
    }
    OnDeleteBlock(Block)
    {
        if(Block.BlockNum < 1)
            return ;
        this.DBSmart.DeleteHistory(Block.BlockNum)
    }
    OnWriteBlockStart(Block)
    {
        if(Block.BlockNum < 1)
            return ;
        this.OnDeleteBlock(Block)
    }
    OnWriteBlockFinish(Block)
    {
    }
    OnWriteTransaction(Body, BlockNum, TrNum)
    {
        var Type = Body[0];
        var Result = this.TRCreateSmart(Body, BlockNum, TrNum);
        var item = WALLET.ObservTree.find({HASH:shaarr(Body)});
        if(item)
        {
            if(Result === true)
                Result = "Add to blockchain"
            item.result = Result
            ToLogClient(Result, GetHexFromArr(item.HASH), true)
            WALLET.ObservTree.remove(item)
        }
        return Result;
    }
    GetScriptTransaction(Body)
    {
        var Type = Body[0];
        var format = FORMAT_SMART_CREATE;
        try
        {
            var TR = BufLib.GetObjectFromBuffer(Body, format, {});
        }
        catch(e)
        {
            return "";
        }
        ConvertBufferToStr(TR)
        return JSON.stringify(TR, "", 2);
    }
    TRCreateSmart(Body, BlockNum, TrNum)
    {
        if(Body.length < 100)
            return "Error length transaction (retry transaction)";
        if(BlockNum < 4000000)
            return "Error block num";
        try
        {
            var TR = BufLib.GetObjectFromBuffer(Body, FORMAT_CREATE, {});
        }
        catch(e)
        {
            return "Error transaction format (retry transaction)";
        }
        if(!TR.Name)
            return "Name required";
        var Data = TR;
        Data.Num = undefined
        Data.BlockNum = BlockNum
        this.DBSmart.Write(Data)
        return true;
    }
    GetRowsAccounts(start, count, Filter)
    {
        var WasError = 0;
        var arr = [];
        for(var num = start; true; num++)
        {
            var Data = this.DBSmart.Read(num);
            if(!Data)
                break;
            if(Filter)
            {
                var ID = Data.Num;
                var Name = Data.Name;
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
            arr.push(Data)
            count--
            if(count < 0)
                break;
        }
        return arr;
    }
    GetMaxNum()
    {
        return this.DBSmart.GetMaxNum();
    }
};
module.exports = SmartApp;
var App = new SmartApp;
DApps["Smart"] = App;
DAppByType[TYPE_TRANSACTION_SMART_CREATE] = App;
