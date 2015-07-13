@component('computed-properties-test')
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


