/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/


function $(id)
{
    return document.getElementById(id);
};
if(window.nw)
{
    window.Open = function (path,iconname,width,height)
    {
        width = width || 840;
        height = height || 1000;
        var params = {width:width, height:height};
        if(iconname)
            params.icon = "../HTML/PIC/" + iconname + ".png";
        window.nw.Window.open(path, params, function (win)
        {
        });
    };
    window.GetData = function (Method,ObjPost,Func)
    {
        window.nw.global.RunRPC({path:Method, obj:ObjPost}, Func);
    };
    let ServerHTTP = undefined;
    global.RunRPC = function (message,Func)
    {
        if(!ServerHTTP)
            ServerHTTP = require('../core/html-server');
        var reply = ServerHTTP.SendData(message);
        if(Func)
        {
            Func(reply);
        }
    };
}
else
{
    window.Open = function (path,iconname,width,height)
    {
        if(!window.NWMODE)
        {
            var win = window.open(path);
        }
        else
        {
            width = width || 840;
            height = height || 1000;
            var left = (screen.width - width) / 2;
            var params = "left=" + left + ",top=24,menubar=no,location=no,resizable=yes,scrollbars=no,status=no";
            params += ",width=" + width;
            params += ",height=" + height;
            var win = window.open(path, undefined, params);
        }
    };
    window.GetData = function (Method,ObjPost,Func)
    {
        if(Method.substr(0, 1) !== "/")
            Method = "/" + Method;
        var StrPost = null;
        var serv = new XMLHttpRequest();
        if(ObjPost !== null)
        {
            StrPost = JSON.stringify(ObjPost);
            serv.open("POST", Method, true);
        }
        else
        {
            throw "ERROR GET-TYPE";
        }
        serv.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        serv.onreadystatechange = function ()
        {
            if(serv.readyState == 4)
            {
                if(serv.status == 200)
                {
                    if(Func)
                    {
                        Func(JSON.parse(serv.responseText), serv.responseText);
                    }
                }
                else
                {
                    if(Func)
                        Func(undefined);
                }
            }
        };
        serv.send(StrPost);
    };
}

function SUM_TO_STRING(Value,Currency,bFloat)
{
    var Str;
    if(Value.SumCOIN || Value.SumCENT)
        if(bFloat)
        {
            Str = "" + FLOAT_FROM_COIN(Value);
        }
        else
        {
            Str = "" + Value.SumCOIN + "." + Rigth("000000000" + Value.SumCENT, 9);
        }
    else
        Str = "";
    if(Currency !== undefined)
    {
        if(Str === "")
            Str = "0";
        Str += " " + CurrencyName(Currency);
    }
    return Str;
};

function GetArrFromHex(Str)
{
    var array = [];
    for(var i = 0; Str && i < Str.length / 2; i++)
    {
        array[i] = parseInt(Str.substr(i * 2, 2), 16);
    }
    return array;
};

function GetHexFromArr(arr)
{
    if(!(arr instanceof Array) && arr.data)
        arr = arr.data;
    var Str = "";
    for(var i = 0; arr && i < arr.length; i++)
    {
        if(!arr[i])
            Str += "00";
        else
        {
            var Val = arr[i] & 255;
            var A = Val.toString(16);
            if(A.length === 1)
                A = "0" + A;
            Str = Str + A;
        }
    }
    return Str.toUpperCase();
};

function GetStrFromAddr(arr)
{
    return GetHexFromArr(arr);
};

function GetHexFromArrBlock(Arr,LenBlock)
{
    var Str = "";
    var Arr2 = [];
    for(var i = 0; i < Arr.length; i++)
    {
        Arr2[i % LenBlock] = Arr[i];
        if(Arr2.length >= LenBlock)
        {
            Str += GetHexFromArr(Arr2) + "\n";
            Arr2 = [];
        }
    }
    if(Arr2.length)
    {
        Str += GetHexFromArr(Arr2);
    }
    return Str;
};

function Rigth(Str,Count)
{
    if(Str.length < Count)
        return Str;
    else
        return Str.substr(Str.length - Count);
};

