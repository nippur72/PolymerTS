// Type definitions for polymer v1.0
// Project: https://github.com/polymer
// Definitions by: Antonino Porcino <https://github.com/nippur72>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// ref to Polymer.Base (this)
class base {
	$: any;
	$$: any;

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
	fire(type: string, detail: Object, options?: Object):any {}
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

interface Polymer {
	(prototype: PolymerElement): Function;
	Class(prototype: PolymerElement): Function;
	dom(node: HTMLElement): HTMLElement;

	appendChild?(node): HTMLElement;
	insertBefore?(node, beforeNode): HTMLElement;
	removeChild?(node): HTMLElement;
	flush?();

	// Path to the value to read. The path may be specified as a string (e.g. foo.bar.baz) or an array of path parts (e.g. ['foo.bar', 'baz']). Note that bracketed expressions are not supported; string-based path parts must be separated by dots. Note that when dereferencing array indicies, the index may be used as a dotted part directly (e.g. users.12.name or ['users', 12, 'name']). Convienence method for reading a value from a path. Note, if any part in the path is undefined, this method returns undefined (this method does not throw when dereferencing undefined paths).

}

declare var Polymer: Polymer;

interface PolymerElement {
	properties?: Object;
	listeners?: Object;
	behaviors?: Object[];
	observers?: String[];

	// lifecycle
	factoryImpl?(): void;
	ready?():void;
	created?():void;
	attached?():void;
	detached?():void;
	attributeChanged?(attrName: string, oldVal: any, newVal: any):void;
	updateStyles?():void;
}


// tag decorator
function component(tagname: string) {
	return function(target: Function) {
		target.prototype["is"] = tagname;
	}
}

// extends decorator
function extend(tagname: string) {
	return (target: Function) => {
		target.prototype["extends"] = tagname;
	}
}

// hostAttributes decorator
function hostAttribute(attributes: Object) {
	return (target: Function) => {
		target.prototype["hostAttributes"] = attributes;
	}
}

// property definition interface
interface propDefinition {
	type?: any;
	value?: any;
	reflectToAttribute?: boolean;
	readonly?: boolean;
	notify?: boolean;
	computed?: string;
	observer?: string;
}

// property decorator
function property(ob: propDefinition) {
	return (target: PolymerElement, propertyKey: string) => {
		target.properties = target.properties || {};
		target.properties[propertyKey] = ob;
	}
}

// listener decorator
function listener(eventName: string) {
	return (target: PolymerElement, propertyKey: string) => {
		target.listeners = target.listeners || {};
		target.listeners[eventName] = propertyKey;
	}
}

// Behavior decorator
function behavior(behaviorObject: Object) {
	return (target: PolymerElement) => {
		target.behaviors = target.behaviors || [];
		target.behaviors.push(behaviorObject);
	}
}

// Observer decorator
function observer(observerName: string) {
	return (target: PolymerElement) => {
		target.observers = target.observers || [];
		target.observers.push(observerName);
	}
}

// element registration functions

function createElement(element: Function): void {
	Polymer(element.prototype);
}

function createClass(element: Function): void {
	Polymer.Class(element.prototype);
}
