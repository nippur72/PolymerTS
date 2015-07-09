# PolymerTS

Write Polymer 1.0 elements as TypeScript @decorated classes! 

If you find bugs or want to improve it, just send a pull request.

# Table of contents

- Installation
- Supported features
- How to write elements
- How to correctly reference in markup
- @decorators explained
   - @component
   - @property
   - @observe
   - @computed
   - @listen
   - @behaviour
- Creating elements imperatively: @template and @style
- Examples
   - A timer-based counter element   
   - Using computed properties
   - Using private properties and class constructor
- Running the example

# Installation

Install via bower:
```
bower install -save polymer-ts
```
You'll get the following files in `bower_components/polymer-ts`:
- `polymer-ts.js` the JavaScript file to add in your app (via `<script src="">`)
- `polymer-ts.ts` the file to reference in your TypeScript code (via `/// <reference path="...">`)

# Supported features

- Decorators
   - `@component(tagName)` sets component's name (equivalent to `is:` in PolymerJS)
   - `@extend(name)` extends a native tag (equivalent to `extends:` in PolymerJS)
   - `@hostAttributes(attrs)` sets host attributes (equivalent to `hostAttributes:` in PolymerJS)
   - `@property(defs)` sets a property (equivalent to `properties:` in PolymerJS)
   - `@observe(propList)` sets an observer function on single or multiple properties (equivalent to `observers:` in PolymerJS)
   - `@computed()` defines a computed property
   - `@listen(eventName)` sets an event listener function (equivalent to `listeners:` in PolymerJS)
   - `@behaviour(className)` gets the behavious of the class (equivalent to `behaviours:` in PolymerJS)
- Registration functions
   - `createElement(className)` register in Polymer and create the element
   - `createClass(className)` register in Polymer without creating the element
- Events
   - class constructor automatically linked to the `created` event 

# How to write elements

- write elements as TypeScript classes
- extend the `polymer.Base` class 
- implement the `polymer.Element` interface
- use @decorators as needed 

# How to correctly reference in markup

In the `head` section of your main .html file:

```HTML
<head>
   <!-- webcomponents and polymer standard library -->
   <script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
   <link rel="import" href="bower_components/polymer/polymer.html">   
   
   <!-- include the file "polymer-ts.js" before the elements -->
   <script src="bower_components/polymer-ts/polymer-ts.js"></script>
   
   <!-- your custom elements -->
   <link rel="import" href="elements/my-element.html">   
</head>
```

In your custom element (e.g. `elements/my-element.html`):
```HTML
<dom-module id="my-element">
   <!-- ... your custom element here... -->
</dom-module>

<!-- your element code typescript transpiled file --> 
<script type="text/javascript" src="my-element.js"></script>

<!-- create the element in polymer -->
<script>
   createElement(MyElement);
</script>
```

In your element typescript code (e.g. `elements/my-element.ts`):
```TypeScript
/// <reference path="../bower_components/polymer-ts/polymer-ts.ts" />

@component("my-element")
class MyElement extends polymer.Base implements polymer.Element
{
}
```

# @decorators explained

## @component(tagName)

Sets the tag name of the custom component. The decorator is applied to the TypeScript `class` keyword. Notice that tag names must include a `-` as per WebComponents specs. Example of a `<my-element>`:
 
```TypeScript
@component("my-element")
class MyElement extends polymer.Base implements polymer.Element
{
}
```

If the component extends a native HTML tag, pass it as second argument or use the `@extend` decorator:

```TypeScript
@component("my-button","button")
class MyButton extends polymer.Base implements polymer.Element
{
}
```
or
```TypeScript
@component("my-button") @extend("button")
class MyButton extends polymer.Base implements polymer.Element
{
}
```

## @property(def)

Creates a Polymer property. It can be applied to a member field or a function. When applied to a function, the property becomes a computed property.

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

Example:
```TypeScript
@property({ type: number, value: 42 });
initialValue: number;
```
While you can specify `computed` and `observer` in a property definition, there are the specific decorators `@computed` and `@observe` that are easier to use. 

## @observe(propList)

Sets an observer function for a single property or a list of properties.

If observing a single property, the function must be of the type `function(newVal,OldVal)`.

