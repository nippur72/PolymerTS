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
var MyTimer = (function (_super) {
    __extends(MyTimer, _super);
    function MyTimer() {
        _super.apply(this, arguments);
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
})(polymer.Base);
//# sourceMappingURL=my-timer.js.map