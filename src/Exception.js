var GSCHED = GSCHED || {};

GSCHED.Exception = function (message) {
    this.message = message;
    this.stack = (new Error()).stack;
}

GSCHED.SugarException = function (message) {
    GSCHED.SugarException.baseConstructor.call(this, message);
}

/**
 * Simple inheritance model
 * @param {Object} subClass subClass to extend
 * @param {Object} baseClass Base class to inherit from
 */
$_extend = function (subClass, subClassName, baseClass) {
    subClass.prototype = Object.create(Error.prototype);
    subClass.prototype.name = subClassName;
    subClass.prototype.constructor = subClass;
    subClass.baseConstructor = baseClass;
    subClass.superClass = baseClass.prototype;
}

// Extend the subclasses from the base Exception class
$_extend(GSCHED.SugarException, "GSCHED.SugarException", GSCHED.Exception);
