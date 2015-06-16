var __decorate = this.__decorate || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var MyTimer = (function () {
    function MyTimer() {
    }
    MyTimer.prototype.ready = function () {
        var _this = this;
        this.count = this.start;
        this.timerHandle = setInterval(function () {
            _this.count++;
        }, 1000);
    };
    MyTimer.prototype.detatched = function () {
        clearInterval(this.timerHandle);
    };
    __decorate([
        property({ type: Number, value: 0 })
    ], MyTimer.prototype, "start");
    MyTimer = __decorate([
        component("my-timer")
    ], MyTimer);
    return MyTimer;
})();
var MyElement = (function () {
    function MyElement() {
    }
    /*
    @listener("tap")
    regularTap(e)
    {
       alert("Thank you for tapping");
    }
    */
    MyElement.prototype.handleClick = function () {
        this.test = this.test + "x";
    };
    //@observer("testChanged(test)")
    MyElement.prototype.testChanged = function (newValue, oldValue) {
        console.log("test has changed from " + oldValue + " to " + newValue);
    };
    __decorate([
        property({ type: String, value: "1024" /*, observer: "testChanged" */ })
    ], MyElement.prototype, "test");
    Object.defineProperty(MyElement.prototype, "testChanged",
        __decorate([
            observerFor("test")
        ], MyElement.prototype, "testChanged", Object.getOwnPropertyDescriptor(MyElement.prototype, "testChanged")));
    MyElement = __decorate([
        component("my-element")
    ], MyElement);
    return MyElement;
})();
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
// tag decorator
function component(tagname) {
    return function (target) {
        target.prototype["is"] = tagname;
    };
}
// extends decorator
function extend(tagname) {
    return function (target) {
        target.prototype["extends"] = tagname;
    };
}
// hostAttributes decorator
function hostAttribute(attributes) {
    return function (target) {
        target.prototype["hostAttributes"] = attributes;
    };
}
// property decorator
function property(ob) {
    return function (target, propertyKey) {
        target.properties = target.properties || {};
        target.properties[propertyKey] = ob;
    };
}
// listener decorator
function listener(eventName) {
    return function (target, propertyKey) {
        target.listeners = target.listeners || {};
        target.listeners[eventName] = propertyKey;
    };
}
// Behavior decorator
function behavior(behaviorObject) {
    return function (target) {
        target.behaviors = target.behaviors || [];
        target.behaviors.push(behaviorObject);
    };
}
// Observer decorator
function observer(observerName) {
    return function (target) {
        target.observers = target.observers || [];
        target.observers.push(observerName);
    };
}
// ObserverFor decorator
function observerFor(propertyName) {
    return function (target, observerName) {
        target.properties = target.properties || {};
        target.properties[propertyName] = target.properties[propertyName] || {};
        target.properties[propertyName].observer = observerName;
    };
}
// element registration functions
function createElement(element) {
    Polymer(element.prototype);
}
function createClass(element) {
    Polymer.Class(element.prototype);
}
/// <reference path="polymer.ts"/>
function RegisterAll() {
    createElement(MyElement);
    createElement(MyTimer);
}
//# sourceMappingURL=myapp.js.map