function toUTF8Array(str)
{
    var utf8 = [];
    for(var i = 0; i < str.length; i++)
    {
        var charcode = str.charCodeAt(i);
        if(charcode < 0x80)
            utf8.push(charcode);
        else
            if(charcode < 0x800)
            {
                utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
            }
            else
                if(charcode < 0xd800 || charcode >= 0xe000)
                {
                    utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                }
                else
                {
                    i++;
                    charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                    utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                }
    }
    return utf8;
};

function Utf8ArrayToStr(array)
{
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = array.length;
    i = 0;
    while(i < len)
    {
        c = array[i++];
        switch(c >> 4)
        {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                out += String.fromCharCode(c);
                break;
            case 12:
            case 13:
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
                break;
        }
    }
    for(var i = 0; i < out.length; i++)
    {
        if(out.charCodeAt(i) < 32)
        {
            out = out.substr(0, i);
            break;
        }
    }
    return out;
};

function GetArr32FromStr(Str)
{
    return GetArrFromStr(Str, 32);
};

function GetArrFromStr(Str,Len)
{
    var arr = toUTF8Array(Str);
    for(var i = arr.length; i < Len; i++)
    {
        arr[i] = 0;
    }
    return arr.slice(0, Len);
};

function WriteByte(arr,Num)
{
    arr[arr.length] = Num & 0xFF;
};

function WriteUint(arr,Num)
{
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
    arr[len + 2] = (Num >>> 16) & 0xFF;
    arr[len + 3] = (Num >>> 24) & 0xFF;
    var NumH = Math.floor(Num / 4294967296);
    arr[len + 4] = NumH & 0xFF;
    arr[len + 5] = (NumH >>> 8) & 0xFF;
};

function WriteUint16(arr,Num)
{
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
};

function WriteUint32(arr,Num)
{
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
    arr[len + 2] = (Num >>> 16) & 0xFF;
    arr[len + 3] = (Num >>> 24) & 0xFF;
};

function WriteStr(arr,Str,ConstLength)
{
    if(!Str)
        Str = "";
    var arrStr = toUTF8Array(Str);
    var length;
    var len = arr.length;
    if(ConstLength)
    {
        length = ConstLength;
    }
    else
    {
        length = arrStr.length;
        if(length > 65535)
            length = 65535;
        arr[len] = length & 0xFF;
        arr[len + 1] = (length >>> 8) & 0xFF;
        len += 2;
    }
    for(var i = 0; i < length; i++)
    {
        arr[len + i] = arrStr[i];
    }
};

function WriteArr(arr,arr2,ConstLength)
{
    var len = arr.length;
    for(var i = 0; i < ConstLength; i++)
    {
        arr[len + i] = arr2[i];
    }
};

function WriteTr(arr,arr2)
{
    var len2 = arr2.length;
    var len = arr.length;
    arr[len] = len2 & 0xFF;
    arr[len + 1] = (len2 >>> 8) & 0xFF;
    len += 2;
    for(var i = 0; i < len2; i++)
    {
        arr[len + i] = arr2[i];
    }
};

function ReadUintFromArr(arr,len)
{
    if(len === undefined)
    {
        len = arr.len;
        arr.len += 6;
    }
    var value = (arr[len + 5] << 23) * 2 + (arr[len + 4] << 16) + (arr[len + 3] << 8) + arr[len + 2];
    value = value * 256 + arr[len + 1];
    value = value * 256 + arr[len];
    return value;
};

function ReadUintNext_DEL(arr)
{
    var len = arr.len;
    var value = (arr[len + 5] << 23) * 2 + (arr[len + 4] << 16) + (arr[len + 3] << 8) + arr[len + 2];
    value = value * 256 + arr[len + 1];
    value = value * 256 + arr[len];
    arr.len += 6;
    return value;
};

function ReadStr(arr)
{
    var length = arr[arr.len] + arr[arr.len + 1] * 256;
    arr.len += 2;
    var arr2 = arr.slice(arr.len, arr.len + length);
    var Str = Utf8ArrayToStr(arr2);
    arr.len += length;
    return Str;
};

function ReadArr(arr,length)
{
    var Ret = [];
    var len = arr.len;
    for(var i = 0; i < length; i++)
    {
        Ret[i] = arr[len + i];
    }
    arr.len += length;
    return Ret;
};

function ParseNum(Str)
{
    var Res = parseInt(Str);
    if(isNaN(Res))
        Res = 0;
    if(!Res)
        Res = 0;
    if(Res < 0)
        Res = 0;
    return Res;
};

