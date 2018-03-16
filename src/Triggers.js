//Refer to troubleshooting #1 to see how to remove any error messages
function createTriggers() {
    deleteTriggers();

    var userPrefs = getUserPrefs(false);
    var run_timers_every_x_minutes = userPrefs['run_timers_every_x_minutes'];

//    var timerTrigger = ScriptApp.newTrigger("processTimer")
//        .timeBased()
//        .everyMinutes(run_timers_every_x_minutes)
//        .create();
//
//    var queueTrigger = ScriptApp.newTrigger("processQueue")
//        .timeBased()
//        .everyMinutes(run_timers_every_x_minutes)
//        .create();
//
//    var draftsTrigger = ScriptApp.newTrigger("moveDraftsToInbox")
//        .timeBased()
//        .everyMinutes(run_timers_every_x_minutes)
//        .create();
//
//    var unrespondedTrigger = ScriptApp.newTrigger("processUnresponded")
//        .timeBased()
//        .everyMinutes(1)
//        .create();
  
    processUnresponded();
}

function deleteTriggers() {
    var allTriggers = ScriptApp.getProjectTriggers();
    // Loop over all triggers
    for (var i = 0; i < allTriggers.length; i++) {
        ScriptApp.deleteTrigger(allTriggers[i]);
    }
}

function processTimer() {

    Logger.log('processTimer Activated ' + new Date().toString());

    var queueLabel = SCHEDULER_QUEUE_LABEL;
    var queueLabelObject = GmailApp.getUserLabelByName(queueLabel);
    var timerChildLabels = getUserChildLabels(SCHEDULER_TIMER_LABEL);

    for (var i = 0; i < timerChildLabels.length; i++) {
        var timerChildLabelObject, queueLabelObject, page;
        var date = parseDate(timerChildLabels[i]);
        if (date == null) {
            continue;
        }
        // basically just move it from timer to queue
        var queueChildLabel = SCHEDULER_QUEUE_LABEL + '/' + timerChildLabels[i];

        timerChildLabelObject = GmailApp.getUserLabelByName(SCHEDULER_TIMER_LABEL + '/' + timerChildLabels[i]);
        page = null;

        // Get threads in "pages" of 100 at a time
        // TODO:  Rework.. less frequent scheduling will increase the likelihood of having more than 100 awaiting processing
        while (!page || page.length == 100) {
            page = timerChildLabelObject.getThreads(0, 100);
            if (page.length > 0) {
                // TODO:  looks like creating an existing label doesn't hurt anything..  maybe performance? 
                GmailApp.createLabel(queueChildLabel);
                queueChildLabelObject = GmailApp.getUserLabelByName(queueChildLabel);

                if (queueChildLabelObject) {
                    queueLabelObject.addToThreads(page);
                    // Move the threads into queueChildLabel
                    queueChildLabelObject.addToThreads(page);

                }
                // Move the threads out of timerLabel
                timerChildLabelObject.removeFromThreads(page);
            }
        }

    }
}



function processQueue() {
    Logger.log('processQueue Activated ' + new Date().toString());
    var userPrefs = getUserPrefs(false);

    var queueLabel = SCHEDULER_QUEUE_LABEL;
    var queueLabelObject = GmailApp.getUserLabelByName(queueLabel);
    var queueChildLabels = getUserChildLabels(SCHEDULER_QUEUE_LABEL);

    for (var i = 0; i < queueChildLabels.length; i++) {
        var currentDate = convertToUserDate(new Date());
        var queueChildDate = parseDate(queueChildLabels[i]);

        //skip if queuedatetime is not ready to process
        if (currentDate.getTime() < queueChildDate.getTime()) {
            Logger.log('process later');
            continue;
        }

        var queueChildLabel = SCHEDULER_QUEUE_LABEL + '/' + queueChildLabels[i];
        var queueChildLabelObject = GmailApp.getUserLabelByName(queueChildLabel);
        var threads = queueChildLabelObject.getThreads();

        //Remove queue child label if nothing to process
        if (threads.length == 0) {
            deleteLabel(queueChildLabel);
        }

        for (var x in threads) {

            var thread = threads[x];
            var message = GmailApp.getMessageById(thread.getMessages()[0].getId());

            if (message.isDraft()) {
                var sentMessage = GmailApp.getDraft(message.get()).send();

                //move sent message to inbox
                if (userPrefs['move_sent_messages_inbox']) {
                    sentMessage.removeLabel(queueLabelObject);
                    sentMessage.removeLabel(queueChildLabelObject);
                    sentMessage.moveToInbox();
                }

            } else {
                thread.removeLabel(queueLabelObject);
                thread.removeLabel(queueChildLabelObject);
                GmailApp.moveThreadToInbox(threads[x]);

                if (userPrefs['mark_sent_messages_inbox_unread']) {
                    GmailApp.markMessageUnread(message);
                }

            }

        }

    }
}


