/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
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
        var i = document.getElementById("B" + e.id);
        if(i)
            i.innerHTML = Str;
        else
            document.getElementById("diargams").innerHTML += "<DIV id='B" + e.id + "'>" + Str + "</DIV>";
    }
};

function SetDiagramMouseX(e,t)
{
    if(e.srcElement && 0 <= e.srcElement.className.indexOf("DIAGRAM") && ("down" === t ? LMouseOn = !0 : "up" === t && (LMouseOn = !1),
    e.preventDefault(), !0 === LMouseOn))
    {
        var i = e.srcElement, a = getMouse(i, e);
        if(!0 === e.ctrlKey)
            for(var r in DiagramMapId)
            {
                var o;
                (o = DiagramMapId[r]).mouseX = a.x, DrawDiagram(o);
            }
        else
            (o = DiagramMapId[i.id]) && (o.mouseX = a.x, DrawDiagram(o));
    }
};

function DrawDiagram(s)
{
    if(!s.Delete)
    {
        var e = s.arr;
        e || (e = s.ArrList);
        var t = s.id, d = s.value, i = s.steptime, a = s.startnumber, r = s.starttime, g = s.mouseX;
        if(e)
        {
            var u = document.getElementById(t), m = u.getContext("2d"), v = 50, o = 11;
            if(s.fillStyle ? m.fillStyle = s.fillStyle : m.fillStyle = "#FFF", m.fillRect(0, 0, u.width, u.height), !(e.length <= 0))
            {
                for(var n = e[0], l = e[0], f = 0, h = 0; h < e.length; h++)
                    e[h] > n && (n = e[h]), e[h] < l && (l = e[h]), e[h] && (f += e[h]);
                "MAX:" === s.name.substr(0, 4) && s.AvgValue ? f = s.AvgValue : f /= e.length, f = f < 50 ? f.toFixed(2) : Math.floor(f), void 0 !== s.MaxValue && (n = s.MaxValue);
                var M = n;
                M <= 0 && (M = 1);
                var D = (u.width - v - 50) / e.length, c = (u.height - o - 15) / M, w = 0, T = s.line;
                s.zero && (T = 1, w -= s.zero * c, n -= s.zero, f -= s.zero), n = Math.floor(n + .5), m.lineWidth = T ? 3 : 1 < D ? D : 1;
                var S = v, p = u.height - 15, I = 0, y = void 0, x = void 0;
                if(s.red || (s.red = "#A00"), T ? H(e, "line", s.red) : (H(e, "red", s.red), 0 < d && H(e, "green", "#0A0")), m.lineWidth = .5,
                m.beginPath(), m.strokeStyle = "#000", v--, S--, p += 2, m.moveTo(v, o), m.lineTo(S, p), m.moveTo(S, p + w), m.lineTo(u.width - 10,
                p + w), m.stroke(), void 0 !== g && (m.beginPath(), m.lineWidth = .5, m.strokeStyle = "#00F", m.moveTo(g, o), m.lineTo(g, p),
                m.stroke(), void 0 !== y))
                {
                    m.fillStyle = x;
                    var L = "" + Math.floor(y + .5);
                    m.fillText(L, g - 3, 9);
                }
                if(m.fillStyle = "#000", m.fillText(Rigth("          " + n, 8), 0, 8), 0 < n && 0 < f)
                {
                    var X = p - o, O = f / n, A = X - Math.floor(O * X), B = A;
                    B < 10 && (B = 10), m.beginPath(), m.moveTo(v - 2, A + o), m.lineTo(v + 2, A + o), m.stroke(), m.strokeStyle = "#00F", m.fillText(Rigth("          " + f,
                    8), 0, B + o);
                }
                var R = 10;
                e.length < R && (R = e.length);
                var b, k, E = (u.width - v - 50) / R, P = 1, V = e.length / R;
                if(void 0 !== a)
                    k = 1, b = a;
                else
                    if(r)
                    {
                        k = 1, (b = Math.floor((new Date - r - i * e.length * 1e3) / 1e3)) < 0 && (b = 0), 0 == (P = 10 * Math.floor(V / 10)) && (P = 1);
                    }
                    else
                        k = 0, b = new Date - i * e.length * 1e3, S -= 16;
                for(h = 0; h <= R; h++)
                {
                    var z;
                    if(h === R ? (z = e.length * i, P = 1) : z = 0 === h ? 0 : h * V * i, k)
                        L = z = Math.floor((b + z) / P) * P;
                    else
                    {
                        var F = new Date(b + 1e3 * z);
                        L = "" + F.getHours(), L += ":" + Rigth("0" + F.getMinutes(), 2), L += ":" + Rigth("0" + F.getSeconds(), 2);
                    }
                    m.fillText(L, S + h * E, p + 10);
                }
            }
        }
    }
    
function H(e,t,i)
    {
        m.beginPath(), m.moveTo(v, u.height - 15), m.strokeStyle = i;
        for(var a = 0; a < e.length; a++)
        {
            var r = e[a];
            if(r || (r = 0), "green" === t)
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
            var f = S + m.lineWidth / 2 + a * D;
            if(T || m.moveTo(f, p - n), m.lineTo(f, p - l), g)
                Math.abs(f - g) < Math.abs(I - g) && (I = f, y = r, s.zero && (y -= s.zero), x = i);
        }
        m.stroke();
    };
};

function InitDiagramByArr(e,t)
{
    for(var i = 0; i < e.length; i++)
        e[i].num = i + 1, SetHTMLDiagramItem(e[i], t);
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
    var i = t.clientX - getTrueOffsetLeft(e);
    window.pageXOffset && (i += window.pageXOffset);
    var a = t.clientY - getTrueOffsetTop(e);
    return window.pageYOffset && (a += window.pageYOffset), {x:i, y:a};
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
