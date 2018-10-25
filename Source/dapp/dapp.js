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
class DApp
{
    constructor()
    {
    }
    Name()
    {
        return "";
    }
    SendMessage(Body, ToAddr)
    {
        SERVER.SendMessage(Body, ToAddr)
    }
    AddTransaction(Body)
    {
        SERVER.AddTransaction(Body)
    }
    GetScriptTransaction(Body)
    {
        return "";
    }
    GetVerifyTransaction(BlockNum, TrNum, Body)
    {
        return 1;
    }
    ClearDataBase()
    {
    }
    OnWriteBlockStart(Block)
    {
    }
    OnWriteBlockFinish(Block)
    {
    }
    OnDeleteBlock(Block)
    {
    }
    OnWriteTransaction(Block, Body, BlockNum, TrNum)
    {
    }
    OnMessage(Msg)
    {
    }
};
module.exports = DApp;

function ReqDir(Path)
{
    if(fs.existsSync(Path))
    {
        var arr = fs.readdirSync(Path);
        for(var i = 0; i < arr.length; i++)
        {
            var name = arr[i];
            ToLog("Reg: " + name);
            var name2 = Path + "/" + arr[i];
            require(name2);
        }
    }
};
global.DApps = {};
global.DAppByType = {};
