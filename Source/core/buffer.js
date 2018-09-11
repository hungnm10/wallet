/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

function Write(e,r,t,n,l)
{
    if("number" == typeof t)
        throw ToLogTrace("ERRR StringFormat "), "ERR!!";
    var a = t;
    if("buffer" === a.substr(0, 6) && 6 < a.length)
        n = parseInt(a.substr(6)), a = "buffer";
    else
        if("arr" === a.substr(0, 3) && 3 < a.length)
            n = parseInt(a.substr(3)), a = "arr";
        else
            if("str" === a.substr(0, 3) && 3 < a.length)
            {
                var f = parseInt(a.substr(3));
                return r && e.write(r, e.len, f), void (e.len += f);
            }
    switch(a)
    {
        case "str":
            var i = toUTF8Array(r);
            65535 < (f = i.length) && (f = 0), e[e.len] = 255 & f, e[e.len + 1] = f >>> 8 & 255, e.len += 2;
            for(var s = 0; s < f; s++)
                e[e.len + s] = i[s];
            e.len += f;
            break;
        case "byte":
            r < 0 && (r = 0), e[e.len] = r, e.len += 1;
            break;
        case "double":
            e.writeDoubleLE(r, e.len, 8), e.len += 8;
            break;
        case "uint":
            r < 0 && (r = 0), 0xffffffffffff <= r && (r = 0), e.writeUIntLE(r, e.len, 6), e.len += 6;
            break;
        case "uint16":
            r < 0 && (r = 0), e[e.len] = 255 & r, e[e.len + 1] = r >>> 8 & 255, e.len += 2;
            break;
        case "uint32":
            r < 0 && (r = 0), e.writeUInt32LE(r, e.len, 4), e.len += 4;
            break;
        case "time":
            var u = r.valueOf();
            e.writeUIntLE(u, e.len, 6), e.len += 6;
            break;
        case "addres":
        case "hash":
            f = r ? Math.min(32, r.length) : 0;
            for(s = 0; s < f; s++)
                e[e.len + s] = r[s];
            e.len += 32;
            break;
        case "buffer":
            f = void 0 === n ? r.length : Math.min(n, r.length);
            for(s = 0; s < f; s++)
                e[e.len + s] = r[s];
            e.len += n;
            break;
        case "arr":
            f = r ? Math.min(n, r.length) : 0;
            for(s = 0; s < f; s++)
                e[e.len + s] = r[s];
            e.len += n;
            break;
        case "tr":
            f = r.length;
            MAX_TRANSACTION_SIZE > MAX_TRANSACTION_SIZE && (f = MAX_TRANSACTION_SIZE), e[e.len] = 255 & f, e[e.len + 1] = f >>> 8 & 255,
            e.len += 2;
            for(s = 0; s < f; s++)
                e[e.len + s] = r[s];
            e.len += f;
            break;
        case "data":
            f = r.length;
            e.writeUInt32LE(f, e.len, 4), e.len += 4;
            for(s = 0; s < f; s++)
                e[e.len + s] = r[s];
            e.len += f;
            break;
        case "hashSTR":
            var o = GetHexFromAddres(r);
            e.write(o, e.len, 64), e.len += 64;
            break;
        case "uintSTR":
            o = r.toString();
            e.write(o, e.len, 10), e.len += 10;
            break;
        default:
            l = l || {};
            var b = t.substr(0, 1);
            if("[" === b)
            {
                r && (f = r.length);
                var d = GetMiddleString(a);
                Write(e, f, "uint32");
                for(s = 0; s < f; s++)
                    Write(e, r[s], d, void 0, l);
            }
            else
            {
                if("{" !== b)
                    throw "Bad write type params: " + a;
                var c = l[a];
                c || (c = GetAttributes(GetMiddleString(a)), l[a] = c);
                for(s = 0; s < c.length; s++)
                {
                    var h = c[s];
                    Write(e, r[h.Key], h.Value, void 0, l);
                }
            }
    }
};
function Read(e,r,t,n)
{
    var l;
    if("number" == typeof r)
        throw ToLogTrace("ERR StringFormat"), "ERRR!";
    var a = r;
    if("buffer" === a.substr(0, 6))
        6 < a.length ? (t = parseInt(a.substr(6)), a = "buffer") : t = 0;
    else
        if("arr" === a.substr(0, 3))
            3 < a.length ? (t = parseInt(a.substr(3)), a = "arr") : t = 0;
        else
            if("str" === a.substr(0, 3))
            {
                if(3 < a.length)
                {
                    var f = parseInt(a.substr(3));
                    l = e.toString("utf8", e.len, e.len + f), e.len += f;
                    for(var i =  - 1, s = l.length - 1; 0 <= s; s--)
                        if(0 !== l.charCodeAt(s))
                        {
                            i = s;
                            break;
                        }
                    return l = 0 <= i ? l.substr(0, s + 1) : "";
                }
                t = 0;
            }
    switch(a)
    {
        case "str":
            f = e.len + 2 <= e.length ? e[e.len] + 256 * e[e.len + 1] : 0, e.len += 2;
            var u = e.slice(e.len, e.len + f);
            l = Utf8ArrayToStr(u), e.len += f;
            break;
        case "byte":
            l = e.len + 1 <= e.length ? e[e.len] : 0, e.len += 1;
            break;
        case "double":
            l = e.len + 8 <= e.length ? e.readDoubleLE(e.len, 8) : 0, e.len += 8;
            break;
        case "uint":
            l = e.len + 6 <= e.length ? e.readUIntLE(e.len, 6) : 0, e.len += 6;
            break;
        case "uint16":
            l = e.len + 2 <= e.length ? e[e.len] + 256 * e[e.len + 1] : 0, e.len += 2;
            break;
        case "uint32":
            l = e.len + 4 <= e.length ? e.readUInt32LE(e.len, 4) : 0, e.len += 4;
            break;
        case "time":
            l = e.len + 6 <= e.length ? e.readUIntLE(e.len, 6) : 0, l = new Date(l), e.len += 6;
            break;
        case "addres":
        case "hash":
            l = [];
            for(s = 0; s < 32; s++)
                e.len + s <= e.length ? l[s] = e[e.len + s] : l[s] = 0;
            e.len += 32;
            break;
        case "buffer":
        case "arr":
            l = e.len + t <= e.length ? e.slice(e.len, e.len + t) : Buffer.alloc(t), e.len += t;
            break;
        case "tr":
            if(e.len + 1 >= e.length)
            {
                l = void 0;
                break;
            }
            f = e[e.len] + 256 * e[e.len + 1];
            e.len += 2, l = e.slice(e.len, e.len + f), e.len += f;
            break;
        case "data":
            (f = e.len + 4 <= e.length ? e.readUInt32LE(e.len, 4) : 0) > e.length - e.len - 4 && (f = 0), e.len += 4, l = e.slice(e.len,
            e.len + f), e.len += f;
            break;
        case "hashSTR":
            var o = e.toString("utf8", e.len, e.len + 64);
            l = GetAddresFromHex(o), e.len += 64;
            break;
        case "uintSTR":
            o = e.toString("utf8", e.len, e.len + 10);
            l = parseInt(o), e.len += 10;
            break;
        default:
            n = n || {};
            var b = a.substr(0, 1);
            if("[" === b)
            {
                l = [];
                var d = GetMiddleString(a);
                for(f = Read(e, "uint32"), s = 0; s < f && e.len <= e.length; s++)
                    l[s] = Read(e, d, void 0, n);
            }
            else
            {
                if("{" !== b)
                    throw "Bad read type params: " + a;
                var c = n[a];
                c || (c = GetAttributes(GetMiddleString(a)), n[a] = c), l = {};
                for(s = 0; s < c.length; s++)
                {
                    var h = c[s];
                    l[h.Key] = Read(e, h.Value, void 0, n);
                }
            }
    }
    return l;
};
function BufWriteByte(e)
{
    this[this.len] = e, this.len += 1;
};
function BufWrite(e,r,t)
{
    Write(this, e, r, t);
};
function BufRead(e,r)
{
    return Read(this, e, r);
};
function GetNewBuffer(e)
{
    var r = Buffer.alloc(e);
    return r.Read = BufRead.bind(r), r.Write = BufWrite.bind(r), r.len = 0, r;
};
function GetReadBuffer(e)
{
    var r = Buffer.from(e);
    return r.Read = BufRead.bind(r), r.Write = BufWrite.bind(r), r.len = 0, r;
};
function GetObjectFromBuffer(e,r,t)
{
    var n = Buffer.from(e);
    return n.len = 0, Read(n, r, void 0, t);
};
function GetBufferFromObject(e,r,t,n)
{
    var l = Buffer.alloc(t);
    return l.len = 0, Write(l, e, r, void 0, n), l = l.slice(0, l.len);
};
function GetMiddleString(e)
{
    return e.substr(1, e.length - 2);
};
function GetMiddleString2(e,r,t)
{
    for(var n = 0, l = "", a = 0; a < e.length; a++)
    {
        var f = e.substr(a, 1);
        if(" " !== f && "\n" !== f && (f !== r || 1 != ++n))
        {
            if(f === t && 0 === --n)
                break;
            n && (l += f);
        }
    }
    return l;
};
function GetAttributeStrings(e)
{
    for(var r = 0, t = [], n = "", l = 0; l < e.length; l++)
    {
        var a = e.substr(l, 1);
        if("{" === a)
            r++;
        else
            if("}" === a)
                r--;
            else
            {
                if("," === a && 0 === r)
                {
                    0 < n.length && t.push(n), n = "";
                    continue;
                }
                if(" " === a || "\n" === a)
                    continue;
            }
        n += a;
    }
    return 0 < n.length && t.push(n), t;
};
function GetKeyValueStrings(e)
{
    for(var r = "", t = 0; t < e.length; t++)
    {
        var n = e.substr(t, 1);
        if(" " !== n && "\n" !== n)
        {
            if(":" === n)
                return {Key:r, Value:e.substr(t + 1)};
            r += n;
        }
    }
    throw "Error format Key:Value = " + e;
};
function GetAttributes(e)
{
    for(var r = [], t = GetAttributeStrings(e), n = 0; n < t.length; n++)
    {
        var l = GetKeyValueStrings(t[n]);
        r.push(l);
    }
    return r;
};
module.exports.GetNewBuffer = GetNewBuffer, module.exports.GetReadBuffer = GetReadBuffer, module.exports.alloc = GetNewBuffer,
module.exports.from = GetReadBuffer, module.exports.Write = Write, module.exports.Read = Read, module.exports.GetObjectFromBuffer = GetObjectFromBuffer,
module.exports.GetBufferFromObject = GetBufferFromObject;
