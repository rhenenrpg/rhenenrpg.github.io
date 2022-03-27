// source https://gist.github.com/MartijnSanders/072b9af2eea5d362cff5cac90eea4633

var FFW = FFW || (function() { // eslint-disable-line no-unused-vars
    'use strict';

    const scriptName = "Frequent Freewheelers";
    const version = '0.0.7';
    const lastUpdate = 1634706237;
    const schemaVersion = 0.1;    
    const S = () => state[scriptName];
    let changed_characters = {};
    const mylog = (msg) => {
        let d = new Date();
        let lines = new Error().stack.split("\n");
        log(`${d.toUTCString()} ${lines[2].trim()} ${msg}`);
    };
    const checkInstall = () => {
      log(`-=> ${scriptName} v${version} <=-  [${new Date(lastUpdate*1000)}]`);
      if( ! _.has(state,scriptName) || S().version !== schemaVersion) {
        log('  > Updating Schema to v'+schemaVersion+' <');
        switch(S() && S().version) {
          case 0.2:
            S().version = schemaVersion; /* placeholder */
            /* break; // intentional dropthrough */ /* falls through */

          case 0.3:
            S().version = schemaVersion; /* placeholder */
            /* break; // intentional dropthrough */ /* falls through */

          case 'UpdateSchemaVersion':
            S().version = schemaVersion;
            break;

          default:
            state[scriptName] = {
              version: schemaVersion,
              config: {
                showButton: false,
                createDefaultToken: true,
                standardizeCharacterNames: true,
              }
            };
        }
      }      
    };
    const getCleanImgsrc = (imgsrc) => {
        let parts = imgsrc.match(/(.*\/images\/.*)(thumb|med|original|max)([^?]*)(\?[^?]+)?$/);
        if(parts) {
            return parts[1]+'thumb'+parts[3]+(parts[4]?parts[4]:`?${Math.round(Math.random()*9999999)}`);
        }
        return;
    };
    const createDefaultToken = (c) => {
        const tokensize = findObjs({type:'attribute', _characterid: c.get('id'),name:"token_size"});        
        let w = 70;
        if (tokensize && tokensize.length && tokensize[0].get('current') > 1) {
            mylog('tokensize[0].current' + tokensize[0].get('current'));
            w = 70 * tokensize[0].get('current');
        }
        const npc = findObjs({type:'attribute', _characterid: c.get('id'),name:"npc"});
        let isNPC = false;
        if (npc && npc.length && npc[0].get('current') == 1) {
            isNPC = true;
        }
        mylog('npc=' + isNPC + ' w='+ w);
        const dt = {
            imgsrc : getCleanImgsrc(c.get("avatar")),
            subtype: 'token',
            name: c.get("name").split('\(')[0].trim(),
            pageid: Campaign().get('playerpageid'),
            represents : c.get('id'),
            left:70,top:70,width:w,height:w,layer:'objects',
            showname:true,
            showplayers_name:true }
        const token = createObj('graphic',dt);
        let a = findObjs({type:'attribute', _characterid: c.get('id'),name:"hp"});
        if (a && a.length>0) {
            if (isNPC) {
                token.set('bar1_value',a[0].get('max'));
                token.set('bar1_max',a[0].get('max'));
             } else {
                token.set('bar1_value', a[0].get('current'));
                token.set('bar1_max',a[0].get('max'));
                token.set('bar1_link',a[0].get('_id'));
             }
        } else {
            sendChat('Frequent Freewheeler Bot',`<div style="color: #993333;font-weight:bold;">Pas op! Upload de avatar pas nadat het karakter af is. Defaulttoken nu aangemaakt zonder HP en AC bar</div>`);
        }
        if (isNPC) {
            a = findObjs({type:'attribute', _characterid: c.get('id'),name:"npc_ac"});
            if (a && a.length>0) {
                token.set('bar2_value',a[0].get('current'));
            }
        } else {
            a = findObjs({type:'attribute', _characterid: c.get('id'),name:"ac"});
            if (a && a.length>0) {
                token.set('bar2_value',a[0].get('current'));
                token.set('bar2_link',a[0].get('_id'));
            } 
        }
        setDefaultTokenForCharacter(c,token);
        mylog("constructed "+ JSON.stringify(token));
        token.remove();
    };
    const standardizeCharacterName = (charactername, playername)=> {
        return charactername.split('\(')[0].trim() + ' (' + playername.trim() + ')';
    };
    const updateSingleCharacter = (c,player, force)=> {
        const d = (new Date()).getTime()
        mylog("info kept" + changed_characters[c.get('id')] + "  d" + d)
        if ( (c.get('id') in changed_characters) && ((d - changed_characters[c.get('id')]) < 1000)) {
            mylog("skipping spurious update of character " + c.get("id"));
            return;
        }
        changed_characters[c.get('id')] = d
        const std_name = standardizeCharacterName(c.get('name'),player.get('_displayname'));
        mylog("UPDATED name " + c.get('name') + " to " + std_name + " force " + force);
        if( (std_name !== c.get('name')) || force) {
            c.set('name',std_name);
            if(c.get("avatar").length>4){
                createDefaultToken(c);
            }
            mylog("UPDATED name " + c.get('name'));
        }
        if ( c.get('inplayerjournals') !== player.get("id") ) {
            c.set("inplayerjournals",player.get("id"));
            mylog("UPDATED inplayerjournals " + c.get('name'));                
        }
        if ( c.get('controlledby') !== player.get("id")) {
            c.set("controlledby",player.get("id"));
            mylog("UPDATED controlledby " + c.get('name'));
        }    
    };
    const updateAllCharactersOfPlayer = (player) => {
        const attrs = findObjs({type: 'attribute', name:'ffwplayerid', _current:player.get('d20userid')});
        mylog('nr of characters to update = ' + attrs.length);
        attrs.forEach( (a) => { 
            findObjs({type:'character', id:a.get('_characterid')}).forEach( (c) => { 
                setTimeout(() => { 
                    updateSingleCharacter(c,player,false); 
                }, 500); 
            }) 
        });
    };
    const updateCharacter = (character) => {
        const attrs = findObjs({type: 'attribute', name:'ffwplayerid',_characterid: character.get('id')});
        mylog('nr of characters to update = ' + attrs.length);
        if ( attrs.length > 0 ) { // only for characters that have ffwplayerid attribute
              let players = findObjs({type: 'player', d20userid: attrs[0].get('current')});
              mylog('nr of players found = ' + players.length);
              if (players.length> 0) {
               updateSingleCharacter(character,players[0],true)
            }
        }
    };
    const setLastUpdate = (character) => {
        const attrs = findObjs({type: 'attribute', name:'ffwgmnoteslastupdate',_characterid: character.get('id')});
        let d = new Date(); 
        let lupdate = (10000*d.getFullYear()) + (100*(1+d.getMonth())) + d.getDate();
        if ( attrs.length > 0 ) { // only for characters that have ffwplayerid attribute
            mylog('setLastUpdate updating first of #attributes=' + attrs.length);
            attrs[0].set('current',lupdate);
        } else {
            mylog('setLastUpdate creating ffwgmnoteslastupdate attribute');
            createObj("attribute", {name: "ffwgmnoteslastupdate", current: lupdate, characterid: character.id});
	}
    };
    const outerBlob = (dd, data ) => {
       let data2 =  data.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').replace(/&nbsp;/g, ' ');
       dd['gmnotes'] = data2;
       log('blob ' + JSON.stringify(dd));
    };
    const outerjoin = (c, fa, dd, i) => {
       if( i == fa.length ) {
           c.get("gmnotes", (data) => outerBlob(dd, data));
       } else {
           let aa = findObjs({type:'attribute', _characterid: c.get('id'),name:fa[i]});
           if (aa && aa.length>0) {
               aa.forEach(a => { 
                  dd[fa[i]] = a.get('current');
                  outerjoin(c,fa,dd,i+1);          
               })
           } else {
              dd[fa[i]] = 'null';
              outerjoin(c,fa,dd,i+1);
           }
       }
    };
    const reportAndFix = (who, fix)=> {
        log("FFW report to log on request of " + who);
        let playerDict = {};
        findObjs({type:'player'}).forEach(p=>{ playerDict[p.get('id')] = p; });
        log('FFW Report #players = ' + playerDict.length);
        log('FFW Report playerDict = '+ JSON.stringify(playerDict));    
        findObjs({type:'character'}).filter(c => c.get("controlledby")).forEach( c => {
            log('FFW Report character name:' + c.get("name") + ' controlledby:' + c.get('controlledby'));
            if ( c.get('controlledby') === 'all' ) {
                log('   controlled by all - skipping');
            } else if ( c.get('controlledby') in playerDict ) {
                let player = playerDict[c.get('controlledby')];
                let ffwattrs = findObjs({type: 'attribute', characterid:c.get('id'), name:'ffwplayerid'});
                if (ffwattrs.length > 1) {
                    log('   SHOULD remove too many ffwplayerid attributes #'+ ffwattrs.length);
                    if(fix) {
                        for(let i = 1; i < ffwattrs.length; i++) {
                            ffwattrs[i].remove();
                        }
                    }
                    ffwattrs = [ffwattrs[0]];
                } else if (ffwattrs.length < 1) {
                    log('   SHOULD add ffwplayerid attribute');
                    if(fix) {
                        createObj("attribute", {name: "ffwplayerid", current: player.get('d20userid'),max: player.get('d20userid'),characterid: c.id});
                    }
                } else if( player.get('d20userid') !== ffwattrs[0].get('current') ) {
                    log('   SHOULD correct ffwplayerid ' + ffwattrs[0].get('current'));
                    if(fix) {
                        ffwattrs[0].set('current',player.get('d20userid'));
                    }
                }
                ffwattrs = findObjs({type: 'attribute', characterid:c.get('id'), name:'ffwcreationdate'});
                if (ffwattrs.length > 1) {
                    log('   SHOULD remove too many ffwcreationdate attributes #'+ ffwattrs.length);
                    if(fix) {
                        for(let i = 1; i < ffwattrs.length; i++) {
                            log('fix not implemented');
                            // ffwattrs[i].remove();
                        }
                    }
                    ffwattrs = [ffwattrs[0]];
                } 
                if (ffwattrs.length < 1) {
                    log('   SHOULD add ffwcreationdate attribute');
                    if(fix) {
                       let d = new Date(); 
                       createObj("attribute", {name: "ffwcreationdate", current: (10000*d.getFullYear()) + (100*(1+d.getMonth())) + d.getDate(),characterid: c.get('id')});
                    }
                } 
                if(c.get('inplayerjournals') !== c.get('controlledby')) {
                    log('   SHOULD update inplayerjournals');
                    if(fix) c.set('inplayerjournals',c.get('controlledby'));
                }
                let rightname = standardizeCharacterName(c.get('name'),player.get('_displayname'));
                if( rightname !== c.get('name')) {
                    log('   SHOULD update name to '+ rightname);
                    if(fix) c.set('name',rightname)
                }
            } else {
                log('   controlledby points to non-joined player');
            }
        });
        log('outerjoin all characters');
        findObjs({type:'character'}).forEach(c =>{ 
            let dd = {'id':c.get('id'), 'name' : c.get('name') };
            let fa = ['ffwplayerid', 'ffwcreationdate', 'ffwgmnoteslastupdate', 'level', 'experience'];
            outerjoin(c, fa, dd, 0);
        });
        log('done');    
    };
    const deleteTokensOnActivePage = ()=> {
        let ppi = Campaign().get('playerpageid')
        mylog(ppi);
        findObjs({type:'graphic', subtype: 'token', layer:'objects', pageid: ppi })
            .filter( c=> c.get('name')).forEach( t =>{ 
                mylog('token '+t.get('id') + ' ' + JSON.stringify(t)); 
                t.remove();
            });
    };
    const sendButton = (player)=> {
        mylog("!newpcmenu " + JSON.stringify(player));
        sendChat('FFW', '/w \"' + player.get('_displayname') + '\" <a href="!newpc">Klik hier om nieuw Karakter te maken</a>', null, {noarchive:true});
    };
    const createCharacterAndAssign = (player)=> {
        const existingChars = findObjs({type: 'character',controlledby:player.get("id"),name: "nieuw ("+player.get('_displayname') +")"});
        if ( existingChars && existingChars.length > 0 ) {
            sendChat('FFW', '/w \"' + player.get('_displayname') + '\" <a href="http://journal.roll20.net/character/'+ existingChars[0].id + '">bestaat al, klik hier om je karakter te openen</a>', null, {noarchive:true});
        } else {
            const c = {"name": "nieuw ("+player.get('_displayname') +")" ,
                "bio":"",
                "gmnotes":"",
                "_defaulttoken":"",
                "archived":false,
                "inplayerjournals":player.get("id"),
                "controlledby":player.get("id"),
                "_type":"character",
                "avatar":""}
            let character = createObj('character',c);          
            createObj("attribute", {name: "ffwplayerid", current: player.get('d20userid'),max: player.get('d20userid'),characterid:character.id});
            let d = new Date(); 
            createObj("attribute", {name: "ffwcreationdate", current: (10000*d.getFullYear()) + (100*(1+d.getMonth())) + d.getDate(),characterid: character.id});
            sendChat('FFW', '/w \"' + player.get('_displayname') + '\" <a href="http://journal.roll20.net/character/'+ character.id + '">klik hier om je nieuwe karakter te openen</a>', null, {noarchive:true});
        }
    }; 
    const handleInput = (msg)=> {
        var args, player, who;
        if (msg.type !== "api") {
            return;
        }
        player = getObj('player',msg.playerid);
        who = (player||{get:()=>'API'}).get('_displayname').split(' ')[0];
        args = msg.content.split(/\s+/);
        mylog("handleInput " + who + " " + args);
        switch(args.shift()) {
            case '!ffw':
                if(!playerIsGM(msg.playerid)) {
                    return;
                }                
                mylog(`${msg.playerid} ${msg.content}`);                
                if(_.contains(args,'--help')) {
                    mylog('please implement help')
                    // showHelp(who);
                    return;
                }
                if(_.contains(args,'--report')) {
                    reportAndFix(who,false);
                    return;
                }
                if(_.contains(args,'--fix')) {
                    reportAndFix(who,true);
                    return;
                }
                if(_.contains(args,'--deleteunseentokens')) {
                    deleteTokensOnActivePage();
                    return;
                }
                break;
            case '!newpcmenu':
                mylog("!newpcmenu " + player );
                sendButton(player);
                break;
            case '!newpc':
                createCharacterAndAssign(player);
                break;
        }
    };
    const registerEventHandlers = ()=> {
        on('chat:message', handleInput);
        on('add:character', (obj) => { // this can be an imported character
            setTimeout(()=>{ updateCharacter(obj); },5000);
        });
        on('change:player:_online', (obj,prev) => { 
            if(obj.get('online')) {
                mylog("players comes online "+obj.get('_displayname')); 
                updateAllCharactersOfPlayer(obj); // there can be non-assigned characters
                setTimeout(() => { sendButton(obj); }, 5000);
            }
        });        
        on('change:player:_displayname', (obj,prev) => {    
            mylog("players changes displayname "+obj.get('_displayname')); 
            updateAllCharactersOfPlayer(obj);
        });                
        on('change:character:name', (obj,prev) => {        
            mylog('change:character:name ' + obj.get('name') + " " + prev['name']);
            updateCharacter(obj);
        });    
        on('change:character:gmnotes', (obj,prev) => {        
            mylog('change:character:gmnotes of ' + obj.get('name'));
            setLastUpdate(obj);
        });    
        on('change:character:avatar', (obj,prev) => {
            mylog('change:character:avatar ' + obj.get('name'));
            if(obj.get('avatar').length > 4) {
               createDefaultToken(obj);
            }
        });
     };

    on('ready',()=>{
        checkInstall();
        registerEventHandlers();
        findObjs({type:'player',_online:true}).forEach( p => { 
            setTimeout(function(){ sendButton(p); },500); 
        });
     });


     return {
       // Public interface here 
     };
    
}());



