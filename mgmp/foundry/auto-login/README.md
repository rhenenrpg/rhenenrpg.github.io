## Foundry Autologin

User management has not been a priority in the development of FoundryVTT. FoudryVTT user management has drawbacks, some IMHO unacceptable:
  * The admin/mastergm has to add users manually and set their passwords manually;
  * Passwords are hashed with a one-way hash, the admin has to maintain some form of shadow registration of users;
  * Users are administrated on world level and if you have different hosts, users (and their passwords) have to be maintained seperately for each game;  
  * If you want a singe password for a user, the admin has to sync this password accross all games the user is in;
  * Every time the admin changes something, a world reloads for all connected users.
  

Changing this requires a patch i

## Foundry Autologin  - Implementation (for developers only)

The sequence diagram of this solution

![Autologin to Foundry](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/rhenenrpg/rhenenrpg.github.io/main/uml/sd-autologin-foundry.iuml)


