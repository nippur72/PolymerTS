var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MyBehaviour = (function (_super) {
    __extends(MyBehaviour, _super);
    function MyBehaviour() {
        _super.apply(this, arguments);
    }
    MyBehaviour.prototype.onBehave = function () {
        console.log("behave trigger");
    };
    __decorate([
        listen("behave")
    ], MyBehaviour.prototype, "onBehave", null);
    return MyBehaviour;
}(polymer.Base));
var MyElement = (function (_super) {
    __extends(MyElement, _super);
    function MyElement() {
        _super.apply(this, arguments);
        this.test = "4096";
        this.propArray = [1, 2, 3, 4, 5, 6];
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
        var s;
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
    ], MyElement.prototype, "test", void 0);
    __decorate([
        property({ type: String, value: "2048" /*, observer: "testChanged" */ })
    ], MyElement.prototype, "test1", void 0);
    __decorate([
        property()
    ], MyElement.prototype, "dummy_property", void 0);
    __decorate([
        property()
    ], MyElement.prototype, "propArray", void 0);
    __decorate([
        observe("test")
    ], MyElement.prototype, "testChanged", null);
    __decorate([
        observe("test,test1")
    ], MyElement.prototype, "test_and_test1_Changed", null);
    __decorate([
        computed()
    ], MyElement.prototype, "fullname", null);
    MyElement = __decorate([
        component("my-element"),
        behavior(MyBehaviour),
        template("\n\n      <p>I'm a DOM element. This is my local DOM!</p>\n      <p>And this is a test property: <span>{{test}}</span></p>\n      <p><button on-click=\"handleClick\">click me</button></p>\n      <p>The full name is <span>{{fullname}}</span></p>\n\n    <template is=\"dom-repeat\" items=\"{{propArray}}\">\n        <div>{{item}}</div>        \n    </template>\n")
    ], MyElement);
    return MyElement;
}(polymer.Base));
MyElement.register();
//# sourceMappingURL=my-element.js.map