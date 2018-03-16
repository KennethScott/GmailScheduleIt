function getTimeZoneString() {
    var userPrefs = getUserPrefs();
    var timezone_string = userPrefs['localzone'];

    Logger.log('User timezone:' + timezone_string);

    if (timezone_string == DEFAULT_TIMEZONE) {
        timezone_string = CalendarApp.getDefaultCalendar().getTimeZone();
        Logger.log('Loading timezone from calendar: ' + timezone_string);
    }

    return timezone_string;
}

function convertToUserDate(date) {
    var user_date_string = Utilities.formatDate(date, getTimeZoneString(), "yyyy/MM/dd HH:mm:ss");
    var user_date = new Date(user_date_string);
    Logger.log('Converted:' + date + ' to user time:' + user_date);
    return user_date;
}

function getActiveUserEmail() {
    return Session.getActiveUser().getEmail();
}

function deleteLabel(label) {
    var label = GmailApp.getUserLabelByName(label);
    try {
        label.deleteLabel();
    } catch (ex) {}
}

function createTimerChildLabels(labels) {
    for (var i in labels) {
        GmailApp.createLabel(SCHEDULER_TIMER_LABEL + '/' + labels[i]);
    }

    return true;
}

function createTimerChildLabel(label) {
    GmailApp.createLabel(SCHEDULER_TIMER_LABEL + '/' + label);
}

function deleteTimerChildLabel(label) {
    deleteLabel(SCHEDULER_TIMER_LABEL + '/' + label);
}

// TODO: delete later
function getUserChildLabels(label) {
    labels = GmailApp.getUserLabels();
    var childLabels = [];
    for each (var l in labels) {
        if (l.getName().indexOf(label + '/') == 0) {
            childLabels.push(l.getName().replace(label + '/', ""));
        }
    }
    return childLabels;
}

// TODO: consider caching
function getUserChildLabelNames(label) {
    labels = GmailApp.getUserLabels();
    var childLabels = [];
    for each (var l in labels) {
        if (l.getName().indexOf(label + '/') == 0) {
            childLabels.push(l.getName());
        }
    }
    return childLabels;
}

function parseDate(str) {
    // return Date.parse(str);
    if (dateConversionRequired(str)) {
        return convertToUserDate(Date.future(str));
    }

    return Date.future(str);
}

function parseDateFormat(str) {

    // var date = Date.parse(str);
    var date = Date.future(str);
    if (date.isValid() && date.isFuture()) {
        return convertToUserDate(date).full();
    }

    return null;
}


function dateConversionRequired(str) {
    var substrings = ["year", "month", "week", " day", "hour", "minute", "second"];
    for (var i = 0; i != substrings.length; i++) {
        var substring = substrings[i];
        if (str.indexOf(substring) != -1) {
            return true;
        }
    }
    return false;
}


// Mapping of Gmail search time units to milliseconds.
var UNIT_MAPPING = {
    h: 36e5, // Hours
    d: 864e5, // Days
    w: 6048e5, // Weeks
    m: 263e7, // Months
    y: 3156e7 // Years
};

function subtractGmailDateString(date, timeStr) {
    // Takes a date object and subtracts a Gmail-style time string (e.g. '5d').
    // Returns a new date object.
    var re = /^([0-9]+)([a-zA-Z]+)$/,
        parts = re.exec(timeStr),
        val = parts && parts[1],
        unit = parts && parts[2],
        ms = UNIT_MAPPING[unit];

    return date.getTime() - (val * ms);
}