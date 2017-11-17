/*
class MyAbstract extends polymer.Base
{
   makeSomeNoise()
   {
      console.log("argh!");
      this.fire("noise-made");
   }
}
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MyInline = (function (_super) {
    __extends(MyInline, _super);
    //class MyInline extends MyAbstract implements MyMixin
    function MyInline() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MyInline;
}(polymer.Base));
MyInline = __decorate([
    component("my-inline"),
    template("\n   <div>\n      This element has been created completely from code\n      <br>The prop is: <span>{{prop}}</span>\n      <br>And the marker is <span>{{marker}}</span>\n   </div>\n"),
    style("\n   :host { \n      display: block; \n   } \n\n   div { \n      color: red; \n   }\n")
    //class MyInline extends MyAbstract implements MyMixin
], MyInline);
MyInline.register();
/*
class MyMixin extends polymer.Base implements polymer.Element
{
   @listen("noise-made")
   noiseMade() {
      console.log("someone made noise!");
   }
}

function applyMixins(derivedCtor: any, baseCtors: any[]) {
   baseCtors.forEach(baseCtor => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
         derivedCtor.prototype[name] = baseCtor.prototype[name];
      })
   });
}

applyMixins(MyInline, [MyMixin]);
*/ 
//# sourceMappingURL=my-inline.js.map