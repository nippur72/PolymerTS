class MyBehaviour extends polymer.Base 
{
   @listen("behave")
   onBehave() {
      console.log("behave trigger");
   }
}

@component("my-element")
@behavior(MyBehaviour)

@template(`

      <p>I'm a DOM element. This is my local DOM!</p>
      <p>And this is a test property: <span>{{test}}</span></p>
      <p><button on-click="handleClick">click me</button></p>
      <p>The full name is <span>{{fullname}}</span></p>

    <template is="dom-repeat" items="{{propArray}}">
        <div>{{item}}</div>        
    </template>
`)

class MyElement extends polymer.Base 
{
   @property({ type: String, value: "1024" /*, observer: "testChanged" */})
   test: string = "4096"; 
     
   @property({ type: String, value: "2048" /*, observer: "testChanged" */ })
   test1: string;  

   @property()
   dummy_property: any; 

   @property() propArray = [1,2,3,4,5,6];
                                 
   //@behavior(MyBehaviour)
   
   /*
   @listener("tap")
   regularTap(e)
   {
      alert("Thank you for tapping");
   }
   */
   //@behavior(MyBehaviour.prototype)

   handleClick()
   {    
      this.test = this.test + "x";
      this.fire("behave");  

      var s: HTMLElement;
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
   @computed("fullname", "test")
   computeFullName(test)
   {
      return "Douglas Adams [" + test + "]";         
   }
   */
   
   /*
   @property({ name:"fullname", type: String, computed: "test" })
   computefullname(test)
   {
      return "alba: "+test;
   }
   */

   /*
   @property({type: String, computed: "test" })
   fullname(test) {
      return "Douglas Adams [" + test + "]";    
   }
   */

   /*
   @property({computed: "get_fullname(test)" })
   fullname: string;

   get_fullname(test) {
      return "Douglas Adams [" + test + "]";    
   }
   */

   @computed() fullname(test)
   {
      return "Douglas Adams ["+test+"]";
   }

   /*
   ready()
   {
      
   }
   */
}

MyElement.register();

