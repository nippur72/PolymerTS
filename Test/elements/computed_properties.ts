@component("computed-properties-test")
class ComputedPropertiesTest extends polymer.Base
{
   @property() first  = 1;   
   @property() second = 1;
   
   @computed() computed1(first, second)
   {
      return first + second;
   }     
                  
   @property({ computed: 'getcomputed2(first,second)' })
   computed2: number;

   getcomputed2()
   {
      return this.first + this.second;
   }                    
}

@component("custom-constructor-test")
@template("<div>this element has a custom constructor</div>")
class CustomConstructorTest extends polymer.Base
{
   @property() bar: string;

   constructor(foo: string)
   {
      super();
      this.bar = foo;
   }
}

@component("property-initialization-test")
@template("")
class PropertyInitializationTest extends polymer.Base {
   @property() bar = "mybar"

   @property() foo: string;

   @property({ value: "mywar" }) war;

   constructor() {
      super();
      this.foo = "myfoo";
   }
}

@component("double-initialization-test")
@template("")
class DoubleInitializationTest extends polymer.Base {
   @property() bar="mybar"

   @property() foo: string;

   @property({ value: "mywar" }) war;

   constructor() {
      super();
      this.foo="myfoo";
   }
}

@component("uninitialized-test")
@template("")
class UnInitializedTest extends polymer.Base
{
   @property() bar = "mybar"
}

@component("no-factory-impl-test")
@template("")
class NoFactoryImplTest extends polymer.Base
{
   factoryImpl()
   {      
      return null;
   }
}

@component("listener-test")
@template("")
class ListenerTest extends polymer.Base
{
   @property() bar="mybar";

   constructor() {      
      super();
      this.fire("change-bar");      
   }

   @listen("change-bar")
   changeBarEvent()
   {
      this.bar = "foo";
   }
}

@component("observer-test")
@template("")
class ObserverTest extends polymer.Base {
   @property() bar="mybar";
   @property() foo="myfoo";
   @property() nbar_changed = 0;
   @property() nbar_foo_changed = 0;

   @observe("bar")
   changedBar() {
      this.nbar_changed++;
   }

   @observe("bar,foo")
   changedBarAndFoo() {
      this.nbar_foo_changed++;
   }
}


