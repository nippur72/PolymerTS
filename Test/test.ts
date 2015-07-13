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

function querySelector(s)
{
   return document.querySelector(s);
}

// quickly checks if instance implements the class 
function implements(instance: Object, classFunction: Function)
{
   var instanceMembers = {};
   for(var i in instance) instanceMembers[i] = true;

   var classMembers = [];
   for(var i in classFunction.prototype) classMembers.push(i);

   for(var t=0; t<classMembers.length; t++)
   {
      if(instanceMembers[classMembers[t]]===undefined)
      {
         return false;
      }
   }   
   return true;
}

function RunSpecs()
{
   describe("WebComponents library", () => {
      waitFor( () => polymerReady );

      it("fires the event 'WebComponentsReady'", () =>
      {         
         expect(polymerReady).toBe(true);
      });
   });

   /*
   describe("<my-element>", () =>   
   {
      it("initializes properties", () =>
      {
         var el = <MyElement> <any> document.querySelector("#myelid");
         expect(el.test).toBe("4096");        
      });
   });
   */

   registerTest();
   computedPropertiesTest();
}

function registerTest()
{
   describe("@component", () => {
      it('registers regular elements', () => {
         var el = querySelector('#testElement');
         expect(implements(el, TestElement)).toBe(true);
         expect(el["is"]).toBe(TestElement.prototype["is"]);
      });

      it('extends builtin elements using second argument', () => {
         var el = querySelector('#testInput1');
         expect(implements(el, TestInput1)).toBe(true);
      });

      it("sets 'is:' correctly", () => {
         var el1 = querySelector('#testElement');
         var el2 = querySelector('#testInput1');
         var el3 = querySelector('#testInput2');
         expect(el1["is"]).toBe(TestElement.prototype["is"]);
         expect(el2["is"]).toBe(TestInput1.prototype["is"]);
         expect(el3["is"]).toBe(TestInput2.prototype["is"]);
      });
   });

   describe("@extend", () => {
      it('extends builtin elements', () => {
         var el = querySelector('#testInput2');
         expect(implements(el, TestInput2)).toBe(true);
      });
   });
}

function computedPropertiesTest()
{
   describe("Computed properties", () =>
   {      
      it('work with @computed decorator', () => {
         var element = <ComputedPropertiesTest> <any> querySelector('#computedProperties1');

         expect(element.computed1).toBe(2);
         element.set('first', 2);
         expect(element.computed1).toBe(3);
         element.set('second', 4);
         expect(element.computed1).toBe(6);
      });

      it('work with @property decorator', () => {
         var element=<ComputedPropertiesTest> <any> querySelector('#computedProperties2');

         expect(element.computed2).toBe(2);
         element.set('first', 2);
         expect(element.computed2).toBe(3);
         element.set('second', 4);
         expect(element.computed2).toBe(6);
      });
   });
}