function parseUint(Str)
{
    var Res = parseInt(Str);
    if(isNaN(Res))
        Res = 0;
    if(!Res)
        Res = 0;
    if(Res < 0)
        Res = 0;
    return Res;
};

function CopyObjKeys(dest,src)
{
    for(var key in src)
    {
        dest[key] = src[key];
    }
};

function SaveToArr(Arr,Obj)
{
    for(var key in Obj)
    {
        Arr[0]++;
        var Value = Obj[key];
        switch(typeof Value)
        {
            case "number":
                WriteByte(Arr, 241);
                WriteUint(Arr, Value);
                break;
            case "string":
                WriteByte(Arr, 242);
                WriteStr(Arr, Value);
                break;
            case "object":
                if(Value && (Value.length > 0 || Value.length === 0) && Value.length <= 240)
                {
                    WriteByte(Arr, Value.length);
                    WriteArr(Arr, Value, Value.length);
                    break;
                }
            default:
                WriteByte(Arr, 250);
        }
    }
};

function LoadFromArr(Arr,Obj)
{
    if(!Arr.length)
        return false;
    var Count = Arr[0];
    Arr.len = 1;
    for(var key in Obj)
    {
        if(!Count)
            break;
        Count--;
        var Type = Arr[Arr.len];
        Arr.len++;
        switch(Type)
        {
            case 241:
                Obj[key] = ReadUintFromArr(Arr);
                break;
            case 242:
                Obj[key] = ReadStr(Arr);
                break;
            default:
                if(Type <= 240)
                {
                    var length = Type;
                    Obj[key] = ReadArr(Arr, length);
                    break;
                }
                else
                {
                    Obj[key] = undefined;
                }
        }
    }
    if(Arr[0])
        return true;
    else
        return false;
};
var entityMap = {"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':'&quot;', "'":'&#39;', "/":'&#x2F;', "\n":'<BR>', " ":'&nbsp;', };

function escapeHtml(string)
{
    string = string.replace(/\\n/g, "\n");
    string = string.replace(/\\"/g, "\"");
    return String(string).replace(/[\s\n&<>"'\/]/g, function (s)
    {
        return entityMap[s];
    });
};

function InsertAfter(elem,refElem)
{
    var parent = refElem.parentNode;
    var next = refElem.nextSibling;
    if(next)
    {
        return parent.insertBefore(elem, next);
    }
    else
    {
        return parent.appendChild(elem);
    }
};

function MoveUp(elem)
{
    var parent = elem.parentNode;
    for(var i = 0; i < parent.children.length; i++)
    {
        var item = parent.children[i];
        if(item.id && item.id !== undefined)
        {
            return parent.insertBefore(elem, item);
        }
    }
};

function ViewGrid(APIName,Params,nameid,bClear,TotalSum)
{
    GetData(APIName, Params, function (Data)
    {
        if(!Data || !Data.result)
            return ;
        SetGridData(Data.arr, nameid, TotalSum, bClear);
    });
};

function ViewCurrent(Def,flag,This)
{
    if(Def.BlockName)
    {
        if(flag)
        {
            var bVisible = IsVisibleBlock(Def.BlockName);
            if(!bVisible)
                MoveUp($(Def.BlockName));
            SetVisibleBlock(Def.BlockName, !bVisible);
        }
        else
        {
            SetVisibleBlock(Def.BlockName, true);
        }
        if(!IsVisibleBlock(Def.BlockName))
            return ;
    }
    var item = $(Def.NumName);
    var Filter = "", Filter2 = "";
    if(Def.FilterName)
    {
        Filter = $(Def.FilterName).value;
    }
    if(Def.FilterName2)
    {
        Filter2 = $(Def.FilterName2).value;
    }
    if(!Def.Param3)
        Def.Param3 = "";
    ViewGrid(Def.APIName, {StartNum:ParseNum(item.value), CountNum:GetCountViewRows(Def), Param3:Def.Param3, Filter:Filter, Filter2:Filter2,
    }, Def.TabName, 1, Def.TotalSum);
    SaveValues();
    if(This)
        SetImg(This, Def.BlockName);
};

function ViewPrev(Def)
{
    var item = document.getElementById(Def.NumName);
    var Num = ParseNum(item.value);
    Num -= GetCountViewRows(Def);
    if(Num < 0)
        Num = 0;
    item.value = Num;
    ViewCurrent(Def);
};

function ViewNext(Def,MaxNum)
{
    var item = document.getElementById(Def.NumName);
    var Num = ParseNum(item.value);
    Num += GetCountViewRows(Def);
    if(Def.FilterName)
    {
        if(document.getElementById(Def.FilterName).value)
        {
            Num = document.getElementById(Def.TabName).MaxNum + 1;
        }
    }
    if(Num < MaxNum)
    {
        item.value = Num;
    }
    else
    {
        item.value = MaxNum - MaxNum % GetCountViewRows(Def);
    }
    ViewCurrent(Def);
};

function ViewBegin(Def)
{
    document.getElementById(Def.NumName).value = 0;
    ViewCurrent(Def);
};

function ViewEnd(Def,MaxNum)
{
    document.getElementById(Def.NumName).value = MaxNum - MaxNum % GetCountViewRows(Def);
    ViewCurrent(Def);
};

function GetCountViewRows(Def)
{
    if(Def.CountViewRows)
        return Def.CountViewRows;
    else
        return CountViewRows;
};

function DoStableScroll()
{
    var item = $("idStableScroll");
    if(!item)
        return ;
    var scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight,
    document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
    var itemlHeight = Math.max(item.scrollHeight, item.offsetHeight, item.clientHeight);
    scrollHeight = scrollHeight - itemlHeight;
    item.style.top = "" + scrollHeight + "px";
};
var glEvalMap = {};

function CreateEval(formula,StrParams)
{
    var Ret = glEvalMap[formula];
    if(!Ret)
    {
        eval("function M(" + StrParams + "){return " + formula + "}; Ret=M;");
        glEvalMap[formula] = Ret;
    }
    return Ret;
};
var glWorkNum = 0;
var CUR_ROW;

function SetGridData(arr,id_name,TotalSum,bclear,revert)
{
    var htmlTable = document.getElementById(id_name);
    if(bclear)
        ClearTable(htmlTable);
    if(!htmlTable.ItemsMap)
    {
        htmlTable.ItemsMap = {};
        htmlTable.RowCount = 0;
    }
    var map = htmlTable.ItemsMap;
    glWorkNum++;
    var ValueTotal = {SumCOIN:0, SumCENT:0};
    var row0 = htmlTable.rows[0];
    var row0cells = row0.cells;
    var colcount = row0cells.length;
    for(var i = 0; arr && i < arr.length; i++)
    {
        var Item = arr[i];
        var ID = Item.Num;
        htmlTable.MaxNum = Item.Num;
        var row = map[ID];
        if(!row)
        {
            htmlTable.RowCount++;
            if(revert)
                row = htmlTable.insertRow(1);
            else
                row = htmlTable.insertRow( - 1);
            map[ID] = row;
            for(var n = 0; n < colcount; n++)
            {
                var cell0 = row0cells[n];
                if(cell0.innerText == "")
                    continue;
                cell0.F = CreateEval(cell0.id, "Item");
                if(cell0.id.substr(0, 1) === "(")
                    cell0.H = 1;
                var cell = row.insertCell(n);
                cell.className = cell0.className;
            }
        }
        row.Work = glWorkNum;
        CUR_ROW = row;
        for(var n = 0; n < colcount; n++)
        {
            var cell = row.cells[n];
            if(!cell)
                continue;
            var cell0 = row0cells[n];
            if(cell0.H)
            {
                var text = "" + cell0.F(Item);
                text.trim();
                if(cell.innerHTML !== text)
                    cell.innerHTML = text;
            }
            else
            {
                var text = "" + cell0.F(Item);
                text.trim();
                if(cell.innerText !== text)
                    cell.innerText = text;
            }
        }
        if(TotalSum && Item.Currency === 0)
            ADD(ValueTotal, Item.Value);
    }
    for(var key in map)
    {
        var row = map[key];
        if(row.Work !== glWorkNum)
        {
            htmlTable.deleteRow(row.rowIndex);
            delete map[key];
        }
    }
    if(TotalSum)
    {
        var id = document.getElementById(TotalSum);
        id.innerText = "Total: " + SUM_TO_STRING(ValueTotal, 0);
    }
    DoStableScroll();
};

function ClearTable(htmlTable)
{
    for(var i = htmlTable.rows.length - 1; i > 0; i--)
        htmlTable.deleteRow(i);
    htmlTable.ItemsMap = {};
    htmlTable.RowCount = 0;
};

function RetOpenBlock(BlockNum,TrDataLen)
{
    if(BlockNum && TrDataLen)
        return '<INPUT type="button" onclick="ViewTransaction(' + BlockNum + ')" class="" value="' + BlockNum + '">';
    else
        return BlockNum;
};

function RetBool(Value)
{
    if(Value)
        return "✔";
    else
        return "";
};

function RetNumDapp(Item)
{
    return Item.Num;
};

function RetOpenDapps(Item,bNum,AccountNum)
{
    var Name = escapeHtml(Item.Name);
    if(bNum)
        Name = "" + Item.Num + "." + Name;
    if(Item.HTMLLength > 0)
    {
        if(Item.IconBlockNum)
            return '<button class="bt_open_dapp" onclick="OpenDapps(' + Item.Num + ',' + AccountNum + ')"><img src="/file/' + Item.IconBlockNum + '/' + Item.IconTrNum + '" style="vertical-align:middle; max-width: 32px;"> ' + Name + '</button>';
        else
            return '<button class="bt_open_dapp" onclick="OpenDapps(' + Item.Num + ',' + AccountNum + ')">' + Name + '</button>';
    }
    else
        if(Item.IconBlockNum)
            return '<img src="/file/' + Item.IconBlockNum + '/' + Item.IconTrNum + '" style="vertical-align:middle; max-width: 32px;"> ' + Name;
        else
            return Name;
};

function RetDirect(Value)
{
    if(Value === "-")
    {
        return "<B style='color:red'>-</B>";
    }
    else
        if(Value === "+")
        {
            return "<B style='color:green;'>+</B>";
        }
        else
            return "";
};

function RetCategory(Item)
{
    var Str = "";
    var Num = 0;
    if(Item.Category1 && MapCategory[Item.Category1])
    {
        Num++;
        Str += "" + Num + "." + MapCategory[Item.Category1] + "<BR>";
    }
    if(Item.Category2 && MapCategory[Item.Category2])
    {
        Num++;
        Str += "" + Num + "." + MapCategory[Item.Category2] + "<BR>";
    }
    if(Item.Category3 && MapCategory[Item.Category3])
    {
        Num++;
        Str += "" + Num + "." + MapCategory[Item.Category3] + "<BR>";
    }
    Str = Str.substr(0, Str.length - 4);
    return Str;
};

function RetChangeSmart(Item)
{
    var Name = "";
    var State = "";
    var bOpen = 0;
    if(Item.SmartObj)
    {
        if(Item.SmartObj.HTMLLength)
        {
            Name = RetOpenDapps(Item.SmartObj, 1, Item.Num);
            bOpen = 1;
        }
        else
            Name = "" + Item.SmartObj.Num + "." + escapeHtml(Item.SmartObj.Name) + "<BR>";
        if(window.DEBUG_WALLET)
            State = "<BR>State:" + JSON.stringify(Item.SmartState);
    }
    if(bOpen)
        return '<DIV style="width: 200px">' + Name + '<button onclick="ChangeSmart(' + Item.Num + ',' + Item.Value.Smart + ')" style="height: 40px; padding-top: 0px;" class="button">Set</button>' + State + '</DIV>';
    else
        return Name + '<button onclick="ChangeSmart(' + Item.Num + ',' + Item.Value.Smart + ')" style="" class="button">Set</button>' + State;
};

function RetBaseAccount(Item)
{
    var Str = "" + Item.Account;
    if(Item.AccountLength > 1)
        Str += "-" + (Item.Account + Item.AccountLength - 1);
    return Str;
};

function ViewTransaction(BlockNum)
{
    window.Open('/HTML/blockviewer.html#' + BlockNum, 'viewer', 800, 800);
};

function DateFromBlock(BlockNum)
{
    var Str;
    if(window.FIRST_TIME_BLOCK)
    {
        var now = new Date(window.FIRST_TIME_BLOCK + BlockNum * 1000);
        Str = now.toISOString();
        Str = Str.substr(0, Str.indexOf("."));
        Str = Str.replace("T", " ");
    }
    else
        Str = "";
    return Str;
};

function SetCheckPoint(BlockNum)
{
    if(!BlockNum)
    {
        SetError("Not set BlockNum");
        return ;
    }
    GetData("SetCheckPoint", BlockNum, function (Data)
    {
        if(Data)
        {
            SetStatus(Data.text, !Data.result);
        }
    });
};

function AddDiagramToArr(Arr,Item)
{
    var bWas = 0;
    for(var i = 0; i < Arr.length; i++)
    {
        if(Arr[i].name === Item.name)
        {
            Item.Delete = 0;
            Arr[i] = Item;
            bWas = 1;
            break;
        }
    }
    if(!bWas)
    {
        Item.num = Arr.length;
        Arr.push(Item);
    }
};

function SetVisibleBlock(name,bSet)
{
    var Item = document.getElementById(name);
    if(bSet && typeof bSet === "string")
        Item.style.display = bSet;
    else
        if(bSet)
        {
            Item.style.display = 'block';
        }
        else
        {
            Item.style.display = 'none';
        }
    return Item;
};

function IsVisibleBlock(name)
{
    var Item = document.getElementById(name);
    if(Item.style.display === 'block' || Item.style.display === "table-row")
        return true;
    else
        return false;
};

function LoadValuesByArr(Arr,DopStr)
{
    if(!DopStr)
        DopStr = "";
    if(localStorage["VerSave"] !== "3")
        return 0;
    for(var i = 0; i < Arr.length; i++)
    {
        var name = Arr[i];
        var Item = document.getElementById(name);
        var name2 = DopStr + name;
        if(Item.type === "checkbox")
            Item.checked = parseInt(localStorage.getItem(name2));
        else
            Item.value = localStorage.getItem(name2);
    }
    return 1;
};

function SaveValuesByArr(Arr,DopStr)
{
    if(!DopStr)
        DopStr = "";
    localStorage["VerSave"] = "3";
    for(var i = 0; i < Arr.length; i++)
    {
        var name = Arr[i];
        var name2 = DopStr + name;
        var Item = $(name);
        if(Item.type === "checkbox")
            window.localStorage.setItem(name2, 0 + Item.checked);
        else
            window.localStorage.setItem(name2, Item.value);
    }
};
var MapCurrency = {};
MapCurrency[0] = "TERA";
var MapCategory = {};
MapCategory[0] = "-";
MapCategory[1] = "Art & Music";
MapCategory[2] = "Big Data & AI";
MapCategory[3] = "Business";
MapCategory[4] = "Commerce & Advertising";
MapCategory[5] = "Communications";
MapCategory[6] = "Content Management";
MapCategory[7] = "Crowdfunding";
MapCategory[8] = "Data Storage";
MapCategory[9] = "Drugs & Healthcare";
MapCategory[10] = "Education";
MapCategory[11] = "Energy & Utilities";
MapCategory[12] = "Events & Entertainment";
MapCategory[13] = "eСommerce";
MapCategory[14] = "Finance";
MapCategory[15] = "Gambling & Betting";
MapCategory[16] = "Gaming & VR";
MapCategory[17] = "Healthcare";
MapCategory[18] = "Identity & Reputation";
MapCategory[19] = "Industry";
MapCategory[20] = "Infrastructure";
MapCategory[21] = "Investment";
MapCategory[22] = "Live Streaming";
MapCategory[23] = "Machine Learning & AI";
MapCategory[24] = "Marketing";
MapCategory[25] = "Media";
MapCategory[26] = "Mining";
MapCategory[27] = "Payments";
MapCategory[28] = "Platform";
MapCategory[29] = "Provenance & Notary";
MapCategory[30] = "Real Estate";
MapCategory[31] = "Recruitment";
MapCategory[32] = "Service";
MapCategory[33] = "Social Network";
MapCategory[34] = "Social project";
MapCategory[35] = "Supply & Logistics";
MapCategory[36] = "Trading & Investing";
MapCategory[37] = "Transport";
MapCategory[38] = "Travel & Tourisim";
MapCategory[39] = "Bounty";
MapCategory[40] = "Code-library";

function GetTokenName(Num,Name)
{
    if(!Name)
        Name = "Token";
    return "(" + Num + "." + Name + ")";
    return "{" + Num + "." + Name + "}";
};

function CurrencyNameItem(Item)
{
    var Name = MapCurrency[Item.Currency];
    if(!Name)
    {
        if(Item.CurrencyObj)
            Name = GetTokenName(Item.Currency, Item.CurrencyObj.ShortName);
        else
            Name = GetTokenName(Item.Currency, "");
        MapCurrency[Item.Currency] = Name;
    }
    return Name;
};

function CurrencyName(Num)
{
    var Name = MapCurrency[Num];
    if(!Name)
    {
        GetData("GetDappsAll", {StartNum:Num, CountNum:1}, function (Data)
        {
            if(Data && Data.result)
            {
                var Smart = Data.arr[0];
                Name = GetTokenName(Smart.Num, Smart.ShortName);
                MapCurrency[Smart.Num] = Name;
            }
        });
        Name = GetTokenName(Num, "");
    }
    return Name;
};

function FillSelect(IdName,arr,bNatural)
{
    var Select = $(IdName);
    var Value = Select.value;
    var Options = Select.options;
    var strJSON = JSON.stringify(arr);
    if(Select.strJSON === strJSON)
        return ;
    Select.strJSON = strJSON;
    var Value = Select.value;
    if(bNatural)
    {
        Options.length = 0;
        for(var key in arr)
        {
            var name = arr[key];
            Options[Options.length] = new Option(name, key);
            if(key == Value)
                Select.value = key;
        }
    }
    else
    {
        Options.length = 0;
        for(var i = 0; i < arr.length; i++)
        {
            var item = arr[i];
            Options[Options.length] = new Option(item.text, item.value);
            if(item.value == Value)
                Select.value = item.value;
        }
        if(!arr.length)
            for(var key in arr)
            {
                var item = arr[key];
                Options[Options.length] = new Option(item.text, item.value);
                if(item.value == Value)
                    Select.value = item.value;
            }
    }
};

function GetArrFromSelect(IdName)
{
    var Select = $(IdName);
    var Options = Select.options;
    var arr = [];
    for(var i = 0; i < Options.length; i++)
    {
        var item = Options[i];
        arr.push({text:item.text, value:item.value});
    }
    return arr;
};

function FillCategory(IdName)
{
    var arr = [];
    for(var key in MapCategory)
    {
        arr.push({sort:MapCategory[key].toUpperCase(), text:MapCategory[key], value:key});
    }
    arr.sort(function (a,b)
    {
        if(a.sort < b.sort)
            return  - 1;
        if(a.sort > b.sort)
            return 1;
        return 0;
    });
    FillSelect(IdName, arr);
};

function AddToInvoiceList(Item)
{
    var arr;
    var Str = localStorage["InvoiceList"];
    if(Str)
    {
        arr = JSON.parse(Str);
    }
    else
    {
        arr = [];
    }
    arr.unshift(Item);
    localStorage["InvoiceList"] = JSON.stringify(arr);
};

function OpenDapps(Num,AccountNum)
{
    if(AccountNum)
        window.Open('/dapp/' + Num + '#' + AccountNum, 'dapp', 1200);
    else
        window.Open('/dapp/' + Num, 'dapp', 1200);
};

function ParseFileName(Str)
{
    var Ret = {BlockNum:0, TrNum:0};
    var index1 = Str.indexOf("file/");
    if(index1)
    {
        var index2 = Str.indexOf("/", index1 + 6);
        Ret.BlockNum = parseInt(Str.substr(index1 + 5, index2 - index1 - 5));
        Ret.TrNum = parseInt(Str.substr(index2 + 1));
    }
    return Ret;
};
var glTrSendNum = 0;
window.MapSendTransaction = {};

function SendTransaction(Body,TR,SumPow,F)
{
    if(Body.length > 16000)
    {
        if(window.SetStatus)
            SetStatus("Error length transaction =" + Body.length + " (max size=16000)");
        if(F)
            F(1, TR, Body);
        return ;
    }
    glTrSendNum++;
    CreateNonceAndSend(1, 0);
    
function CreateNonceAndSend(bCreateNonce,startnonce)
    {
        var CurTrNum = glTrSendNum;
        var nonce = startnonce;
        if(bCreateNonce)
            nonce = CreateHashBodyPOWInnerMinPower(Body, SumPow);
        var StrHex = GetHexFromArr(Body);
        GetData("SendTransactionHex", StrHex, function (Data)
        {
            if(Data)
            {
                var key = GetHexFromArr(shaarr(Body));
                if(window.SetStatus)
                    SetStatus("Send '" + key.substr(0, 8) + "' result:" + Data.text);
                if(Data.text === "Not add")
                {
                    CreateNonceAndSend(1, nonce + 1);
                }
                else
                    if(Data.text === "Bad time")
                    {
                        if(window.SetStatus)
                            SetStatus("Next send...");
                        setTimeout(function ()
                        {
                            if(CurTrNum === glTrSendNum)
                                CreateNonceAndSend(0, nonce);
                        }, 100);
                    }
                    else
                    {
                        var key = GetHexFromArr(shaarr(Body));
                        MapSendTransaction[key] = TR;
                        if(F)
                            F(0, TR, Body);
                    }
            }
        });
    };
};
var MapSendID = {};

function SendCallMethod(Account,MethodName,Params,FromNum,FromSmartNum)
{
    var TR = {Type:135};
    let Body = [TR.Type];
    WriteUint(Body, Account);
    WriteStr(Body, MethodName);
    WriteStr(Body, JSON.stringify(Params));
    WriteUint(Body, FromNum);
    if(FromNum)
    {
        GetData("GetAccount", FromNum, function (Data)
        {
            if(!Data || Data.result !== 1)
            {
                SetStatus("Error account number: " + FromNum);
                return ;
            }
            if(Data.Item.Value.Smart !== FromSmartNum)
            {
                SetStatus("Error - The account:" + FromNum + " does not belong to a smart contract:" + FromSmartNum);
                return ;
            }
            var OperationID = Data.Item.Value.OperationID;
            if(!MapSendID[FromNum] || (new Date() - MapSendID[FromNum].Date) > 8 * 1000)
            {
                MapSendID[FromNum] = {OperationID:OperationID + 10};
            }
            else
            {
                OperationID = MapSendID[FromNum].OperationID;
            }
            MapSendID[FromNum].OperationID++;
            MapSendID[FromNum].Date = (new Date()) - 0;
            WriteUint(Body, OperationID);
            Body.length += 10;
            SendTrArrayWithSign(Body, FromNum, TR);
        });
    }
    else
    {
        WriteUint(Body, 0);
        Body.length += 10;
        Body.length += 64;
        Body.length += 12;
        SendTransaction(Body, TR);
    }
};

function SendTrArrayWithSign(Body,Account,TR)
{
    var StrHex = GetHexFromArr(Body);
    GetData("GetSignFromHEX", {Hex:StrHex, Account:Account}, function (Data)
    {
        if(Data && Data.result)
        {
            var Arr = GetArrFromHex(Data.Sign);
            WriteArr(Body, Arr, 64);
            Body.length += 12;
            SendTransaction(Body, TR);
        }
    });
};

function GetTrCreateAcc(Currency,PubKey,Description,Adviser,Smart)
{
    var TR = {Type:TYPE_TRANSACTION_CREATE, Currency:Currency, PubKey:PubKey, Name:Description, Adviser:Adviser, Smart:Smart, };
    return TR;
};

function GetBodyCreateAcc(TR)
{
    var Body = [];
    WriteByte(Body, TR.Type);
    WriteUint(Body, TR.Currency);
    WriteArr(Body, GetArrFromHex(TR.PubKey), 33);
    WriteStr(Body, TR.Name, 40);
    WriteUint(Body, TR.Adviser);
    WriteUint32(Body, TR.Smart);
    Body.length += 3;
    Body.length += 12;
    return Body;
};

function RetJSON(Item)
{
    return JSON.stringify(Item);
};
Number.prototype.toStringF = function ()
{
    var data = String(this).split(/[eE]/);
    if(data.length == 1)
        return data[0];
    var z = '', sign = this < 0 ? '-' : '', str = data[0].replace('.', ''), mag = Number(data[1]) + 1;
    if(mag < 0)
    {
        z = sign + '0.';
        while(mag++)
            z += '0';
        return z + str.replace(/^\-/, '');
    }
    mag -= str.length;
    while(mag--)
        z += '0';
    return str + z;
};
