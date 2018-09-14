/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

const DELTA_LONG_MINING = 5000;
var BLOCKNUM_ALGO2 = 6580000;
require('./library.js');
require('./crypto-library.js');

function GetHashFromSeqAddr(SeqHash,AddrHash,BlockNum,PrevHash)
{
    if(BlockNum < BLOCKNUM_ALGO2)
    {
        var Hash = shaarrblock2(SeqHash, AddrHash, BlockNum);
        return {Hash:Hash, PowHash:Hash};
    }
    var MinerID = ReadUintFromArr(AddrHash, 0);
    var Nonce0 = ReadUintFromArr(AddrHash, 6);
    var Nonce1 = ReadUintFromArr(AddrHash, 12);
    var Nonce2 = ReadUintFromArr(AddrHash, 18);
    var DeltaNum1 = ReadUint16FromArr(AddrHash, 24);
    var DeltaNum2 = ReadUint16FromArr(AddrHash, 26);
    var PrevHashNum;
    if(PrevHash)
    {
        PrevHashNum = ReadUint32FromArr(PrevHash, 28);
    }
    else
    {
        PrevHashNum = ReadUint32FromArr(AddrHash, 28);
    }
    return GetHash(SeqHash, PrevHashNum, BlockNum, MinerID, Nonce0, Nonce1, Nonce2, DeltaNum1, DeltaNum2);
};

function GetHash(BlockHash,PrevHashNum,BlockNum,Miner,Nonce0,Nonce1,Nonce2,DeltaNum1,DeltaNum2)
{
    if(DeltaNum1 > DELTA_LONG_MINING || DeltaNum2 > DELTA_LONG_MINING)
        return undefined;
    var HashBase = GetHashFromNum2(BlockNum, PrevHashNum);
    var HashCurrent = GetHashFromArrNum2(BlockHash, Miner, Nonce0);
    var HashNonce1 = GetHashFromNum3(BlockNum - DeltaNum1, Miner, Nonce1);
    var HashNonce2 = GetHashFromNum3(BlockNum - DeltaNum2, Miner, Nonce2);
    var Hash1 = XORArr(HashBase, HashNonce1);
    var Hash2 = XORArr(HashCurrent, HashNonce2);
    var Ret = {Hash:Hash2};
    if(CompareArr(Hash1, Hash2) > 0)
    {
        Ret.PowHash = Hash1;
    }
    else
    {
        Ret.PowHash = Hash2;
    }
    return Ret;
};

function XORArr(Arr1,Arr2)
{
    var Ret = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for(var i = 0; i < 32; i++)
    {
        Ret[i] = Arr1[i] ^ Arr2[i];
    }
    return Ret;
};

function GetHashFromNum2(Value1,Value2)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(MeshArr, Value1, 0);
    WriteUintToArrOnPos(MeshArr, Value2, 6);
    return sha3(MeshArr);
};

function GetHashFromArrNum2(Arr,Value1,Value2)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0];
    WriteArrToArrOnPos(MeshArr, Arr, 0, 32);
    WriteUintToArrOnPos(MeshArr, Value1, 32);
    WriteUintToArrOnPos(MeshArr, Value2, 38);
    return sha3(MeshArr);
};

function GetHashFromNum3(Value1,Value2,Value3)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(MeshArr, Value1, 0);
    WriteUintToArrOnPos(MeshArr, Value2, 6);
    WriteUintToArrOnPos(MeshArr, Value3, 12);
    return sha3(MeshArr);
};
global.GetHashFromSeqAddr = GetHashFromSeqAddr;
global.CalcHashBlockFromSeqAddr = CalcHashBlockFromSeqAddr;
global.CreateHashMinimal = CreateHashMinimal;
global.StartNumNewAlgo = StartNumNewAlgo;
global.CreatePOWVersion0 = CreatePOWVersion0;

function StartNumNewAlgo()
{
    return BLOCKNUM_ALGO2;
};

function CalcHashBlockFromSeqAddr(Block,PrevHash)
{
    var Value = GetHashFromSeqAddr(Block.SeqHash, Block.AddrHash, Block.BlockNum, PrevHash);
    Block.Hash = Value.Hash;
    Block.PowHash = Value.PowHash;
};

function CreateHashMinimal(Block,MinerID)
{
    if(Block.BlockNum < BLOCKNUM_ALGO2)
    {
        return false;
    }
    Block.MinerID = MinerID;
    Block.RunCount = 16;
    CreatePOWVersion0(Block);
    return true;
    var PrevHashNum = ReadUint32FromArr(Block.PrevHash, 28);
    var Ret = GetHash(Block.SeqHash, PrevHashNum, Block.BlockNum, MinerID, 0, 0, 0, 0, 0);
    Block.Hash = Ret.Hash;
    Block.PowHash = Ret.PowHash;
    Block.Power = GetPowPower(Block.PowHash);
    Block.AddrHash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(Block.AddrHash, MinerID, 0);
    WriteUint32ToArrOnPos(Block.AddrHash, PrevHashNum, 28);
    return true;
};

function CreatePOWVersion0(Block)
{
    if(!Block.MaxLider)
    {
        Block.MaxLider = {Nonce1:0, Nonce2:0, Hash1:[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], Hash2:[255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
        };
    }
    var MaxLider = Block.MaxLider;
    var BlockNum = Block.BlockNum;
    var Miner = Block.MinerID;
    var PrevHashNum = ReadUint32FromArr(Block.PrevHash, 28);
    var HashBase = GetHashFromNum2(BlockNum, PrevHashNum);
    var HashCurrent = GetHashFromArrNum2(Block.SeqHash, Miner, 0);
    for(var nonce = 0; nonce < Block.RunCount; nonce++)
    {
        var Nonce1 = Block.LastNonce + nonce;
        var Nonce2 = Nonce1;
        var HashNonce1 = GetHashFromNum3(BlockNum, Miner, Nonce1);
        var HashNonce2 = GetHashFromNum3(BlockNum, Miner, Nonce2);
        var Hash1 = XORArr(HashBase, HashNonce1);
        var Hash2 = XORArr(HashCurrent, HashNonce2);
        if(CompareArr(MaxLider.Hash1, Hash1) > 0)
        {
            MaxLider.Hash1 = Hash1;
            MaxLider.Nonce1 = Nonce1;
        }
        if(CompareArr(MaxLider.Hash2, Hash2) > 0)
        {
            MaxLider.Hash2 = Hash2;
            MaxLider.Nonce2 = Nonce2;
        }
    }
    Block.LastNonce += Block.RunCount;
    Block.AddrHash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(Block.AddrHash, Miner, 0);
    WriteUintToArrOnPos(Block.AddrHash, MaxLider.Nonce1, 12);
    WriteUintToArrOnPos(Block.AddrHash, MaxLider.Nonce2, 18);
    WriteUint32ToArrOnPos(Block.AddrHash, PrevHashNum, 28);
    Block.Hash = MaxLider.Hash2;
    if(CompareArr(MaxLider.Hash1, MaxLider.Hash2) > 0)
    {
        Block.PowHash = MaxLider.Hash1;
    }
    else
    {
        Block.PowHash = MaxLider.Hash2;
    }
};