function moveDraftsToInbox() {
    var userPrefs = getUserPrefs(false);

    if (!userPrefs['nolabel_drafts_to_inbox']) {
        return;
    }

    var drafts = GmailApp.getDraftMessages();

    for (var i = 0; i < drafts.length; i++) {

        if (drafts[i].getSubject().match(/inbox0/)) {
            //BONUS: If draft emails have subject inbox0 in them, then do not return those to inbox.
        } else {
            //Move to these drafts to inbox    
            drafts[i].getThread().moveToInbox();
        }
    }
}







var RECURRING_KEY = "recurring";
var ARGUMENTS_KEY = "arguments";

/**
 * Sets up the arguments for the given trigger.
 *
 * @param {Trigger} trigger - The trigger for which the arguments are set up
 * @param {*} functionArguments - The arguments which should be stored for the function call
 * @param {boolean} recurring - Whether the trigger is recurring; if not the 
 *   arguments and the trigger are removed once it called the function
 */
function setupTriggerArguments(trigger, functionArguments, recurring) {
  var triggerUid = trigger.getUniqueId();
  var triggerData = {};
  triggerData[RECURRING_KEY] = recurring;
  triggerData[ARGUMENTS_KEY] = functionArguments;

  PropertiesService.getScriptProperties().setProperty(triggerUid, JSON.stringify(triggerData));
}

/**
 * Function which should be called when a trigger runs a function. Returns the stored arguments 
 * and deletes the properties entry and trigger if it is not recurring.
 *
 * @param {string} triggerUid - The trigger id
 * @return {*} - The arguments stored for this trigger
 */
function handleTriggered(triggerUid) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var triggerData = JSON.parse(scriptProperties.getProperty(triggerUid));

  if (!triggerData[RECURRING_KEY]) {
    deleteTriggerByUid(triggerUid);
  }

  return triggerData[ARGUMENTS_KEY];
}

/**
 * Deletes trigger arguments of the trigger with the given id.
 *
 * @param {string} triggerUid - The trigger id
 */
function deleteTriggerArguments(triggerUid) {
  PropertiesService.getScriptProperties().deleteProperty(triggerUid);
}

/**
 * Deletes a trigger with the given id and its arguments.
 * When no project trigger with the id was found only an error is 
 * logged and the function continues trying to delete the arguments.
 * 
 * @param {string} triggerUid - The trigger id
 */
function deleteTriggerByUid(triggerUid) {
  if (!ScriptApp.getProjectTriggers().some(function (trigger) {
    if (trigger.getUniqueId() === triggerUid) {
      ScriptApp.deleteTrigger(trigger);
      return true;
    }

    return false;
  })) {
    console.error("Could not find trigger with id '%s'", triggerUid);
  }

  deleteTriggerArguments(triggerUid);
}

/**
 * Deletes a trigger and its arguments.
 * 
 * @param {Trigger} trigger - The trigger
 */
function deleteTrigger(trigger) {
  ScriptApp.deleteTrigger(trigger);
  deleteTriggerArguments(trigger.getUniqueId());
}

/**
 * Deletes all project triggers and their arguments.
 */
function deleteAllTriggers() {
  // Delete all triggers and parameters
  var triggers = ScriptApp.getProjectTriggers();
  for (var i=0; i<triggers.length; i++) {    
    deleteTrigger(triggers[i]);
  }  
}
