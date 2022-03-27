## Roll20 solution for Multi-GM Multi-Player 

The Roll20 solution for Multi-GM Multi-Player initiatives is Roll20 with some conventions and helper scripts. 

![](roll20-opening-page.png)

A roll20 campaign acts as characterhub. Each GM uses own Play campaign(s) during sessies. Some GMs prefer a single play campaign, other GMs like to make a Seperate campaign for each different adventure; both are fine. Before a session the GM copies the participating characters to their play campaign using the character vault. After a session the GM register the fact that the characters played in the gmnotes of the original characters in the characterhub. The copy of the character in the play campaign is not used anymore and can be removed from the GM game.

## Characterhub

Characters are created and maintained in the characterhub. The Characterhub is created by someone with a Roll20 Pro subscription to allow everybody to  export characters and running the [helper apiscript](apiscript-ffw-v0.0.7.js).

This script provide the following functionalities.

#### Characterhub script - New Character Button

Every time a player launches the characterhub campaign, a pink button is shown in the chat. When the player presses this button:
  * a new character is created;
  * the character is assigned to the player;
  * the roll20 accountid of the player is stored in attribute **ffwplayerid** so characters can be automaticallty assigned in GM games (see below).
After clicking the button, the player can open the new character and use the charactermancer to stat it out.

![](new-character-button.png)

#### Characterhub script - Enforce character naming convention

GMs see all characters in the hub and there can be many, hence a naming convention of **charactername (player displayname)** is enforced whenever the charactername changes, the player display name changes or when the player (re)launches the campaign.

#### Characterhub script - Create defaulttoken

Roll20 does not allow players to change the tokens of their character, but players are allowed to set the avatar of their characters. When the avatar is set, the script creates a defaulttoken based on the avatar. The name displayed below the token is without *(player displayname)* and link to the HP and AC are also set. Settings for dynamic lighting left empty, when the script was developed dynamic lighting was in flux and it was decided to use manual fog only.

#### Characterhub script - Register last update of gmnotes

After a game each GM registers the play date and earned XP in the gmnotes of the character. The script stores the date of this change in  **ffwgmnoteslastupdate**. This update does not always happen, see note 1)

#### Characterhub script - !ffw --report and !ffw --fix commands

Because of note 1) there is are two command that check and if needed update all characters in the characterhub. All reporting is send to the API log.

#### Characterhub script - Note 1) APIscripts crash or stop working

API Scripts have the tendency to stop working for no reason. A manual restart is required. When a player does not see the button, it is clear that a restart is needed. However. when an event-trigger is not handled, this can be unnoticed (change gmnotes, change name, change avatar)


## Play Campaign
Each GM uses their own play campaigns. A play campaign has to be created by a someone with a roll20 account and a Pro Subscription. The same script as in the Characterhub can be used here.

## Play Campaign script - assigning imported characters

Every time a character is added or a player comes online, the script checks whether there are characters with an attribute **ffwplayerid** that are not assigned to the player with the registered roll20 account id. If so, the character is assigned to that player. 


## Transporting characters with the Charactervault

It is perfectly doable to transport characters from the hub to a play game manually, but thanks to the right setup i normally perform this at the start of the session. With all players in a discord video channel watching life.

To transport characters from the hub to a play game three [Google Chrome bookmarklets](booksmarks-ffw.html) have been created. Before describing each bookmarklet, here is a small video

![](roll20-character-transport.mp4)
