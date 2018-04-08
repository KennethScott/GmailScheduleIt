
Date.prototype.getEpoch = function() {
    // use SugarJS to get short epoch (basically getTime()/1000 rounded);
    return this.format('{X}');
}

function getTimeZoneString() {
    var userPrefs = getUserPrefs();
    var timezone_string = userPrefs['localzone'];

    Logger.log('User timezone:' + timezone_string);

    // User can just set it.. no need requiring calendar permission just for this...
    //if (timezone_string == DEFAULT_TIMEZONE) {
    //    timezone_string = CalendarxApp.getDefaultCalendar().getTimeZone();
    //    Logger.log('Loading timezone from calendar: ' + timezone_string);
    //}

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


//function parseDate(str) {
//    // return Date.parse(str);
//    if (dateConversionRequired(str)) {
//        return convertToUserDate(Date.future(str));
//    }

//    return Date.future(str);
//}

function parseDateFormat(str) {

    // var date = Date.parse(str);
    var date = new Date().get(str);
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

