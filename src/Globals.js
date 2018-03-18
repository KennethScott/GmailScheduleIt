/**********************
 GLOBALS
**********************/
// Top level label name
var SCHEDULER_LABEL = 'GScheduler';
var SCHEDULER_TIMER_LABEL = SCHEDULER_LABEL + '/' + 'Timer';
var SCHEDULER_QUEUE_LABEL = SCHEDULER_LABEL + '/' + 'Queue';
//var SCHEDULER_AWAITINGRESPONSE_LABEL = SCHEDULER_LABEL + '/' + 'Awaiting Response';
var SCHEDULER_NORESPONSE_LABEL = SCHEDULER_LABEL + '/' + 'No Response';
var SCHEDULER_SNOOZE_LABEL = SCHEDULER_LABEL + '/' + 'Snooze';
var SCHEDULER_PURGE_LABEL = SCHEDULER_LABEL + '/' + 'Purge';
var SCHEDULER_SENDLATER_LABEL = SCHEDULER_LABEL + '/' + 'Send Later';
var SCHEDULER_RECURRING_LABEL = SCHEDULER_SENDLATER_LABEL + '/' + 'Recurring';

// Use default google calendar to determine user timezone
var DEFAULT_TIMEZONE = 'default';


// Global preferences object
var USER_PREFS = null;


//Welcome Email Subject
var EMAIL_WELCOME_SUBJECT = 'Welcome to Gmail ScheduleIt';

var SCRIPTID = 'AKfycbzTcxE3LbS5JRFIs9OF1Cyx5njXxSbaRWrni2V7Gbpc_uazneI';
var SETTINGS_URL = 'https://script.google.com/a/bxs.com/macros/s/' + SCRIPTID + '/exec';
var UNINSTALL_URL = 'https://script.google.com/a/bxs.com/macros/s/' + SCRIPTID + '/manage/uninstall';

/* NOTE these names must match the 'name' attribute in HTML */
var DEFAULT_PREFS = {
    move_sent_messages_inbox: true,
    mark_sent_messages_inbox_unread: false,
    nolabel_drafts_to_inbox: false,
    localzone: 'default',
    timer: ['1 hour later', '2 hours later', '3 hours later', 'One day later', 'tomorrow 8am', 'next monday 8am'],
    run_timers_every_x_minutes: 30
};

var PAGE_SIZE = 100;
var RESUME_FREQUENCY = 1;
var TIMER_ERROR_PREFIX = 'ERR-';