If observing multiple properties (comma separated), the function receives only the new values,
in the same order of the list. 

```TypeScript
// single property observer
@observe("name");
nameChanged(newName,oldName)
{
   // ... 
}
```

```TypeScript
// multiple property observer
@observe("firstname,lastname");
fullnameChanged(newFirstName,newLastName)
{
   // ... 
}
```

## @computed

Creates a computed property or sets the function for a computed property.

The easiest way is to decorate a function that takes as arguments the properties that are involved in the computed property. 

In the following example, a computed property named "fullname" is created, based on the properties "firstName" and "lastName":

```TypeScript
@computed
fullname(firstName,lastName)
{
   return firstName+" "+lastName; 
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

## @listen(eventName)

Sets a listener function for an event.

In the following example the function `resetCounter()` is called whenever the event `reset-counters` is triggered (e.g. via `fire()`).

```TypeScript
   @listen("reset-counters")
   resetCounter() {
      this.count = 0;
   }
```

## @behaviour(className)

Incorporate behaviours from another element (defined with PolymerTS). 

A behaviour is firstly defined in a separate class, declaring it normally as any other Polymer element, and then its behaviour are "imported" with the `@behaviour` decorator. 

The decorator can decorate the `class` keyword or it can be put within the class itself.

Examples: 

```TypeScript
class MyBehaviour extends polymer.Base implements polymer.Element
{
   @listen("something_has_happened")
   onBehave() {
      console.log("something_has_happened triggered");
   }
}
```
```TypeScript
@component("my-element")
@behavior(MyBehaviour)
class MyElement extends polymer.Base implements polymer.Element
{
  // ...
}
```
or
```TypeScript
@component("my-element")
class MyElement extends polymer.Base implements polymer.Element
{
	@behavior(MyBehaviour)  
	// ...
}
```

# Creating elements only with code: @template and @style

**Eperimental feature**: It's also possible to create elements using TypeScript code only, without having any external .html. That can be useful if you want to keep template and logic in the same
TypeScript file.

Use the tags `@template` and `@style` to specify the element's template and style, as in the following example: 
```TypeScript
@component("my-example")

// pass as argument what would be within <dom-module> and </dom-module>
@template(`<div>This element has been created completely from code</div>`)

// pass as argument what would be within <style> and </style>
@style(`:host { display: block; } div { color: red; }`)

class MyExample extends polymer.Base implements polymer.Element
{
   // ...
}
```
Registration is done with `createElement` but be sure to call it after the `WebComponentsReady` event has been fired:
```JavaScript
   <script>
   window.addEventListener('WebComponentsReady', function (e) {
      createElement(MyExample);   
   });
   </script>
```

# Examples

### A timer-based counter element
```TypeScript
@component("my-timer")
class MyTimer extends polymer.Base implements polymer.Element
{
   @property({ type: Number, value: 0 })
   public start: number;   
   
   public count: number;   

   private timerHandle: number;

   ready() {
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
```

```HTML
<dom-module id="my-timer">
   <template>
      <p>This is a timer element, and the count which started 
      from <span>{{start}}</span> is now: <span>{{count}}</span></p>
   </template>
</dom-module>
```

To register the element:

```TypeScript
createElement(MyTimer);   // no .prototype
```
To use the element
```HTML
<my-timer start="42"></my-timer>
```

### Using computed properties

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

### Using private properties and class constructor

The constructor of the class is automatically linked to the `created` event
so you can initialize private properties directly in the constructor, making
the `created` event totally optional.

The order of execution is:

1. class-defined initializations (myprivate1)
2. class constructor (myprivate2)
3. created event (myprivate3)

```TypeScript
@component("my-element")
class MyElement extends polymer.Base implements polymer.Element {
   private myprivate1 = 1;
   private myprivate2;
   private myprivate3;

   constructor() {
      this.myprivate2 = 2;
   }

   // this is optional and can be moved within the constructor
   created() {
      this.myprivate3 = 3;
   }
}
```

# Running the example

To run the very small example contained in this repo:

- clone the repo `nippur72/PolymerTS`
- go to the `Test` directory
- run `bower update`
- Open the solution in Visual Studio and run the Test project.
