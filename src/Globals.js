/**********************
 GLOBALS
**********************/
// Top level label name
var SCHEDULEIT_LABEL = 'GScheduleIt';
//var SCHEDULEIT_TIMER_LABEL = SCHEDULEIT_LABEL + '/' + 'Timer';
//var SCHEDULEIT_QUEUE_LABEL = SCHEDULEIT_LABEL + '/' + 'Queue';
var SCHEDULEIT_NORESPONSE_LABEL = SCHEDULEIT_LABEL + '/' + 'No Response';
//var SCHEDULEIT_SNOOZE_LABEL = SCHEDULEIT_LABEL + '/' + 'Snooze';

// Because of Gmail's filter limitation of only being able to apply a single label, instead of having dedicated labels we'll use a regex to parse label names to get the timer sugar
//var SCHEDULEIT_PURGE_LABEL = SCHEDULEIT_LABEL + '/' + 'Purge';
var SCHEDULEIT_SENDLATER_LABEL = SCHEDULEIT_LABEL + '/' + 'Send Later';
var SCHEDULEIT_RECURRING_LABEL = SCHEDULEIT_SENDLATER_LABEL + '/' + 'Recurring';

// Prefix to append to timer labels that Sugar is unable to parse
var TIMER_ERROR_PREFIX = 'ERR-';

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
    localzone: 'default',
    timer: ['The 1st of next month at 8am', 'In 1 week', 'Tomorrow at 8am', 'One day later', 'Next monday 8am'],
    run_timers_every_x_minutes: 30
};

var PAGE_SIZE = 100;
var RESUME_FREQUENCY = 10;