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
var MyInline = (function (_super) {
    __extends(MyInline, _super);
    function MyInline() {
        _super.apply(this, arguments);
    }
    MyInline = __decorate([
        /*
        class MyAbstract extends polymer.Base
        {
           makeSomeNoise()
           {
              console.log("argh!");
              this.fire("noise-made");
           }
        }
        */ component("my-inline"),
        template("\n   <div>\n      This element has been created completely from code\n      <br>The prop is: <span>{{prop}}</span>\n      <br>And the marker is <span>{{marker}}</span>\n   </div>\n"),
        style("\n   :host { \n      display: block; \n   } \n\n   div { \n      color: red; \n   }\n")
    ], MyInline);
    return MyInline;
}(polymer.Base));
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