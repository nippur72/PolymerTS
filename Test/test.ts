/// <reference path="typings/jasmine/jasmine.d.ts" />

var polymerReady = false;

window.addEventListener('WebComponentsReady', (e) =>
{           
   polymerReady = true;
});

RunSpecs();

// mimics the old Jasmine 1.3 waitsFor()
function waitFor(F)
{
   beforeEach((done) => {
      setInterval(() => {
         if(F()) done();
      }, 250);
   });        
}

function RunSpecs()
{
   describe("WebComponents", () => {
      waitFor( () => polymerReady );

      it("fires the event 'WebComponentsReady'", () =>
      {         
         expect(polymerReady).toBe(true);
      });
   });

   describe("<my-element>", () =>   
   {
      it("initializes properties", () =>
      {
         var el = <MyElement> <any> document.querySelector("#myelid");
         expect(el.test).toBe("4096");        
      });
   });
}

