
@component("my-element")
class MyElement implements PolymerElement
{
   @property({ type: String, value: "1024" /*, observer: "testChanged" */})
   test: string;   
   
   /*
   @listener("tap")
   regularTap(e)
   {
      alert("Thank you for tapping");
   }
   */

   handleClick()
   {    
      this.test = this.test + "x";
   }

   //@observer("testChanged(test)")
   @observerFor("test")
   testChanged(newValue,oldValue)
   {
      console.log(`test has changed from ${oldValue} to ${newValue}`);
   }

   /*
   ready()
   {
      
   }
   */
}
 