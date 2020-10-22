Chanserv is created with the intention of assisting the [cscareers.dev](http://cscareers.dev) community with sub-community channels.

## **What's a sub-community?**

A sub-community channel is defined as a private channel that is "opt-in". Such that, a user can go to the `#bot_commands` channel, type `!join #san_francisco` and the user will be able to access the `#san_francisco` private channel. This idea can be translated to an IRC network. Where the Discord server is the IRC server and users are able to join/leave IRC channels (private channels) on-demand. This is where something like a chanserv will come into play.

## **Functionality**

# P0:

Landing/Home Channel: If a user is in zero private channels, we need to make it apparent of this new functionality that we're adding!

- Display some sort of welcome channel based off whether or not they have some `Unregistered` role. Name of this role is up for debate, but ideally we just need some sort of way to deterministically know if they've joined a custom channel before or not.

Joining:

- A user should be able to view a list of available private channels to join.
- Ideally, we would have this command be supported in a bot channel
- We should send attempt to send a discord message with the list to avoid clutter in public channel. If the user has their DMs disabled, send it in the main channel.

Leaving:

- A user should be able to leave the custom channel they are in. Either by messaging the chanserv bot or the custom channel itself, `!leave <channel_name>`

# P1:

Channel Admins:

Since the admins of the server simply cannot moderate all possible custom channels, we should give more power to individuals on a channel level. Channel admins will have enhanced moderation privileges local to the channel scope. A user can have many channel admins. Server admins should have the ability to promote/revoke members of the server to be channel admins on the local server level.

Set channel topic:

Channel admins should have the ability to set the topic of the channel via `!settopic <channel topic content>`

Ban/remove member from a channel:

Channel admins should have the ability to revoke a member from joining a channel.
