
function getLabel(labelName) {
    // Cache the labels.
    this.labels = this.labels || {};
    label = this.labels[labelName];

    if (!label) {
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
    if (label) {
        label.name = newName;
        Gmail.Users.Labels.update(label, 'me', label.id);
    }
    else {
        Logger.log('Rename failed.  Label not found: ' + oldName);
    }
}

function createTimerChildLabels(parentLabelName, labelNames) {
    for (var i in labelNames) {
        GmailApp.createLabel(parentLabelName + '/' + labelNames[i]);
    }

    return true;
}

function createTimerChildLabel(parentLabelName, labelName) {
    GmailApp.createLabel(parentLabelName + '/' + labelName);
}

function deleteTimerChildLabel(parentLabelName, labelName) {
    deleteLabel(parentLabelName + '/' + labelName);
}

/**
 * Returns an array of just the child name portion (timer sugar) of the specified parent label
 * @param {any} parentLabelName
 */
function getUserChildLabels(parentLabelName) {
    return getUserChildLabelNames(parentLabelName).map(function (s) {
        return s.replace(parentLabelName + '/', "");
    });
}

/**
 * Returns an array of the full child label names of the specified parent
 * @param {any} parentLabelName
 */
function getUserChildLabelNames(parentLabelName) {
    // Cache the labels.
    this.userLabels = this.userLabels || GmailApp.getUserLabels();

    var childLabels = [];
    this.userLabels.forEach(function (l) {
        if (l.getName().indexOf(parentLabelName + '/') == 0) {
            childLabels.push(l.getName());
        }
    });
    return childLabels;
}
