
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

class MyInline extends polymer.Base implements polymer.Element
{
   @property({ value: "hi" })
   prop: string;

   private myprivate = [1,2,3,4,5];

   constructor()
   {
      super();

      console.log("constructor()");
      console.log(this.myprivate);      
   }

   created()
   {
      console.log("created()");
      console.log(this.myprivate);      
   }

   ready()
   {
      console.log("ready()");
      console.log(this.myprivate);

      if (this.myprivate[0] == 1) console.log("correct value preserved");
      else console.log("correct value NOT preserved");

      this.myprivate[0] = 5;
   }
}

