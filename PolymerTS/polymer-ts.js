// Type definitions for polymer v1.0
// Project: https://github.com/polymer
// Definitions by: Antonino Porcino <https://github.com/nippur72>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
// ref to Polymer.Base (this)
var base = (function () {
    function base() {
    }
    base.prototype.arrayDelete = function (path, item) { };
    base.prototype.async = function (callback, waitTime) { };
    base.prototype.attachedCallback = function () { };
    base.prototype.attributeFollows = function (name, toElement, fromElement) { };
    base.prototype.cancelAsync = function (handle) { };
    base.prototype.cancelDebouncer = function (jobName) { };
    base.prototype.classFollows = function (name, toElement, fromElement) { };
    base.prototype.create = function (tag, props) { };
    base.prototype.debounce = function (jobName, callback, wait) { };
    base.prototype.deserialize = function (value, type) { };
    base.prototype.distributeContent = function () { };
    base.prototype.domHost = function () { };
    base.prototype.elementMatches = function (selector, node) { };
    base.prototype.fire = function (type, detail, options) { };
    base.prototype.flushDebouncer = function (jobName) { };
    base.prototype.get = function (path) { };
    base.prototype.getContentChildNodes = function (slctr) { };
    base.prototype.getContentChildren = function (slctr) { };
    base.prototype.getNativePrototype = function (tag) { };
    base.prototype.getPropertyInfo = function (property) { };
    base.prototype.importHref = function (href, onload, onerror) { };
    base.prototype.instanceTemplate = function (template) { };
    base.prototype.isDebouncerActive = function (jobName) { };
    base.prototype.linkPaths = function (to, from) { };
    base.prototype.listen = function (node, eventName, methodName) { };
    base.prototype.mixin = function (target, source) { };
    base.prototype.notifyPath = function (path, value, fromAbove) { };
    base.prototype.pop = function (path) { };
    base.prototype.push = function (path, value) { };
    base.prototype.reflectPropertyToAttribute = function (name) { };
    base.prototype.resolveUrl = function (url) { };
    base.prototype.scopeSubtree = function (container, shouldObserve) { };
    base.prototype.serialize = function (value) { };
    base.prototype.serializeValueToAttribute = function (value, attribute, node) { };
    base.prototype.set = function (path, value, root) { };
    base.prototype.setScrollDirection = function (direction, node) { };
    base.prototype.shift = function (path, value) { };
    base.prototype.splice = function (path, start, deleteCount) { };
    base.prototype.toggleAttribute = function (name, bool, node) { };
    base.prototype.toggleClass = function (name, bool, node) { };
    base.prototype.transform = function (transform, node) { };
    base.prototype.translate3d = function (x, y, z, node) { };
    base.prototype.unlinkPaths = function (path) { };
    base.prototype.unshift = function (path, value) { };
    base.prototype.updateStyles = function () { };
    return base;
})();
// component decorator
function component(tagname) {
    return function (target) {
        target.prototype["is"] = tagname;
    };
}
// extend decorator
function extend(tagname) {
    return function (target) {
        target.prototype["extends"] = tagname;
    };
}
// hostAttributes decorator
function hostAttributes(attributes) {
    return function (target) {
        target.prototype["hostAttributes"] = attributes;
    };
}
/*
// property decorator (simple version)
function property(ob: propDefinition) {
    return (target: PolymerElement, propertyKey: string) => {
        target.properties = target.properties || {};
        target.properties[propertyKey] = ob;
    }
}
*/
/*
// property decorator, computed properties via "name:"
function property(ob: propDefinition) {
   return (target: PolymerElement, propertyKey: string) => {
      target.properties = target.properties || {};
      if (typeof (target[propertyKey]) === "function")
      {
         // property is function, treat it as a computed property
         var name = ob["name"];
         ob["computed"] = propertyKey + "(" + ob["computed"] + ")";
         target.properties[name] = ob;
      }
      else
      {
         // normal property
         target.properties[propertyKey] = ob;
      }
   }
}
*/
// property decorator with automatic name for computed props
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
            target.properties[propertyKey] = ob;
        }
    };
}
// computed decorator
function computed(ob) {
    return function (target, computedFuncName) {
        target.properties = target.properties || {};
        //var propOb = target.properties[computedFuncName] || {};
        var propOb = ob || {};
        var getterName = "get_computed_" + computedFuncName;
        var funcText = target[computedFuncName].toString();
        var start = funcText.indexOf("(");
        var end = funcText.indexOf(")");
        var propertiesList = funcText.substring(start + 1, end);
        propOb["computed"] = getterName + "(" + propertiesList + ")";
        target.properties[computedFuncName] = propOb;
        target[getterName] = target[computedFuncName];
    };
}
// listener decorator
function listener(eventName) {
    return function (target, propertyKey) {
        target.listeners = target.listeners || {};
        target.listeners[eventName] = propertyKey;
    };
}
// behavior decorator
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
// observe decorator
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
// element registration functions
function createElement(element) {
    Polymer(element.prototype);
}
function createClass(element) {
    Polymer.Class(element.prototype);
}
//# sourceMappingURL=polymer-ts.js.map