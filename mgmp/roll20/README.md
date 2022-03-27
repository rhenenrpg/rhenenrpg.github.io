## Roll20 solution for Multi-GM Multi-Player 

The Roll20 solution for Multi-GM Multi-Player initiatives is Roll20 with some conventions and helper scripts. 

![](roll20-opening-page.png)

A roll20 campaign acts as characterhub. Each GM uses own game(s) during game nights. Some GMs prefer a single game, other GMs like to make a game for each different adventure. Before a session the GM copies the participating characters to their own game using the character vault. After a session the GM administrates the fact that the character played in the characterhub and removes the characters from their own game.

### Characterhub

Characters are created and maintained in the characterhub. The Characterhub is created by someone with a Roll20 Pro subscription to allow everybody to  export characters and running the [helper apiscript](apiscript-ffw-v0.0.7.js).

This script provide the following functionalities.

#### Characterhub - New Character Button

Every time a player launches the characterhub campaign, a pink button is shown in the chat. When the player presses this button:
  * a new character is created;
  * the character is assigned to the player;
  * the roll20 accountid of the player is stored in attribute **ffwplayerid** so characters can be automaticallty assigned in GM games (see below).

![](new-character-button.png)


