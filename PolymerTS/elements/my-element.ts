
@component("my-element")
class MyElement extends base implements PolymerElement
{
   @property({ type: String, value: "1024" /*, observer: "testChanged" */})
   test: string; 
     
   @property({ type: String, value: "2048" /*, observer: "testChanged" */ })
   test1: string;   
   
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
  
   @observe("test")
   testChanged(newValue,oldValue)
   {
      console.log(`test has changed from ${oldValue} to ${newValue}`);
   }

   @observe("test,test1")
   test_and_test1_Changed(newTest, newTest1)
   {
      console.log(`test=${newTest}, test1=${newTest1}`);
   }

   /*
   ready()
   {
      
   }
   */
}
 