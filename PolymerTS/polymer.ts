// Type definitions for polymer v0.9
// Project: https://github.com/polymer
// Definitions by: Antonino Porcino <https://github.com/nippur72>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

interface Polymer 
{
    (prototype: PolymerElement): Function;
    Class(prototype: PolymerElement): Function;
    dom(node: HTMLElement): HTMLElement;
}

declare var Polymer: Polymer;

interface PolymerElement 
{	
   properties?: Object;
   listeners?: Object;

   // lifecycle
   factoryImpl? (): void;
	ready? (): void;
	created? (): void;
	attached? (): void;
	detached? (): void;
	attributeChanged? (attrName: string, oldVal: any, newVal: any): void;
	
   $: HTMLElement;

   // utility functions

   // Returns the first node in this element’s local DOM that matches selector.
   $$(selector): HTMLElement;   

   // Toggles the named boolean class on the host element, adding the class if bool is truthy and removing it if bool is falsey. If node is specified, sets the class on node instead of the host element.
   toggleClass(name, bool, node?); 

   // Like toggleClass, but toggles the named boolean attribute.
   toggleAttribute(name, bool, node?); 

   // Moves a boolean attribute from oldNode to newNode, unsetting the attribute (if set) on oldNode and setting it on newNode.
   attributeFollows(name, newNode, oldNode); 

   // Fires a custom event. The options object can contain the following properties:
   fire(type, detail?, options?); 

   // Calls method asynchronously. If no wait time is specified, runs tasks with microtask timing (after the current method finishes, but before the next event from the event queue is processed). Returns a handle that can be used to cancel the task.
   async(method, wait?); 

   // Cancels the identified async task.
   cancelAsync(handle); 

   // Call debounce to collapse multiple requests for a named task into one invocation, which is made after the wait time has elapsed with no new request. If no wait time is given, the callback is called at microtask timing (guaranteed to be before paint).
   debounce(jobName, callback, wait?); 

   // Cancels an active debouncer without calling the callback.
   cancelDebouncer(jobName); 

   // Calls the debounced callback immediately and cancels the debouncer.
   flushDebouncer(jobName); 

   // Returns true if the named debounce task is waiting to run.
   isDebouncerActive(jobName); 

   // Applies a CSS transform to the specified node, or this element if no node is specified. 
   transform(transform, node); 
   
   // Transforms the specified node, or this element if no node is specified.
   translate3d(x, y, z, node); 
   
   // Dynamically imports an HTML document.
   importHref(href, onload, onerror); 
}


// tag decorator
function tag(tagname: string) 
{
   return function (target: Function) 
   { 
      target.prototype["is"] = tagname;          
   }
}

// extends decorator
function extendsTag(tagname: string) 
{
   return function (target: Function) 
   { 
      target.prototype["extends"] = tagname;          
   }
}

// hostAttributes decorator
function hostAttributes(attributes: Object) 
{
   return function (target: Function) 
   { 
      target.prototype["hostAttributes"] = attributes;          
   }
}

// property definition interface
interface propDefinition
{
   type?: Function;
   value?: boolean|number|string|Function;
   reflectToAttribute?: boolean;
   readonly?: boolean;
   notify?: boolean;
   computed?: string;
   observer?: string;
}

// property decorator
function property(ob: propDefinition)
{   
   return (target: PolymerElement, propertyKey: string) => {            
      target.properties = target.properties || {};
      target.properties[propertyKey] = ob;      
   }
}

// listener decorator
function listener(eventName: string)
{   
   return (target: PolymerElement, propertyKey: string) => {                  
      target.listeners = target.listeners || {};
      target.listeners[eventName] = propertyKey;      
   }
}

// element registration functions

function Register(element: Function): void
{
   Polymer(element.prototype);
}

function RegisterClass(element: Function): void
{
   Polymer.Class(element.prototype);
}

