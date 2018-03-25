var _userLabels;

Object.defineProperty(this, 'userLabels', {
    get: function() {
        if (!_userLabels) {
            _userLabels = Gmail.Users.Labels.list('me').labels.find(function (l) {
                return l.type == 'user';
            });
        }
        return _userLabels;
    },
    enumerable: true
});

function getLabel(labelName) {

    var label = this.userLabels.find(function (l) {
        return l.name == labelName;
    });

    if (!label) {
        Logger.log('Label does not exist. Creating it.');
        label = createLabel(labelName);
    }

    return label;
}

function getLabels() {
    return this.userLabels;
}

function deleteLabel(labelName) {
    var label = getLabel(labelName);
    try {
        Gmail.Users.Labels.remove('me', label.id);
        this.userLabels.remove(function (l) {
            return l.id == label.id;
        });
    } catch (ex) { }
}

function renameLabel(oldName, newName) {
    // rename the label, prepending the bad sugar with the ERROR prefix
    var label = getLabel(oldName);

    if (label) {
        var i = this.userLabels.indexOf(label);
        label.name = newName;
        Gmail.Users.Labels.update(label, 'me', label.id);
        this.userLabels[i] = label;
    }
    else {
        Logger.log('Rename failed.  Label not found: ' + oldName);
    }
}

function createLabel(labelName) {
    var label = Gmail.Users.Labels.create({ 'name': labelName }, 'me');
    this.userLabels.push(label);
    return label;
}

function createTimerChildLabels(parentLabelName, labelNames) {
    for (var i in labelNames) {
        createTimerChildLabel(parentLabelName, labelNames[i]);
    }

    return true;
}

function createTimerChildLabel(parentLabelName, labelName) {
    createLabel(parentLabelName + '/' + labelNames);
}

function deleteTimerChildLabel(parentLabelName, labelName) {
    deleteLabel(parentLabelName + '/' + labelName);
}

/**
 * Returns an array of just the child name portion (timer sugar) of the specified parent label
 * @param {any} parentLabelName
 */
function getSugars(parentLabelName) {
    return getUserChildLabelNames(parentLabelName).map(function (s) {
        return s.replace(parentLabelName + '/', "");
    });
}

/**
 * Returns an array of the full child label names of the specified parent
 * @param {any} parentLabelName
 */
function getUserChildLabelNames(parentLabelName) {
    
    var childLabels = [];
    this.userLabels.forEach(function (l) {
        if (l.name.indexOf(parentLabelName + '/') == 0) {
            childLabels.push(l.name);
        }
    });
    return childLabels;
}
