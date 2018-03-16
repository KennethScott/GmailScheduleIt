function setupStaticLabels() {
    GmailApp.createLabel(SCHEDULER_LABEL);
    GmailApp.createLabel(SCHEDULER_TIMER_LABEL);
    GmailApp.createLabel(SCHEDULER_QUEUE_LABEL);
    //GmailApp.createLabel(SCHEDULER_AWAITINGRESPONSE_LABEL);
    GmailApp.createLabel(SCHEDULER_NORESPONSE_LABEL);
    GmailApp.createLabel(SCHEDULER_SNOOZE_LABEL);
    GmailApp.createLabel(SCHEDULER_SENDLATER_LABEL);
    GmailApp.createLabel(SCHEDULER_RECURRING_LABEL);
}

function sendWelcomeEmail() {
    var userPrefs = getUserPrefs(false);

    var body = 'Hi there,';
    body += '<p>Thanks for trying out the GmailScheduleIt. This is a free, secure, private (data is held only within your gmail account & your google app script) and convenient method to schedule outgoing messages and return messages to your inbox.</p>';
    body += '<p>GmailScheduleIt, is an open source project and please do submit tickets on any issues that you find here https://github.com/kennethscott/GmailScheduleIt/issues. </p>';
    body += '<p>SETTINGS: Please note that you can use this link to access your settings at anytime <a href="' + SETTINGS_URL + '" target="_blank">' + SETTINGS_URL + '</a></p>';
    body += '<p>UNINSTALL: Please note that you can use this link to uninstall at anytime <a href="' + UNINSTALL_URL + '" target="_blank">' + UNINSTALL_URL + '</a></p>';
    var options = {
        htmlBody: body
    }

    if (!userPrefs['email_welcome_sent']) {
        GmailApp.sendEmail(getActiveUserEmail(), EMAIL_WELCOME_SUBJECT, body, options);
        userPrefs['email_welcome_sent'] = true;
        UserProperties.setProperties(userPrefs, true);
    }

}