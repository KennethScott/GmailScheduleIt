//import 'google-apps-script';

function processSnoozed(event) {

	var timerLabelNames = [],
	lastRun;

	if (event == undefined) { // new run   
		// skip labels marked as error
		timerLabelNames = getUserChildLabelNames(SCHEDULEIT_SNOOZE_LABEL).remove(new RegExp("\/" + TIMER_ERROR_PREFIX, "i"));
	}
	else {  // continuation run
		lastRun = handleTriggered(event.triggerUid);
		timerLabelNames = [lastRun.labelName];
		Logger.log("Continuation run of label: " + lastRun.labelName + " - before epoch: " + lastRun.epoch);
	}

	timerLabelNames.forEach(function (timerLabelName) {

		try {

			Logger.log('Processing label: ' + timerLabelName);

			// Define all the filters.
			var filters = [
				'label:' + timerLabelName,
				'-in:chats'
			];

			if (lastRun != undefined) { // continuation run  
				filters.push('before:' + lastRun.epoch);
			}

			var timerSugar = timerLabelName.split(/\//).pop();
			Logger.log('Sugar: ' + timerSugar);

			var threads = GmailApp.search(filters.join(' '), 0, PAGE_SIZE);
			var unsnoozedThreads = [];

			threads.forEach(function (thread) {
				if (thread.getLastMessageDate().get(timerSugar).isPast()) {
					unsnoozedThreads.push(thread);
				}
			});

			// Mark unresponded in bulk.
			if (unsnoozedThreads.length > 0) {
				markUnsnoozed(unsnoozedThreads, timerLabelName);
				Logger.log('Updated ' + unsnoozedThreads.length + ' messages.');
			}

			// Resume again in RESUME_FREQUENCY minutes if max results returned (so we can come back later and get more)
			if (threads.length == PAGE_SIZE) {
				var lastThreadLastMessageEpoch = threadMessages[threadMessages.length - 1].getLastMessageDate().getTime();
				Logger.log("Scheduling follow up job...");
				var trigger = ScriptApp.newTrigger('processSnoozed')
                    .timeBased()
                    .at(new Date((new Date()).getTime() + 1000 * 60 * RESUME_FREQUENCY))
                    .create();
				setupTriggerArguments(trigger, { "labelName": timerLabelName, "epoch": lastThreadLastMessageEpoch }, false);
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
        	console.error('processSnoozed() yielded an error: ' + ex);
        	GmailApp.sendEmail(getActiveUserEmail(), SCHEDULEIT_LABEL, ex);
        }

	});

}

function markUnsnoozed(threads, timerLabelName) {
	var timerLabel = getLabel(timerLabelName);
	var threadLimit = 100;

	// addToThreads has a limit of 100 threads. Use batching.
	if (threads.length > threadLimit) {
		for (var i = 0; i < Math.ceil(threads.length / threadLimit); i++) {
			pageOfThreads = threads.slice(100 * i, 100 * (i + 1));
			timerLabel.removeFromThreads(pageOfThreads);
			GmailApp.moveThreadsToInbox(pageOfThreads);
			GmailApp.markThreadsUnread(pageOfThreads);

		}
	} else {
		timerLabel.removeFromThreads(threads);
		GmailApp.moveThreadsToInbox(threads);
		GmailApp.markThreadsUnread(threads);
	}
}