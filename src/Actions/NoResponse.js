//import 'google-apps-script';

/*
 * Originally from:  https://github.com/hijonathan/google-scripts/blob/master/gmail-no-response.js
 *
 * This script goes through your Gmail Inbox looking for emails labeled as SCHEDULEIT_NORESPONSE_LABEL + "/" + time indicator.  Examples:
 * No Response/in 7 days
 * No Response/1 month
 * No Response/after 2 days
 * The time periods should be nested under the main label.
 *
 * Emails found with no response by the indicated time period will be 1) labeled with the SCHEDULEIT_NORESPONSE_LABEL value, timer label removed, marked unread, and moved to the inbox.
*  Emails with the timer label but found with a response will have the timer label removed.
 *
 */

function processUnresponded(event) {

    var timerLabelNames = [],
        lastRun;

    if (event == undefined || !preferenceExists(event.triggerUid)) { // new run.. if you know a better way to check, let me know...           
        // get sublabels, but skip labels marked as error and recurring
        timerLabelNames = getUserChildLabelNames(SCHEDULEIT_NORESPONSE_LABEL).remove(new RegExp("\/" + TIMER_ERROR_PREFIX, "i"));
    } 
    else {  // continuation run
        lastRun = handleTriggered(event.triggerUid);
        timerLabelNames = [lastRun.labelName];
        Logger.log("Continuation run of label: " + lastRun.labelName + " - before epoch: " + lastRun.epoch);
    }

    timerLabelNames.forEach(function (l) {
      
        try {            
            // label name will have spaces and slashes.. convert to google-friendly format.
            var timerLabelName = convertLabelName(l);

            Logger.log('Processing label: ' + timerLabelName);

            // Define all the filters.
            var filters = [
                'label:' + timerLabelName,
                'is:sent',
                'from:me',
                '-in:chats',
                '(-subject:"unsubscribe" AND -"This message was automatically generated by Gmail.")'
            ];

            if (lastRun != undefined) { // continuation run   
                filters.push('before:' + lastRun.epoch);
            }

            var threads = GmailApp.search(filters.join(' '), 0, PAGE_SIZE),
                threadMessages = GmailApp.getMessagesForThreads(threads),
                unrespondedThreads = [],
                respondedThreads = [];

            // make sure to regex on the original user-friendly name version (not the converted google-friendly version)
            var timerSugar = l.split(/\//).pop();

            Logger.log('Processing ' + threads.length + ' threads.');

            // Filter threads where I was the last respondent.
            threadMessages.forEach(function(messages, i) {

                var thread = threads[i],
                    lastMessage = messages[messages.length - 1],
                    lastFrom = lastMessage.getFrom(),
                    lastTo = lastMessage.getTo(), // I don't want to hear about it when I am sender and receiver
                    lastMessageDate = lastMessage.getDate();

                var notifyDate = lastMessageDate.get(timerSugar);

                if (notifyDate.toString() == "Invalid Date" || notifyDate.is(lastMessageDate)) {
                    throw new GSCHED.SugarException("Error processing label: " + timerSugar + ". Messages for this label are not being processed.");
                }

                Logger.log(notifyDate.toString());

                if (isMe(lastFrom)) {
                    if (!isMe(lastTo) && notifyDate.isPast()) {
                        unrespondedThreads.push(thread);
                    }
                }
                else {  // someone has responded.. should we only check for the TO?
                    respondedThreads.push(thread);
                }

            });

            // Mark unresponded in bulk.
            if (unrespondedThreads.length > 0) {
                markUnresponded(unrespondedThreads, timerLabelName);
                Logger.log('Updated ' + unrespondedThreads.length + ' unresponded messages.');
            }

            // Mark responded in bulk.
            if (respondedThreads.length > 0) {
                markUnresponded(respondedThreads, timerLabelName);
                Logger.log('Updated ' + respondedThreads.length + ' responded messages.');
            }

            // Resume again in RESUME_FREQUENCY minutes if max results returned (so we can come back later and get more)
            if (threads.length == PAGE_SIZE) {
                var lastThreadLastMessageEpoch = threadMessages[threadMessages.length - 1].getLastMessageDate().getEpoch();
                Logger.log("Scheduling follow up job for " + l);   // again making sure to use the user-friendly label name
                var trigger = ScriptApp.newTrigger('processUnresponded')
                    .timeBased()
                    .at(new Date((new Date()).getTime() + 1000 * 60 * RESUME_FREQUENCY))
                    .create();
                setupTriggerArguments(trigger, { "labelName": l, "epoch": lastThreadLastMessageEpoch }, false);
            }

        }
        catch (ex if ex instanceof GSCHED.SugarException) {

            console.error(ex);
            Logger.log('Notify user and renaming label with error: ' + timerLabelName);

            GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);                      

            // rename the label, prepending the bad sugar with the ERROR prefix
            renameLabel(timerLabelName, timerLabelName.replace(timerSugar, TIMER_ERROR_PREFIX + timerSugar));

            // mark them unread so they'll stand out
            GmailApp.markThreadsUnread(threads);    
    
        }
        catch (ex) {
            console.error('processUnresponded() yielded an error: ' + ex);
            GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);
        }

    });
}

function isMe(fromAddress) {
    var addresses = getEmailAddresses();
    for (i = 0; i < addresses.length; i++) {
        var address = addresses[i],
            r = RegExp(address, 'i');

        if (r.test(fromAddress)) {
            return true;
        }
    }

    return false;
}

function getEmailAddresses() {
    // Cache email addresses to cut down on API calls.
    if (!this.emails) {
        Logger.log('No cached email addresses. Fetching.');
        var me = getActiveUserEmail(),
            emails = GmailApp.getAliases();

        emails.push(me);
        this.emails = emails;
        Logger.log('Found ' + this.emails.length + ' email addresses that belong to you.');
    }
    return this.emails;
}

function markUnresponded(threads, timerLabelName) {
    var timerLabel = getLabel(timerLabelName);
    var noResponselabel = getLabel(SCHEDULEIT_NORESPONSE_LABEL);
    var addLabelToThreadLimit = 100;

    // addToThreads has a limit of 100 threads. Use batching.
    if (threads.length > addLabelToThreadLimit) {
        for (var i = 0; i < Math.ceil(threads.length / addLabelToThreadLimit); i++) {
            pageOfThreads = threads.slice(100 * i, 100 * (i + 1));
            noResponselabel.addToThreads(pageOfThreads);
            timerLabel.removeFromThreads(pageOfThreads);
            GmailApp.moveThreadsToInbox(pageOfThreads);
            GmailApp.markThreadsUnread(pageOfThreads);
        }
    } else {
        noResponselabel.addToThreads(threads);
        timerLabel.removeFromThreads(threads);
        GmailApp.moveThreadsToInbox(threads);
        GmailApp.markThreadsUnread(threads);
    }
}

function markResponded(threads, timerLabelName) {
    var timerLabel = getLabel(timerLabelName);
    var addLabelToThreadLimit = 100;

    // addToThreads has a limit of 100 threads. Use batching.
    if (threads.length > addLabelToThreadLimit) {
        for (var i = 0; i < Math.ceil(threads.length / addLabelToThreadLimit); i++) {
            pageOfThreads = threads.slice(100 * i, 100 * (i + 1));
            timerLabel.removeFromThreads(pageOfThreads);
        }
    } else {
        timerLabel.removeFromThreads(threads);
    }
}
