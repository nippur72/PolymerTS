// Type definitions for polymer v1.0
// Project: https://github.com/polymer
// Definitions by: Antonino Porcino <https://github.com/nippur72>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
// tag decorator
function tag(tagname) {
    return function (target) {
        target.prototype["is"] = tagname;
    };
}
// extends decorator
function extendsTag(tagname) {
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
// element registration functions
function Register(element) {
    Polymer(element.prototype);
}
function RegisterClass(element) {
    Polymer.Class(element.prototype);
}
/// <reference path="polymer.ts"/>
function RegisterAll() {
    Register(MyElement);
    Register(MyTimer);
}
var __decorate = this.__decorate || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var MyElement = (function () {
    function MyElement() {
    }
    MyElement.prototype.regularTap = function (e) {
        alert("Thank you for tapping");
    };
    __decorate([
        property({ type: String, value: "1024" })
    ], MyElement.prototype, "test");
    Object.defineProperty(MyElement.prototype, "regularTap",
        __decorate([
            listener("tap")
        ], MyElement.prototype, "regularTap", Object.getOwnPropertyDescriptor(MyElement.prototype, "regularTap")));
    MyElement = __decorate([
        tag("my-element")
    ], MyElement);
    return MyElement;
})();
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
        tag("my-timer")
    ], MyTimer);
    return MyTimer;
})();
//# sourceMappingURL=myapp.js.map