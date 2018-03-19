
function getLabel(labelName) {
    // Cache the labels.
    this.labels = this.labels || {};
    label = this.labels[labelName];

    if (!label) {
        Logger.log('Could not find cached label "' + labelName + '". Fetching.', this.labels);

        var label = GmailApp.getUserLabelByName(labelName);

        if (label) {
            Logger.log('Label exists.');
        } else {
            Logger.log('Label does not exist. Creating it.');
            label = GmailApp.createLabel(labelName);
        }
        this.labels[labelName] = label;
    }
    return label;
}

function deleteLabel(labelName) {
    var label = getLabel(labelName);
    try {
        label.deleteLabel();
    } catch (ex) { }
}

function renameLabelByName(oldName, newName) {
    // rename the label, prepending the bad sugar with the ERROR prefix
    var label = Gmail.Users.Labels.list('me').labels.find(function (l) {
        return l.name == oldName;
    });
    label.name = newName;
    Gmail.Users.Labels.update(label, 'me', label.id);
}

function createTimerChildLabels(parentLabel, labels) {
    for (var i in labels) {
        GmailApp.createLabel(parentLabel + '/' + labels[i]);
    }

    return true;
}

function createTimerChildLabel(parentLabel, label) {
    GmailApp.createLabel(parentLabel + '/' + label);
}

function deleteTimerChildLabel(parentLabel, label) {
    deleteLabel(parentLabel + '/' + label);
}

// TODO: delete later
// Get just the timer sugar portion for the specified parent label
function getUserChildLabels(parentLabel) {
    return getUserChildLabelNames(parentLabel).map(function (s) {
               return s.replace(parentLabel + '/', "");
           });
}


function getUserChildLabelNames(label) {
    this.labels = this.labels || GmailApp.getUserLabels();
    var childLabels = [];
    for each (var l in labels) {
        if (l.getName().indexOf(label + '/') == 0) {
            childLabels.push(l.getName());
        }
    }
    return childLabels;
}
