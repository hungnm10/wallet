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
const DELTA_START_MINING = 1000;
const DELTA_FINISH_MINING = 5000;
require('./crypto-library.js');

function CalcHash(AddrHash,BlockNum)
{
};

function CreateHash0(Miner,BlockNum,DeltaNum1,DeltaNum2,Nonce1,Nonce2)
{
    if(DeltaNum1 < DELTA_START_MINING || DeltaNum1 > DELTA_FINISH_MINING || DeltaNum2 < DELTA_START_MINING || DeltaNum2 > DELTA_FINISH_MINING)
        return undefined;
    var Block1 = SERVER.ReadBlockHeaderFromMapDB(BlockNum - DeltaNum1);
    var Block2 = SERVER.ReadBlockHeaderFromMapDB(BlockNum - DeltaNum2);
    if(!Block1 || !Block2)
        return undefined;
    var Arr1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0];
    WriteArrToArrOnPos(Arr1, Block1.SeqHash, 0, 32);
    WriteUintToArrOnPos(Arr1, Miner, 32);
    WriteUintToArrOnPos(Arr1, Nonce1, 38);
    var NonceHash1 = sha3(Arr1);
    var Arr2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0];
    WriteArrToArrOnPos(Arr2, Block2.SeqHash, 0, 32);
    WriteUintToArrOnPos(Arr2, Miner, 32);
    WriteUintToArrOnPos(Arr2, Nonce2, 38);
    var NonceHash2 = sha3(Arr2);
    var Block = SERVER.ReadBlockHeaderFromMapDB(BlockNum);
    var BlockPrev = SERVER.ReadBlockHeaderFromMapDB(BlockNum - DELTA_START_MINING);
    if(!Block || !BlockPrev)
        return undefined;
    var MeshArr1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteArrToArrOnPos(MeshArr1, Block.SeqHash, 0, 32);
    WriteArrToArrHOnPos(MeshArr1, NonceHash1, 0, 32);
    var MeshArr2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteArrToArrOnPos(MeshArr2, BlockPrev.SeqHash, 0, 32);
    WriteArrToArrHOnPos(MeshArr2, NonceHash2, 0, 32);
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

function GetHashFromNum2(Arr,Value1,Value2)
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
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(MeshArr, Value1, 0);
    WriteUintToArrOnPos(MeshArr, Value2, 6);
    WriteUintToArrOnPos(MeshArr, Value3, 12);
    return sha3(MeshArr);
};

function CreateHash(Miner,BlockNum,Nonce0,Nonce1,Nonce2,DeltaNum1,DeltaNum2)
{
    if(DeltaNum1 > DELTA_LONG_MINING || DeltaNum2 > DELTA_LONG_MINING)
        return undefined;
    var Block = SERVER.ReadBlockHeaderFromMapDB(BlockNum);
    if(!Block)
        return undefined;
    var HashBase = sha3(Block.PrevHash);
    var HashCurrent = GetHashFromNum2(Block.SeqHash, Miner, Nonce0);
    var HashNonce1 = GetHashFromNum3(BlockNum - DeltaNum1, Miner, Nonce1);
    var HashNonce2 = GetHashFromNum3(BlockNum - DeltaNum2, Miner, Nonce2);
    var Hash1 = XORArr(HashBase, HashNonce1);
    var Hash2 = XORArr(HashCurrent, HashNonce2);
    var Ret = {Hash:Hash2};
    if(CompareArr(Ret.Hash1, Ret.Hash2) > 0)
    {
        Ret.EHash = Hash1;
    }
    else
    {
        Ret.EHash = Hash2;
    }
    return Ret;
};

function RAND(Rand)
{
    return (1664525 * (Rand) + 1013904223);
};

function RandMesh32(Arr1,Arr2,Arr3)
{
    var hash = 2166136261;
    for(var i = 0; i < 8; i++)
    {
        hash = RAND(Arr2[i] ^ hash);
    }
    for(var i = 0; i < 8; i++)
    {
        hash = RAND(Arr1[i] ^ hash);
        Arr3[i] = hash ^ Arr2[i];
    }
};

function SimpleMesh32(Arr1,Arr2,Arr3)
{
    var hash = 2166136261;
    for(var i = 0; i < 8; i++)
    {
        hash ^= Arr2[i];
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    for(var i = 0; i < 8; i++)
    {
        hash ^= Arr1[i];
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        Arr3[i] = hash ^ Arr2[i];
    }
};
var crc_table;

function Crc32(buf)
{
    var Out = 0xFFFFFFFF;
    if(!crc_table)
    {
        crc_table = [];
        for(var i = 0; i < 256; i++)
        {
            var crc = i;
            for(var j = 0; j < 8; j++)
                crc = crc & 1 ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
            crc_table[i] = crc;
        }
    }
    var crc = Out;
    for(var i = 0; i < buf.length; i++)
        crc = crc_table[(crc ^ buf[i]++) & 0xFF] ^ (crc >>> 8);
    return crc ^ Out;
};

function Test()
{
    var Count = 1000000;
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    console.time("Mesh");
    for(var i = 0; i < Count; i++)
    {
        Mesh(MeshArr, 2);
    }
    console.timeEnd("Mesh");
    var Str = GetHexFromArr(MeshArr.slice(0, 32));
    console.log(Str);
    var A1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var A2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var A3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    console.time("RandMesh32");
    for(var i = 0; i < Count; i++)
        RandMesh32(A1, A2, A3);
    console.timeEnd("RandMesh32");
    console.log(GetHexFromArr(A3.slice(0, 32)));
    console.time("SimpleMesh32");
    for(var i = 0; i < Count; i++)
        SimpleMesh32(A1, A2, A3);
    console.timeEnd("SimpleMesh32");
    console.log(GetHexFromArr(A3.slice(0, 32)));
    var Result;
    console.time("Crc32");
    for(var i = 0; i < Count; i++)
        Result = Crc32(A1);
    console.timeEnd("Crc32");
    console.log("CRC=" + Result);
};
Test();
process.exit();
