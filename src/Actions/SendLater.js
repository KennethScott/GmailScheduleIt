//import 'google-apps-script';

function processSendLater(event) {

    Logger.log('processSendLater Activated ' + new Date().toString());
    var userPrefs = getUserPrefs(false);

    var timerLabelNames = [],
        lastRun;

    if (event == undefined || !preferenceExists(event.triggerUid)) { // new run.. if you know a better way to check, let me know...           
        // skip labels marked as error
        var exclude = (SCHEDULEIT_SENDLATER_LABEL + "/" + TIMER_ERROR_PREFIX + "|" + SCHEDULEIT_RECURRING_LABEL).replace("/", "\/");
        timerLabelNames = getUserChildLabelNames(SCHEDULEIT_SENDLATER_LABEL).remove(new RegExp(exclude, "i"));
    }
    else {  // continuation run
        Logger.log('processSendLater-event: ' + event);
        lastRun = handleTriggered(event.triggerUid);
        timerLabelNames = [lastRun.labelName];
        Logger.log("Continuation run of label: " + lastRun.labelName + " - token: " + lastRun.token);
    }

    timerLabelNames.forEach(function (l) {

        // label name will have spaces and slashes.. convert to google-friendly format.
        var timerLabelName = convertLabelName(l);

        var filters = ['label:' + timerLabelName];

        if (lastRun != undefined) { // continuation run   
            filters.push('before:' + lastRun.token);
        }

        var searchResults = Gmail.Users.Drafts.list('me', { 'q': filters.join(' '), 'maxResults': PAGE_SIZE });
        if (searchResults.resultSizeEstimate > 0) {

            searchResults.drafts.forEach(function (d) {

                try {

                    var draft = GmailApp.getDraft(d.id);

                    // make sure to regex on the original user-friendly name version (not the converted google-friendly version)
                    var timerSugar = l.split(/\//).pop();
                    Logger.log('Sugar: ' + timerSugar);

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
                        var draftThread = draftMessage.getThread();
                        var draftLabels = draftThread.getLabels();                        

                        // we know there's at least the one timer label.. we're looking for a second/recurring label
                        if (draftLabels.length > 1) {

                            var draftLabelNames = [];
                            draftLabels.forEach(function (dl) {
                                draftLabelNames.push(dl.getName());
                            });

                            Logger.log(draftLabelNames.join(' : '));

                            if (draftLabelNames.indexOf(SCHEDULEIT_RECURRING_LABEL) >= 0) {

                                Logger.log('Found recurring label. Create new (duplicate) draft to leave in Drafts for next time.');
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
                                    la.addToThread(newDraft.getMessage().getThread());
                                });

                            }

                        }

                        Logger.log('Sending the draft');
                        draft.send();

                        // Remove the timer, add the SendLater, and mark unread so we'll see it.
                        draftThread.addLabel(getGmailLabelByName(SCHEDULEIT_SENDLATER_LABEL));
                        draftThread.removeLabel(getGmailLabelByName(l));
                        draftThread.markUnread();
                        
                    }

                }
                catch (ex if ex instanceof GSCHED.SugarException) {

                    console.error(ex);
                    Logger.log('Notify user and renaming label with error: ' + timerLabelName);

                    GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);

                    // rename the label, prepending the bad sugar with the ERROR prefix
                    renameLabel(timerLabelName, timerLabelName.replace(timerSugar, TIMER_ERROR_PREFIX + timerSugar));

                }
                catch (ex) {
                    console.error('processSendLater() yielded an error: ' + ex);
                    GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);
                }

            });

            if (searchResults.nextPageToken != undefined) {
                // Resume again in RESUME_FREQUENCY minutes if max results returned (so we can come back later and get more)
                Logger.log("Scheduling follow up job for " + l);   // again making sure to use the user-friendly label name
                var trigger = ScriptApp.newTrigger('processSendLater')
                    .timeBased()
                    .at(new Date((new Date()).getTime() + 1000 * 60 * RESUME_FREQUENCY))
                    .create();
                setupTriggerArguments(trigger, { "labelName": l, "token": searchResults.nextPageToken }, false);
            }

        }

    });

}

