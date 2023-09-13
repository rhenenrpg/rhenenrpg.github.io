// Github:   https://github.com/rhenenrpg/rhenenrpg.github.io/blob/main/mgmp/roll20/CommunityPlaySupport.js
// By:       Martijn Sanders
// Contact:  https://app.roll20.net/users/2575981/martijn-s
// Forum:    na
var API_Meta = API_Meta || {}; //eslint-disable-line no-var
API_Meta.CommunityPlaySupport = { offset: Number.MAX_SAFE_INTEGER, lineCount: -1 };
{ try { throw new Error(''); } catch (e) { API_Meta.CommunityPlaySupport.offset = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - 7); } }

const CommunityPlaySupport = (() => { // eslint-disable-line no-unused-vars
    'use strict';

    // the following attributes are script settings
    const accountAttributeName = 'ffwplayerid';  // name of attribute of character that is used to store the roll20 accountid.
    const createdAttributeName = 'ffwcreationdate';  // name of attribute of character that is used to store the creation date. Will not store when value = ''                 
    // the mnemonic couin means 'Create Or Update If Needed'

    // the following are localization attributes - only chat messages are localized
    const MSG_NEW_CHAR_BUTTON = "Klik hier om nieuw Karakter te maken";
    const MSG_OPEN_EXISTING_CHARACTER = "Klik hier om je karakter te openen";
    const MSG_TOO_MANY_CHARACTERS = "Je hebt al het maximum aantal characters.";
    const MSG_AVATAR_IN_UNFINISHED_CHARACTER = "Pas op! Upload de avatar pas nadat het karakter af is. Defaulttoken is nu aangemaakt zonder HP en AC bar";
    const MSG_AVATAR_IS_MARKETPLACE = "Pas op! Gebruik voor de avatar een plaatje dat je zelf geupload hebt";
    const MSG_DEFAULT_TOKEN_WARNING = "Pas Op! De defaulttoken wordt automatisch overschreven met het plaatje van de avatar"

    const scriptName = "CommunityPlaySupport";
    const version = '0.0.2';
    API_Meta.CommunityPlaySupport.version = version;
    const lastUpdate = "20230821";
    const schemaVersion = 0.1;
    const S = () => state[scriptName];

    let changed_characters = {};

    const checkInstall = () => {
        log(`-=> ${scriptName} v${version} <=- [${lastUpdate}] --offset ${API_Meta.Survey.offset}`);
        if (!_.has(state, scriptName) || S().version !== schemaVersion) {
            mylog('  > Updating Schema to v' + schemaVersion + ' <');
            switch (S() && S().version) {
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
                        gmlist: [],
                        config: {
                            avatarIsDefaultToken: true,  // if true the default token will always be based on the avatar image
                            playerCharacterLimit: 1, // maximum amount of characters that a player is allowed to create in this game.
                            newCharacterName: "Nieuw", // Name for a new character, playername will be appended between round brackets
                            createdCharacterCheckDelay: 5000 // milliseconds to wait before checking new characters     
                        }
                    };
            }
        }
        log(`State of ${scriptName} = ${JSON.stringify(S())}`);
    };

    // generic helper functions    
    const mylog = (msg) => {
        const lines = new Error().stack.split("\n");
        log(`${(new Date()).toUTCString()} ${scriptName} ${lines[2].trim()} ${msg}`);
    };
    const getCleanImgsrc = (imgsrc) => {
        let parts = imgsrc.match(/(.*\/(?:images|marketplace)\/.*)(thumb|med|original|max)([^\?]*)(\?[^?]+)?$/);
        if (parts) {
            return parts[1] + 'thumb' + parts[3] + (parts[4] ? parts[4] : `?${Math.round(Math.random() * 9999999)}`);
        }
        return;
    };
    const id2date = (id) => {
        const result = _.reduce(id.substring(0, 8).split(''), (m, c) => {
            return (m * 64) + ("-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".indexOf(c));
        }, 0);
        return new Date(result);
    };
    const isNPC = (c) => {
        const npc = findObjs({ type: 'attribute', _characterid: c.get('id'), name: "npc" });
        return npc && npc.length && npc[0].get('current') == 1;
    };
    const isGM = (playerid) => {
        return S().gmlist.includes(playerid);
    };


    const standardizedCharacterName = (charactername, playername) => {
        return charactername.split('\(')[0].trim() + ' (' + playername.trim() + ')';
    };
    const couinDefaultTokenSub = (c, existingtoken) => {
        mylog(`Character ${c.get('name')} existingtoken ${existingtoken} ${typeof (existingtoken)} `);
        let w = 70;
        const tokensize = findObjs({ type: 'attribute', _characterid: c.get('id'), name: "token_size" });
        if (tokensize && tokensize.length && tokensize[0].get('current') > 1) {
            // small tokens are assumed to be normal size with a larger transparent border
            // mylog('tokensize[0].current' + tokensize[0].get('current'));
            w = 70 * tokensize[0].get('current');
        }
        const dt = {
            imgsrc: getCleanImgsrc(c.get("avatar")),
            name: c.get("name").split('\(')[0].trim(),
            represents: c.get('id'),
            left: 0,
            top: 0,
            width: w,
            height: w,
            layer: 'objects',
            showname: true,
            showplayers_name: true
        };
        if (isNPC(c)) {
            let a = findObjs({ type: 'attribute', _characterid: c.get('id'), name: "hp" });
            if (a && a.length > 0) {
                dt['bar1_value'] = a[0].get('max');
                dt['bar1_max'] = a[0].get('max');
                dt['bar1_link'] = "";
            }
            a = findObjs({ type: 'attribute', _characterid: c.get('id'), name: "npc_ac" });
            if (a && a.length > 0) {
                dt['bar2_value'] = a[0].get('current');
                dt['bar2_link'] = a[0].get('_id');
            }
        } else {
            let a = findObjs({ type: 'attribute', _characterid: c.get('id'), name: "hp" });
            if (a && a.length > 0) {
                dt['bar1_value'] = a[0].get('current');
                dt['bar1_max'] = a[0].get('max');
                dt['bar1_link'] = a[0].get('_id');
            }
            a = findObjs({ type: 'attribute', _characterid: c.get('id'), name: "ac" });
            if (a && a.length > 0) {
                dt['bar2_value'] = a[0].get('current');
                dt['bar2_link'] = a[0].get('_id');
            }
        }
        let same = true;
        let existingtokenobj;
        if (existingtoken === null || (typeof (existingtoken) === "string" && existingtoken.length < 5)) {
            same = false;
        } else {
            existingtokenobj = JSON.parse(existingtoken);
            mylog(`existingtokenobj ${existingtoken}}`);
            mylog(`dt ${JSON.stringify(dt)}}`);
            for (const [key, value] of Object.entries(dt)) {
                if (existingtokenobj[key] === undefined) {
                    if (value != '') {
                        mylog(`DEBUG DIFFERENT ${key} ${value} vs ${existingtokenobj[key]}`);
                        same = false;
                    }
                } else if (key === 'imgsrc') {
                    mylog(`DEBUG VALUES TO COMPARE ${key} ${value} vs ${existingtokenobj[key]}`);                    
                    if ((value && !existingtokenobj[key]) || (value && !existingtokenobj[key])) {
                        mylog(`DEBUG DIFFERENT ${key} ${value} vs ${existingtokenobj[key]}`);
                        same = false;
                    } else if (value.split('?')[0] !== existingtokenobj[key].split('?')[0]) {
                        mylog(`DEBUG DIFFERENT ${key} ${value} vs ${existingtokenobj[key]}`);
                        same = false;
                    }
                } else if (value != existingtokenobj[key]) {  // != on purpose
                    mylog(`DEBUG DIFFERENT ${key} ${value} vs ${existingtokenobj[key]}`);
                    same = false;
                }
            }
        }
        if (same) {
            mylog(`character ${c.get("name")} token does not require an update`);
        } else {
            // pageid and subtype will never be found in existingtoken, so only add these here
            dt['pageid'] = Campaign().get('playerpageid');
            dt['subtype'] = 'token';
            const token = createObj('graphic', dt);
            // createObj ignores many past values, so explicitly set ignored values 
            for (const [key, value] of Object.entries(dt)) {
                if (value !== token.get(key)) {
                    // mylog(`from DT set token ${key} set to ${value}`);
                    token.set(key, value);
                }
            }
            // add missing values from existing token to maintain for example
            // vision related attributes
            if (existingtokenobj !== undefined) {
                for (const [key, value] of Object.entries(existingtokenobj)) {
                    // mylog(`existingtokenobj ${key} set to ${value}`);
                    if (!(key in dt) && value !== token.get(key)) {
                        // mylog(`from existingtokenobj set token ${key} set to ${value}`);
                        token.set(key, value);
                    }
                }
            }
            mylog(`character ${c.get("_id")} defaulttoken set as ${JSON.stringify(token)}`);
            setDefaultTokenForCharacter(c, token);
            token.remove();
        }
    }
    const couinDefaultToken = (c) => {
        if (!S().config.avatarIsDefaultToken) {
            return;
        }
        if (c.get("avatar").length < 10) {
            mylog(`character ${c.get("_id")} avatar does not contain a valid url - default token not updated`);
            return;
        }
        if (c.get("avatar").includes('marketplace')) {
            mylog(`character ${c.get("_id")} cannot use a marketplace image as token}`);
            return;
        }
        if (!getCleanImgsrc(c.get("avatar"))) {
            mylog(`character ${c.get("_id")} cannot use image ${c.get("avatar")} as token}`);
            return;
        }
        c.get("_defaulttoken", (t) => {
            // use function to get meaningfull linenumbers in exceptions
            couinDefaultTokenSub(c, t);
        });
    };
    const removeGMAssignments = (character) => {
        mylog(`removeGMAssignments ${character.get('name')}`);
        // Remove superfluous assignments to GMs resulting from CharacterVault Exports.
        const players = findObjs({ type: 'player' });
        ['inplayerjournals', 'controlledby'].forEach((fieldname) => {
            const valueNew = character.get(fieldname).split(',').filter(id => id && (id === 'all' || players.filter(p => id === p.get("_id") && !isGM(id)).length)).join(',');
            mylog(`removeGMAssignments old ${character.get(fieldname)} new ${valueNew}`);
            if (valueNew !== character.get(fieldname)) {
                mylog(`update ${fieldname} value ${character.get(fieldname)} to ${valueNew}`);
                character.set(fieldname, valueNew);
            }
        });
    }
    const couinCharacterOfPlayer = (c, player) => {
        const d = (new Date()).getTime()
        // mylog(`info kept ${changed_characters[c.get('id')]}  d ${d}`)
        if ((c.get('id') in changed_characters) && ((d - changed_characters[c.get('id')]) < 1000)) {
            mylog(`character ${c.get("_id")} skipping spurious update of character`);
            return;
        }
        mylog(`character ${c.get("_id")}`);
        changed_characters[c.get('id')] = d;

        let accountAttrs = findObjs({ type: 'attribute', characterid: c.get('id'), name: accountAttributeName });
        if (accountAttrs.length > 1) {
            // Rule: One Character is linked to One account - applies in Hub and Play Games
            mylog(`too many ${accountAttributeName} attributes, found ${accountAttrs.length}, removing all but first.`);
            for (let i = 1; i < accountAttrs.length; i++) {
                accountAttrs[i].remove();
            }
            accountAttrs = [accountAttrs[0]];
        }
        if (accountAttrs.length == 1) {
            if (accountAttrs[0].get('current') !== player.get("_d20userid")) {
                mylog(`updating ${accountAttributeName} attribute from ${accountAttrs[0].get('current')} to ${player.get("_d20userid")}`);
                accountAttrs[0].set('current', player.get("_d20userid"));
            }
        } else {
            mylog(`creating ${accountAttributeName} attribute with value ${player.get("_d20userid")}`);
            createObj("attribute", { name: accountAttributeName, current: player.get('d20userid'), max: player.get('d20userid'), characterid: c.id });
        }
        ['inplayerjournals', 'controlledby'].forEach((fieldname) => {
            // Rule: character should be assigned to userid in ${accountAttributeName}, 'all' is additive            
            const valueArray = c.get(fieldname).split(',')
            const valueNew = player.get('_id') + (('all' in valueArray) ? ',all' : '');
            if (valueNew !== c.get(fieldname)) {
                mylog(`character ${c.get("_id")} update  ${fieldname} value ${c.get(fieldname)} to ${valueNew}`);
                c.set(fieldname, valueNew);
            }
        });
        let std_name = standardizedCharacterName(c.get('name'), player.get('_displayname'));
        if (std_name !== c.get('name')) {
            mylog(`character ${c.get("_id")} update name ${c.get('name')} to ${std_name}`);
            c.set('name', std_name);
        }
        couinDefaultToken(c);

        // Note: During CharacterVault Exports characters can receive fully new object id's. 
        // So store the 'creation' date in a seperate attribute to enable reporting later
        if (createdAttributeName.length) {
            let createdAttributes = findObjs({ type: 'attribute', characterid: c.get('id'), name: createdAttributeName });
            if (createdAttributes.length > 1) { // if should not be needed
                mylog(`character ${c.get("_id")}  remove too many ${createdAttributeName} attributes #${createdAttributes.length}`);
                for (let i = 1; i < createdAttributes.length; i++) {
                    createdAttributes[i].remove();
                }
                createdAttributes = [createdAttributes[0]];
            }
            if (createdAttributes.length < 1) {
                mylog(`character ${c.get("_id")}  creating missing attribute ${createdAttributeName}`);
                const d = id2date(c.get('id'));
                createObj("attribute", { name: createdAttributeName, current: (10000 * d.getFullYear()) + (100 * (1 + d.getMonth())) + d.getDate(), characterid: c.get('id') });
            }
        }
    };
    const couinAllCharactersOfPlayer = (player) => {
        const attrs = findObjs({ type: 'attribute', name: accountAttributeName, _current: player.get('d20userid') });
        mylog(`nr of characters to potentially update = ${attrs.length}`);
        const burndownAllCharactersOfPlayer = () => {
            let a = attrs.shift();
            if (a) {
                couinCharacterOfPlayer(getObj('character', a.get('_characterid')), player);
                setTimeout(burndownAllCharactersOfPlayer, 0);
            }
        };
        burndownAllCharactersOfPlayer()
    };
    const couinCharacter = (character) => {
        const attrs = findObjs({ type: 'attribute', name: accountAttributeName, _characterid: character.get('id') });
        if (attrs.length > 0) { // only for characters that have ${accountAttributeName} attribute            
            const players = findObjs({ type: 'player', d20userid: attrs[0].get('current') });
            if (players.length > 0) {
                mylog(`Character ${character.get("name")} Check ownership, inplayerjournals: ${character.get("inplayerjournals")}, controlledby: ${character.get('controlledby')}, ${accountAttributeName}: ${attrs[0].get('current')}`);
                couinCharacterOfPlayer(character, players[0]);
            } else {
                mylog(`Character ${character.get("name")} ${accountAttributeName} references a player that has not joined this game`);
                removeGMAssignments(character);
            }
        } else {
            removeGMAssignments(character);
            // Due to script NOT running in Hub Games there can be spurious characters without ${accountAttributeName} attribute
            const valueArray = character.get('controlledby').split(',');
            const foundPlayers = findObjs({ type: 'player' }).filter(p => p.get("_id") in valueArray);
            if (foundPlayers.length > 1) {
                mylog(`Character ${character.get("name")} assigned to multiple players, first player will be assigned and others removed`);
            }
            if (foundPlayers.length > 0) {
                const player = foundPlayers[0];
                // Rule: assign accountid of FIRST assigned player, other assignments will be removed
                createObj("attribute", { name: accountAttributeName, current: player.get('d20userid'), max: player.get('d20userid'), characterid: character.id });
                couinCharacterOfPlayer(character, player);
            } else {
                couinDefaultToken(character);
            }
        }
    };
    const deleteTokensOnActivePage = () => {
        let ppi = Campaign().get('playerpageid')
        findObjs({ type: 'graphic', subtype: 'token', layer: 'objects', pageid: ppi })
            .filter(c => c.get('name')).forEach(t => {
                mylog(`remove token ${t.get('id')} ${JSON.stringify(t)}`);
                t.remove();
            });
    };
    const sendButton = (player) => {
        if (S().config.playerCharacterLimit <= 0) { return; }
        mylog(JSON.stringify(player));
        const existingChars = findObjs({ type: 'character', controlledby: player.get("id") });
        if (existingChars && existingChars.length >= S().config.playerCharacterLimit) {
            sendChat(scriptName, `/w "${player.get('_displayname')}" <a href="http://journal.roll20.net/character/${existingChars[0].id}">${MSG_OPEN_EXISTING_CHARACTER}</a>`, null, { noarchive: true });
        } else {
            sendChat(scriptName, `/w "${player.get('_displayname')}" <a href="!cps --create">${MSG_NEW_CHAR_BUTTON}</a>`, null, { noarchive: true });
        }
    };
    const createCharacterAndAssign = (player) => {
        if (S().config.playerCharacterLimit <= 0) { return; }
        const existingChars = findObjs({ type: 'character', controlledby: player.get("id") });
        const newChars = findObjs({ type: 'character', controlledby: player.get("id"), name: `${S().config.newCharacterName} (${player.get('_displayname')})` });
        if (newChars.length > 0) {
            sendChat(scriptName, `/w "${player.get('_displayname')}" <a href="http://journal.roll20.net/character/${newChars[0].id}">${MSG_OPEN_EXISTING_CHARACTER}</a>`, null, { noarchive: true });
        } else if (existingChars.length >= S().config.playerCharacterLimit) {
            sendChat(scriptName, `/w "${player.get('_displayname')}" ${MSG_TOO_MANY_CHARACTERS} <a href="http://journal.roll20.net/character/${existingChars[0].id}">${MSG_OPEN_EXISTING_CHARACTER}</a>`, null, { noarchive: true });
        } else {
            const c = {
                "name": `${S().config.newCharacterName} (${player.get('_displayname')})`,
                "bio": "",
                "gmnotes": "",
                "_defaulttoken": "",
                "archived": false,
                "inplayerjournals": player.get("id"),
                "controlledby": player.get("id"),
                "_type": "character",
                "avatar": ""
            }
            const character = createObj('character', c);
            createObj("attribute", { name: accountAttributeName, current: player.get('d20userid'), max: player.get('d20userid'), characterid: character.id });
            sendChat(scriptName, `/w "${player.get('_displayname')}" <a href="http://journal.roll20.net/character/${character.id}">${MSG_OPEN_EXISTING_CHARACTER}</a>`, null, { noarchive: true });
            // give roll20 some time to add the attribute (createObj goes to firebase, update from firebase triggers update of data cache)
            setTimeout(() => { couinCharacterOfPlayer(character, player) }, S().config.createdCharacterCheckDelay);
        }
    };
    const sendButtonToAllOnlinePlayers = () => {
        if (S().config.playerCharacterLimit <= 0) { return; }
        const onlinePlayers = findObjs({ type: 'player', _online: true });
        const burndownSendButtonToAllOnlinePlayers = () => {
            const p = onlinePlayers.shift();
            if (p) {
                sendButton(p)
                setTimeout(burndownSendButtonToAllOnlinePlayers, 0);
            }
        };
        burndownSendButtonToAllOnlinePlayers();
    }
    const fixAll = (who) => {
        mylog(`Fix All on request of ${who}`);
        const players = findObjs({ type: 'player' });
        mylog(`#players = ${players.length}`);
        mylog(`playerList = '${JSON.stringify(players)}`);
        players.forEach(p => { mylog(`player = ${p.get("_id")} ${isGM(p.get("_id"))}`); });
        const characters = findObjs({ type: 'character' });
        const burndownFixAll = () => {
            const c = characters.shift();
            if (c) {
                mylog(`Fix character ${c.get("name")}`);
                couinCharacter(c);
                setTimeout(burndownFixAll, 0);
            } else {
                mylog('Report DONE');
            }
        };
        burndownFixAll();
    };
    const handleInput = (msg) => {
        var args, player, who;
        if (msg.type !== "api") {
            return;
        }
        player = getObj('player', msg.playerid);
        who = (player || { get: () => 'API' }).get('_displayname').split(' ')[0];
        args = msg.content.split(/\s+/);
        mylog(`handleInput ${who} ${args}`);
        switch (args.shift()) {
            case '!cps':
                mylog(`${msg.playerid} ${msg.content}`);
                if (_.contains(args, '--help')) {
                    mylog('please implement help')
                    // showHelp(who);
                }
                if (_.contains(args, '--fix') && isGM(msg.playerid)) {
                    fixAll(who);
                }
                if (_.contains(args, '--deletetokens') && isGM(msg.playerid)) {
                    deleteTokensOnActivePage();
                }
                if (_.contains(args, '--create')) {
                    createCharacterAndAssign(player);
                }
                if (_.contains(args, '--button')) {
                    sendButton(player);
                }
                break;
            default:
                sendButton(player);
        }
    };
    const addCharacter = (character) => {
        mylog(`add:character ${character.get('id')}`);
        // This event can be a new character or an imported character.
        // In both cases wait some time to allow attributes to be created.        
        setTimeout(() => { couinCharacter(character); }, S().config.createdCharacterCheckDelay);
    }
    const handleChangeCharacterName = (character, prev) => {
        mylog(`change:character:name ${character.get('name')} ${prev['name']}`);
        // roll20 uses a seperate, non-synced attribute npc_name.
        // only sync name to npc_name, not other way round to prevent ping pong
        let a = findObjs({ type: 'attribute', _characterid: character.get('id'), name: "npc_name" });
        if (a.length == 1 && a[0].get('current') !== character.get('name')) {
            a[0].set('current', character.get('name'))
        }
        couinCharacter(character);
    }
    const handleChangeCharacterAvatar = (character, prev) => {
        mylog(`character = ${character}`);
        const attrs = findObjs({ type: 'attribute', _characterid: character.id, name: accountAttributeName });
        let player;
        if (attrs.length > 0) {
            const players = findObjs({ type: 'player', d20userid: attrs[0].get('current') });
            if (players.length > 0) {
                player = players[0];
            }
        }
        if (player != undefined) {
            if (character.get('avatar').includes('marketplace')) {
                mylog(`send warning to player = ${player}: ${MSG_AVATAR_IS_MARKETPLACE}`);
                sendChat(scriptName, `/w "${player.get('_displayname')}" ${MSG_AVATAR_IS_MARKETPLACE}</div>`);
            }
            let a = findObjs({ type: 'attribute', _characterid: character.id, name: "hp" });
            if (a.length <= 0) {
                mylog(`send warning to player = ${player}: ${MSG_AVATAR_IN_UNFINISHED_CHARACTER}`);
                sendChat(scriptName, `/w "${player.get('_displayname')}" ${MSG_AVATAR_IN_UNFINISHED_CHARACTER}</div>`);
            }
        }
        couinCharacter(character);
    }
    const handleChangeCharacterDefaultToken = (character, prev) => {
        // to prevent ping-pong behavior, only a warning is send when player sets defaulttoken directly
        if (S().config.avatarIsDefaultToken) {
            const attrs = findObjs({ type: 'attribute', _characterid: character.id, name: accountAttributeName });
            if (attrs.length > 0) {
                const players = findObjs({ type: 'player', d20userid: attrs[0].get('current') });
                if (players.length > 0) {
                    sendChat(scriptName, `/w "${players[0].get('_displayname')}" ${MSG_DEFAULT_TOKEN_WARNING}</div>`);
                }
            }
        }
    }
    const handleChangePlayerOnline = (player, prev) => {
        mylog(`change:player:online ${player.get('d20userid')} ${player.get('_displayname')} online changes to ${player.get('online')}`);
        if (player.get('online')) {
            // playerIsGM only works when a player is only. Since we need to be able to fix character assignements when
            // some GMs are offline, store GMs in the state.
            const playerId = player.get("_id")
            const updatedGmlist = S().gmlist.filter((id) => id !== playerId);
            if (playerIsGM(playerId)) { updatedGmlist.push(playerId); }
            S().gmlist = updatedGmlist, playerId;
            // change:player:online is like the first event triggered when the browser connects to firebase
            // delay sending button, as we do not want it to arrive before chat is loaded in the browser
            setTimeout(() => { sendButton(player); }, 5000);
            // if the player just joined the game and comes online for the first time, 
            // there can be imported yet non-assigned characters
            setTimeout(() => { couinAllCharactersOfPlayer(player); }, 0);
        }
    }
    const handleChangePlayerDisplayname = (player, prev) => {
        mylog(`player ${player.get('d20userid')} changes displayname to ${player.get('_displayname')}`);
        couinAllCharactersOfPlayer(player);
    }
    const registerEventHandlers = () => {
        on('chat:message', handleInput);
        on('add:character', addCharacter);
        on('change:character:name', handleChangeCharacterName);
        on('change:character:avatar', handleChangeCharacterAvatar);
        on('change:character:_defaulttoken', handleChangeCharacterDefaultToken);
        on('change:player:_online', handleChangePlayerOnline);
        on('change:player:_displayname', handleChangePlayerDisplayname);
    };
    on('ready', () => {
        checkInstall();
        registerEventHandlers();
        sendButtonToAllOnlinePlayers();
    });

    return {
        // Public interface here 
    };

})();

{ try { throw new Error(''); } catch (e) { API_Meta.CommunityPlaySupport.lineCount = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - API_Meta.CommunityPlaySupport.offset); } }
