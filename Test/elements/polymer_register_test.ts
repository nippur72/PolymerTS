@component('test-element')
class TestElement extends polymer.Base
{
      
}

TestElement.register();


@component('test-input1', 'input')
class TestInput1 extends polymer.Base
{

}

TestInput1.register();

@component('test-input2')
@extend('input')
class TestInput2 extends polymer.Base
{

}

TestInput2.register();
