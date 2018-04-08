//import 'google-apps-script';

function processPurge(event) {

    var purgeLog = [],
        timerLabels = [],
        lastRun;

    // Regex to find purge sugar - example: [30 days]
    const regex = /\[(.*?)\]/g; 

    if (event == undefined || !preferenceExists(event.triggerUid)) { // new run.. if you know a better way to check, let me know...           

        timerLabels = getLabels().filter(function (t) {
            // Make *sure* you reset the lastIndex of the regex before each call to exec/test if inside a loop or you will regret it
            regex.lastIndex = 0;

            return regex.test(t.name);
        });

    }
    else {  // continuation run
        lastRun = handleTriggered(event.triggerUid);
        timerLabels = [ getLabel(lastRun.labelName) ];
        Logger.log("Continuation run of label: " + lastRun.labelName);
    }

    Logger.log(timerLabels.length);

    timerLabels.forEach(function (l) {

        try {

            // label name will have spaces and slashes.. convert to google-friendly format.
            var timerLabelName = convertLabelName(l.name);

            // Make *sure* you reset the lastIndex of the regex before each call to exec/test if inside a loop or you will regret it 
            regex.lastIndex = 0;

            // make sure to regex on the original user-friendly name version (not the converted google-friendly version)
            var timerSugar = regex.exec(l.name)[1];

            Logger.log('Sugar: ' + timerSugar);

            // temp for testing..
            if (timerSugar != undefined && !timerSugar.startsWith(TIMER_ERROR_PREFIX)) {

                var today = new Date();

                var beforeDate = new Date(today).rewind(timerSugar, false);

                if (beforeDate.toString() == "Invalid Date" || beforeDate.is(today)) {
                    throw new GSCHED.SugarException("Error processing label: " + timerSugar + ". Messages for this label are not being processed.");
                }

                // Define all the filters.
                var filters = [
                    'label:' + timerLabelName,
                    '-in:chats',
                    'before:' + beforeDate.getEpoch()
                ];

                Logger.log("Filters: " + filters.join(' '));

                var threads = GmailApp.search(filters.join(' '), 0, PAGE_SIZE);

                // Resume again in RESUME_FREQUENCY minutes if max results returned (so we can come back later and get more)
                if (threads.length == PAGE_SIZE) {
                    Logger.log("Scheduling follow up job...");
                    purgeLog.push("Scheduling follow up job for " + l.name);   // again making sure to use the user-friendly label name
                    var trigger = ScriptApp.newTrigger('processPurge')
                        .timeBased()
                        .at(new Date((new Date()).getTime() + 1000 * 60 * RESUME_FREQUENCY))
                        .create();
                    setupTriggerArguments(trigger, { 'labelName': l.name }, false);
                }

                var threadsToDelete = [];  // temp array to store threads to be deleted 

                // Move threads/messages which meet age criteria to trash
                Logger.log("Processing " + threads.length + " threads...");
                for (var i = 0; i < threads.length; i++) {
                    var thread = threads[i];

                    if (thread.getLastMessageDate() < beforeDate) {
                        threadsToDelete.push(thread);
                        //thread.moveToTrash();
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

                if (threadsToDelete.length > 0) {
                    deleteThreads(threadsToDelete);
                }

                purgeLog.push(l.name + ' : ' + threadsToDelete.length + ' threads purged');
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

    // send email here
    GmailApp.sendEmail(getActiveUserEmail(), "Purge Completed", purgeLog.join('\n'))

}


function deleteThreads(threads) {

    var addLabelToThreadLimit = 100;

    // addToThreads has a limit of 100 threads. Use batching.
    if (threads.length > addLabelToThreadLimit) {
        for (var i = 0; i < Math.ceil(threads.length / addLabelToThreadLimit); i++) {
            pageOfThreads = threads.slice(100 * i, 100 * (i + 1));
            GmailApp.moveThreadsToTrash(pageOfThreads);
        }
    } else {
        GmailApp.moveThreadsToTrash(threads);
    }

}
