## Foundry Autologin

User management has not been a priority in the development of FoundryVTT. FoudryVTT user management has drawbacks, some IMHO unacceptable:
  * The admin/mastergm has to add users manually and set their passwords manually;
  * Passwords are hashed on the server with a one-way hash, the admin has to maintain some form of shadow registration of users and passwords;
  * Users are administrated on world level and if you have different hosts, users (and their passwords) have to be maintained seperately for each game;  
  * If you want a single password for a user, the admin has to sync this password accross all games the user is in;
  * Every time the admin changes something, a world reloads for all connected users.
  
## Foundry Autologin - User Experience

The desirable and implemented user experience is simple. A user logs in with Discord and is then presented a start page with the FoundryVTT instances for which he/she/it is permitted.

![](../discord-login/ux-discord-login-4.png)

After clicking on the link FoundryVTT opens the game, voila!

![](../discord-login/ux-discord-login-5.png)



## Foundry Autologin  - Implementation (for developers only)

Changing this requires changes to the FoundryVTT server code, but FoundryVTT modules are only allowed to run client-side in the browser.

The sequence diagram of this solution

![Autologin to Foundry](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/rhenenrpg/rhenenrpg.github.io/main/uml/sd-autologin-foundry.iuml)


