# PolymerTS

Write Polymer 1.0 elements as TypeScript @decorated classes! 

Note: this repo is not yet published on [DefinitelyTyped](https://github.com/borisyankov/DefinitelyTyped).

If you find bugs or want to improve it, just send a pull request.

# Installation

Install via bower:
```
bower install -save polymer-ts
```
You'll get the following files in `bower_components/polymer-ts`:
- `polymer-ts.js` the JavaScript file to add in your app (via `<script src="">`)
- `polymer-ts.ts` the file to reference in your TypeScript code (via `/// <reference path="...">`)

# Running the example

To run the very small example contained in the repo:

- clone the repo `nippur72/PolymerTS`
- go to the `Test` directory
- run `bower update`
- Open the solution in Visual Studio and run the Test project.

# Supported features

- Decorators
   - `@component(name)` sets component's name (equivalent to `is:` in PolymerJS)
   - `@extend(name)` extends a native tag (equivalent to `extends:` in PolymerJS)
   - `@hostAttributes(attrs)` sets host attributes (equivalent to `hostAttributes:` in PolymerJS)
   - `@property(defs)` sets a property (equivalent to `properties:` in PolymerJS)
   - `@observe(defs)` sets an observer function on single or multiple properties (equivalent to `observers:` in PolymerJS)
   - `@computed()` defines a computed property
   - `@listener(eventName)` sets an event listener function (equivalent to `listeners:` in PolymerJS)
   - `@behaviour(className)` gets the behavious of the class (equivalent to `behaviours:` in PolymerJS)
- Registration functions
   - `createElement(className)` register in Polymer and create the element
   - `createClass(className)` register in Polymer without creating the element

# How to write elements

- write elements as TypeScript classes
- extend the `polymer.Base` class 
- implement the `polymer.Element` interface
- use @decorators as needed 

# How to correctly reference in markup

In the `head` section of your main .html file:

```HTML
<head>
   <!-- polymer and webcomponents standard library -->
   <link rel="import" href="bower_components/polymer/polymer.html">
   <script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
   
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
class MyElement extends polymer.base implements polymer.Element
{
}
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

   @listener("reset-counters")
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

### Using behaviours

First you create your custom behaviour in a separate class, and the you "import" it with the `@behaviour` decorator. You can put the decorator close the `class` keyword or within the class itself. 

```TypeScript
class MyBehaviour extends polymer.Base implements polymer.Element
{
   @listener("something_has_happened")
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
