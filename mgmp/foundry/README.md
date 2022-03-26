## My Foundry self hosting solution for Multi-GM Multi-Player

*Note: on this site the solution is explicitly named 'my' foundry solution. The use of 'my' is not because this solution is the best,
but to avoid discussions and opinions with zealous know-it-all internet trolls (you know who you are!). 
There are many ways a solution can be composed, but this is the solution that i have chosen. 
The reasoning for some choices is shared for educational/comical purposes.*

From a high level perspective the solution looks like below figure:

![](solution%20high%20level.png)

Users access the site from a browser. [Cloudflare](cloudflare.md) is a gateway between internet and the local container instances. There is a container with nginx in the role as reverseproxy, a container for the wiki (login, landing page, access control) and a container with foundry servers instances. Lastly [Discord is used for authentication](discord-login) and as input to assign access rights in the wiki.

