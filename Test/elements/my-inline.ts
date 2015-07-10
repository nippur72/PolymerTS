class MyAbstract extends polymer.Base implements polymer.Element
{
   makeSomeNoise()
   {
      console.log("argh!");
      this.fire("noise-made");
   }
}

@component("my-inline")

@template
(`
   <div>
      This element has been created completely from code
      <br>The prop is: <span>{{prop}}</span>
   </div>
`)

@style
(`
   :host { 
      display: block; 
   } 

   div { 
      color: red; 
   }
`)

class MyInline extends MyAbstract implements MyMixin
{
   @property()
   public prop = "hello world";  
   
   //is = "my-inline"; 

   private myprivate = [1,2,3,4,5];

   constructor()
   {
      super();            
      console.log("constructor()");
      this.prop = "hello world and all the rest";
      //console.log(this.myprivate);      
   }

   created()
   {
      //this.prop = "hello";
      console.log("created()");
      /*console.log(this.myprivate);      */
   }

   ready()
   {
      console.log("ready()");
      /*
      console.log(this.myprivate);

      if (this.myprivate[0] == 1) console.log("correct value preserved");
      else console.log("correct value NOT preserved");

      this.myprivate[0] = 5;

      this.makeSomeNoise();

      this.prop = "64"; */

      this.makeSomeNoise();
   }

   @observe("prop")
   hiChanged(newVal, oldVal)
   {
      console.log(`prop changed from ${oldVal} to ${newVal}`);
   }

   noiseMade: ()=>void;
}

class MyMixin extends polymer.Base implements polymer.Element
{
   @listen("noise-made")
   noiseMade() {
      console.log("someone made noise!");
   }
}

function applyMixins(derivedCtor: any, baseCtors: any[]) {
   baseCtors.forEach(baseCtor => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
         derivedCtor.prototype[name] = baseCtor.prototype[name];
      })
   });
}

applyMixins(MyInline, [MyMixin]);
