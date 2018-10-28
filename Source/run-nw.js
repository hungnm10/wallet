//let Win;
nw.Window.open('./HTML/wallet.html',
    {
        width: 840,
        height: 1000,
        icon: "../HTML/PIC/wallet.png",
    }, function(win)
    {
        //win.showDevTools();


        // Create a tray icon
        let Visible=1;
        var tray = new nw.Tray({ title: 'TERA', icon: '/HTML/PIC/wallet16.png'});
        tray.on('click',function ()
        {
            Visible=!Visible;
            if(Visible)
                win.show();
            else
                win.hide();
        })

        // Give it a menu
        var menu = new nw.Menu();
        menu.append(new nw.MenuItem({ label: 'Hide', click:function () {win.hide();Visible=0;}}));
        menu.append(new nw.MenuItem({ label: 'Show', click:function () {win.show();Visible=1;}}));
        menu.append(new nw.MenuItem({ label: 'Exit', click:function () {process.exit(0)}}));
        tray.menu = menu;


        win.on('navigation',function (frame, url, policy)
        {
            console.log("url:"+url);
        });
    });

if(!global.DATA_PATH || global.DATA_PATH==="")
    global.DATA_PATH="../DATA";
global.CODE_PATH=process.cwd();


global.START_IP="";
global.START_PORT_NUMBER = 30000;
global.CREATE_ON_START=0;

global.LOCAL_RUN=0;
require('./core/run-server');


