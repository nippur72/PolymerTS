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
var MyAbstract = (function (_super) {
    __extends(MyAbstract, _super);
    function MyAbstract() {
        _super.apply(this, arguments);
    }
    MyAbstract.prototype.makeSomeNoise = function () {
        console.log("argh!");
        this.fire("noise-made");
    };
    return MyAbstract;
})(polymer.Base);
var MyInline = (function (_super) {
    __extends(MyInline, _super);
    function MyInline(marker) {
        _super.call(this);
        this.prop = "hello world";
        this.marker = "default marker";
        //is = "my-inline"; 
        this.myprivate = [1, 2, 3, 4, 5];
        console.log("constructor(\"" + marker + "\")");
        this.prop = "hello world and all the rest";
        //console.log(this.myprivate);      
        if (marker !== undefined)
            this.marker = marker;
    }
    /*
    factoryImpl(foo, bar)
    {
       console.log(`factoryImpl called with foo=${foo} bar=${bar}`);
    }
    */
    MyInline.prototype.created = function () {
        //this.prop = "hello";
        console.log("created()");
        /*console.log(this.myprivate);      */
    };
    MyInline.prototype.ready = function () {
        console.log("ready()");
        /*
        console.log(this.myprivate);
  
        if (this.myprivate[0] == 1) console.log("correct value preserved");
        else console.log("correct value NOT preserved");
  
        this.myprivate[0] = 5;
  
        this.makeSomeNoise();
  
        this.prop = "64"; */
        this.makeSomeNoise();
    };
    MyInline.prototype.attached = function () {
        console.log("attached()");
    };
    MyInline.prototype.hiChanged = function (newVal, oldVal) {
        console.log("prop changed from " + oldVal + " to " + newVal);
    };
    __decorate([
        property()
    ], MyInline.prototype, "prop");
    __decorate([
        property()
    ], MyInline.prototype, "marker");
    Object.defineProperty(MyInline.prototype, "hiChanged",
        __decorate([
            observe("prop")
        ], MyInline.prototype, "hiChanged", Object.getOwnPropertyDescriptor(MyInline.prototype, "hiChanged")));
    MyInline = __decorate([
        component("my-inline"),
        template("\n   <div>\n      This element has been created completely from code\n      <br>The prop is: <span>{{prop}}</span>\n      <br>And the marker is <span>{{marker}}</span>\n   </div>\n"),
        style("\n   :host { \n      display: block; \n   } \n\n   div { \n      color: red; \n   }\n")
    ], MyInline);
    return MyInline;
})(MyAbstract);
var MyMixin = (function (_super) {
    __extends(MyMixin, _super);
    function MyMixin() {
        _super.apply(this, arguments);
    }
    MyMixin.prototype.noiseMade = function () {
        console.log("someone made noise!");
    };
    Object.defineProperty(MyMixin.prototype, "noiseMade",
        __decorate([
            listen("noise-made")
        ], MyMixin.prototype, "noiseMade", Object.getOwnPropertyDescriptor(MyMixin.prototype, "noiseMade")));
    return MyMixin;
})(polymer.Base);
function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach(function (baseCtor) {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(function (name) {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
applyMixins(MyInline, [MyMixin]);
//# sourceMappingURL=my-inline.js.map