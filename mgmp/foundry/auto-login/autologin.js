function joinFlow() {
    console.debug("joinFlow start " + window.location.href);
    if (window.location.href.startsWith("http:")) {
        console.debug("joinFlow case http: called directly from internal network - do nothing");
        return;
    }
    console.debug("joinFlow case https: called via reverse proxy, attempt to get user + password");
    $.get("/dokuwiki/doku.php?id=foundrystatus", function(data) {        
        let rp = location.pathname.split("/")[1];
        let user = new RegExp('<div id="'+rp+'.fvttusername">([^<]*)','g').exec(data);
        let password = new RegExp('<div id="'+rp+'.fvttpassword">([^<]*)','g').exec(data); 
        if ( !user || !password ) {
            console.debug('no user or no password, cannot login');
            return null;
        }
        if ( (user[1] === undefined) || (password[1] === undefined)) {
            console.debug('no user or no password, cannot login');
            return null;
        }
        user = user[1];
        password = password[1];
        const usersel = document.getElementsByName('userid');
        if(usersel && usersel[0]) {
            let sel = usersel[0];
            for( let i = 0; i < sel.options.length; i++ ) {
                opt = sel.options[i];                
                if(opt.text === user) {                    
                    fetch(foundry.utils.getRoute("join"), {
                        method: "POST",
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({'userid': opt.value, 'password': password, 'action': 'join' })
                    }).then(response => response.json())
                      .then(response => {                        
                        if ( response.status === 'success' ) {                            
                            setTimeout(() => window.location.href = response.redirect, 500 );
                        }
                    });
                }
            }            
        }
    });
}

function launchFlow(condition, flow) {
    if (!condition()) {
        setTimeout(()=>launchFlow(condition, flow), 100)
    } else {
        flow()
    }
}

if (location.pathname === foundry.utils.getRoute("join")) {
    launchFlow(() =>
        document.querySelectorAll("input[type='password']").length > 0,
        joinFlow
    )
}
