//Refer to troubleshooting #1 to see how to remove any error messages
function createTriggers() {
    deleteAllTriggers();

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
    //var unrespondedTrigger = ScriptApp.newTrigger("processUnresponded")
    //    .timeBased()
    //    .everyMinutes(run_timers_every_x_minutes)
    //    .create();

    //var purgeTrigger = ScriptApp.newTrigger("processPurge")
    //    .timeBased()
    //    .everyMinutes(run_timers_every_x_minutes)
    //    .create();

    //processUnresponded();
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
