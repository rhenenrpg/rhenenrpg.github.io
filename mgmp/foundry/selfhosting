## My Foundry self hosting solution

From a high level perspective the solution looks like below figure:

![](solution%20high%20level.png)

Users access the site from a browser. [Cloudflare](cloudflare.md) is a gateway between internet and the local Linux container instances. There is a container with [nginx in the role as reverseproxy](nginx), a container for the wiki (login, landing page, access control) and a container with foundry servers instances. [Discord is used for authentication](discord-login) and as input to assign access rights in the wiki. FoundryVTT core functionality is changed to enable [automatic login of users on FoundryVTT instancs](auto-login).

This solution is build on Linux, it is possible to transpose this solution to mac or windows, but that is outside the scope of this site.
