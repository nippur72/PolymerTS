@component('test-element')
class TestElement extends polymer.Base
{
  
}

@component('test-input1', 'input')
class TestInput1 extends polymer.Base {

}

@component('test-input2')
@extend('input')
class TestInput2 extends polymer.Base
{

}
