## nginx - Setup

Given the fact that the cloudflare tunnel is used to connect the reverseproxy to internet and cloudflare handles https, 
the server can simply stay defined as default. 

Also the geo location of the request is added to the logformat ($http_cf_ipcountry).


```
# nginx server configuration
#
log_format cloudflare '$proxy_add_x_forwarded_for - $remote_user [$time_local] '
                           '"$request" $status $body_bytes_sent '
                           '"$http_referer" "$http_user_agent" $http_cf_ipcountry';
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

It's a private site, so disallow robots
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

The dokuwiki instance is used for authentication and authorization of the complete site using nginx subrequest authentication.
See [[https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-subrequest-authentication/]].
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

The dokuwiki instance does not require subrequest authentication, the right headers from Cloudflare need to be forwarded.
```
       location /dokuwiki/ {
                # Set proxy headers
                proxy_set_header Host $host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_set_header CF-IPCountry $http_cf_ipcountry;
                proxy_pass http://192.168.1.26:80/;
        }
```
 



**Authorization model**

Authorization is based on groups. The first segment of the path is prefixed with 'x' and matched with the groups that a user belongs too. So users with group ''xvtt'' are allowed to access to ''https://mydomain.com/vtt/...''


**Implementation on Dokuwiki instance**

<code>
copy doku.php mynginxauth.php
</code>


and then add below the require of init.php

<code>
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
</code>


Dokuwiki is served from location /dokuwiki/ as set in the configuration item Basic:basedir. Ensure that Dokuwiki sets the session cookie on / by setting the configuration Basic:cookiedir to /.

