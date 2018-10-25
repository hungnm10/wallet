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
const NAMES_TYPE_TRANSACTION = 10;
class CApp extends require("./dapp")
{
    constructor()
    {
        super()
        this.KeyValueMap = {}
        this.CurrentNameArr = ""
        global.NAMES = this
    }
    OnWriteTransaction(Block, Body, BlockNum, TrNum)
    {
        return ;
        if(Body[0] === NAMES_TYPE_TRANSACTION)
        {
            var StrKey = GetHexFromAddres(Body.slice(1, 33));
            if(!this.KeyValueMap[StrKey])
            {
                this.KeyValueMap[StrKey] = Body.slice(33)
                if(CompareArr(Body.slice(33), this.Server.addrArr) === 0)
                    this.CurrentNameArr = Body.slice(1, 33)
            }
        }
    }
};
module.exports = CApp;
var App = new CApp;
DApps["Names"] = App;
DAppByType[NAMES_TYPE_TRANSACTION] = App;
