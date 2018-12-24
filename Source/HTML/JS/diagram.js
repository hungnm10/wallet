/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: MIT (not for evil)
 * Web: http://terafoundation.org
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

var DiagramMap = {}, DiagramMapId = {}, LMouseOn = !1;

function SetHTMLDiagramItem(e,t)
{
    if(e.mouseX = t - 50, !e.Extern && !e.Delete)
    {
        e.id || (e.id = "DgrmId" + e.num), DiagramMap[e.name] = e, (DiagramMapId[e.id] = e).isLine ? e.text ? Str = "<BR><B>" + e.text + '</B><INPUT type="button" class="delete" onclick="DeleteDiagram(\'' + e.id + '\')" value="X">' : Str = "<HR>" : Str = "<BR><DIV>" + e.text + '<INPUT type="button" class="delete" onclick="DeleteDiagram(\'' + e.id + '\')" value="X"></DIV>            <BR><canvas  class="DIAGRAM" width="' + t + '" height="80" id="' + e.id + '"></canvas>';
        var a = document.getElementById("B" + e.id);
        if(a)
            a.innerHTML = Str;
        else
            document.getElementById("diargams").innerHTML += "<DIV id='B" + e.id + "'>" + Str + "</DIV>";
    }
};

function SetDiagramMouseX(e,t)
{
    if(e.srcElement && 0 <= e.srcElement.className.indexOf("DIAGRAM") && ("down" === t ? LMouseOn = !0 : "up" === t && (LMouseOn = !1),
    e.preventDefault(), !0 === LMouseOn))
    {
        var a = e.srcElement, i = getMouse(a, e);
        if(!0 === e.ctrlKey)
            for(var r in DiagramMapId)
            {
                var o;
                (o = DiagramMapId[r]).mouseX = i.x, DrawDiagram(o);
            }
        else
            (o = DiagramMapId[a.id]) && (o.mouseX = i.x, DrawDiagram(o));
    }
};

