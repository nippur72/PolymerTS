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
   describe("webcomponents library", () => {
      waitFor( () => polymerReady );

      it("fires the event 'WebComponentsReady'", () =>
      {         
         expect(polymerReady).toBe(true);
      });
   });

   describe("@component decorator", () => {
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

   describe("@extend decorator", () => {
      it('extends builtin elements', () => {
         var el = querySelector('#testInput2');
         expect(implements(el, TestInput2)).toBe(true);
      });
   });

   describe("a computed property", () =>
   {      
      it('can be set with @computed decorator', () => {
         var element = <ComputedPropertiesTest> <any> querySelector('#computedProperties1');

         expect(element.computed1).toBe(2);
         element.set('first', 2);
         expect(element.computed1).toBe(3);
         element.set('second', 4);
         expect(element.computed1).toBe(6);
      });

      it('can be set with @property decorator', () => {
         var element=<ComputedPropertiesTest> <any> querySelector('#computedProperties2');

         expect(element.computed2).toBe(2);
         element.set('first', 2);
         expect(element.computed2).toBe(3);
         element.set('second', 4);
         expect(element.computed2).toBe(6);
      });
   });

   describe("custom constructor", () =>
   {
      var elementConstructor, el;

      beforeEach(() =>
      {
         // register in Polymer and get the constructor
         elementConstructor = createElement(CustomConstructorTest);
         
         // create the element
         el = new elementConstructor("42");

         // connect it to DOM
         var root = querySelector("#put_custom_constructor_here");
         root.appendChild(el);
      });

      // wait for the 'attached' event
      waitFor(() => (el.bar == "42") );

      it("provides custom initialization", () =>
      {
         expect(el.bar).toBe("42");
      });         
   });

   describe("constructor()", () => {
      var elementConstructor, el;

      beforeEach(() => {
         // register in Polymer and get the constructor
         elementConstructor = createElement(PropertyInitializationTest);
         
         // create the element
         el = new elementConstructor();

         // connect it to DOM
         var root = querySelector("#put_custom_constructor_here");
         root.appendChild(el);
      });

      // wait for the 'attached' event
      waitFor(() => (el.bar == "mybar"));

      it("initializes properties correctly", () => {
         expect(el.bar).toBe("mybar");
         expect(el.foo).toBe("myfoo");
         expect(el.war).toBe("mywar");
      });
   });

   describe("@listen decorator", () => {
      var elementConstructor, el;

      beforeEach(() => {
         elementConstructor=createElement(ListenerTest);
         el=new elementConstructor();
         var root=querySelector("#put_custom_constructor_here");
         root.appendChild(el);
      });

      // wait for the 'attached' event
      waitFor(() => (el.bar=="foo"));

      it("sets an event listener function", () => {
         expect(el.bar).toBe("foo");
      });
   });
}

