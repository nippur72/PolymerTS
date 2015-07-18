/// <reference path="../bower_components/polymer-ts/polymer-ts.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
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
            listen("behave")
        ], MyBehaviour.prototype, "onBehave", Object.getOwnPropertyDescriptor(MyBehaviour.prototype, "onBehave")));
    return MyBehaviour;
})(polymer.Base);
var MyElement = (function (_super) {
    __extends(MyElement, _super);
    function MyElement() {
        _super.apply(this, arguments);
        this.test = "4096";
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
    /*
    @computed("fullname", "test")
    computeFullName(test)
    {
       return "Douglas Adams [" + test + "]";
    }
    */
    /*
    @property({ name:"fullname", type: String, computed: "test" })
    computefullname(test)
    {
       return "alba: "+test;
    }
    */
    /*
    @property({type: String, computed: "test" })
    fullname(test) {
       return "Douglas Adams [" + test + "]";
    }
    */
    /*
    @property({computed: "get_fullname(test)" })
    fullname: string;
 
    get_fullname(test) {
       return "Douglas Adams [" + test + "]";
    }
    */
    MyElement.prototype.fullname = function (test) {
        return "Douglas Adams [" + test + "]";
    };
    __decorate([
        property({ type: String, value: "1024" /*, observer: "testChanged" */ })
    ], MyElement.prototype, "test");
    __decorate([
        property({ type: String, value: "2048" /*, observer: "testChanged" */ })
    ], MyElement.prototype, "test1");
    __decorate([
        property()
    ], MyElement.prototype, "dummy_property");
    Object.defineProperty(MyElement.prototype, "testChanged",
        __decorate([
            observe("test")
        ], MyElement.prototype, "testChanged", Object.getOwnPropertyDescriptor(MyElement.prototype, "testChanged")));
    Object.defineProperty(MyElement.prototype, "test_and_test1_Changed",
        __decorate([
            observe("test,test1")
        ], MyElement.prototype, "test_and_test1_Changed", Object.getOwnPropertyDescriptor(MyElement.prototype, "test_and_test1_Changed")));
    Object.defineProperty(MyElement.prototype, "fullname",
        __decorate([
            computed
        ], MyElement.prototype, "fullname", Object.getOwnPropertyDescriptor(MyElement.prototype, "fullname")));
    MyElement = __decorate([
        component("my-element"),
        behavior(MyBehaviour)
    ], MyElement);
    return MyElement;
})(polymer.Base);
MyElement.register();
