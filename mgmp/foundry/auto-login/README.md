## Foundry Autologin

User management has not been a priority in the development of FoundryVTT. FoudryVTT user management has drawbacks, some IMHO unacceptable from an UX perspective:
  * The admin/mastergm has to add users manually and set their passwords manually;
  * Passwords are hashed on the server with a one-way hash, the admin has to maintain some form of shadow registration of users and passwords;
  * Users are administrated on world level and if you have different hosts, users (and their passwords) have to be maintained seperately for each game;  
  * If you want a single password for a user, the admin has to sync this password accross all games the user is in;
  * Every time the admin commits a change in the user management page, the game reloads for all connected users.
  
## Foundry Autologin - User Experience

The desirable and implemented user experience is simple. A user logs in with Discord and is presented a start page. The start page shows all FoundryVTT instances that can be accessed.

![](../discord-login/ux-discord-login-4.png)

After clicking on the link FoundryVTT opens the game, voila!

![](../discord-login/ux-discord-login-5.png)

Only caveat is that the username in foundry is the same as the username in discord (plus discriminator).

## Foundry Autologin  - Implementation (for developers only)

Changing user management and the user login experience cannot be done with a module, but FoundryVTT modules are only allowed to run client-side in the browser within the scope of the active world. **This a good choice**. 

However, i still want a better user login experience. The implemented solution requires development in four places, two in dokuwiki and two changes to the FoundryVTT server code.

The sequence diagram of this solution

![Autologin to Foundry](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/rhenenrpg/rhenenrpg.github.io/main/uml/sd-autologin-foundry.iuml)


## Foundry Autologin - Change 1: Dokuwiki foundryvttstatus page

a wiki page 

```
https://rhenenrpg.net/dokuwiki/doku.php?id=foundrystatus
```

that is accessible to all and contains a plugin directive for each foundryvtt instance that can be accessed by all registered users.

```
<foundryvttstatus route="vtttuesday" port="30000">   
<foundryvttstatus route="vttsaturday" port="30001"> 
```

## Foundry Autologin - Change 2: Dokuwiki foundryvttstatus plugin

Copied from [foundryvttstatus plugin](https://github.com/rhenenrpg/dokuwiki-plug-foundryvttstatus):

Usage: 

```
<foundryvttstatus route="vttdinsdag" port="30000">   
```

if the user belongs to group $route, the status is checked of the foundryvtt instance on http://foundryvtt.lan:$port/$route using a custom added API that:
  * returns the status and active world of the instance;
  * adds the user as a foundryvtt user;
  * creates/updates the password from the foundryvtt user (a random password with 24 letters or digits);
  * if the user belongs to group gm$route it will receive  assistant GM permissions and player permissions otherwise;
  * returns a password that can be used to login this user in this foundryvtt instance.
If the user belongs to group $route a link to the instance is presented and a hidden <div> will contain the password for use by the foundryvtt autologin javascript.




