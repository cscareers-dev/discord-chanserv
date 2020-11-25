<p align="center">
<img src="https://i.imgur.com/3XVmGsH.png" alt="Chanserv">
</p>

# Introduction

Chanserv is a Discord bot that empowers sub-communities to be built within a Discord server. This bot was initially created to help connect individuals in the cscareers.dev Discord server during the COVID-19 pandemic by allowing users to request channels based around different topics such as location, company, common interests, etc. As the name suggests, this bot was heavily inspired off of a typical [chanserv bot](http://www.geekshed.net/commands/chanserv/) from IRC.

Chanserv is currently supporting three roles - server admin, channel admin, and channel member. Server admins can be thought of as the staff running the server. Channel admins can be thought of as an administrator scoped locally to a community channel. Channel members are members that have joined a specific community channel.

In a community channel, there can exist many channel admins who are assigned by server admins. Channel admins have the ability to invite, kick, and highlight their respective channel.

# Supported Commands

## User commands:

- `!help` - view currently supported commands accessible by anyone.
- `!channels` - view community channels that are publicly available to be joined
- `!join channel_name` - joins a specific community channel
- `!leave channel_name` - leaves a specific community channel
- `!create channel_name` - submits a request to create a community channel

## Channel admin commands:

- `!kick username#1234` - removes a user from the respective community channel
- `!invite username#1234` - invites a user to the respective community channel
- `!highlight` - sends a `@here` ping to the respective community channel

## Server admin commands:

- `!promote username#1234` - promotes a user to channel admin in respective community channel
- `!demote username#1234` - demotes a user to channel member in respective community channel

# Contributing

While requirements will change, we will create issues on an as needed basis. We are also open to your suggestions! You may either create an issue with your suggestion or you can create a suggestion in the [cscareers.dev Discord server](https://cscareers.dev/discord).
