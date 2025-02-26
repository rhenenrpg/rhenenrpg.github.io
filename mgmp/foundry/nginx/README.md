## nginx - Setup

Given the fact that the cloudflare tunnel is used to connect the reverseproxy to internet and cloudflare handles https, 
the server can simply stay defined as default. 

The geo location of the request is added to the logformat ($http_cf_ipcountry) and also the duration it took to serve the request ($request_time).


```
# nginx server configuration
#
log_format cloudflare '$proxy_add_x_forwarded_for - $remote_user [$time_local] '
                           '"$request" $status $body_bytes_sent '
                           '"$http_referer" "$http_user_agent" $http_cf_ipcountry $request_time';
server {
        listen 80;
        listen [::]:80;

        root /var/www/html;

        server_name rhenenrpg.net;

        # Add index.php to the list if you are using PHP
        index index.html index.htm index.nginx-debian.html;
         
        client_max_body_size 25m;

        error_log /var/log/nginx/error.log error;
        access_log /var/log/nginx/access.log cloudflare;
```

Ensure that when a user types in rhenenrpg.net, the browser goes to the right start page.
```
        location / {
                return 302 https://$host/dokuwiki/doku.php;
        }
```

It's a restricted site, so disallow robots
```
        location = /robots.txt {
                add_header  Content-Type  text/plain;
                return 200 "User-agent: *\nDisallow: /\n";
        }
```

Block SG and RU visitors, there are 100+ daily requests fromthose countries. Probably because bots ignore /robots.txt
```        
        if ( $http_cf_ipcountry = "SG" ) { return 403; }
        if ( $http_cf_ipcountry = "RU" ) { return 403; }
```

The dokuwiki instance is used for authentication and authorization of the complete site using nginx 
[subrequest authentication](https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-subrequest-authentication/).
The dokuwiki part of this implementation can be found below.

```
       location = /auth {
            internal;
            proxy_pass              http://XX.XX.XX.XX:80/dokuwiki/mynginxauth.php;
            proxy_pass_request_body off;
            proxy_set_header        Content-Length "";
            proxy_set_header        X-Original-URI $request_uri;
            proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header        X-Forwarded-Proto $scheme;
            proxy_set_header        CF-IPCountry $http_cf_ipcountry;            
        }
```

The dokuwiki instance does not require subrequest authentication, the right headers from Cloudflare do need to be forwarded.
```
       location /dokuwiki/ {
                # Set proxy headers
                proxy_set_header Host $host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_set_header CF-IPCountry $http_cf_ipcountry;
                proxy_pass http://XX.XX.X.XX:80/;
        }
```
 
Each foundry instance will be accessable on a different location. Not only to enable multiple foundryvtt instances in parallel, but also because of the authorization model.

```
        location /vttdinsdag/ {
                auth_request     /auth;
                # Set proxy headers
                proxy_set_header Host $host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;

                # These are important to support WebSockets
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "Upgrade";
                proxy_pass http://XX.XX.XX.XX:30000/vttdinsdag/;

        }
```

That's it

## Authorization model

Authorization is based on dokuwiki groups. The location is prefixed with 'x' and matched with the groups that a user belongs too. So users with group ''xvttdinsdag'' are allowed to access to ''https://rhenenrpg.net/vttdinsdag/...''


## Dokuwiki - Implementation 

Dokuwiki is served from location /dokuwiki/ as set in the configuration item Basic:basedir. Ensure that Dokuwiki sets the session cookie for all requests on the domain. This can be achieved by setting the configuration Basic:cookiedir to /.


For each http request to a restricted location, nginx will pass a subrequest to a dokuwiki endpoint. This endpoint should either retun a 200 OK or a 401 Unauthorized. In order to facilitate this endpoint, a copy of doku.php has been adapted.

```
cp doku.php mynginxauth.php
```

and then below the require of init.php the following has been added

```
// load and initialize the core system
require_once(DOKU_INC.'inc/init.php');
// Start addition
if(isset($_SERVER['HTTP_X_ORIGINAL_URI'])) { // authentication mode
    $finduri = 'x'.explode("/",trim($_SERVER['HTTP_X_ORIGINAL_URI'],'/'))[0];
    foreach( $USERINFO['grps'] as $group ) {
        if($group == $finduri) {
            header('HTTP/1.0 200 OK');
            exit;
        }
    }
    header('HTTP/1.0 401 Unauthorized');
    exit;
} 
dbglog('orig_uri is not set, acting like doku.php');
// End addition
```



