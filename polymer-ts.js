// Type definitions for polymer v1.0
// Project: https://github.com/polymer
// Definitions by: Antonino Porcino <https://github.com/nippur72>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
var polymer;
(function (polymer) {
    var Base = (function () {
        function Base() {
        }
        Base.prototype.arrayDelete = function (path, item) { };
        Base.prototype.async = function (callback, waitTime) { };
        Base.prototype.attachedCallback = function () { };
        Base.prototype.attributeFollows = function (name, toElement, fromElement) { };
        Base.prototype.cancelAsync = function (handle) { };
        Base.prototype.cancelDebouncer = function (jobName) { };
        Base.prototype.classFollows = function (name, toElement, fromElement) { };
        Base.prototype.create = function (tag, props) { };
        Base.prototype.debounce = function (jobName, callback, wait) { };
        Base.prototype.deserialize = function (value, type) { };
        Base.prototype.distributeContent = function () { };
        Base.prototype.domHost = function () { };
        Base.prototype.elementMatches = function (selector, node) { };
        Base.prototype.fire = function (type, detail, options) { };
        Base.prototype.flushDebouncer = function (jobName) { };
        Base.prototype.get = function (path) { };
        Base.prototype.getContentChildNodes = function (slctr) { };
        Base.prototype.getContentChildren = function (slctr) { };
        Base.prototype.getNativePrototype = function (tag) { };
        Base.prototype.getPropertyInfo = function (property) { };
        Base.prototype.importHref = function (href, onload, onerror) { };
        Base.prototype.instanceTemplate = function (template) { };
        Base.prototype.isDebouncerActive = function (jobName) { };
        Base.prototype.linkPaths = function (to, from) { };
        Base.prototype.listen = function (node, eventName, methodName) { };
        Base.prototype.mixin = function (target, source) { };
        Base.prototype.notifyPath = function (path, value, fromAbove) { };
        Base.prototype.pop = function (path) { };
        Base.prototype.push = function (path, value) { };
        Base.prototype.reflectPropertyToAttribute = function (name) { };
        Base.prototype.resolveUrl = function (url) { };
        Base.prototype.scopeSubtree = function (container, shouldObserve) { };
        Base.prototype.serialize = function (value) { };
        Base.prototype.serializeValueToAttribute = function (value, attribute, node) { };
        Base.prototype.set = function (path, value, root) { };
        Base.prototype.setScrollDirection = function (direction, node) { };
        Base.prototype.shift = function (path, value) { };
        Base.prototype.splice = function (path, start, deleteCount) { };
        Base.prototype.toggleAttribute = function (name, bool, node) { };
        Base.prototype.toggleClass = function (name, bool, node) { };
        Base.prototype.transform = function (transform, node) { };
        Base.prototype.translate3d = function (x, y, z, node) { };
        Base.prototype.unlinkPaths = function (path) { };
        Base.prototype.unshift = function (path, value) { };
        Base.prototype.updateStyles = function () { };
        return Base;
    })();
    polymer.Base = Base;
})(polymer || (polymer = {})); // end module
// @component decorator
function component(tagname, extendsTag) {
    return function (target) {
        target.prototype["is"] = tagname;
        if (extendsTag !== undefined) {
            target.prototype["extends"] = extendsTag;
        }
    };
}
// @extend decorator
function extend(tagname) {
    return function (target) {
        target.prototype["extends"] = tagname;
    };
}
// @template decorator
function template(templateString) {
    return function (target) {
        target.prototype["template"] = templateString;
    };
}
// @style decorator
function style(styleString) {
    return function (target) {
        target.prototype["style"] = styleString;
    };
}
// @hostAttributes decorator
function hostAttributes(attributes) {
    return function (target) {
        target.prototype["hostAttributes"] = attributes;
    };
}
// @property decorator with automatic name for computed props
function property(ob) {
    return function (target, propertyKey) {
        target.properties = target.properties || {};
        if (typeof (target[propertyKey]) === "function") {
            // property is function, treat it as a computed property         
            var params = ob["computed"];
            var getterName = "get_computed_" + propertyKey;
            ob["computed"] = getterName + "(" + params + ")";
            target.properties[propertyKey] = ob;
            target[getterName] = target[propertyKey];
        }
        else {
            // normal property
            target.properties[propertyKey] = ob || {};
        }
    };
}
// @computed decorator
function computed(ob) {
    return function (target, computedFuncName) {
        target.properties = target.properties || {};
        var propOb = ob || {};
        var getterName = "get_computed_" + computedFuncName;
        var funcText = target[computedFuncName].toString();
        var start = funcText.indexOf("(");
        var end = funcText.indexOf(")");
        var propertiesList = funcText.substring(start + 1, end);
        propOb["computed"] = getterName + "(" + propertiesList + ")";
        target.properties[computedFuncName] = propOb;
        target[getterName] = target[computedFuncName];
        // do not copy the function in the initialization phase
        target["$donotcopy"] = target["$donotcopy"] || {};
        target["$donotcopy"][computedFuncName] = true;
    };
}
// @listen decorator
function listen(eventName) {
    return function (target, propertyKey) {
        target.listeners = target.listeners || {};
        target.listeners[eventName] = propertyKey;
    };
}
// @behavior decorator
function behavior(behaviorObject) {
    return function (target) {
        if (typeof (target) === "function") {
            // decorator applied externally, target is the class object
            target.prototype["behaviors"] = target.prototype["behaviors"] || [];
            target.prototype["behaviors"].push(behaviorObject.prototype);
        }
        else {
            // decorator applied internally, target is class.prototype
            target.behaviors = target.behaviors || [];
            target.behaviors.push(behaviorObject.prototype);
        }
    };
}
// @observe decorator
function observe(propertiesList) {
    if (propertiesList.indexOf(",") > 0) {
        // observing multiple properties
        return function (target, observerFuncName) {
            target.observers = target.observers || [];
            target.observers.push(observerFuncName + "(" + propertiesList + ")");
        };
    }
    else {
        // observing single property
        return function (target, observerName) {
            target.properties = target.properties || {};
            target.properties[propertiesList] = target.properties[propertiesList] || {};
            target.properties[propertiesList].observer = observerName;
        };
    }
}
function constructWithSpread(func, argArray) {
    var arr = [null];
    // since "arguments" is nor a real Array we can't use concat
    for (var t = 0; t < argArray.length; t++) {
        arr.push(argArray[t]);
    }
    var nullaryFunc = Function.prototype.bind.apply(func, arr);
    return new nullaryFunc();
}
function setupArtificialInstantation(elementClass) {
    var polymerBaseInstance = new polymer.Base();
    var registeredElement = {};
    // if "is" is defined copy from prototype, otherwise make new instance    
    var source = (elementClass.prototype.is === undefined) ? new elementClass() : elementClass.prototype;
    for (var propertyKey in source) {
        // do not include polymer.Base functions
        if (!(propertyKey in polymerBaseInstance)) {
            registeredElement[propertyKey] = source[propertyKey];
        }
    }
    // artificial constructor: call constructor() and copies members
    registeredElement["$custom_cons"] = function () {
        // creates a fresh instance in order to grab instantiated properties and inherited methods from it
        // TODO: when supported use spread operator (on new)     
        var args = this.$custom_cons_args;
        var elementInstance = constructWithSpread(elementClass, args);
        var donotcopy = this["$donotcopy"] || {};
        for (var propertyKey in elementInstance) {
            // do not include polymer functions
            if (!(propertyKey in polymerBaseInstance) && !(propertyKey in donotcopy)) {
                this[propertyKey] = elementInstance[propertyKey];
            }
        }
    };
    // arguments for artifical constructor
    registeredElement["$custom_cons_args"] = [];
    // modify "factoryImpl"
    if (registeredElement["factoryImpl"] !== undefined) {
        throw "do not use factoryImpl() use constructor() instead";
    }
    else {
        registeredElement["factoryImpl"] = function () {
            this.$custom_cons_args = arguments;
        };
    }
    // modify "attached" event function
    var attachToFunction = "attached";
    var oldFunction = registeredElement[attachToFunction];
    registeredElement[attachToFunction] = function () {
        this.$custom_cons();
        if (oldFunction !== undefined)
            oldFunction.apply(this);
    };
    return registeredElement;
}
// element registration functions
function createElement(element) {
    if (element.prototype.template !== undefined || element.prototype.style !== undefined) {
        createTemplate(element);
    }
    return Polymer(setupArtificialInstantation(element));
}
function createClass(element) {
    if (element.prototype.template !== undefined || element.prototype.style !== undefined) {
        createTemplate(element);
    }
    return Polymer.Class(setupArtificialInstantation(element));
}
function createTemplate(definition) {
    var domModule = document.createElement('dom-module');
    var proto = definition.prototype;
    domModule.id = proto.is;
    // attaches style
    if (proto.style !== undefined) {
        var elemStyle = document.createElement('style', 'custom-style');
        domModule.appendChild(elemStyle);
        elemStyle.textContent = proto.style;
    }
    // attaches template
    if (proto.template !== undefined) {
        var elemTemplate = document.createElement('template');
        domModule.appendChild(elemTemplate);
        elemTemplate.innerHTML = proto.template;
    }
    // tells polymer the element has been created
    domModule.createdCallback();
}
//# sourceMappingURL=polymer-ts.js.map