##### Naming Conventions #####

##### Naming Convention for NGINX locations #####
  * / - root redirects to dokuwiki start page
  * /dokuwiki/ - proxy to dokuwiki 
  * /auth - proxy to authentication/authorization endpoint
  * /vtt<foundryserver>/ - each foundry world is hosted on a seperate instance with it's own proxy

##### Naming Convention for Dokuwiki groups #####
reserved group names:
  * user - every registered user will be assigned this group
  * discord - this group indicates whether a user authenticates/authorizes with discord

reserved group prefixes: 
  * x<location> - every group that starts with an 'x' is used to authorize a user to the nginx location without the x.
