//import 'google-apps-script';

function processSendLater(event) {

    Logger.log('processSendLater Activated ' + new Date().toString());
    var userPrefs = getUserPrefs(false);

    var timerLabelNames = [],
        lastRun;

    if (event != undefined) { // new run   
        lastRun = handleTriggered(event.triggerUid);
        timerLabelNames = [lastRun.labelName];
        Logger.log("Continuation run of label: " + lastRun.labelName + " - token: " + lastRun.token);
    }
    else {
        // skip labels marked as error
        var exclude = (SCHEDULER_SENDLATER_LABEL + "/" + TIMER_ERROR_PREFIX + "|" + SCHEDULER_RECURRING_LABEL).replace("/", "\/"); 
        timerLabelNames = getUserChildLabelNames(SCHEDULER_SENDLATER_LABEL).remove(new RegExp(exclude, "i"));
    }

    timerLabelNames.forEach(function (timerLabelName) {

        var filters = ['label:' + timerLabelName];

        if (lastRun != undefined) { // continuation run   
            filters.push('before:' + lastRun.token);
        }

        var searchResults = Gmail.Users.Drafts.list('me', { 'q': filters.join(' '), 'maxResults': PAGE_SIZE });
        if (searchResults.resultSizeEstimate > 0) {

            searchResults.drafts.forEach(function (d) {

                var draft = GmailApp.getDraft(d.id);

                var timerSugar = timerLabelName.split(/\//).pop();
                Logger.log('Sugar: ' + timerSugar);

                try {

                    var draftMessage = draft.getMessage();

                    var draftDate = draftMessage.getDate();
                    Logger.log('Draft date: ' + draftDate);

                    var sendDate = draftDate.get(timerSugar);
                    Logger.log('Send date: ' + sendDate);

                    if (sendDate.toString() == "Invalid Date" || sendDate.is(draftDate)) {
                        throw new GSCHED.SugarException("Error processing label: " + timerSugar + ". Messages for this label are not being processed.");
                    }

                    if (sendDate.isPast()) {

                        // this is horrible.. but we need arrays of the labels and the names
                        var draftLabels = draftMessage.getThread().getLabels();                        

                        if (draftLabels.length > 0) {

                            var draftLabelNames = [];
                            draftLabels.forEach(function (l) {
                                draftLabelNames.push(l.getName());
                            });

                            Logger.log(draftLabelNames.join(' : '));

                            if (draftLabelNames.indexOf(SCHEDULER_RECURRING_LABEL) >= 0) {

                                Logger.log('Found recurring label');
                                var newDraft = GmailApp.createDraft(draftMessage.getTo(), draftMessage.getSubject(), "",
                                    {
                                        attachments: draftMessage.getAttachments(),
                                        cc: draftMessage.getCc(),
                                        bcc: draftMessage.getBcc(),
                                        htmlBody: draftMessage.getBody()
                                    });

                                // add all the labels
                                Logger.log('Add all the labels to the new draft');
                                draftLabels.forEach(function (la) {
                                    newDraft.getMessage().getThread().addLabel(la);
                                });
                            }

                        }

                        Logger.log('Sending the draft');
                        draft.send();
                        
                    }

                }
                catch (ex if ex instanceof GSCHED.SugarException) {

                    console.error(ex);
                    Logger.log('Notify user and renaming label with error: ' + timerLabelName);

                    GmailApp.sendEmail(getActiveUserEmail(), SCHEDULER_LABEL, ex);

                    var draftMessageThread = draftMessage.getThread();

                    // can't actually rename a label so we have to add the new one and delete the old one from the threads
                    var errLabelName = timerLabelName.replace(timerSugar, TIMER_ERROR_PREFIX + timerSugar)

                    draftMessageThread.addLabel(getLabel(errLabelName));

                    var timerLabel = getLabel(timerLabelName);
                    draftMessageThread.removeLabel(timerLabel);

                    // if there are no more messages with the bad label, go ahead and delete it for cleanup
                    if (timerLabel.getThreads(0, 1).length == 0) {
                        Logger.log('Deleting label: ' + timerLabelName);
                        timerLabel.deleteLabel();
                    }

                }
                catch (ex) {
                    console.error(ex);
                    GmailApp.sendEmail(getActiveUserEmail(), SCHEDULER_LABEL, ex);
                }

            });

            if (searchResults.nextPageToken != undefined) {
                // Resume again in RESUME_FREQUENCY minutes if max results returned (so we can come back later and get more)
                Logger.log("Scheduling follow up job...");
                var trigger = ScriptApp.newTrigger('processSendLater')
                    .timeBased()
                    .at(new Date((new Date()).getTime() + 1000 * 60 * RESUME_FREQUENCY))
                    .create();
                setupTriggerArguments(trigger, { "labelName": timerLabelName, "token": searchResults.nextPageToken }, false);
            }

        }

    });

}




//    var queueLabel = SCHEDULER_QUEUE_LABEL;
//    var queueLabelObject = GmailApp.getUserLabelByName(queueLabel);
//    var queueChildLabels = getUserChildLabels(SCHEDULER_QUEUE_LABEL);

//    for (var i = 0; i < queueChildLabels.length; i++) {
//        var currentDate = convertToUserDate(new Date());
//        var queueChildDate = parseDate(queueChildLabels[i]);

//        //skip if queuedatetime is not ready to process
//        if (currentDate.getTime() < queueChildDate.getTime()) {
//            Logger.log('process later');
//            continue;
//        }

//        var queueChildLabel = SCHEDULER_QUEUE_LABEL + '/' + queueChildLabels[i];
//        var queueChildLabelObject = GmailApp.getUserLabelByName(queueChildLabel);
//        var threads = queueChildLabelObject.getThreads();

//        //Remove queue child label if nothing to process
//        if (threads.length == 0) {
//            deleteLabel(queueChildLabel);
//        }

//        for (var x in threads) {

//            var thread = threads[x];
//            var message = GmailApp.getMessageById(thread.getMessages()[0].getId());

//            if (message.isDraft()) {
//                var sentMessage = GmailApp.getDraft(message.get()).send();

//                //move sent message to inbox
//                if (userPrefs['move_sent_messages_inbox']) {
//                    sentMessage.removeLabel(queueLabelObject);
//                    sentMessage.removeLabel(queueChildLabelObject);
//                    sentMessage.moveToInbox();
//                }

//            } else {
//                thread.removeLabel(queueLabelObject);
//                thread.removeLabel(queueChildLabelObject);
//                GmailApp.moveThreadToInbox(threads[x]);

//                if (userPrefs['mark_sent_messages_inbox_unread']) {
//                    GmailApp.markMessageUnread(message);
//                }

//            }

//        }

//    }
//}
