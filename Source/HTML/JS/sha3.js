/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

function meshhash(t,r)
{
    for(var e = [t[3], t[2], t[1], t[0]], a = [], n = 0; n < 16; n++)
        a[n] = t[2 * n] + (t[2 * n + 1] << 8);
    var s = 0, o = 0;
    for(n = 0; n < 64; n++)
    {
        var i = t[31 & o];
        o++;
        var u = i >> 4 & 15, h = 15 & i, c = 3 & i;
        switch(u)
        {
            case 0:
                e[0] = e[0] + e[c];
                break;
            case 1:
                e[0] = e[0] * e[c];
                break;
            case 2:
                e[0] = e[0] | e[c];
                break;
            case 3:
                e[0] = e[0] & e[c];
                break;
            case 4:
            case 5:
            case 6:
            case 7:
                e[0] = e[0] + e[1] + e[2] + e[3];
                break;
            case 8:
                (65535 & e[0]) < 32768 && !s && (o = 32 + o - h, s = 1);
                break;
            case 9:
                32768 < (65535 & e[0]) && !s && (o += h, s = 1);
                break;
            default:
                e[u % 4] = a[h];
        }
        var f = 15 & e[0], p = e[0] >> 8 & 15;
        if(f !== p)
        {
            var d = a[f];
            a[f] = a[p], a[p] = d;
        }
    }
    var y = [];
    for(n = 0; n < 16; n++)
        y[2 * n] = 255 & a[n], y[2 * n + 1] = a[n] >> 8;
    return sha3_array_256(y);
};
function meshhash2(t,r)
{
    for(var e = [t[0], t[1], t[2], t[3], t[4], t[5]], a = [], n = 0; n < 16; n++)
        a[n] = t[2 * n] + (t[2 * n + 1] << 8);
    var s = 0, o = 0;
    for(n = 0; n < 64; n++)
    {
        var i = t[31 & o];
        o++;
        var u = i >> 4 & 15, h = 15 & i, c = 3 & i;
        switch(u)
        {
            case 0:
                e[0] = e[0] * e[c];
                break;
            case 1:
                e[0] = e[0] + e[c];
                break;
            case 2:
                e[0] = e[0] & e[c];
                break;
            case 3:
                e[0] = e[0] | e[c];
                break;
            case 16:
            case 4:
            case 5:
            case 6:
            case 7:
                e[0] = e[0] + e[1] + e[2] + e[3];
                break;
            case 9:
                (65535 & e[0]) < 32768 && !s && (o = 32 + o - h, s = 1);
                break;
            case 8:
                32768 < (65535 & e[0]) && !s && (o += h, s = 1);
                break;
            default:
                e[u % 4] = a[h];
        }
        var f = 15 & e[0], p = e[0] >> 8 & 15;
        if(f !== p)
        {
            var d = a[f];
            a[f] = a[p], a[p] = d;
        }
    }
    var y = [];
    for(n = 0; n < 16; n++)
        y[2 * n] = 255 & a[n], y[2 * n + 1] = a[n] >> 8;
    return sha3_array_256(y);
};
function TestSpeed(t,r)
{
    for(var e = Buffer.alloc(1e6), a = new Date - 0, n = 1; n <= 10; n++)
        r(e);
    var s = new Date - 0, o = t + "=" + Math.trunc((s - a) / 10) + " ms";
    console.log(o);
};
!function ()
{
    "use strict";
    var c = "object" == typeof window ? window : {};
    !c.JS_SHA3_NO_NODE_JS && "object" == typeof process && process.versions && process.versions.node && !c.RUN_NW_CLIENT && (c = global),
    c.RUN_CLIENT && (c = window);
    !c.JS_SHA3_NO_COMMON_JS && "object" == typeof module && module.exports;
    var f = !c.JS_SHA3_NO_ARRAY_BUFFER && "undefined" != typeof ArrayBuffer, u = "0123456789abcdef".split(""), t = [4, 1024, 262144,
    67108864], r = [6, 1536, 393216, 100663296], p = [0, 8, 16, 24], ct = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648,
    32907, 0, 2147483649, 0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0, 2147483658, 0, 2147516555,
    0, 139, 2147483648, 32905, 2147483648, 32771, 2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
    2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648], e = [224, 256, 384, 512], a = [128, 256],
    o = ["hex", "buffer", "arrayBuffer", "array"], i = {128:168, 256:136};
    !c.JS_SHA3_NO_NODE_JS && Array.isArray || (Array.isArray = function (t)
    {
        return "[object Array]" === Object.prototype.toString.call(t);
    });
    for(var n = function (r,e,a)
    {
        return function (t)
        {
            return new R(r, e, r).update(t)[a]();
        };
    }, s = function (e,a,n)
    {
        return function (t,r)
        {
            return new R(e, a, r).update(t)[n]();
        };
    }, h = function (n,t,s)
    {
        return function (t,r,e,a)
        {
            return v["cshake" + n].update(t, r, e, a)[s]();
        };
    }, d = function (n,t,s)
    {
        return function (t,r,e,a)
        {
            return v["kmac" + n].update(t, r, e, a)[s]();
        };
    }, y = function (t,r,e,a)
    {
        for(var n = 0; n < o.length; ++n)
        {
            var s = o[n];
            t[s] = r(e, a, s);
        }
        return t;
    }, l = function (t,r,e)
    {
        var a = n(t, r, e);
        return a.create = function ()
        {
            return new R(t, r, t);
        }, a.update = function (t)
        {
            return a.create().update(t);
        }, y(a, n, t, r);
    }, b = [{name:"keccak", padding:[1, 256, 65536, 16777216], bits:e, createMethod:l}, {name:"sha3", padding:r, bits:e, createMethod:l,
        outputs:"hex"}, {name:"sha3_array", padding:r, bits:e, createMethod:l, outputs:"array"}, {name:"sha3_buf", padding:r, bits:e,
        createMethod:l, outputs:"buffer"}, {name:"shake", padding:[31, 7936, 2031616, 520093696], bits:a, createMethod:function (r,e)
        {
            var a = s(r, e, "hex");
            return a.create = function (t)
            {
                return new R(r, e, t);
            }, a.update = function (t,r)
            {
                return a.create(r).update(t);
            }, y(a, s, r, e);
        }}, {name:"cshake", padding:t, bits:a, createMethod:function (a,n)
        {
            var s = i[a], o = h(a, 0, "hex");
            return o.create = function (t,r,e)
            {
                return r || e ? new R(a, n, t).bytepad([r, e], s) : v["shake" + a].create(t);
            }, o.update = function (t,r,e,a)
            {
                return o.create(r, e, a).update(t);
            }, y(o, h, a, n);
        }}, {name:"kmac", padding:t, bits:a, createMethod:function (a,n)
        {
            var s = i[a], o = d(a, 0, "hex");
            return o.create = function (t,r,e)
            {
                return new w(a, n, r).bytepad(["KMAC", e], s).bytepad([t], s);
            }, o.update = function (t,r,e,a)
            {
                return o.create(t, e, a).update(r);
            }, y(o, d, a, n);
        }}], v = {}, _ = [], k = 0; k < b.length; ++k)
        for(var A = b[k], g = A.bits, B = 0; B < g.length; ++B)
        {
            var m = A.name + "_" + g[B];
            if(_.push(m), v[m] = A.createMethod(g[B], A.padding, A.outputs), "sha3" !== A.name)
            {
                var O = A.name + g[B];
                _.push(O), v[O] = v[m];
            }
        }
    function R(t,r,e)
    {
        this.blocks = [], this.s = [], this.padding = r, this.outputBits = e, this.reset = !0, this.block = 0, this.start = 0, this.blockCount = 1600 - (t << 1) >> 5,
        this.byteCount = this.blockCount << 2, this.outputBlocks = e >> 5, this.extraBytes = (31 & e) >> 3;
        for(var a = 0; a < 50; ++a)
            this.s[a] = 0;
    };
    function w(t,r,e)
    {
        R.call(this, t, r, e);
    };
    R.prototype.update = function (t)
    {
        var r = "string" != typeof t;
        if(r && t.constructor === c.ArrayBuffer)
            return TO_ERROR_LOG("SHA3", 10, "ERROR: Error type ArrayBuffer, use Uint8Array instead!"), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var e = t.length;
        if(r && ("number" != typeof e || !Array.isArray(t) && (!f || !ArrayBuffer.isView(t))))
            return TO_ERROR_LOG("SHA3", 20, "ERROR: Input is invalid type, message=" + JSON.stringify(t)), [0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for(var a, n, s = this.blocks, o = this.byteCount, i = this.blockCount, u = 0, h = this.s; u < e; )
        {
            if(this.reset)
                for(this.reset = !1, s[0] = this.block, a = 1; a < i + 1; ++a)
                    s[a] = 0;
            if(r)
                for(a = this.start; u < e && a < o; ++u)
                    s[a >> 2] |= t[u] << p[3 & a++];
            else
                for(a = this.start; u < e && a < o; ++u)
                    (n = t.charCodeAt(u)) < 128 ? s[a >> 2] |= n << p[3 & a++] : (n < 2048 ? s[a >> 2] |= (192 | n >> 6) << p[3 & a++] : (n < 55296 || 57344 <= n ? s[a >> 2] |= (224 | n >> 12) << p[3 & a++] : (n = 65536 + ((1023 & n) << 10 | 1023 & t.charCodeAt(++u)),
                    s[a >> 2] |= (240 | n >> 18) << p[3 & a++], s[a >> 2] |= (128 | n >> 12 & 63) << p[3 & a++]), s[a >> 2] |= (128 | n >> 6 & 63) << p[3 & a++]),
                    s[a >> 2] |= (128 | 63 & n) << p[3 & a++]);
            if(o <= (this.lastByteIndex = a))
            {
                for(this.start = a - o, this.block = s[i], a = 0; a < i; ++a)
                    h[a] ^= s[a];
                S(h), this.reset = !0;
            }
            else
                this.start = a;
        }
        return this;
    }, R.prototype.encode = function (t,r)
    {
        var e = 255 & t, a = 1, n = [e];
        for(e = 255 & (t >>= 8); 0 < e; )
            n.unshift(e), e = 255 & (t >>= 8), ++a;
        return r ? n.push(a) : n.unshift(a), this.update(n), n.length;
    }, R.prototype.encodeString = function (t)
    {
        var r = "string" != typeof (t = t || "");
        r && t.constructor === c.ArrayBuffer && (t = new Uint8Array(t));
        var e = t.length;
        if(r && ("number" != typeof e || !Array.isArray(t) && (!f || !ArrayBuffer.isView(t))))
            return TO_ERROR_LOG("SHA3", 30, "ERROR: Input is invalid type, str=" + JSON.stringify(t)), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var a = 0;
        if(r)
            a = e;
        else
            for(var n = 0; n < t.length; ++n)
            {
                var s = t.charCodeAt(n);
                s < 128 ? a += 1 : s < 2048 ? a += 2 : s < 55296 || 57344 <= s ? a += 3 : (s = 65536 + ((1023 & s) << 10 | 1023 & t.charCodeAt(++n)),
                a += 4);
            }
        return a += this.encode(8 * a), this.update(t), a;
    }, R.prototype.bytepad = function (t,r)
    {
        for(var e = this.encode(r), a = 0; a < t.length; ++a)
            e += this.encodeString(t[a]);
        var n = r - e % r, s = [];
        return s.length = n, this.update(s), this;
    }, R.prototype.finalize = function ()
    {
        var t = this.blocks, r = this.lastByteIndex, e = this.blockCount, a = this.s;
        if(t[r >> 2] |= this.padding[3 & r], this.lastByteIndex === this.byteCount)
            for(t[0] = t[e], r = 1; r < e + 1; ++r)
                t[r] = 0;
        for(t[e - 1] |= 2147483648, r = 0; r < e; ++r)
            a[r] ^= t[r];
        S(a);
    }, R.prototype.toString = R.prototype.hex = function ()
    {
        this.finalize();
        for(var t, r = this.blockCount, e = this.s, a = this.outputBlocks, n = this.extraBytes, s = 0, o = 0, i = ""; o < a; )
        {
            for(s = 0; s < r && o < a; ++s, ++o)
                t = e[s], i += u[t >> 4 & 15] + u[15 & t] + u[t >> 12 & 15] + u[t >> 8 & 15] + u[t >> 20 & 15] + u[t >> 16 & 15] + u[t >> 28 & 15] + u[t >> 24 & 15];
            o % r == 0 && (S(e), s = 0);
        }
        return n && (t = e[s], 0 < n && (i += u[t >> 4 & 15] + u[15 & t]), 1 < n && (i += u[t >> 12 & 15] + u[t >> 8 & 15]), 2 < n && (i += u[t >> 20 & 15] + u[t >> 16 & 15])),
        i;
    }, R.prototype.buffer = R.prototype.arrayBuffer = function ()
    {
        this.finalize();
        var t, r = this.blockCount, e = this.s, a = this.outputBlocks, n = this.extraBytes, s = 0, o = 0, i = this.outputBits >> 3;
        t = n ? new ArrayBuffer(a + 1 << 2) : new ArrayBuffer(i);
        for(var u = new Uint32Array(t); o < a; )
        {
            for(s = 0; s < r && o < a; ++s, ++o)
                u[o] = e[s];
            o % r == 0 && S(e);
        }
        return n && (u[s] = e[s], t = t.slice(0, i)), t;
    }, R.prototype.digest = R.prototype.array = function ()
    {
        this.finalize();
        for(var t, r, e = this.blockCount, a = this.s, n = this.outputBlocks, s = this.extraBytes, o = 0, i = 0, u = []; i < n; )
        {
            for(o = 0; o < e && i < n; ++o, ++i)
                t = i << 2, r = a[o], u[t] = 255 & r, u[t + 1] = r >> 8 & 255, u[t + 2] = r >> 16 & 255, u[t + 3] = r >> 24 & 255;
            i % e == 0 && S(a);
        }
        return s && (t = i << 2, r = a[o], 0 < s && (u[t] = 255 & r), 1 < s && (u[t + 1] = r >> 8 & 255), 2 < s && (u[t + 2] = r >> 16 & 255)),
        u;
    }, (w.prototype = new R).finalize = function ()
    {
        return this.encode(this.outputBits, !0), R.prototype.finalize.call(this);
    };
    var S = function (t)
    {
        var r, e, a, n, s, o, i, u, h, c, f, p, d, y, l, b, v, _, k, A, g, B, m, O, R, w, S, C, N, x, E, M, J, T, H, I, z, L, U, j,
        D, G, F, V, W, K, Y, q, P, Q, X, Z, $, tt, rt, et, at, nt, st, ot, it, ut, ht;
        for(a = 0; a < 48; a += 2)
            n = t[0] ^ t[10] ^ t[20] ^ t[30] ^ t[40], s = t[1] ^ t[11] ^ t[21] ^ t[31] ^ t[41], o = t[2] ^ t[12] ^ t[22] ^ t[32] ^ t[42],
            i = t[3] ^ t[13] ^ t[23] ^ t[33] ^ t[43], u = t[4] ^ t[14] ^ t[24] ^ t[34] ^ t[44], h = t[5] ^ t[15] ^ t[25] ^ t[35] ^ t[45],
            c = t[6] ^ t[16] ^ t[26] ^ t[36] ^ t[46], f = t[7] ^ t[17] ^ t[27] ^ t[37] ^ t[47], r = (p = t[8] ^ t[18] ^ t[28] ^ t[38] ^ t[48]) ^ (o << 1 | i >>> 31),
            e = (d = t[9] ^ t[19] ^ t[29] ^ t[39] ^ t[49]) ^ (i << 1 | o >>> 31), t[0] ^= r, t[1] ^= e, t[10] ^= r, t[11] ^= e, t[20] ^= r,
            t[21] ^= e, t[30] ^= r, t[31] ^= e, t[40] ^= r, t[41] ^= e, r = n ^ (u << 1 | h >>> 31), e = s ^ (h << 1 | u >>> 31), t[2] ^= r,
            t[3] ^= e, t[12] ^= r, t[13] ^= e, t[22] ^= r, t[23] ^= e, t[32] ^= r, t[33] ^= e, t[42] ^= r, t[43] ^= e, r = o ^ (c << 1 | f >>> 31),
            e = i ^ (f << 1 | c >>> 31), t[4] ^= r, t[5] ^= e, t[14] ^= r, t[15] ^= e, t[24] ^= r, t[25] ^= e, t[34] ^= r, t[35] ^= e,
            t[44] ^= r, t[45] ^= e, r = u ^ (p << 1 | d >>> 31), e = h ^ (d << 1 | p >>> 31), t[6] ^= r, t[7] ^= e, t[16] ^= r, t[17] ^= e,
            t[26] ^= r, t[27] ^= e, t[36] ^= r, t[37] ^= e, t[46] ^= r, t[47] ^= e, r = c ^ (n << 1 | s >>> 31), e = f ^ (s << 1 | n >>> 31),
            t[8] ^= r, t[9] ^= e, t[18] ^= r, t[19] ^= e, t[28] ^= r, t[29] ^= e, t[38] ^= r, t[39] ^= e, t[48] ^= r, t[49] ^= e, y = t[0],
            l = t[1], K = t[11] << 4 | t[10] >>> 28, Y = t[10] << 4 | t[11] >>> 28, C = t[20] << 3 | t[21] >>> 29, N = t[21] << 3 | t[20] >>> 29,
            ot = t[31] << 9 | t[30] >>> 23, it = t[30] << 9 | t[31] >>> 23, G = t[40] << 18 | t[41] >>> 14, F = t[41] << 18 | t[40] >>> 14,
            T = t[2] << 1 | t[3] >>> 31, H = t[3] << 1 | t[2] >>> 31, b = t[13] << 12 | t[12] >>> 20, v = t[12] << 12 | t[13] >>> 20, q = t[22] << 10 | t[23] >>> 22,
            P = t[23] << 10 | t[22] >>> 22, x = t[33] << 13 | t[32] >>> 19, E = t[32] << 13 | t[33] >>> 19, ut = t[42] << 2 | t[43] >>> 30,
            ht = t[43] << 2 | t[42] >>> 30, tt = t[5] << 30 | t[4] >>> 2, rt = t[4] << 30 | t[5] >>> 2, I = t[14] << 6 | t[15] >>> 26,
            z = t[15] << 6 | t[14] >>> 26, _ = t[25] << 11 | t[24] >>> 21, k = t[24] << 11 | t[25] >>> 21, Q = t[34] << 15 | t[35] >>> 17,
            X = t[35] << 15 | t[34] >>> 17, M = t[45] << 29 | t[44] >>> 3, J = t[44] << 29 | t[45] >>> 3, O = t[6] << 28 | t[7] >>> 4,
            R = t[7] << 28 | t[6] >>> 4, et = t[17] << 23 | t[16] >>> 9, at = t[16] << 23 | t[17] >>> 9, L = t[26] << 25 | t[27] >>> 7,
            U = t[27] << 25 | t[26] >>> 7, A = t[36] << 21 | t[37] >>> 11, g = t[37] << 21 | t[36] >>> 11, Z = t[47] << 24 | t[46] >>> 8,
            $ = t[46] << 24 | t[47] >>> 8, V = t[8] << 27 | t[9] >>> 5, W = t[9] << 27 | t[8] >>> 5, w = t[18] << 20 | t[19] >>> 12, S = t[19] << 20 | t[18] >>> 12,
            nt = t[29] << 7 | t[28] >>> 25, st = t[28] << 7 | t[29] >>> 25, j = t[38] << 8 | t[39] >>> 24, D = t[39] << 8 | t[38] >>> 24,
            B = t[48] << 14 | t[49] >>> 18, m = t[49] << 14 | t[48] >>> 18, t[0] = y ^ ~b & _, t[1] = l ^ ~v & k, t[10] = O ^ ~w & C, t[11] = R ^ ~S & N,
            t[20] = T ^ ~I & L, t[21] = H ^ ~z & U, t[30] = V ^ ~K & q, t[31] = W ^ ~Y & P, t[40] = tt ^ ~et & nt, t[41] = rt ^ ~at & st,
            t[2] = b ^ ~_ & A, t[3] = v ^ ~k & g, t[12] = w ^ ~C & x, t[13] = S ^ ~N & E, t[22] = I ^ ~L & j, t[23] = z ^ ~U & D, t[32] = K ^ ~q & Q,
            t[33] = Y ^ ~P & X, t[42] = et ^ ~nt & ot, t[43] = at ^ ~st & it, t[4] = _ ^ ~A & B, t[5] = k ^ ~g & m, t[14] = C ^ ~x & M,
            t[15] = N ^ ~E & J, t[24] = L ^ ~j & G, t[25] = U ^ ~D & F, t[34] = q ^ ~Q & Z, t[35] = P ^ ~X & $, t[44] = nt ^ ~ot & ut,
            t[45] = st ^ ~it & ht, t[6] = A ^ ~B & y, t[7] = g ^ ~m & l, t[16] = x ^ ~M & O, t[17] = E ^ ~J & R, t[26] = j ^ ~G & T, t[27] = D ^ ~F & H,
            t[36] = Q ^ ~Z & V, t[37] = X ^ ~$ & W, t[46] = ot ^ ~ut & tt, t[47] = it ^ ~ht & rt, t[8] = B ^ ~y & b, t[9] = m ^ ~l & v,
            t[18] = M ^ ~O & w, t[19] = J ^ ~R & S, t[28] = G ^ ~T & I, t[29] = F ^ ~H & z, t[38] = Z ^ ~V & K, t[39] = $ ^ ~W & Y, t[48] = ut ^ ~tt & et,
            t[49] = ht ^ ~rt & at, t[0] ^= ct[a], t[1] ^= ct[a + 1];
    };
    c.sha3_str = v.sha3_256, c.sha3_array_256 = v.sha3_array_256, c.sha3 = v.sha3_array_256, c.sha = function (t)
    {
        return meshhash(v.sha3_256(t));
    }, c.shaarr = function (t)
    {
        return meshhash(v.sha3_array_256(t));
    }, c.shabuf = function (t)
    {
        return Buffer.from(shaarr(t));
    }, c.shaarrblock = function (t,r)
    {
        return !r || r < global.START_NEW_ALGO ? meshhash(v.sha3_array_256(t), r) : meshhash2(v.sha3_array_256(t), r);
    };
}();
