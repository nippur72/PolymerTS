# PolymerTS

This repo allows you to use Polymer v0.9 from TypeScript.

I have NOT published it on [DefinitelyTyped](https://github.com/borisyankov/DefinitelyTyped) yet.

To use it, just get the file `polymer.ts` and include in your TypeScript project.

If you find bugs or want to improve it, just send a pull request.

To run the very small example contained in the repo, clone it and install the `bower_components` directory (manually or via bower). Then open in Visual Studio and run it.

When writing Polymer elements you can use @decorators (similarly to PolymerDart).

Example:

```TypeScript
@tag("my-element")
class MyElement
{
   @property({type: String, value: "44"})
   test: string;   

   @listener("tap")
   regularTap(e)
   {
      alert("Thank you for tapping");
   }
}
```

To register the element:

```TypeScript
Register(MyElement);   // no .prototype
```

