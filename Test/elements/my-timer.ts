
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

   detatched() {
      clearInterval(this.timerHandle);
   }
}


 