/// <reference path="typings/jasmine/jasmine.d.ts" />

function RunSpecs()
{
   describe("A jasmine test", () =>   
   {
      it("constains a spec", () =>
      {
         expect(!false).toBe(true);

         var el=document.querySelector("#myelid");

         expect((<any> el).test).toBe("");        
      });
   });
}






