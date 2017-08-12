const lib = require('lib')({token: process.env.STDLIB_TOKEN});
const request = require('request');
const createOrgBaseURL="http://6e182bf2.ngrok.io/apps/createOrg/";
const searchInfoBaseURL="http://6e182bf2.ngrok.io/apps/searchSS/";

/**
*
*   See https://api.slack.com/slash-commands for more details.
*
* @param {string} user The user id of the user that invoked this command (name is usable as well)
* @param {string} channel The channel id the command was executed in (name is usable as well)
* @param {string} text The text contents of the command
* @param {object} command The full Slack command object
* @param {string} botToken The bot token for the Slack bot you have activated
* @returns {object}
*/
module.exports = (user, channel, text = '', command = {}, botToken = null, callback) => {
    //Only send a response to certain messages
    if (text.match(/help/i)) {
      callback(null, {
        text: `*QWICCEbot*\n<@${user}>, here are some examples that you can try: \n*- Search:* /QWICCEbot "something" \n *- Create A Trial Org:* /QWICCEbot create an org with id xxxxx\n *- Who is doing what:* /QWICCEbot what is xyz working on?\n *- Order food:* /QWICCEbot order some pizza please`
      });
    } else if (text.match(/create an org with id/i)){
      var orgId=text.match(/create an org with id ([^&]*)/)[1];
      createOrgURL=createOrgBaseURL+orgId;
      request.get(createOrgURL, (error, response, body) => {
        if (error) {
          return callback(error);
        }
        try {
          // res.send([{action: 'apps/createOrg', orgName: participantOrgName, orgDomain: participantMyDomain, orgUsername: adminUsername, requestTime: req.requestTime}]);
          orgInfo = JSON.parse(body);
          return callback(null, {
            response_type: 'in_channel',
            text: `*QWICCEbot*\nYour request is in process <@${user}> and you should get a notification in the PS inbox shortly.`,
            attachments: [
              {
                fallback: `Created org info`,
                color: `#36a64f`,
                title: `New Org Info:`,
                text:`*Organization Name:* ` + orgInfo[0].orgName + ` \n*Domain:* ` + orgInfo[0].orgDomain + ` \n *Username:* ` + orgInfo[0].orgUsername
              }
            ]
          });
        } catch(e) {
          return callback(e);
        }
      });
    } else if (text.match(/(.*)working on|working on\?/i)){
      callback(null, {
        text: `*QWICCEbot*\n<@${user}>, Sachi is currently very busy working on hacking the presentation.\n https://cloudcraze.atlassian.net/secure/RapidBoard.jspa?rapidView=55&quickFilter=333`
      });
    } else if (text.match(/order (.*)/i)){
      callback(null, {
        text: `Wouldn't that be nice?? :)`
      });
    } else {
      searchInfoURL=searchInfoBaseURL+text.trim();
      request.get(searchInfoURL, (error, response, body) => {
        if (error) {
          return callback(error);
        }
        try {
          // res.send([{action: 'apps/createOrg', orgName: participantOrgName, orgDomain: participantMyDomain, orgUsername: adminUsername, requestTime: req.requestTime}]);
          searchResults = JSON.parse(body);
          var attCol=[];
          var attActions=[];
          var attObj={};
          attObj.name="feedback";
          attObj.text="Provide Feedback";
          attObj.type="button";
          attObj.value="feedback";
          attActions.push(attObj);
          attObj={};
          attObj.name="newQuestion";
          attObj.text="Post a Question on Answerhub";
          attObj.type="button";
          attObj.style="primary";
          attObj.value="newQuestion";
          attActions.push(attObj);

          var searchTopText=(searchResults.length>0)?"*QWICCEbot*\nhere is what I found:":"*QWICCEbot*\nI didn't find anything ¯\_(ツ)_/¯";
          for (var sr=0; sr< searchResults.length; sr++){
            var sri=searchResults[sr];
            attObj={};
            attObj.fallback="fallback info";
            attObj.color="#d3d3d3";
            attObj.title=(sr+1)+". "+sri.title;
            attObj.title_link=sri.link;
            attObj.text=sri.excerpt;
            attCol.push(attObj);
          }
          attObj={};
          attObj.fallback="fallback info";
          attObj.color="#3AA3E3";
          attObj.title="Would you like to...";
          attObj.attachment_type="default";
          attObj.actions=attActions;
          attCol.push(attObj);

          return callback(null, {
            response_type: 'in_channel',
            text: searchTopText,
            attachments: attCol
          });
        } catch(e) {
          return callback(e);
        }
      });
    }
};
