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
