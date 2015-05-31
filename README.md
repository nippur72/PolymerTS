# PolymerTS

This repo allows you to use Polymer v1.0 from TypeScript.

I have NOT published it on [DefinitelyTyped](https://github.com/borisyankov/DefinitelyTyped) yet.

To use it, just get the file `polymer.ts` and include in your TypeScript project.

If you find bugs or want to improve it, just send a pull request.

To run the very small example contained in the repo, clone it and install Polymer:

- manually: extract .zip file into `bower_components` folder
- or more easily via bower: `bower update`

Then open in Visual Studio and run the project.

When writing Polymer elements you can use @decorators (similarly to PolymerDart).

Example of a counter element:
```TypeScript
@tag("my-timer")
class MyTimer implements PolymerElement
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

   detatched() {
      clearInterval(this.timerHandle);
   }
}
```

```HTML
<link rel="import" href="bower_components/polymer/polymer.html">

<dom-module id="my-timer">
   <template>
      <p>This is a timer element, and the count which started 
      from <span>{{start}}</span> is now: <span>{{count}}</span></p>
   </template>
</dom-module>
```

To register the element:

```TypeScript
Register(MyTimer);   // no .prototype
```

