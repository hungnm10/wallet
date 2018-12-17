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
const crypto = require('crypto');
const RBTree = require('bintrees').RBTree;
require("./library");
require("./crypto-library");
const WalletPath = "WALLET";
const DBRow = require("./db/db-row");
const CONFIG_NAME = GetDataPath(WalletPath + "/config.lst");
class CApp
{
    constructor()
    {
        CheckCreateDir(GetDataPath(WalletPath))
        this.DBHistory = new DBRow("../" + WalletPath + "/wallet-act", 4 * 6 + 1 + 200 + 10 + 6, "{BlockNum:uint, FromID:uint, FromOperationID:uint, ToID:uint, Direct:str1, Description:str200, SumCOIN:uint,SumCENT:uint32, Currency:uint}")
        this.Password = ""
        this.WalletOpen = undefined
        var Params = LoadParams(CONFIG_NAME, undefined);
        if(!Params)
        {
            Params = {}
            if(global.TEST_NETWORK)
            {
                Params.Key = global.ARR_PUB_KEY[0]
            }
            else
            {
                Params.Key = GetHexFromArr(crypto.randomBytes(32))
            }
            Params.AccountMap = {}
            Params.MiningAccount = 0
        }
        if(Params.MiningAccount)
            global.GENERATE_BLOCK_ACCOUNT = Params.MiningAccount
        this.AccountMap = Params.AccountMap
        this.KeyPair = crypto.createECDH('secp256k1')
        if(Params.Protect)
        {
            this.KeyXOR = GetArrFromHex(Params.KeyXOR)
            this.WalletOpen = false
            this.SetPrivateKey(Params.PubKey)
        }
        else
        {
            this.SetPrivateKey(Params.Key)
        }
    }
    SetMiningAccount(Account)
    {
        global.GENERATE_BLOCK_ACCOUNT = Account
        this.SaveWallet()
    }
    AddTransaction(Tr)
    {
        if(!global.TX_PROCESS.Worker)
            return 0;
        var StrHex = GetHexFromArr(shaarr(Tr.body));
        global.TX_PROCESS.Worker.send({cmd:"FindTX", TX:StrHex})
        return SERVER.AddTransaction(Tr, 1);
    }
    SetPrivateKey(KeyStr, bSetNew)
    {
        var bGo = 1;
        if(this.WalletOpen === false)
        {
            bGo = 0
        }
        if(KeyStr && KeyStr.length === 64 && bGo)
        {
            this.KeyPair.setPrivateKey(GetArr32FromHex(KeyStr))
            this.KeyPair.PubKeyArr = this.KeyPair.getPublicKey('', 'compressed')
            this.KeyPair.PubKeyStr = GetHexFromArr(this.KeyPair.PubKeyArr)
            this.KeyPair.PrivKeyStr = KeyStr.toUpperCase()
            this.KeyPair.addrArr = this.KeyPair.PubKeyArr.slice(1)
            this.KeyPair.addrStr = GetHexAddresFromPublicKey(this.KeyPair.addrArr)
            this.KeyPair.addr = this.KeyPair.addrArr
            this.KeyPair.WasInit = 1
            this.PubKeyArr = this.KeyPair.PubKeyArr
        }
        else
        {
            this.KeyPair.WasInit = 0
            if(KeyStr)
            {
                this.PubKeyArr = GetArrFromHex(KeyStr)
                this.KeyPair.PubKeyStr = GetHexFromArr(this.PubKeyArr)
            }
            else
            {
                this.PubKeyArr = []
                this.KeyPair.PubKeyStr = ""
            }
            this.KeyPair.PrivKeyStr = ""
        }
        if(bSetNew)
        {
            this.AccountMap = {}
        }
        this.FindMyAccounts()
        if(bGo)
            this.SaveWallet()
    }
    CloseWallet()
    {
        this.Password = ""
        this.WalletOpen = false
        this.KeyPair = crypto.createECDH('secp256k1')
        this.SetPrivateKey(GetHexFromArr(this.PubKeyArr), false)
        ToLogClient("Wallet close")
        return 1;
    }
    OpenWallet(StrPassword)
    {
        if(this.WalletOpen !== false)
        {
            ToLogClient("Wallet was open")
        }
        var Hash = this.HashProtect(StrPassword);
        var TestPrivKey = this.XORHash(this.KeyXOR, Hash, 32);
        if(!IsZeroArr(TestPrivKey))
        {
            this.KeyPair.setPrivateKey(Buffer.from(TestPrivKey))
            var TestPubKey = this.KeyPair.getPublicKey('', 'compressed');
            if(CompareArr(TestPubKey, this.PubKeyArr) !== 0)
            {
                ToLogClient("Wrong password")
                return 0;
            }
            this.Password = StrPassword
            this.WalletOpen = true
            this.SetPrivateKey(GetHexFromArr(TestPrivKey), false)
        }
        else
        {
            this.Password = StrPassword
            this.WalletOpen = true
            this.SetPrivateKey(GetHexFromArr(this.PubKeyArr), false)
        }
        ToLogClient("Wallet open")
        return 1;
    }
    SetPasswordNew(StrPassword)
    {
        if(this.WalletOpen === false)
        {
            ToLogClient("Wallet is close by password")
            return ;
        }
        this.Password = StrPassword
        if(StrPassword)
            this.WalletOpen = true
        else
            this.WalletOpen = undefined
        this.SaveWallet()
    }
    HashProtect(Str)
    {
        var arr = shaarr(Str);
        for(var i = 0; i < 10000; i++)
        {
            arr = shaarr(arr)
        }
        return arr;
    }
    XORHash(arr1, arr2, length)
    {
        var arr3 = [];
        for(var i = 0; i < length; i++)
        {
            arr3[i] = arr1[i] ^ arr2[i]
        }
        return arr3;
    }
    SaveWallet()
    {
        if(this.WalletOpen === false)
        {
            return ;
        }
        var Params = {};
        if(this.Password)
        {
            Params.Protect = true
            var Hash = this.HashProtect(this.Password);
            if(this.KeyPair.WasInit)
            {
                Params.KeyXOR = GetHexFromArr(this.XORHash(this.KeyPair.getPrivateKey(), Hash, 32))
            }
            else
            {
                var Key2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                Params.KeyXOR = GetHexFromArr(this.XORHash(Key2, Hash, 32))
            }
            Params.PubKey = GetHexFromArr(this.PubKeyArr)
            this.KeyXOR = GetArrFromHex(Params.KeyXOR)
        }
        else
        {
            if(this.KeyPair.WasInit)
                Params.Key = this.KeyPair.PrivKeyStr
            else
                Params.Key = GetHexFromArr(this.PubKeyArr)
        }
        Params.AccountMap = this.AccountMap
        Params.MiningAccount = global.GENERATE_BLOCK_ACCOUNT
        SaveParams(CONFIG_NAME, Params)
    }
    OnDoHistoryAct(Item, BlockNum)
    {
        Item.BlockNum = BlockNum
        this.DBHistory.Write(Item)
    }
    OnDeleteBlock(BlockNumFrom)
    {
        this.DBHistory.DeleteHistory(BlockNumFrom)
    }
    OnCreateAccount(Data)
    {
        this.AccountMap[Data.Num] = 0
    }
    FindMyAccounts()
    {
        if(IsZeroArr(this.PubKeyArr))
            return ;
        DApps.Accounts.FindAccounts([this.PubKeyArr], this.AccountMap, 0)
    }
    GetAccountKey(Num)
    {
        if(this.KeyPair.WasInit && global.TestTestWaletMode)
        {
        }
        return this.KeyPair;
    }
    GetSignFromArr(Arr, Num)
    {
        if(!this.KeyPair.WasInit)
            return "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        var KeyPair;
        if(Num)
        {
            KeyPair = this.GetAccountKey(Num)
        }
        else
        {
            KeyPair = this.KeyPair
        }
        var hash = shabuf(Arr);
        var sigObj = secp256k1.sign(hash, KeyPair.getPrivateKey());
        return GetHexFromArr(sigObj.signature);
    }
    GetSignTransaction(TR)
    {
        var Arr;
        if(TR.Version === 2 || TR.Version === 3)
        {
            var format;
            if(TR.Version === 2)
                format = FORMAT_MONEY_TRANSFER_BODY2
            else
                format = FORMAT_MONEY_TRANSFER_BODY3
            Arr = []
            for(var i = 0; i < TR.To.length; i++)
            {
                var Item = TR.To[i];
                var DataTo = DApps.Accounts.ReadState(Item.ID);
                if(!DataTo)
                    return "";
                for(var j = 0; j < 33; j++)
                    Arr[Arr.length] = DataTo.PubKey[j]
            }
            var Body = BufLib.GetBufferFromObject(TR, format, MAX_TRANSACTION_SIZE, {});
            for(var j = 0; j < Body.length; j++)
                Arr[Arr.length] = Body[j]
        }
        else
        {
            Arr = BufLib.GetBufferFromObject(TR, FORMAT_MONEY_TRANSFER_BODY, MAX_TRANSACTION_SIZE, {})
        }
        return this.GetSignFromArr(Arr, this.AccountMap[TR.FromID]);
    }
    GetHistoryMaxNum()
    {
        return this.DBHistory.GetMaxNum();
    }
    GetHistory(start, count, Filter, Direct00)
    {
        if(Filter)
            Filter = Filter.toUpperCase()
        var arr = [];
        for(var num = start; true; num++)
        {
            var Item = this.DBHistory.Read(num);
            if(!Item)
                break;
            Item.ToName = ""
            if(Item.ToID !== 1000000000000)
            {
                var Account = DApps.Accounts.ReadState(Item.ToID);
                if(Account)
                {
                    Item.ToName = Account.Name
                }
            }
            if(Filter)
            {
                var Date = DateFromBlock(Item.BlockNum);
                var Str = "" + Date + " " + Item.Description.toUpperCase() + " " + Item.FromID + " " + Item.ToID + " " + Item.ToName.toUpperCase() + " " + Item.FromOperationID + " " + Item.BlockNum;
                if(Str.indexOf(Filter) < 0)
                    continue;
            }
            Item.Value = {SumCOIN:Item.SumCOIN, SumCENT:Item.SumCENT}
            arr.push(Item)
            count--
            if(count < 1)
                break;
        }
        return arr;
    }
};
global.WALLET = new CApp;
