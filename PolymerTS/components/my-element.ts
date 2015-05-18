
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

   /*
   ready()
   {
      
   }
   */
}
 