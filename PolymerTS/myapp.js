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
/*
// Behavior decorator
function behavior(behaviorObject: Function) {
   return (target: PolymerElement) => {
      console.log(typeof target);
        target.behaviors = target.behaviors || [];
        target.behaviors.push(behaviorObject.prototype);
    }
}


function behavior2(behaviorObject: Function) {
   return function (target: Function) {
      console.log(typeof target);
      target.prototype["behaviors"] = target.prototype["behaviors"] || [];
      target.prototype["behaviors"].push(behaviorObject.prototype);
   }
}
*/
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
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = this.__decorate || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var MyBehaviour = (function (_super) {
    __extends(MyBehaviour, _super);
    function MyBehaviour() {
        _super.apply(this, arguments);
    }
    MyBehaviour.prototype.onBehave = function () {
        console.log("behave trigger");
    };
    Object.defineProperty(MyBehaviour.prototype, "onBehave",
        __decorate([
            listener("behave")
        ], MyBehaviour.prototype, "onBehave", Object.getOwnPropertyDescriptor(MyBehaviour.prototype, "onBehave")));
    MyBehaviour = __decorate([
        component("my-behaviour")
    ], MyBehaviour);
    return MyBehaviour;
})(base);
var MyElement = (function (_super) {
    __extends(MyElement, _super);
    function MyElement() {
        _super.apply(this, arguments);
    }
    //@behavior(MyBehaviour)
    /*
    @listener("tap")
    regularTap(e)
    {
       alert("Thank you for tapping");
    }
    */
    //@behavior(MyBehaviour.prototype)
    MyElement.prototype.handleClick = function () {
        this.test = this.test + "x";
        this.fire("behave");
    };
    MyElement.prototype.testChanged = function (newValue, oldValue) {
        console.log("test has changed from " + oldValue + " to " + newValue);
    };
    MyElement.prototype.test_and_test1_Changed = function (newTest, newTest1) {
        console.log("test=" + newTest + ", test1=" + newTest1);
    };
    __decorate([
        property({ type: String, value: "1024" /*, observer: "testChanged" */ })
    ], MyElement.prototype, "test");
    __decorate([
        property({ type: String, value: "2048" /*, observer: "testChanged" */ })
    ], MyElement.prototype, "test1");
    Object.defineProperty(MyElement.prototype, "testChanged",
        __decorate([
            observe("test")
        ], MyElement.prototype, "testChanged", Object.getOwnPropertyDescriptor(MyElement.prototype, "testChanged")));
    Object.defineProperty(MyElement.prototype, "test_and_test1_Changed",
        __decorate([
            observe("test,test1")
        ], MyElement.prototype, "test_and_test1_Changed", Object.getOwnPropertyDescriptor(MyElement.prototype, "test_and_test1_Changed")));
    MyElement = __decorate([
        component("my-element"),
        behavior(MyBehaviour)
    ], MyElement);
    return MyElement;
})(base);
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
/// <reference path="polymer.ts"/>
function RegisterAll() {
    createElement(MyElement);
    createElement(MyTimer);
}
/// <reference path="polymer.ts" />
/// <reference path="elements/my-element.ts" />
/// <reference path="elements/my-timer.ts" />
/// <reference path="app.ts" />
//# sourceMappingURL=myapp.js.map