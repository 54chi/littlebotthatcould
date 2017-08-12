# littlebotthatcould
Chatbot hackathon (QWICCEbot)

This is the source for the chatbot I built for the CC hackathon.

It uses a serverless architecture with the StdLib.

If you're not sure what StdLib ("Standard Library") is, please check out
https://stdlib.com.

## Function: `functions/commands/qwiccebot.js`

The chatbot. It understand the intent using pattern matching, calls the respective service, very similar to [browserCommander](https://github.com/54chi/browserCommander) and return the results if needed. Supported intents are:

* help (help menu)
* create an org with id xyz (where "xyz" is the trialorg id to use)
* what is xyz working on? (where "xyz" is the name of the person)
* search (searches for a keyword or sentence across multiple channels)

The job of the bot is to do intent recognition and call web services, where the heavy works happens. Because of it, it is very easy to extend to do other jobs, like ordering food for the office or asking for the guest wi-fi password for example.

## Function: `functions/__main__.js`

This is your main endpoint, corresponding to `https://username.lib.id/service/`.
This is, of course, where `username` is your username and `service` is your service
name.

Any time a function has the filename `__main__.js`, the enclosing folder is
used as the route name over HTTP. You can think of it like the default function
for a specific directory.

Note that when pushing to a development environment (or if you want to access
  a specific version), this should be reached via:
  `https://username.lib.id/service@dev/main` (if your dev environment is called
  `dev`, also the default local environment name) or
  `https://username.lib.id/service@0.0.0/main` (if your version is 0.0.0).

### Usage

This endpoint generates a template based on the contents of `pages/index.ejs`,
which is modifiable and contains your "Add to Slack" button. It is the easiest
way to distribute your app to other users.

## Function: `functions/auth.js`

This is the OAuth endpoint for your Slack App that verifies another team (or your
  own) has properly validated the slack app.

### Usage

This endpoint processes an OAuth request and returns the contents of
`slack/pages/auth.ejs`. (Typically "Success!" if successful.)

## Function: `functions/commands/__main__.js`

This is the main **Command Handler** function for handling Slack Slash Commands.
You can read more about them here: https://api.slack.com/slash-commands

This function is triggered by slack at the following URL:
`https://<username>.lib.id/<service>@<ver>/commands/:bg`

Where `<username>` is your username, `<service>` is the service name and
`<ver>` is the environment or semver release of your service. The `:bg`
indicates you'd like this function to return an HTTP 2XX code as quickly as
possible and do all processing behind the scenes. (Ideal for Slack.)

### Usage

To add or modify Slash commands, you'll want to look in the directory
`functions/commands/` and create files with the name
`functions/commands/NAME.js` where `NAME` is your intended command,
and also add them to your Slash Commands list via Slack's Slash Command interface.

For the default "hello" command (should be added as `/hello` to your app) you'll
notice the following boilerplate code:

```javascript
module.exports = (user, channel, text = '', command = {}, botToken = null, callback) => {

  callback(null, {
    response_type: 'in_channel',
    text: `Hello, <@${user}>...\nYou said: ${text}`
  });

};
```

In this function, `user` and `channel` are strings representing the user and
channel the command was called from. The contents of the command (text) are
available in `text`, a full `command` object is available
that contains all data passed from slack (https://api.slack.com/slash-commands),
and a botToken for your Slack App's bot is passed in (if you want to use it
  to post additional messages, upload files, etc.).

The first parameter passed to `callback` is an error (if present), use `new Error()`
when possible. The second parameter is a `chat.postMessage` object,
more details can be found here: https://api.slack.com/methods/chat.postMessage.

You can test the sample hello command on the command line by running

```shell
$ lib .commands.hello test_user general "some text"
```

## Function: `functions/events/__main__.js`

This is the main **Event Handler** function for handling public channel events
from Slack's Event API: https://api.slack.com/events

This function is triggered by slack at the following URL:
`https://<username>.lib.id/<service>@<ver>/commands/:bg`

Where `<username>` is your username, `<service>` is the service name and
`<ver>` is the environment or semver release of your service. The `:bg`
indicates you'd like this function to return an HTTP 2XX code as quickly

You'll notice an `* @bg params` line in the comments for this function. This
means, when executed as a background function, it will return a JSON object
mapping to the parameters passed to it (which also passes Slack's `challenge`
litmus test).

### Usage

This function will delegate incoming commands to their appropriate handler,
which can be placed in `functions/events/TYPE.js` or `functions/events/TYPE/__main__.js`
as these are functionally equivalent. If there is a subtype involved,
`functions/events/TYPE/SUBTYPE.js` or `functions/events/TYPE/SUBTYPE/__main__.js`
will be invoked.

By default your `functions/events/message/__main__.js` should look like this:

```javascript
module.exports = (user, channel, text = '', event = {}, botToken = null, callback) => {

  // Only send a response to certain messages
  if (text.match(/hey|hello|hi|sup/i)) {
    callback(null, {
      text: `Hey there! <@${user}> said ${text}`
    });
  } else {
    callback(null, {});
  }

};
```

In this function, `user` and `channel` are strings representing the user and
channel the event was triggered by. The contents of the command (text) are
available in `text`, a full `event` object is available
that contains all data passed from slack (https://api.slack.com/events),
and a botToken for your Slack App's bot is passed in (if you want to use it
  to post additional messages, upload files, etc.).

The first parameter passed to `callback` is an error (if present), use `new Error()`
when possible. The second parameter is a `chat.postMessage` object,
more details can be found here: https://api.slack.com/methods/chat.postMessage.

You can test the sample message event on the command line by running:

```shell
$ lib .events.message test_user general "hello"
```

# Utilities

This Slack App template comes with some utility function in `slack/utils`.
We'll go over a few of them;

- message.js
- update_message.js
- respond.js
- upload.js

## Utility: `utils/message.js`

This function has a fingerprint of:

```javascript
module.exports = (token, channel, text, callback) => {}
```

Where `token` is your bot token (the token used for the bot response),
`channel` as the channel where the response is expected, `text` being a
string or `channel.postMessage` object (for more granular control),
and `callback` being a function expecting one parameter (an `error`, if applicable)
that executes the call.

Use this function to get your bot to send messages to users or channels --- that's
it. The `token` field should be passed in any `slack/commands` or `slack/events`
handlers.

## Utility: `utils/update_message.js`

This function has a fingerprint of:

```javascript
module.exports = (token, channel, ts, message, callback) => {}
```

Where `token` is your bot token (the token used for the bot response),
`channel` as the channel where the response is expected, `ts` as the timestamp
of the message being updated, `message` being a string or `chat.update` object
(for more granular control) that will replace the original message, and
`callback` being a function expecting one parameter (an `error`, if applicable)
that executes the call.

Use this function to get your bot to update messages in channels.

## Utility: `utils/respond.js`

Very similar to `message.js`, this is a Slash Command response that `HTTP POST`s
a message to a webhook endpoint instead of creating a new bot message directly.

The benefits this has over `message.js`, is that Slash Commands can be used in
private channels (or globally, within a team) where applicable.

## Utility: `utils/upload.js`

Similar to `message.js`, this function has a fingerprint of:

```javascript
module.exports = (token, channel, filename, contentType, file, callback) => {}
```

Where `token` is your bot token, `channel` is the channel to upload a file to,
`filename` is the desired filename, `contentType` is the desired content type
(i.e. a string like `image/png`), file is a `Buffer` of file contents
and `callback` is a function that can handle an optional `err` parameter.

# Helpers

There are a few helper functions for message formatting, etc. Feel free to
look at them at your leisure, we've documented `storage.js` to better understand
how team data is stored.

## Helper: `helpers/storage.js`

This is a storage helper based upon https://stdlib.com/utils/storage. It
is a basic key-value store that saves crucial team (including bot) details
about each and every team its installed on, specific to the `SLACK_APP_NAME`
field in your `env.json` and your StdLib (https://stdlib.com) account. You
should probably avoid interfacing with this function directly, but it should
be noted that it is *critical* for the ability to install your app on
multiple teams.

# That's it!
