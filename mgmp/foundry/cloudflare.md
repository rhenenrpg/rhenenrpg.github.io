## Cloudflare

Initially the goal was to host a server just for my regular groups. 
Now the goal has grown to accommodate a west-marches style community with 200+ players with a max concurrency of about 30 players. 
In such a community grievance will happen at some moment in time. So DDoS protection is added as a requirement.

As solution Cloudflare has been chosen. Cloudflare is setup to proxy the traffic to the reverse proxy. 
The reverse proxy connects to cloudflare via a cloudflare tunnel. Thanks to the tunnel no port forwarding needs to be setup on modem of the ISP. 
If needed the tunnel can act as a kill switch closing all inbound traffic to protect my relation with my ISP. 
A domain is rented at Cloudflare for a tenner per year, but as the other required services fit within the free plan, the total package is well worth it:
  * Domain name;
  * free and automatic certificates (no more opening of firewall to run let's encrypts script);
  * DoS protection;
  * geolocation headers are added;  
  * tunnel that removes modem bridging/port forwarding hassles;  
  * tunnel that can act as killswitch;
  * IPv6 to IPv4 translation.

For acquiring domain and setting up website proxy, login to your [dashboard](https://dash.cloudflare.com/)

For setting up a cloudflare tunnel, follow this [guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)

Info on the [http headers](https://developers.cloudflare.com/fundamentals/get-started/http-request-headers/)

