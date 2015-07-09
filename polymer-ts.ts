// Type definitions for polymer v1.0
// Project: https://github.com/polymer
// Definitions by: Antonino Porcino <https://github.com/nippur72>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

module polymer {

   export class Base {
	   $: any;
	   $$: any;

	   root:HTMLElement;
	   shadyRoot:HTMLElement;
           style:CSSStyleDeclaration;
	   customStyle:{[property:string]:string;};;

	   arrayDelete(path: string, item: string|any):any {}
	   async(callback: Function, waitTime?: number):any {}
	   attachedCallback():void {}
	   attributeFollows(name: string, toElement: HTMLElement, fromElement: HTMLElement):void {}
	   cancelAsync(handle: number):void {}
	   cancelDebouncer(jobName: string):void {}
	   classFollows(name: string, toElement: HTMLElement, fromElement: HTMLElement):void {}
	   create(tag: string, props: Object):any {}
	   debounce(jobName: string, callback: Function, wait?: number):void {}
	   deserialize(value: string, type: any):any {}
	   distributeContent():void {}
	   domHost():void {}
	   elementMatches(selector: string, node: Element):any {}
	   fire(type: string, detail?: Object, options?: Object):any {}
	   flushDebouncer(jobName: string):void {}
	   get(path: string|Array<string|number>):any {}
	   getContentChildNodes(slctr: string):any {}
	   getContentChildren(slctr: string):any {}
	   getNativePrototype(tag: string):any {}
	   getPropertyInfo(property: string):any {}
	   importHref(href: string, onload?: Function, onerror?: Function):any {}
	   instanceTemplate(template: any):any {}
	   isDebouncerActive(jobName: string):any {}
	   linkPaths(to: string, from: string):void {}
	   listen(node: Element, eventName: string, methodName: string):void {}
	   mixin(target: Object, source: Object):void {}
	   notifyPath(path: string, value: any, fromAbove: any):void {}
	   pop(path: string):any {}
	   push(path: string, value: any):any {}
	   reflectPropertyToAttribute(name: string):void {}
	   resolveUrl(url: string):any {}
	   scopeSubtree(container: Element, shouldObserve: boolean):void {}
	   serialize(value: string):any {}
	   serializeValueToAttribute(value: any, attribute: string, node: Element):void {}
	   set(path: string, value: any, root?: Object):any {}
	   setScrollDirection(direction: string, node: HTMLElement):void {}
	   shift(path: string, value: any):any {}
	   splice(path: string, start: number, deleteCount: number):any {}
	   toggleAttribute(name: string, bool: boolean, node?: HTMLElement):void {}
	   toggleClass(name: string, bool: boolean, node?: HTMLElement):void {}
	   transform(transform: string, node?: HTMLElement):void {}
	   translate3d(x, y, z, node?: HTMLElement):void {}
	   unlinkPaths(path: string):void {}
	   unshift(path: string, value: any):any {}
	   updateStyles():void {}
   }

   export interface Element {
      properties?: Object;
      listeners?: Object;
      behaviors?: Object[];
      observers?: String[];

      // lifecycle
      factoryImpl?(): void;
      ready?(): void;
      created?(): void;
      attached?(): void;
      detached?(): void;
      attributeChanged?(attrName: string, oldVal: any, newVal: any): void;
      updateStyles?(): void;

      // 
      prototype?: Object;
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

} // end module

// Polymer object
declare var Polymer: {
	(prototype: polymer.Element): Function;
	Class(prototype: polymer.Element): Function;
	dom(node: HTMLElement): HTMLElement;
	dom(node: polymer.Base): HTMLElement;

	appendChild?(node): HTMLElement;
	insertBefore?(node, beforeNode): HTMLElement;
	removeChild?(node): HTMLElement;
   flush?();   

   patchConstructor(target: Function): void;   
}

function patchConstructor(target: Function): void {         
   // saves class constructor
   target.prototype["$$constructor"] = target; 

   // saves created() event function 
   if (target.prototype.created !== undefined) {
      target.prototype["$$oldcreated"] = target.prototype.created;
   }

   // define a new "created" event, calling constructor and old created()
   target.prototype["created"] = function () {
      this.$$constructor.apply(this);
      if (this.$$oldcreated !== undefined) this.$$oldcreated();
   };
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

// element registration functions
function createElement(element: polymer.Element): void {
   if((<any> element.prototype).template !== undefined || (<any>element.prototype).style !== undefined) {
      createTemplate(element);
   }   
   patchConstructor(<Function> element);
	Polymer(element.prototype);
}

function createClass(element: polymer.Element): void {
   if((<any> element.prototype).template !== undefined || (<any>element.prototype).style !== undefined) {
      createTemplate(element);
   }
   patchConstructor(<Function> element);
   Polymer.Class(element.prototype);
}

function createTemplate(definition: polymer.Element) {
   var domModule: any = document.createElement('dom-module');

   var proto = <any> definition.prototype;

   domModule.id = proto.is;

   // attaches style
   if(proto.style !== undefined) {
      var elemStyle = (<any> document).createElement('style', 'custom-style');  
      domModule.appendChild(elemStyle);
      elemStyle.textContent = proto.style;
   }

   // attaches template
   if(proto.template !== undefined) {
      var elemTemplate = document.createElement('template');
      domModule.appendChild(elemTemplate);
      elemTemplate.innerHTML = proto.template;
   }

   // tells polymer the element has been created
   domModule.createdCallback();
}

