## Roll20 solution for Multi-GM Multi-Player 

The Roll20 solution for Multi-GM Multi-Player initiatives is Roll20 with some conventions and helper scripts. 

![](roll20-opening-page.png)

A roll20 campaign acts as characterhub. Each GM uses own game(s) during game nights. Some GMs prefer a single game, other GMs like to make a game for each different adventure; both are fine. Before a session the GM copies the participating characters to their own game using the character vault. After a session the GM register the fact that the character played in the gmnotes of the original character in the characterhub. The copy of the character is not used anymore and can be removed from the GM game.

### Characterhub

Characters are created and maintained in the characterhub. The Characterhub is created by someone with a Roll20 Pro subscription to allow everybody to  export characters and running the [helper apiscript](apiscript-ffw-v0.0.7.js).

This script provide the following functionalities.

#### Characterhub script - New Character Button

Every time a player launches the characterhub campaign, a pink button is shown in the chat. When the player presses this button:
  * a new character is created;
  * the character is assigned to the player;
  * the roll20 accountid of the player is stored in attribute **ffwplayerid** so characters can be automaticallty assigned in GM games (see below).

![](new-character-button.png)

After clicking the button, the player can open the new character and use the charactermancer to stat it out.

#### Characterhub script - Enforce character naming convention

GMs see all characters in the hub and there can be many, hence a naming convention of **charactername (player displayname)** is enforced whenever the charactername changes, the player display name changes or when the player (re)launches the campaign.

#### Characterhub script - Create defaulttoken



#### Characterhub script - Register last update of gmnotes

After a game each GM registers the play date and earned XP in the gmnotes of the character. The script stores the date of this change in  **ffwgmnoteslastupdate**. This update does not always happen, see note 1)

#### Characterhub script - Note 1) APIscripts crash or stop working

API Scripts have the tendency to stop working for no reason. A manual restart is required. When a player does not see the button, it is clear that a restart is needed. However. when an event-trigger is not handled, this can be unnoticed (change gmnotes, change name, change avatar)
