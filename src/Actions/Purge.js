//import 'google-apps-script';


//function Install() {

//    var TRIGGER_NAME = "dailyAutoDeleteGmail";

//    // First run 1 mins after install
//    ScriptApp.newTrigger(TRIGGER_NAME)
//        .timeBased()
//        .at(new Date((new Date()).getTime() + 1000 * 60 * 1))
//        .create();

//    // Run daily there after
//    ScriptApp.newTrigger(TRIGGER_NAME)
//        .timeBased().everyDays(1).create();

//}



function processPurge(event) {

    var timerLabelNames = [],
        lastRun;

    if (event == undefined) { // new run   
        // skip labels marked as error
        timerLabelNames = getUserChildLabelNames(SCHEDULEIT_PURGE_LABEL).remove(new RegExp("\/" + TIMER_ERROR_PREFIX, "i"));
    }
    else {  // continuation run
        lastRun = handleTriggered(event.triggerUid);
        timerLabelNames = [lastRun.labelName];
        Logger.log("Continuation run of label: " + lastRun.labelName);
    }

    timerLabelNames.forEach(function (timerLabelName) {

        try {

            var timerSugar = timerLabelName.split(/\//).pop();
            Logger.log('Sugar: ' + timerSugar);

            var today = new Date();

            var beforeDate = today.rewind(timerSugar, false);

            if (beforeDate.toString() == "Invalid Date" || beforeDate.is(today)) {
                throw new GSCHED.SugarException("Error processing label: " + timerSugar + ". Messages for this label are not being processed.");
            }

            // Define all the filters.
            var filters = [
                'label:' + timerLabelName,
                '-in:chats',
                'before:' + beforeDate.getTime()
            ];

            Logger.log("Filters: " + filters.join(' '));

            var threads = GmailApp.search(filters.join(' '), 0, PAGE_SIZE);

            // Resume again in RESUME_FREQUENCY minutes if max results returned (so we can come back later and get more)
            if (threads.length == PAGE_SIZE) {
                Logger.log("Scheduling follow up job...");
                var trigger = ScriptApp.newTrigger('processPurge')
                    .timeBased()
                    .at(new Date((new Date()).getTime() + 1000 * 60 * RESUME_FREQUENCY))
                    .create();
                setupTriggerArguments(trigger, { 'labelName': timerLabelName }, false);
            }

            // Move threads/messages which meet age criteria to trash
            Logger.log("Processing " + threads.length + " threads...");
            for (var i = 0; i < threads.length; i++) {
                var thread = threads[i];

                if (thread.getLastMessageDate() < beforeDate) {
                    thread.moveToTrash();
                }
                //  no idea why you'd want to delete individual messages of a thread...   
                //      else {
                //        var messages = GmailApp.getMessagesForThread(threads[i]);
                //        for (var j=0; j<messages.length; j++) {
                //          var email = messages[j];       
                //          if (email.getDate() < age) {
                //            email.moveToTrash();
                //          }
                //        }
                //      }
            }

        }
        catch (ex if ex instanceof GSCHED.SugarException) {

            console.error(ex);
            Logger.log('Notify user and renaming label with error: ' + timerLabelName);

            GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);

            // rename the label, prepending the bad sugar with the ERROR prefix
            renameLabelByName(timerLabelName, timerLabelName.replace(timerSugar, TIMER_ERROR_PREFIX + timerSugar));

        }
        catch (ex) {
            console.error('processPurge() yielded an error: ' + ex);
            GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);
        }

    });

}
