
@tag("my-element")
class MyElement implements PolymerElement
{
   @property({type: String, value: "1024"})
   test: string;   

   @listener("tap")
   regularTap(e)
   {
      alert("Thank you for tapping");
   }

   /*
   ready()
   {
      
   }
   */
}
 