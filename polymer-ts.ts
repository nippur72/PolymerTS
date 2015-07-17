// PolymerTS - Polymer for TypeScript
//
// https://github.com/nippur72/PolymerTS
//
// Antonino Porcino, nino.porcino@gmail.com

module polymer {   

   // this is the original Polymer.Base
   export declare class PolymerBase /* extends HTMLElement */ {   // commented as not yet supported by TypeScript
	   $: any;
	   $$: any;

	   root:HTMLElement;
	   shadyRoot:HTMLElement;
	   style:CSSStyleDeclaration;
	   customStyle:{[property:string]:string;};

	   arrayDelete(path: string, item: string|any):any;
	   async(callback: Function, waitTime?: number):any;
	   attachedCallback():void;
	   attributeFollows(name: string, toElement: HTMLElement, fromElement: HTMLElement):void;
	   cancelAsync(handle: number):void;
	   cancelDebouncer(jobName: string):void;
	   classFollows(name: string, toElement: HTMLElement, fromElement: HTMLElement):void;
	   create(tag: string, props: Object):any;
	   debounce(jobName: string, callback: Function, wait?: number):void;
	   deserialize(value: string, type: any):any;
	   distributeContent():void;
	   domHost():void;
	   elementMatches(selector: string, node: Element):any;
	   fire(type: string, detail?: Object, options?: Object):any;
	   flushDebouncer(jobName: string):void;
	   get(path: string|Array<string|number>):any;
	   getContentChildNodes(slctr: string):any;
	   getContentChildren(slctr: string):any;
	   getNativePrototype(tag: string):any;
	   getPropertyInfo(property: string):any;
	   importHref(href: string, onload?: Function, onerror?: Function):any;
	   instanceTemplate(template: any):any;
	   isDebouncerActive(jobName: string):any;
	   linkPaths(to: string, from: string):void;
	   listen(node: Element, eventName: string, methodName: string):void;
	   mixin(target: Object, source: Object):void;
	   notifyPath(path: string, value: any, fromAbove: any):void; 
	   pop(path: string):any; 
	   push(path: string, value: any):any;
	   reflectPropertyToAttribute(name: string):void;
	   resolveUrl(url: string):any;
	   scopeSubtree(container: Element, shouldObserve: boolean):void;
	   serialize(value: string):any;
	   serializeValueToAttribute(value: any, attribute: string, node: Element):void;
	   set(path: string, value: any, root?: Object):any;
	   setScrollDirection(direction: string, node: HTMLElement):void;
	   shift(path: string, value: any):any;
	   splice(path: string, start: number, deleteCount: number):any;
	   toggleAttribute(name: string, bool: boolean, node?: HTMLElement):void;
	   toggleClass(name: string, bool: boolean, node?: HTMLElement):void;
	   transform(transform: string, node?: HTMLElement):void;
	   translate3d(x, y, z, node?: HTMLElement):void;
	   unlinkPaths(path: string):void;
	   unshift(path: string, value: any):any;
      updateStyles(): void;
   }
   
   // members that can be optionally implemented in an element
   export interface Element {
      properties?: Object;
      listeners?: Object;
      behaviors?: Object[];
      observers?: String[];

      // lifecycle
      factoryImpl?(...args): void;
      ready?(): void;
      created?(): void;
      attached?(): void;
      detached?(): void;
      attributeChanged?(attrName: string, oldVal: any, newVal: any): void;

      // 
      prototype?: Object;
   }

   // members set by PolymerTS
   export interface PolymerTSElement
   {      
      $custom_cons?: FunctionConstructor;
      $custom_cons_args?: any[];
   }

   // property definition interface
   export interface Property {
      name?: string;
      type?: any;
      value?: any;
      reflectToAttribute?: boolean;
      readonly?: boolean;
      notify?: boolean;
      computed?: string;
      observer?: string;
   }

   // the ES6-inheritable version of Polymer.Base
   export declare class Base extends polymer.PolymerBase implements polymer.Element {
      static create<T extends polymer.Base>(...args: any[]): T;
   }    

   // create an ES6 inheritable Polymer.Base object, referenced as "polymer.Base"   
   export function createEs6PolymerBase()
   {     
      // create a placeholder class 
      var pb = function () { };      

      // make it available as polymer.Base
      window["polymer"]["Base"] = pb;

      // add a default create method()
      pb.prototype["create"] = function () {
         throw "element not yet registered in Polymer";
      }
   }

   export function prepareForRegistration(elementClass: Function): polymer.Element {

      // backward compatibility with TypeScript 1.4 (no decorators)
      if(elementClass.prototype.is === undefined)
      {
         var proto = elementClass.prototype;
         var instance = new (<any>elementClass)();
         proto.is             = instance.is;
         proto.extends        = instance.extends;
         proto.properties     = instance.properties;
         proto.listeners      = instance.listeners;
         proto.observers      = instance.observers;
         proto.behaviors      = instance.behaviors;
         proto.hostAttributes = instance.hostAttributes;
         proto.style          = instance.style;
         proto.template       = instance.template;
      }
      
      var preparedElement = elementClass.prototype;

      // artificial constructor: call constructor() and copies members
      preparedElement["$custom_cons"] = function () {
         // reads arguments coming from factoryImpl
         var args = this.$custom_cons_args;      

         // applies class constructor on the polymer element (this)
         elementClass.apply(this, args);
      };
   
      // arguments for artifical constructor
      preparedElement["$custom_cons_args"] = [];
   
      // modify "factoryImpl"
      if (preparedElement["factoryImpl"] !== undefined) {
         throw "do not use factoryImpl() use constructor() instead";
      }
      else {
         preparedElement["factoryImpl"] = function () {
            this.$custom_cons_args = arguments;
         };
      }
   
      // modify "attached" event function
      var attachToFunction = "attached";
      var oldFunction = preparedElement[attachToFunction];
      preparedElement[attachToFunction] = function () {
         this.$custom_cons();
         if (oldFunction !== undefined) oldFunction.apply(this);
      };

      return preparedElement;
   }

