/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

module.exports = function ()
{
    "use strict";
    
function u(e)
    {
        for(var t = 1; t < arguments.length; t++)
            e = e.replace("%" + t, arguments[t]);
        return e;
    };
    this.ErrorIgnore = !1, this.ErrorOne = !0, this.CommentIgnore = !0, this.PrintMargin = 120, this.FileNumber = 0, this.InjectCheck = !1,
    this.SideMode = "client", this.Clear = function ()
    {
        this.buf = "", this.stream = "", this.bWasBackSlash = !1, this.pos = 0, this.start = 0, this.beforeRegExp = 0, this.value = "",
        this.type = "", this.BlockLevel = 0, this.LastStreamValue = "", this.CountCol = 0, this.ErrCount = 0, this.WasEnter = !1, this.lastComment = 0,
        this.lastAddCode =  - 1, this.LineNumber = 0, this.posLineNumber = 0, this.IgnoreCodeLevel = !1, this.AddToStream = this.AddToStreamAddTab;
    }, this.AllowedWords = {true:1, false:1, undefined:1, Infinity:1, NaN:1, null:1, this:5, arguments:5}, this.KeyWords = {break:1,
        return:1, case:1, do:1, if:1, switch:1, var:1, throw:1, while:1, default:1, for:1, try:1, continue:1, with:1, function:3, void:3,
        new:3, delete:3, typeof:3, finally:5, catch:5, else:5, instanceof:4, in:4}, this.ProcessWords = {break:"break", return:"return",
        case:"case", do:"do", if:"if", switch:"switch", var:"var", throw:"throw", with:"with", while:"while", default:"default", for:"for",
        try:"try", continue:"continue", function:"function", void:"void", new:"new", delete:"delete", typeof:"typeof", finally:"finally",
        catch:"catch", else:"else"}, this.enIndenifier = "1", this.enString = "2", this.enNumber = "3", this.enSpaces = "4", this.enNewLine = "5",
    this.enComments = "6", this.enRegular = "7", this.enOperator = "O", this.enEndFile = "EoF", this.lexTypeAll = new Array(65536),
    this.lexTypeIdentifier = new Array(65536), this.lexTypeNumbers = new Array(65536), this.lexTypeNumbers16 = new Array(65536),
    this.lexTypeSpaces = new Array(65536), this.lexTypeNewLines = new Array(65536), this.lexTypeRegStart = new Array(65536), this.SpacesArray = new Array(100),
    this.Init = function ()
    {
        this.ExportMap = {};
        var e = "0123456789", t = " \t\b\f\v \u2028\u2029\f", s = "\n\r";
        r("N", e, this.lexTypeAll), r("C", "~!%^&*-+/<>`@#()=\\|{}[];':\"?,.", this.lexTypeAll), r("S", t, this.lexTypeAll), r("M",
        s, this.lexTypeAll), h("L", this.lexTypeAll, this.lexTypeAll), r("N", e, this.lexTypeNumbers), r("N", "0123456789ABCDEFabcdef",
        this.lexTypeNumbers16), r("S", t, this.lexTypeSpaces), r("M", s, this.lexTypeNewLines), r("R", "`~!#%^&*(+|-=\\[{};:,?<>",
        this.lexTypeRegStart), h("L", this.lexTypeAll, this.lexTypeIdentifier), r("N", e, this.lexTypeIdentifier), n(this.lexTypeAll),
        n(this.lexTypeNumbers), n(this.lexTypeNumbers16), n(this.lexTypeSpaces), n(this.lexTypeNewLines), n(this.lexTypeRegStart),
        n(this.lexTypeIdentifier), this.SpacesArray[0] = "", this.SpacesArray[1] = "";
        for(var i = 2; i < 100; i++)
            this.SpacesArray[i] = this.SpacesArray[i - 1] + "    ";
        
function r(e,t,s)
        {
            for(var i = 0; i < t.length; i++)
            {
                s[t.charCodeAt(i)] = e;
            }
        };
        
function h(e,t,s)
        {
            for(var i = 32; i < 65536; i++)
                t[i] && "L" != t[i] || (s[i] = "L");
            s[92] = "L";
        };
        
function n(e)
        {
            for(var t = 0; t < 65536; t++)
                e[t] = e[t] || !1;
        };
    }, this.Init(), this.Error = function ()
    {
        for(var e = u.apply(this, arguments), t = 0, s = this.start; 0 <= s; s--)
            if("\n" == this.buf[s] || "\r" == this.buf[s])
            {
                t = s + 1;
                break;
            }
        var i = this.buf.length - 1;
        for(s = this.pos; s < this.buf.length; s++)
            if("\n" == this.buf[s] || "\r" == this.buf[s])
            {
                i = s;
                break;
            }
        var r = 1;
        for(s = 0; s < this.start; s++)
            "\n" == this.buf[s] && r++;
        var h, n = this.start + 1 - t, a = "", o = "";
        100 < this.start - t && (t = this.start - 100, a = "..."), 100 < i - this.start && (i = this.start + 100, o = "..."), this.ErrCount++,
        h = !this.ErrorOne && this.ErrorIgnore ? " <<err:" + this.ErrCount + ">> " : " <<?>> ";
        var d = this.buf.substring(t, this.start) + h + this.buf.substring(this.start, i), c = "SyntaxError: " + e + ". " + u("At line: %1 col: %2",
        r - 1, n - 1) + "\n" + a + d + o;
        if(this.ErrorIgnore)
        {
            if(console.log(c), this.stream += h, this.stream += this.value + " ", !this.ErrorOne)
                return void this.NotBackPos();
            this.stream += "\n\n" + c;
        }
        throw c;
    }, this.code_base = "\0\b\t\n\v\f\r !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя",
    this.FromBackSlashString = function (e)
    {
        for(var t = "", s = 0; s < e.length; s++)
        {
            if("\\" == (i = e[s]))
                switch(e[s + 1])
                {
                    case "r":
                        s += 1, t += "\r";
                        break;
                    case "n":
                        s += 1, t += "\n";
                        break;
                    case "t":
                        s += 1, t += "\t";
                        break;
                    case "b":
                        s += 1, t += "\b";
                        break;
                    case "f":
                        s += 1, t += "\f";
                        break;
                    case "u":
                        var i = e.substring(s + 2, s + 6), r = parseInt(i);
                        isNaN(r) ? this.Error("Unrecognize unicode symbol: '%1'", "\\u" + i) : t += String.fromCharCode(r), s += 5;
                        break;
                    case "x":
                        i = e.substring(s + 2, s + 4), r = parseInt(i, 16);
                        isNaN(r) ? this.Error("Unrecognize Latin symbol: '%1'", "\\x" + i) : t += this.code_base.charAt(r), s += 3;
                        break;
                    default:
                        var h = e.charCodeAt(s + 1);
                        if("N" == this.lexTypeNumbers[h])
                        {
                            i = e.substring(s + 1, s + 4), r = parseInt(i, 8);
                            isNaN(r) ? this.Error("Unrecognize Latin symbol: '%1'", "\\" + i) : t += this.code_base.charAt(r), s += 3;
                        }
                }
            else
                t += i;
        }
        return t;
    }, this.PosString = function ()
    {
        var e = this.buf[this.pos];
        for(this.pos++; this.pos < this.buf.length; )
        {
            var t = this.buf[this.pos];
            if(t == e)
                return void this.pos++;
            if("\\" == t)
                this.pos++, this.bWasBackSlash = !0;
            else
                if("\n" == t)
                    return void this.Error("Found end of line during calculate string");
            this.pos++;
        }
        this.Error("Found end of file during calculate string");
    }, this.PosRegExp = function ()
    {
        this.Error("RegExp not support");
    }, this.PosCurrentType = function (e)
    {
        for(; this.pos < this.buf.length; )
        {
            var t = this.buf.charCodeAt(this.pos);
            if(!e[t])
                break;
            92 == t && (this.bWasBackSlash = !0), this.pos++;
        }
    }, this.PosIdentifier = function ()
    {
        this.PosCurrentType(this.lexTypeIdentifier);
    }, this.PosSpaces = function ()
    {
        this.PosCurrentType(this.lexTypeSpaces);
    }, this.PosNewLines = function ()
    {
        this.PosCurrentType(this.lexTypeNewLines);
    }, this.PosNumber = function ()
    {
        if("0" != this.buf[this.pos])
        {
            if(this.PosCurrentType(this.lexTypeNumbers), "." == this.buf[this.pos] && (this.pos++, this.PosCurrentType(this.lexTypeNumbers)),
            "e" == this.buf[this.pos] || "E" == this.buf[this.pos])
            {
                this.pos++;
                var e = this.buf[this.pos];
                "+" != e && "-" != e || this.pos++;
                var t = this.pos;
                this.PosCurrentType(this.lexTypeNumbers), t == this.pos && this.Error("Unrecognize exponent number");
            }
            var s = this.buf.charCodeAt(this.pos);
            "L" == this.lexTypeAll[s] && this.Error("Unrecognize number");
        }
        else
        {
            this.pos++;
            var i = this.buf[this.pos];
            "x" == i || "X" == i ? (this.pos++, this.PosCurrentType(this.lexTypeNumbers16)) : ("." == i && this.pos++, this.PosCurrentType(this.lexTypeNumbers));
        }
    }, this.PosCommentsOneLine = function ()
    {
        for(; this.pos < this.buf.length; )
        {
            var e = this.buf[this.pos];
            if("\n" == e)
                break;
            if("\r" == e)
                break;
            this.pos++;
        }
    }, this.PosCommentsMultiLine = function ()
    {
        for(; this.pos < this.buf.length; )
        {
            if("*/" == this.buf[this.pos] + this.buf[this.pos + 1])
            {
                this.pos += 2;
                break;
            }
            this.pos++;
        }
    }, this.BackPos = function ()
    {
        this.type != this.enEndFile && (this.pos = this.start);
    }, this.NotBackPos = function ()
    {
        this.pos == this.start && this.PosNextItem();
    }, this.PosNextToken = function ()
    {
        for(this.WasEnter = !1; ; )
            switch(this.PosNextItem(), this.type)
            {
                case this.enNewLine:
                    this.WasEnter = !0;
                    break;
                case this.enSpaces:
                case this.enComments:
                    break;
                default:
                    return this.type;
            }
    }, this.PosNextItem = function ()
    {
        if(this.start = this.pos, this.pos >= this.buf.length)
            return this.type = this.enEndFile, this.enEndFile;
        var e = this.buf.charCodeAt(this.pos);
        switch(this.lexTypeAll[e])
        {
            case "L":
                return this.bWasBackSlash = !1, this.PosIdentifier(), this.value = this.buf.substring(this.start, this.pos), this.bWasBackSlash && (this.value = this.FromBackSlashString(this.value)),
                this.beforeRegExp = 65, this.type = this.enIndenifier, "in" == this.value || "of" == this.value || "instanceof" == this.value ? this.value : this.enIndenifier;
            case "N":
                return this.PosNumber(), this.value = this.buf.substring(this.start, this.pos), this.beforeRegExp = 48, this.type = this.enNumber,
                this.enNumber;
            case "S":
                return this.PosSpaces(), this.type = this.enSpaces, this.enSpaces;
            case "M":
                return this.PosNewLines(), this.type = this.enNewLine, this.enNewLine;
            case "C":
                var t = this.buf[this.pos];
                switch(t)
                {
                    case '"':
                    case "'":
                        return this.bWasBackSlash = !1, this.PosString(), this.value = this.buf.substring(this.start, this.pos), this.beforeRegExp = 65,
                        this.type = this.enString, this.enString;
                    case "/":
                        var s = this.buf[this.pos + 1];
                        if("/" == s)
                            return this.PosCommentsOneLine(), !this.CommentIgnore && this.lastComment <= this.start && (this.lastComment = this.start + 1,
                            this.value = this.buf.substring(this.start, this.pos), this.AddToStream(this.value), this.AddToStream("\n")), this.type = this.enComments,
                            this.enComments;
                        if("*" == s)
                            return this.PosCommentsMultiLine(), !this.CommentIgnore && this.lastComment <= this.start && (this.lastComment = this.start + 1,
                            this.value = this.buf.substring(this.start, this.pos), this.AddToStream(this.value), "\n" == this.buf[this.pos] && (this.AddToStream("\n"),
                            this.pos++)), this.type = this.enComments, this.enComments;
                        if("R" == this.lexTypeRegStart[this.beforeRegExp])
                        {
                            for(this.PosRegExp(), this.beforeRegExp = 65; 0 <= "gmi".indexOf(this.buf[this.pos]); )
                                this.pos++;
                            return this.value = this.buf.substring(this.start, this.pos), this.type = this.enRegular, this.enRegular;
                        }
                        t += this.AddNextOperator("=");
                        break;
                    case "/":
                        this.beforeRegExp = 0, t += this.AddNextOperator("=");
                        break;
                    case "=":
                        t += this.AddNextOperator("="), t += this.AddNextOperator("=");
                        break;
                    case ">":
                        if(t += this.AddNextOperator(">"), ">>=" == (t += this.AddNextOperator("=")))
                            break;
                        t += this.AddNextOperator(">"), t += this.AddNextOperator("=");
                        break;
                    case "<":
                        t += this.AddNextOperator("<"), t += this.AddNextOperator("=");
                        break;
                    case "!":
                        t += this.AddNextOperator("="), t += this.AddNextOperator("=");
                        break;
                    case "~":
                        break;
                    case "+":
                        if("++" == (t += this.AddNextOperator("+")))
                            break;
                        t += this.AddNextOperator("=");
                        break;
                    case "-":
                        if("--" == (t += this.AddNextOperator("-")))
                            break;
                        t += this.AddNextOperator("=");
                        break;
                    case "*":
                        t += this.AddNextOperator("=");
                        break;
                    case "&":
                        if("&&" == (t += this.AddNextOperator("&")))
                            break;
                        t += this.AddNextOperator("=");
                        break;
                    case "|":
                        if("||" == (t += this.AddNextOperator("|")))
                            break;
                        t += this.AddNextOperator("=");
                        break;
                    case "^":
                    case "%":
                        t += this.AddNextOperator("=");
                        break;
                    case ".":
                        var i = this.buf.charCodeAt(this.pos + 1);
                        if(this.lexTypeNumbers[i])
                            return this.pos++, this.PosNumber(), this.value = this.buf.substring(this.start, this.pos), this.beforeRegExp = 48, this.type = this.enNumber,
                            this.enNumber;
                }
                return this.beforeRegExp = e, this.value = t, this.pos++, this.type = t;
            default:
                this.Error("Unrecognize symbol: '%1'", e);
        }
        return this.type = this.enNewLine, this.enNewLine;
    }, this.AddNextOperator = function (e)
    {
        var t = this.buf[this.pos + 1];
        return t == e ? (this.pos++, t) : "";
    }, this.ParseLexem = function (e,t)
    {
        this.Clear(), this.buf = e, this.beforeRegExp = 61;
        for(var s = ""; ; )
        {
            if(this.PosNextItem() == this.enEndFile)
                break;
            t && (s = s + this.value + "\n");
        }
        return s && console.log(s), s;
    }, this.ParseLexem2 = function (e)
    {
        this.Clear(), this.buf = e, this.beforeRegExp = 61;
        for(var t = 0, s = new Uint32Array(e.length), i = new Uint32Array(e.length); ; )
        {
            if(this.PosNextItem() == this.enEndFile)
                break;
            s[t] = this.start, i[t] = this.pos, t++;
        }
        return {Value1:s, Value2:i};
    }, this.ParseCode = function (e)
    {
        this.Clear(), this.buf = e, this.ParseBlock();
    }, this.ParseBlock = function (e,t,s,i)
    {
        t || this.BlockLevel++;
        var r = this.IgnoreCodeLevel, h = !1;
        this.beforeRegExp = 61;
        e:
        for(; ; )
        {
            var n = this.pos, a = this.PosNextToken();
            if(!i && !s && !h)
                switch(a)
                {
                    case ";":
                    case ":":
                    case "{":
                    case "}":
                    case this.enEndFile:
                        break;
                    case this.enIndenifier:
                    default:
                        this.AddCheckLineToStream();
                }
            switch(a)
            {
                case ";":
                    h = !1;
                    break;
                case ":":
                    this.Error("Unexpected token: '%1'", this.GetTokenName(a)), h = !1;
                    break;
                case "{":
                    this.AddNewLineToStream("{\n", !0), this.ParseBlock("}"), this.AddNewLineToStream("}\n", !0), h = !1;
                    break;
                case "}":
                case this.enEndFile:
                    break e;
                case this.enIndenifier:
                    i = !1;
                    var o = this.value;
                    if(1 == this.KeyWords[o] || "function" == o)
                    {
                        this["Parse_" + this.ProcessWords[o]](), s || this.AddNewLineToStream(";\n"), a = this.type;
                        break;
                    }
                default:
                    this.pos = n, ":" === (a = this.ParseExpressionWithComma(!1, !1, !0)) ? h = !0 : (h = !1, s || this.AddNewLineToStream(";\n"));
            }
            if(t && ":" != a)
                break;
        }
        return e &&  - 1 == e.indexOf(a) && this.Error("Error block closing. Unexpected token: '%1'", this.GetTokenName(a)), this.IgnoreCodeLevel = r,
        t || this.BlockLevel--, a;
    }, this.ParseOneBlock = function ()
    {
        if("{" == (e = this.PosNextToken()))
        {
            this.AddNewLineToStream("\n"), this.AddNewLineToStream("{\n", !0);
            var e = this.ParseBlock("}");
            this.AddNewLineToStream("}\n", !0);
        }
        else
            if(";" == e)
                this.InjectCheck ? (this.AddCheckLineToStream(), this.AddNewLineToStream("\n")) : this.AddNewLineToStream(";\n");
            else
                if(this.InjectCheck)
                {
                    this.AddNewLineToStream("\n"), this.AddNewLineToStream("{\n", !0), this.BackPos();
                    e = this.ParseBlock(!1, !0);
                    this.AddNewLineToStream("}\n", !0);
                }
                else
                    this.AddNewLineToStream("\n"), this.BackPos(), this.BlockLevel++, e = this.ParseBlock(!1, !0), this.BlockLevel--;
        return ";" == e && this.NotBackPos(), e;
    }, this.ParseExpressionWithComma = function (e,t,s)
    {
        var i;
        for(e && (i = "," + e); ; )
        {
            var r = this.pos, h = this.ParseExpression(i, t, s);
            if("," != h)
                break;
            r != this.pos && i || this.PosNextItem(), s = !1, this.CountCol <= this.PrintMargin ? this.AddToStream(", ") : this.AddNewLineToStream(",\n",
            !0);
        }
        return h;
    }, this.ParseExpression = function (e,t,s)
    {
        var i, r = !1, h = !1, n = !1;
        this.beforeRegExp = 61;
        e:
        for(; ; )
        {
            var a = this.PosNextItem();
            switch(a)
            {
                case this.enSpaces:
                case this.enComments:
                    continue;
                case this.enNewLine:
                    n = !1, this.WasEnter = !0;
                    continue;
                case this.enNumber:
                case this.enIndenifier:
                case this.enString:
                case this.enRegular:
                case "{":
                    if(r)
                        break e;
            }
            switch(a)
            {
                case this.enIndenifier:
                    var o = this.value, d = this.KeyWords[o];
                    if(3 == d)
                        this["Parse_" + this.ProcessWords[o]]();
                    else
                    {
                        if(1 == d || 5 == d)
                        {
                            a = this.enOperator, this.BackPos();
                            break e;
                        }
                        if(this.AllowedWords[o] || (o = "__" + o), this.AddToStream(o), s)
                        {
                            var c = this.pos;
                            if(":" == (u = this.PosNextToken()))
                                return a = u, r = !0, this.AddNewLineToStream(":\n", !0), ":";
                            this.pos = c;
                        }
                    }
                    r = h = n = !0;
                    break;
                case this.enNumber:
                case this.enString:
                case this.enRegular:
                    this.AddToStream(this.value), r = h = !(n = !1);
                    break;
                case "{":
                    this.ParseDefObject(), r = h = !(n = !1);
                    break;
                case "[":
                    this.ParseDefArray(), r = h = n = !0;
                    break;
                case "(":
                    this.ParseFunctionCall(h), r = h = n = !0;
                    break;
                case ".":
                    h || this.Error("Unexpected token: '%1'", a), this.AddToStream("."), this.RequireIndenifier(), r = h = n = !0;
                    break;
                case "?":
                    r || this.Error("Require expression before token: '%1'", a), this.ParseIfCondition(), r = !(h = n = !1);
                    break;
                case "=":
                case "+=":
                    n || this.Error("Unexpected token: '%1'", a), this.AddToStream(" " + a + " "), this.AddToStream("CHCK_LENGTH(");
                    var u = this.ParseExpression(void 0, !1, !1);
                    return this.AddToStream(")"), u;
                case "-=":
                case "*=":
                case "/=":
                case ">>=":
                case "<<=":
                case ">>>=":
                case "&=":
                case "|=":
                case "^=":
                case "%=":
                    n || this.Error("Unexpected token: '%1'", a), this.AddToStream(" " + a + " "), r = h = n = !1;
                    break;
                case "!":
                case "~":
                    this.AddToStream(a), h = n = !1;
                    break;
                case "==":
                case "===":
                case "!=":
                case "!==":
                case ">=":
                case "<=":
                case ">":
                case "<":
                case "~":
                case "^":
                case "&":
                case "|":
                case "<<":
                case ">>":
                case ">>>":
                case "%":
                case "*":
                case "/":
                case "&&":
                case "||":
                    r || this.Error("Require expression before token: '%1'", a), r = !1, this.AddToStream(" " + a + " "), h = n = !1;
                    break;
                case "-":
                case "+":
                    r = !1, this.AddToStream(" " + a + " "), h = n = !1;
                    break;
                case "++":
                case "--":
                    if(this.WasEnter && r)
                    {
                        a = ";";
                        break e;
                    }
                    r && (h || this.Error("Invalid left-side argument before token: '%1'", a)), this.AddToStream(a), h = n = !1;
                    break;
                case "in":
                case "of":
                case "instanceof":
                    r || this.Error("Invalid argument before: '%1'", a), this.AddToStream(" " + a + " "), this.ParseExpressionWithComma(!1, !1),
                    h = n = !(r = !0);
                    break;
                case ",":
                case ";":
                case ")":
                case "]":
                case "}":
                case ":":
                case this.enEndFile:
                    break e;
                default:
                    this.Error("Unexpected token: '%1'", a);
            }
            this.WasEnter = !1;
        }
        e ?  - 1 == e.indexOf(a) && (a == this.enOperator ? this.Error("Unexpected keywords: '%1'", o) : (i = this.GetTokenName(a)) == a ? this.Error("Error expression closing. Unexpected token: '%1'",
        i) : this.Error("Error expression closing. Unexpected %1", i)) : this.BackPos();
        t || r || ((i = a == this.enOperator ? o : this.GetTokenName(a)) == a ? this.Error("Require expression before token: '%1'",
        i) : this.Error("Require expression before: %1", i));
        return a;
    }, this.GetTokenName = function (e)
    {
        switch(e)
        {
            case this.enNumber:
                return "number";
            case this.enIndenifier:
                return "indenifier";
            case this.enString:
                return "string";
            case this.enRegular:
                return "regular";
            case this.enEndFile:
                return "End of file";
            default:
                return e;
        }
    }, this.RequireChar = function (e)
    {
        this.PosNextToken() != e && this.Error("Require token: '%1'", e);
    }, this.RequireIndenifier = function (e)
    {
        return (this.PosNextToken() != this.enIndenifier || e && this.value != e) && (e ? this.Error("Require indenifier: '%1'", e) : this.Error("Require indenifier")),
        this.AddToStream(this.value), this.value;
    }, this.RequireIndenifierOptional = function ()
    {
        this.PosNextToken() != this.enIndenifier ? this.BackPos() : this.AddToStream(" " + this.value);
    }, this.HasEnter = function ()
    {
        return this.PosNextToken(), this.BackPos(), this.WasEnter;
    }, this.Parse_var = function ()
    {
        this.AddToStream("var "), this.ParseExpressionWithComma(!1, !0);
    }, this.Parse_function = function (e)
    {
        var t;
        e || this.AddToStream("function ");
        var s = this.PosNextToken();
        s == this.enIndenifier ? (t = this.value, e ? this.AddToStream(t) : this.AddToStream("__" + t), s = this.PosNextToken()) : e && this.Error("Require name before: '%1'",
        s), "(" != s && this.Error("Require token: '%1'", "("), this.AddToStream("(");
        for(var i = !1; ; )
        {
            if((s = this.PosNextToken()) == this.enIndenifier)
            {
                var r = this.value;
                if(this.AddToStream("__" + r), "," == (s = this.PosNextToken()))
                {
                    this.AddToStream(","), i = !0;
                    continue;
                }
                i = !1;
            }
            else
                if(i)
                {
                    this.Error("Require indenifier");
                    break;
                }
            if(")" == s)
                break;
            this.Error("Require indenifier");
        }
        t && ((s = this.PosNextToken()) == this.enIndenifier && "export" === this.value ? this.ExportMap[t] = 1 : this.BackPos()),
        this.RequireChar("{"), this.AddNewLineToStream(")\n", !0), this.AddNewLineToStream("{\n", !0), this.InjectCheck && (this.AddCheckLineToStream(30),
        this.AddToStream("for(var i=0;i<arguments.length;i++) CHCK_LENGTH0(arguments[i]);\n")), this.ParseBlock("}", !1, !1, !1), this.AddNewLineToStream("\n"),
        this.AddToStream("}", "} ");
    }, this.ParseFunctionCall = function (e)
    {
        this.AddToStream("("), this.ParseExpressionWithComma(")", !0), this.AddToStream(")");
    }, this.Parse_void = function ()
    {
        this.AddToStream("void ");
        this.ParseExpression();
    }, this.Parse_new = function ()
    {
        this.AddToStream("new ");
        this.ParseExpression();
    }, this.Parse_delete = function ()
    {
        this.AddToStream("delete "), this.ParseExpression();
    }, this.ParseIfCondition = function ()
    {
        this.AddToStream(" ? "), this.ParseExpression(":"), this.AddToStream(" : "), this.ParseExpression();
    }, this.ParseDefArray = function ()
    {
        this.AddToStream("["), this.ParseExpressionWithComma("]", !0), this.AddToStream("]");
    }, this.ParseDefObject = function ()
    {
        for(this.BlockLevel++, this.AddToStream("{"); ; )
        {
            var e = this.PosNextToken();
            if(e == this.enIndenifier || e == this.enString || e == this.enNumber)
            {
                var t = this.value;
                e = "get" === t || "set" === t ? ":" == (e = this.PosNextToken()) ? (this.AddToStream(t + ":"), this.ParseExpression(",}")) : (this.AddToStream(t + " "),
                this.BackPos(), this.Parse_function(!0), this.PosNextToken()) : (this.RequireChar(":"), this.AddToStream(t + ":"), this.ParseExpression(",}"));
            }
            if("}" == e)
                break;
            if("," != e)
            {
                this.Error("Unexpected token: '%1'", this.GetTokenName(e));
                break;
            }
            this.CountCol <= this.PrintMargin ? this.AddToStream(", ") : this.AddNewLineToStream(",\n", !0);
        }
        this.BlockLevel--, this.AddToStream("}", "} ");
    }, this.Parse_break = function ()
    {
        this.AddToStream("break"), this.HasEnter() || this.RequireIndenifierOptional();
    }, this.Parse_continue = function ()
    {
        this.AddToStream("continue"), this.HasEnter() || this.RequireIndenifierOptional();
    }, this.Parse_return = function ()
    {
        this.AddToStream("return "), this.HasEnter() || this.ParseExpressionWithComma(!1, !0);
    }, this.Parse_typeof = function ()
    {
        this.AddToStream("typeof "), this.ParseExpression();
    }, this.Parse_for = function ()
    {
        this.AddToStream("for("), this.RequireChar("(");
        var e, t, s = !1, i = !1, r = this.pos;
        ((t = this.PosNextToken()) == this.enIndenifier && ("var" == this.value && (t = this.PosNextToken(), i = !0), t == this.enIndenifier && (e = this.value,
        (t = this.PosNextToken()) != this.enIndenifier || "in" != this.value && "of" != this.value || (s = !0))), s) ? (i && this.AddToStream("var "),
        this.AddToStream("__" + e + " " + this.value + " ")) : (this.pos = r, ";" == (t = this.ParseBlock(";", !0, !0)) && this.NotBackPos(),
        this.AddToStream("; "), this.ParseExpressionWithComma(";", !0), this.AddToStream("; "));
        this.ParseExpressionWithComma(")", !0), this.AddToStream(")"), this.ParseOneBlock();
    }, this.Parse_while = function ()
    {
        this.RequireChar("("), this.AddToStream("while("), this.ParseExpressionWithComma(")"), this.AddToStream(")"), this.ParseOneBlock();
    }, this.Parse_do = function ()
    {
        this.AddToStream("do"), this.ParseOneBlock(), this.RequireIndenifier("while"), this.RequireChar("("), this.AddToStream("("),
        this.ParseExpressionWithComma(")"), this.AddToStream(")");
    }, this.Parse_if = function ()
    {
        this.AddToStream("if("), this.RequireChar("("), this.ParseExpressionWithComma(")"), this.AddToStream(")"), this.ParseOneBlock(),
        this.PosNextToken() == this.enIndenifier && "else" == this.ProcessWords[this.value] ? (this.AddToStream("else"), this.ParseOneBlock()) : this.BackPos();
    }, this.Parse_switch = function ()
    {
        this.RequireChar("("), this.AddToStream("switch("), this.ParseExpressionWithComma(")"), this.RequireChar("{"), this.AddNewLineToStream(")\n",
        !0), this.AddNewLineToStream("{\n", !0), this.BlockLevel++, this.ParseBlock("}", !1, !1, !0), this.BlockLevel--, this.AddNewLineToStream("}\n",
        !0);
    }, this.Parse_case = function ()
    {
        this.BlockLevel--, this.AddToStream("case "), this.ParseExpressionWithComma(":"), this.AddNewLineToStream(":\n", !0), this.BlockLevel++;
    }, this.Parse_default = function ()
    {
        this.RequireChar(":"), this.BlockLevel--, this.AddNewLineToStream("default:\n", !0), this.BlockLevel++;
    }, this.Parse_with = function ()
    {
        this.RequireChar("("), this.AddToStream("with("), this.ParseExpressionWithComma(")"), this.AddToStream(")"), this.ParseOneBlock();
    }, this.Parse_try = function ()
    {
        this.RequireChar("{"), this.AddToStream("try\n"), this.AddNewLineToStream("{\n", !0), this.ParseBlock("}"), this.AddNewLineToStream("}\n",
        !0);
        var e = this.PosNextToken();
        e == this.enIndenifier && "catch" == this.ProcessWords[this.value] && (this.AddToStream("catch("), this.RequireChar("("), this.RequireIndenifier(),
        this.RequireChar(")"), this.AddNewLineToStream(")\n", !0), this.AddNewLineToStream("{\n", !0), this.RequireChar("{"), this.ParseBlock("}"),
        this.AddToStream("}"), e = this.PosNextToken()), e == this.enIndenifier && "finally" == this.ProcessWords[this.value] ? (this.RequireChar("{"),
        this.AddNewLineToStream("\n"), this.AddNewLineToStream("finally\n", !0), this.AddNewLineToStream("{\n", !0), this.ParseBlock("}"),
        this.AddToStream("}")) : this.BackPos();
    }, this.Parse_throw = function ()
    {
        if(this.AddToStream("throw "), !this.HasEnter())
            this.ParseExpressionWithComma();
    }, this.AddCheckLineToStream = function (e)
    {
        this.InjectCheck && (e || (e = 1), this.CalculateLineNumber(), this.AddToStream("DO(" + e + ");"));
    }, this.CalculateLineNumber = function ()
    {
        for(var e = this.posLineNumber; e < this.pos; e++)
            "\n" == this.buf[e] && this.LineNumber++;
        this.posLineNumber = this.pos;
    }, this.CalculateLineNumber0 = function (e)
    {
        for(var t = 0; t < e.length; t++)
            "\n" == e[t] && this.LineNumber++;
    }, this.AddCheckToStream = function (e)
    {
        this.InjectCheck && this.AddToStream(e);
    }, this.AddToStreamSimple = function (e,t)
    {
        this.LastStreamValue = t || e, this.IgnoreCodeLevel || (this.stream += e);
    }, this.AddToStreamAddTab = function (e,t)
    {
        "\n" == this.LastStreamValue[this.LastStreamValue.length - 1] && (this.CountCol = 0, this.IgnoreCodeLevel || (this.stream += this.SpacesArray[100 <= this.BlockLevel ? 99 : this.BlockLevel])),
        "\n" == e[e.length - 1] ? this.CountCol = 0 : this.CountCol += e.length, this.AddToStreamSimple(e, t);
    }, this.AddNewLineToStream = function (e,t)
    {
        var s = this.LastStreamValue[this.LastStreamValue.length - 1];
        (t || "\n" != s) && (";\n" != e || "}" != s && ";" != s ? this.AddToStream(e) : this.AddToStream("\n"));
    };
}, global.LexerJS = new module.exports;
