## Autologin to Foundry


## Autologin to Foundry - Implementation (for developers only)

The sequence diagram of the Autologin to Foundry

![Autologin to Foundry](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/rhenenrpg/rhenenrpg.github.io/main/uml/sd-autologin-foundry.iuml)

ACL Groups are (re)assigned with each login. Changes to discord server membership and discord roles are not monitored real-time, so users will have to logout/login if either changes. 

To enable discord login with ACL group assignment a dokuwiki plugin has been developed, which can be found in a it's own repository: [dokuwiki-plugin-oauthdiscord](https://github.com/rhenenrpg/dokuwiki-plugin-oauthdiscord)