function DrawDiagram(s)
{
    if(!s.Delete)
    {
        var e = s.arr;
        e || (e = s.ArrList);
        var d = s.value, t = s.steptime, a = s.startnumber, i = s.starttime, g = s.mouseX;
        if(e)
        {
            var u = document.getElementById(s.id), m = u.getContext("2d"), h = 50, r = 11;
            if(s.fillStyle ? m.fillStyle = s.fillStyle : m.fillStyle = "#FFF", m.fillRect(0, 0, u.width, u.height), !(e.length <= 0))
            {
                var v = 0;
                "**" === s.name.substr(s.name.length - 2) && (v = 1);
                for(var o = e[0], n = e[0], l = 0, f = 0; f < e.length; f++)
                    e[f] > o && (o = e[f]), e[f] < n && (n = e[f]), e[f] && (l += e[f]);
                "MAX:" === s.name.substr(0, 4) && s.AvgValue ? l = s.AvgValue : l /= e.length, v && l && (l = Math.pow(2, l) / 1e6), l = l < 50 ? l.toFixed(2) : Math.floor(l),
                void 0 !== s.MaxValue && (o = s.MaxValue), v && o && (o = Math.pow(2, o) / 1e6);
                var M = o;
                M <= 0 && (M = 1);
                var D = (u.width - h - 50) / e.length, c = (u.height - r - 15) / M, w = 0, T = s.line;
                s.zero && (T = 1, w -= s.zero * c, o -= s.zero, l -= s.zero), o = Math.floor(o + .5), m.lineWidth = T ? 3 : 1 < D ? D : 1;
                var p = h, S = u.height - 15, I = 0, y = void 0, x = void 0;
                if(s.red || (s.red = "#A00"), T ? H(e, "line", s.red) : (H(e, "red", s.red), 0 < d && H(e, "green", "#0A0")), m.lineWidth = .5,
                m.beginPath(), m.strokeStyle = "#000", h--, p--, S += 2, m.moveTo(h, r), m.lineTo(p, S), m.moveTo(p, S + w), m.lineTo(u.width - 10,
                S + w), m.stroke(), void 0 !== g && (m.beginPath(), m.lineWidth = .5, m.strokeStyle = "#00F", m.moveTo(g, r), m.lineTo(g, S),
                m.stroke(), void 0 !== y))
                {
                    m.fillStyle = x;
                    var L = "" + Math.floor(y + .5);
                    m.fillText(L, g - 3, 9);
                }
                if(m.fillStyle = "#000", m.fillText(Rigth("          " + o, 8), 0, 8), 0 < o && 0 < l)
                {
                    var X = S - r, O = l / o, b = X - Math.floor(O * X), A = b;
                    A < 10 && (A = 10), m.beginPath(), m.moveTo(h - 2, b + r), m.lineTo(h + 2, b + r), m.stroke(), m.strokeStyle = "#00F", m.fillText(Rigth("          " + l,
                    8), 0, A + r);
                }
                var B = 10;
                e.length < B && (B = e.length);
                var R, k, E = (u.width - h - 50) / B, P = 1, V = e.length / B;
                if(void 0 !== a)
                    k = 1, R = a;
                else
                    if(i)
                    {
                        k = 1, (R = Math.floor((new Date - i - t * e.length * 1e3) / 1e3)) < 0 && (R = 0), 0 == (P = 10 * Math.floor(V / 10)) && (P = 1);
                    }
                    else
                        k = 0, R = new Date - t * e.length * 1e3, p -= 16;
                for(f = 0; f <= B; f++)
                {
                    var z;
                    if(f === B ? (z = e.length * t, P = 1) : z = 0 === f ? 0 : f * V * t, k)
                        L = z = Math.floor((R + z) / P) * P;
                    else
                    {
                        var F = new Date(R + 1e3 * z);
                        L = "" + F.getHours(), L += ":" + Rigth("0" + F.getMinutes(), 2), L += ":" + Rigth("0" + F.getSeconds(), 2);
                    }
                    m.fillText(L, p + f * E, S + 10);
                }
            }
        }
    }
    
function H(e,t,a)
    {
        m.beginPath(), m.moveTo(h, u.height - 15), m.strokeStyle = a;
        for(var i = 0; i < e.length; i++)
        {
            var r = e[i];
            if(r || (r = 0), v && r && (r = Math.pow(2, r) / 1e6), "green" === t)
            {
                if(d < r)
                    continue;
            }
            else
                if("red" === t && r <= d)
                    continue;
            var o = r;
            d < o && (o = d);
            var n = Math.floor(o * c), l = Math.floor(r * c);
            n === l && (n -= 2);
            var f = p + m.lineWidth / 2 + i * D;
            if(T || m.moveTo(f, S - n), m.lineTo(f, S - l), g)
                Math.abs(f - g) < Math.abs(I - g) && (I = f, y = r, s.zero && (y -= s.zero), x = a);
        }
        m.stroke();
    };
};

function InitDiagramByArr(e,t)
{
    for(var a = 0; a < e.length; a++)
        e[a].num = a + 1, SetHTMLDiagramItem(e[a], t);
    window.addEventListener("mousedown", function (e)
    {
        SetDiagramMouseX(e, "down");
    }, !1), window.addEventListener("mouseup", function (e)
    {
        SetDiagramMouseX(e, "up");
    }, !1), window.addEventListener("onmousemove", function (e)
    {
        SetDiagramMouseX(e, "move");
    }, !1);
};

function getMouse(e,t)
{
    var a = t.clientX - getTrueOffsetLeft(e);
    window.pageXOffset && (a += window.pageXOffset);
    var i = t.clientY - getTrueOffsetTop(e);
    return window.pageYOffset && (i += window.pageYOffset), {x:a, y:i};
};

function getTrueOffsetLeft(e)
{
    for(var t = 0; e; )
        t += e.offsetLeft || 0, e = e.offsetParent;
    return t;
};

function getTrueOffsetTop(e)
{
    for(var t = 0; e; )
        t += e.offsetTop || 0, e = e.offsetParent;
    return t;
};
