/// <reference path="polymer.ts"/>
if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
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
    MyElement = __decorate([
        tag("my-element")
    ], MyElement);
    return MyElement;
})();
function RegisterAll() {
    Register(MyElement);
}
/*
window.onload = () => {
    var el = document.getElementById('content');
    var greeter = new Greeter(el);
    greeter.start();
    
    // register a new element called proto-element
};
*/
//# sourceMappingURL=app.js.map