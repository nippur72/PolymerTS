declare module polymer {
    class Base {
        $: any;
        $$: any;
        arrayDelete(path: string, item: string | any): any;
        async(callback: Function, waitTime?: number): any;
        attachedCallback(): void;
        attributeFollows(name: string, toElement: HTMLElement, fromElement: HTMLElement): void;
        cancelAsync(handle: number): void;
        cancelDebouncer(jobName: string): void;
        classFollows(name: string, toElement: HTMLElement, fromElement: HTMLElement): void;
        create(tag: string, props: Object): any;
        debounce(jobName: string, callback: Function, wait?: number): void;
        deserialize(value: string, type: any): any;
        distributeContent(): void;
        domHost(): void;
        elementMatches(selector: string, node: Element): any;
        fire(type: string, detail?: Object, options?: Object): any;
        flushDebouncer(jobName: string): void;
        get(path: string | Array<string | number>): any;
        getContentChildNodes(slctr: string): any;
        getContentChildren(slctr: string): any;
        getNativePrototype(tag: string): any;
        getPropertyInfo(property: string): any;
        importHref(href: string, onload?: Function, onerror?: Function): any;
        instanceTemplate(template: any): any;
        isDebouncerActive(jobName: string): any;
        linkPaths(to: string, from: string): void;
        listen(node: Element, eventName: string, methodName: string): void;
        mixin(target: Object, source: Object): void;
        notifyPath(path: string, value: any, fromAbove: any): void;
        pop(path: string): any;
        push(path: string, value: any): any;
        reflectPropertyToAttribute(name: string): void;
        resolveUrl(url: string): any;
        scopeSubtree(container: Element, shouldObserve: boolean): void;
        serialize(value: string): any;
        serializeValueToAttribute(value: any, attribute: string, node: Element): void;
        set(path: string, value: any, root?: Object): any;
        setScrollDirection(direction: string, node: HTMLElement): void;
        shift(path: string, value: any): any;
        splice(path: string, start: number, deleteCount: number): any;
        toggleAttribute(name: string, bool: boolean, node?: HTMLElement): void;
        toggleClass(name: string, bool: boolean, node?: HTMLElement): void;
        transform(transform: string, node?: HTMLElement): void;
        translate3d(x: any, y: any, z: any, node?: HTMLElement): void;
        unlinkPaths(path: string): void;
        unshift(path: string, value: any): any;
        updateStyles(): void;
    }
    interface Element {
        properties?: Object;
        listeners?: Object;
        behaviors?: Object[];
        observers?: String[];
        factoryImpl?(): void;
        ready?(): void;
        created?(): void;
        attached?(): void;
        detached?(): void;
        attributeChanged?(attrName: string, oldVal: any, newVal: any): void;
        updateStyles?(): void;
        prototype?: Object;
    }
    interface Property {
        name?: string;
        type?: any;
        value?: any;
        reflectToAttribute?: boolean;
        readonly?: boolean;
        notify?: boolean;
        computed?: string;
        observer?: string;
    }
}
declare var Polymer: {
    (prototype: polymer.Element): Function;
    Class(prototype: polymer.Element): Function;
    dom(node: HTMLElement): HTMLElement;
    appendChild?(node): HTMLElement;
    insertBefore?(node, beforeNode): HTMLElement;
    removeChild?(node): HTMLElement;
    flush?();
    patchConstructor(target: Function): void;
};
declare function component(tagname: string, extendsTag?: string): (target: Function) => void;
declare function extend(tagname: string): (target: Function) => void;
declare function template(templateString: string): (target: Function) => void;
declare function style(styleString: string): (target: Function) => void;
declare function hostAttributes(attributes: Object): (target: Function) => void;
declare function property(ob?: polymer.Property): (target: polymer.Element, propertyKey: string) => void;
declare function computed(ob?: polymer.Property): (target: polymer.Element, computedFuncName: string) => void;
declare function listen(eventName: string): (target: polymer.Element, propertyKey: string) => void;
declare function behavior(behaviorObject: any): any;
declare function observe(propertiesList: string): (target: polymer.Element, observerFuncName: string) => void;
declare function setupArtificialInstantation(elementClass: Function): polymer.Element;
declare function createElement(element: polymer.Element): void;
declare function createClass(element: polymer.Element): void;
declare function createTemplate(definition: polymer.Element): void;
