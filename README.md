# PolymerTS

Write Polymer 1.0 elements as TypeScript @decorated classes.

# Table of contents

- [Installation](#install)
- [Supported features](#features)
- [How to write elements](#howtowrite)
- [How to correctly reference in markup](#howtoreference)
- [Starting the application](#start)
- [Using the yeoman generator to create new elements](#generator)
- [Decorators explained](#decorators)
   - [@component](#component)
   - [@extend](#extend)
   - [@property](#property)
   - [@observe](#observe)
   - [@computed](#computed)
   - [@listen](#listen)
   - [@behavior](#behavior)
   - [@hostAttributes](#hostattributes)
- [Writing elements only with code: @template and @style](#imperatively)
- [Writing elements without using decorators](#decoratorless)
- [Examples](#examples)
   - [A timer-based counter element](#timer_example)
   - [Using computed properties](#computed_example)
   - [Using custom constructor](#custom_constructor_example)   
   - [Using behaviors defined externally](#paperexample)
- [Running the repo example](#repoexample)
- [What it does, in short](#details)
- [Known issues](#knownissues)
- [Contributing](#contributing)
- [Changelog](#changelog)

# Installation <a name="install"></a>

Install via bower:
```
bower install -save polymer-ts
```
You'll get the following files in `bower_components/polymer-ts`:
- `polymer-ts.html` the html file to include via `<link rel="import">` that loads PolymerTS
- `polymer-ts.min.html` the html file to include via `<link rel="import">` that loads PolymerTS (minified version)
- `polymer-ts.d.ts` the file to reference in your TypeScript code (`/// <reference path="...">`)
- `polymer-ts.ts` the source TypeScript file for debugging purposes
- `polymer-ts.js` or `polymer-ts.min.js` the JavaScript file if you want to include PolymerTS via `<script src="">`

# Supported features <a name="features"></a>

- Decorators
   - `@component(tagName)` sets component's name (equivalent to `is:` in PolymerJS)
   - `@extend(name)` extends a native tag (equivalent to `extends:` in PolymerJS)
   - `@hostAttributes(attrs)` sets host attributes (equivalent to `hostAttributes:` in PolymerJS)
   - `@property(defs)` sets a property (equivalent to `properties:` in PolymerJS)
   - `@observe(propList)` sets an observer function on single or multiple properties (equivalent to `observers:` in PolymerJS)
   - `@computed()` defines a computed property
   - `@listen(eventName)` sets an event listener function (equivalent to `listeners:` in PolymerJS)
   - `@behavior(className)` gets the behaviors of the class (equivalent to `behaviors:` in PolymerJS)
- Registration functions
   - `className.register()` registers in Polymer
   - `className.register(true)` registers in Polymer but not in `document.registerElement()`
   - `className.create()` creates an instance of the element
- Other
   - class constructor mapped to factory constructor (`factoryImpl()`)

Unsupported:
   - property defined with getter/setter

# How to write elements <a name="howtowrite"></a>

1. Write elements as TypeScript classes
2. Extend the `polymer.Base` class
3. Use @decorators as needed

A class-element:
- can have private properties/fields
- can use class constructor (rendered as `factoryImpl()`)
- can use inherited properties and methods
- can use TypeScript Mixins

# How to correctly reference in markup<a name="howtoreference"></a>

In the `head` section of your main .html file:

```HTML
<head>
   <!-- webcomponents, polymer standard, polymer-ts -->
   <script src="bower_components/webcomponentsjs/webcomponents-lite.js"></script>
   <link rel="import" href="bower_components/polymer/polymer.html">
   <link rel="import" href="bower_components/polymer-ts/polymer-ts.html">

   <!-- your custom elements -->
   <link rel="import" href="elements/my-element.html">

   <!-- your application -->
   <script src="myapp.js"></script>
</head>
```

In your custom element (e.g. `elements/my-element.html`):
```HTML
<dom-module id="my-element">
   <!-- ... your custom element here... -->
</dom-module>

<!-- your element code typescript transpiled file -->
<script type="text/javascript" src="my-element.js"></script>
```

In your element typescript code (e.g. `elements/my-element.ts`):
```TypeScript
/// <reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

@component("my-element")
class MyElement extends polymer.Base
{
}

// after the element is defined, we register it in Polymer
MyElement.register();
```

The above example loads in the following order:
- WebComponents
- Polymer
- PolymerTS
- Your custom elements
- Your app

Note: due to an [issue in WebComponents](https://github.com/webcomponents/webcomponentsjs/issues/347),
you can't use the `<script>` tag on the main page to load PolymerTS or custom elements,
you have always to use the `<link rel="import">` syntax.

This will make sure that scripts will be loaded in the correct order in all browsers.

If for some reason you want to use script inclusion for your elements, you have to load
Polymer and PolymerTS via script too. Polymer doesn't have a `polymer.js` file (it's shipped as `.html` only),
but you can get one from [greenify/polymer-js](https://github.com/greenify/polymer-js).

# Starting the application <a name="start"></a>

Any global code in your app that depends on Polymer should be started only after the event
`WebComponentsReady` has been fired:

```TypeScript
window.addEventListener('WebComponentsReady', (e) =>
{
   // any code that depends on polymer here
});
```

# Using the yeoman generator to create new elements <a name="generator"></a>

New elements can be quickly scaffolded using the `polymerts:el` yeoman
generator available with the package [generator-polymerts](https://www.npmjs.com/package/generator-polymerts).

First install `yeoman` and `generator-polymerts`:
```
npm install -g yo
npm install -g generator-polymerts
```
then use the `polymerts:el` generator to create a new element:
```
yo polymerts:el my-element
```

# Decorators explained <a name="decorators"></a>

## @component(tagName) <a name="component"></a>

Sets the tag name of the custom component. The decorator is applied on the `class` keyword. Tag names must include a `-` as per WebComponents specs.

Example of a `<my-element>`:

```TypeScript
@component("my-element")
class MyElement extends polymer.Base
{
}
```

If the component extends a native HTML tag, pass the "base" tag name as second argument (alternatively, use the `@extend` decorator)

```TypeScript
@component("my-button","button")
class MyButton extends polymer.Base
{
}
```

## @extend(tagName) <a name="extend"></a>

Specifies that the element is an extension of a native HTML element.

```TypeScript
@component("my-button")
@extend("button")
class MyButton extends polymer.Base
{
}
```

## @property(def) <a name="property"></a>

Creates a Polymer property. It can be applied to a member field or a function.
When applied to a function, the property becomes a computed property.

The parameter `def` is a map object that sets the options for the property:

```TypeScript
{
    type?: any;                     // Boolean, Date, Number, String, Array or Object
    value?: any;                    // default value for the property
    reflectToAttribute?: boolean;   // should the property reflect to attribute
    readonly?: boolean;             // marks property as read-only
    notify?: boolean;               // if set to true, will trigger "propname-changed"
    computed?: string;              // computed function call (as string)
    observer?: string;              // observer function call (as string)
}
```

Examples:
```TypeScript
@property({ type: number, value: 42 })
initialValue: number;
```

The default value for a property is optional as long as the property is initialized:
```TypeScript
@property()
myprop = 42;  // direct initialization
```
or
```TypeScript
@property({ type: number })
myprop: number;

constructor() {
   this.myprop = 42; // initialized within constructor
}
```

While you can specify `computed` and `observer` in a property definition,
there are the specific decorators `@computed` and `@observe` that are easier to use.

## @observe(propList) <a name="observe"></a>

Sets an observer function for a single property or a list of properties.

If observing a single property, the function must be of the type `function(newVal,OldVal)`.

If observing multiple properties (comma separated), the function receives only the new values,
in the same order of the list.

```TypeScript
// single property observer
@observe("name")
nameChanged(newName,oldName)
{
   // ...
}
```

```TypeScript
// multiple property observer
@observe("firstname,lastname")
fullnameChanged(newFirstName,newLastName)
{
   // ...
}
```

## @computed <a name="computed"></a>

Creates a computed property or sets the function for a computed property.

The easiest way is to decorate a function that takes as arguments the properties that are involved in the computed property.

In the following example, a computed property named "fullname" is created, based on the properties "firstName" and "lastName":

```TypeScript
@computed()
fullname(firstName,lastName)
{
   return firstName+" "+lastName; // firstname is the same as this.firstName
}
```

The decorator accepts also a map object for setting options on the property, e.g.:
```TypeScript
@computed({ type: String })
fullname(firstName,lastName)
{
   return firstName+" "+lastName;
}
```

The `@computed` decorator is a shortcut for `@property`:

```TypeScript
@property({computed: 'computefullname(firstName,lastName)'})
fullname: string;

computefullname(firstName,lastName)
{
   return firstName+" "+lastName;
}
```

## @listen(eventName) <a name="listen"></a>

Sets a listener function for an event.

In the following example the function `resetCounter()` is called whenever the event `reset-counters` is triggered (e.g. via `fire()`).

```TypeScript
   @listen("reset-counters")
   resetCounter() {
      this.count = 0;
   }
```

## @behavior(className) <a name="behavior"></a>

Incorporates behaviors from another object.

The object can be either a class (not necessarily a PolymerTS element) or a plain JavaScript object.

The `@behavior` decorator can decorate the `class` keyword or it can be put within the class itself.

Examples:

```TypeScript
class MyBehavior extends polymer.Base
{
   @listen("something_has_happened")
   onBehave() {
      console.log("something_has_happened triggered");
   }
}
```
```TypeScript
@component("my-element")
@behavior(MyBehavior)
class MyElement extends polymer.Base
{
  // ...
}
```
or
```TypeScript
@component("my-element")
class MyElement extends polymer.Base
{
	@behavior(MyBehavior)
	// ...
}
```
Note: a functionality similar to `@behavior` can be also obtained by plain class inheritance
or by the use of Mixins.

# Writing elements only with code <a name="imperatively"></a>

It's also possible to create elements using TypeScript code only,
without having any external .html. That can be useful if you want to keep template and logic in the same
TypeScript file.

Use the tags `@template` and `@style` to specify the element's template and style, as in the following example:
```TypeScript
@component("my-example")

// pass as argument what would be within <dom-module> and </dom-module>
@template(`<div>This element has been created completely from code</div>`)

// pass as argument what would be within <style> and </style>
@style(`:host { display: block; } div { color: red; }`)

class MyExample extends polymer.Base
{
   // ...
}

MyExample.register();
```

## @hostAttributes(attributesObject) <a name="hostattributes"></a>

Sets attributes on the host element.

In the following example, the `style` attribute of the host element is changed:

```TypeScript
@component("my-element")
@hostAttributes({ style: "color: red;" })
class MyElement extends polymer.Base
{
}
```

# Writing elements without using decorators <a name="decoratorless"></a>

It's possible to avoid the use of decorators (e.g. for compatibility with TypeScript < 1.5) by simply writing
their respective equivalent in plain Polymer syntax. E.g.
```TypeScript
class MyElement extends polymer.Base
{
   is = "my-element";

   properties = {
      myprop: { value: 42 }
   };

   // ...
}
```

# Examples <a name="examples"></a>

### A timer-based counter element <a name="timer_example"></a>
```TypeScript
@component("my-timer")
class MyTimer extends polymer.Base
{
   @property({ type: Number, value: 0 })
   public start: number;

   public count: number;

   private timerHandle: number;

   constructor() {
      this.count = this.start;
      this.timerHandle = setInterval(() => {
         this.count++;
      }, 1000);
   }

   @observe("count")
   countChanged(newValue, oldValue) {
      if(newValue==100000) {
         console.log("too much time spent doing nothing!");
         this.fire("reset-counters");
	  }
   }

   @listen("reset-counters")
   resetCounter() {
      this.count = 0;
   }

   detatched() {
      clearInterval(this.timerHandle);
   }
}

MyTimer.register();
```

```HTML
<dom-module id="my-timer">
   <template>
      <p>This is a timer element, and the count which started
      from <span>{{start}}</span> is now: <span>{{count}}</span></p>
   </template>
</dom-module>
```

To use the element
```HTML
<my-timer start="42"></my-timer>
```

### Using computed properties <a name="computed_example"></a>

There are several (almost equivalent) ways of defining a computed property:

```TypeScript
// classic way
@property({name: "fullname", computed: "computeFullName(first,last)"});
fullname: string;
computeFullName(f,l) {
   return f+" "+l;
}

// by decorating a function
@property({computed: "first,last"});
fullname(f,l) {
   return f+" "+l;
}

// by using @computed, name and parameters extracted from the function
@computed
fullname(first,last) {
   return first+" "+last;
}
```

### Using custom constructor <a name="custom_constructor_example"></a>

Elements can be instantiated by using a custom constructor:

```TypeScript
@component("my-info")
class MyInfo extends polymer.Base
{
   private someInfo: string;

   constructor(someInfo: string) {
      this.someInfo = someInfo;
   }
}

// creates the element passing a parameter
var el = MyInfo.create("hello world");

// and attach in some way to the DOM
document.body.appendChild(el);
```

# Using behavior defined in paper elements<a name="paperexample"></a>

This example shows how to use a behavior defined in an external library (Polymer paper elements).

```typescript
/// <reference path="typings/polymer/paper/PaperRippleBehavior.d.ts"/>

@component('ts-element')
@behavior(Polymer['PaperRippleBehavior'])
class TsElement extends polymer.Base implements Polymer.PaperRippleBehavior
{   
   // stand-in properties for behavior mixins 
   noink: boolean = false;
   ensureRipple: (optTriggeringEvent?: Event) => void;
   getRipple: () => paper.PaperRipple;
   hasRipple: () => boolean;

   handleClick(e:Event)
   {
      this.greet = "Holà";      
      this.fire("greet-event");
      this.ensureRipple(e);
   }
}
```

# Running the example <a name="repoexample"></a>

To run the "Test" project containing the Jasmine specs:

- clone this repo `nippur72/PolymerTS`
- go to the `Test` directory
- run `bower update`
- Open the solution in Visual Studio and run the "Test" project.

# What it does<a name="details"></a>

In short, PolymerTS:

- provides a class named `polymer.Base` that all your elements can extend
- provides a suite of decorators to easily implement elements
- injects the method `register()` in your element-class (to allow registration it in Polymer)

in turn, the `register()` method:

- process decorators translating them in its Polymer counterpart
- connects the `constructor()` before of the `attached` event so that properties are correctly initialized
- connects the `constructor(args)` to the `factoryImpl()` callback so that custom constructor is processed correctly
- registers the element in Polymer, saving the constructor function and making it available as the `create()` method

# Known issues <a name="knownissues"></a>

- can't use property defined with `get` and `set` (Polymer's issue)
- can't include elements using `<script>` on the main .html page (WebComponent's issue)

# Contributing <a name="contributing"></a>

Contributions are welcome.

If you find bugs or want to improve it, just send a pull request.

# Change log <a name="changelog"></a>
- v0.1.19 (Sep 16, 2015)
  - Extended `@behavior` to work with plain JavaScript objects (in addition to TypeScript classes)
- v0.1.17 (Sep 14, 2015)
  - BREAKING CHANGE: (mostly harmless) Polymer.Base is now an extension of HTMLElement
  - Added `is` to Element's interface
- v0.1.7 (Aug 7, 2015)
  - Corrected signature for `Polymer.dom.flush()`
- v0.1.6 (Jul 21, 2015)
  - provided `polymer-ts.d.ts` to reference from external projects
  - no longer need to include `webcomponents.js` (non-lite) in IE
- v0.1.5 (Jul 18, 2015)
  - BREAKING CHANGE: global functions `createElement()` and `createClass()` deprecated, use `Element.resgister()` instead
  - BREAKING CHANGE: use `<link rel="import">` to load PolymerTS and custom elements
- v0.1.4 (Jul 17, 2015)
  - register elements with `className.register()`
- v0.1.3 (Jul 16, 2015)
  - polymer.Base is now seen as a full ES6 inheritable class
- v0.1.2 (Jul 13, 2015)
  - Improved the way objects are instatiated
  - support for static method `create()` on the element class
- v0.1.1 (Jul 10, 2015)
  - Added support for constructor() with parameters.
  - `constructor()` is now a replacement of `factoryImpl()`.
  - preamble `implements polymer.Element` no longer required
- v0.1.0 (Jul 10, 2015)
  - Added support for class inheritance
  - Added support for use of `constructor()`
  - Added support for decorator-less syntax
- v0.0.1 to v0.0.9
  - early experimental versions