   export function injectTemplateAndStyle(definition: polymer.Element) {
      var domModule: any = document.createElement('dom-module');

      var proto = <any> definition.prototype;

      domModule.id = proto.is;

      // attaches style
      if (proto.style !== undefined) {
         var elemStyle = (<any> document).createElement('style', 'custom-style');
         domModule.appendChild(elemStyle);
         elemStyle.textContent = proto.style;
      }

      // attaches template
      if (proto.template !== undefined) {
         var elemTemplate = document.createElement('template');
         domModule.appendChild(elemTemplate);
         elemTemplate.innerHTML = proto.template;
      }

      // tells polymer the element has been created
      domModule.createdCallback();
   }

} // end module

// modifies Polymer.Base and makes it available as an ES6 class named polymer.Base 
polymer.createEs6PolymerBase();

// Polymer object
declare var Polymer: {
   (prototype: polymer.Element): FunctionConstructor;
   Class(prototype: polymer.Element): Function;
   dom(node: HTMLElement): HTMLElement;
   dom(node: polymer.Base): HTMLElement;

   appendChild(node): HTMLElement;
   insertBefore(node, beforeNode): HTMLElement;
   removeChild(node): HTMLElement;
   updateStyles(): void; 
   flush();   
   
   Base: any;     
}

// @component decorator
function component(tagname: string, extendsTag?: string) {
	return function(target: Function) {
      target.prototype["is"] = tagname;
      if (extendsTag !== undefined)
      {
         target.prototype["extends"] = extendsTag;
      }
	}
}

// @extend decorator
function extend(tagname: string) {
	return (target: Function) => {
		target.prototype["extends"] = tagname;
	}
}

// @template decorator
function template(templateString: string) {
   return (target: Function) => {
      target.prototype["template"] = templateString;
   }
}

// @style decorator
function style(styleString: string) {
   return (target: Function) => {
      target.prototype["style"] = styleString;
   }
}

// @hostAttributes decorator
function hostAttributes(attributes: Object) {
	return (target: Function) => {
		target.prototype["hostAttributes"] = attributes;
	}
}

// @property decorator with automatic name for computed props
function property(ob?: polymer.Property) {      
   return (target: polymer.Element, propertyKey: string) => {
      target.properties = target.properties || {};
      if (typeof (target[propertyKey]) === "function") {
         // property is function, treat it as a computed property         
         var params = ob["computed"];
         var getterName = "get_computed_" + propertyKey;
         ob["computed"] = getterName + "(" + params + ")";
         target.properties[propertyKey] = ob;
         target[getterName] = target[propertyKey];
      }
      else {
         // normal property
         target.properties[propertyKey] = ob || {};
      }
   }
}

// @computed decorator
function computed(ob?: polymer.Property) {   
   return (target: polymer.Element, computedFuncName: string) => {
      target.properties = target.properties || {};      
      var propOb = ob || {};
      var getterName = "get_computed_" + computedFuncName;
      var funcText: string = target[computedFuncName].toString();
      var start = funcText.indexOf("(");
      var end = funcText.indexOf(")");
      var propertiesList = funcText.substring(start+1,end);
      propOb["computed"] = getterName + "(" + propertiesList + ")";
      target.properties[computedFuncName] = propOb;
      target[getterName] = target[computedFuncName];
   }
}

// @listen decorator
function listen(eventName: string) {
	return (target: polymer.Element, propertyKey: string) => {
		target.listeners = target.listeners || {};
		target.listeners[eventName] = propertyKey;
	}
}

// @behavior decorator
function behavior(behaviorObject: any): any {
   return (target: any) => {
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
   }
}

// @observe decorator
function observe(propertiesList: string) {
   if (propertiesList.indexOf(",") > 0) {
      // observing multiple properties
      return (target: polymer.Element, observerFuncName: string) => {
         target.observers = target.observers || [];
         target.observers.push(observerFuncName + "(" + propertiesList + ")");
      }
   }
   else {
      // observing single property
      return (target: polymer.Element, observerName: string) => {
         target.properties = target.properties || {};
         target.properties[propertiesList] = target.properties[propertiesList] || {};
         target.properties[propertiesList].observer = observerName;
      }
   }
}

function createElement<T extends polymer.Base>(element: new (...args: any[]) => T): new (...args: any[]) => T {
   if ((<any> element.prototype).template !== undefined || (<any>element.prototype).style !== undefined) {
      polymer.injectTemplateAndStyle(element);
   }
   // register element and make available its constructor as "create()"
   var maker = <any> Polymer(polymer.prepareForRegistration(element));   
   element["create"] = function () {      
      var newOb = Object.create(maker.prototype);      
      return maker.apply(newOb, arguments); 
   };
   return maker;
}

function createClass<T extends polymer.Base>(element: new (...args: any[]) => T): new (...args: any[]) => T {
   if ((<any> element.prototype).template !== undefined || (<any>element.prototype).style !== undefined) {
      polymer.injectTemplateAndStyle(element);
   }
   return <any> Polymer.Class(polymer.prepareForRegistration(<Function> element));
}

