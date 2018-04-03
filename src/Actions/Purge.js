//import 'google-apps-script';

function processPurge(event) {

    var timerLabels = [],
        lastRun;

    // Regex to find purge sugar - example: [30 days]
    const regex = /\[(.*?)\]/g; 

    if (event == undefined) { // new run           

        timerLabels = getLabels().filter(function (t) {
            return regex.test(t.name);
        });

    }
    else {  // continuation run
        Logger.log('processPurge-event: ' + event);
        lastRun = handleTriggered(event.triggerUid);
        timerLabels = [ getLabel(lastRun.labelName) ];
        Logger.log("Continuation run of label: " + lastRun.labelName);
    }

    Logger.log(timerLabels.length);

    timerLabels.forEach(function (l) {

        try {

            var timerLabelName = l.name;

            var timerSugar = regex.exec(timerLabelName)[1];

            // Make *sure* you reset the lastIndex of the regex after calling exec (if inside a loop) or you will regret it
            regex.lastIndex = 0;

            Logger.log('Sugar: ' + timerSugar);

            if (timerSugar != undefined && timerSugar.indexOf('TIMER_ERROR_PREFIX') != 0) {

                var today = new Date();

                var beforeDate = new Date(today).rewind(timerSugar, false);

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

        }
        catch (ex if ex instanceof GSCHED.SugarException) {

            console.error(ex);
            Logger.log('Notify user and renaming label with error: ' + timerLabelName);

            GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);

            // rename the label, prepending the bad sugar with the ERROR prefix
            renameLabel(timerLabelName, timerLabelName.replace(timerSugar, TIMER_ERROR_PREFIX + timerSugar));

        }
        catch (ex) {
            console.error('processPurge() yielded an error: ' + ex);
            GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);
        }

    });

}
