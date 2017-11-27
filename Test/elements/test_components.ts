@component("computed-properties-test")
class ComputedPropertiesTest extends polymer.Base {
    @property() first = 1;
    @property() second = 1;

    @computed() computed1(first, second) {
        return first + second;
    }

    @property({computed: 'getcomputed2(first,second)'})
    computed2: number;

    getcomputed2() {
        return this.first + this.second;
    }
}

ComputedPropertiesTest.register();

@component("custom-constructor-test")
@template("<div>this element has a custom constructor</div>")
class CustomConstructorTest extends polymer.Base {
    @property() bar: string;

    constructor(foo: string) {
        super();
        this.bar = foo;
    }
}

CustomConstructorTest.register();

@component("property-initialization-test")
@template("")
class PropertyInitializationTest extends polymer.Base {
    @property() bar = "mybar";

    @property() foo: string;

    @property({value: "mywar"}) war;

    @property({value: "mywar"}) constructorProp;

    @property({type: Boolean, notify: true, reflectToAttribute: true, value: true})
    allValuesSet: boolean;

    @property({type: Boolean, readOnly: true})
    readOnlyUndefined = true;

    @property({type: Boolean, readOnly: true, value: true})
    readOnlyInitialized = false;

    constructor() {
        super();
        this.foo = "myfoo";
        this.constructorProp = "constructorProp";
        this.readOnlyUndefined = false;
    }
}

PropertyInitializationTest.register();

@component("double-initialization-test")
@template("")
class DoubleInitializationTest extends polymer.Base {
    @property() bar = "mybar"

    @property() foo: string;

    @property({value: "mywar"}) war;

    constructor() {
        super();
        this.foo = "myfoo";
    }
}

@component("uninitialized-test")
@template("")
class UnInitializedTest extends polymer.Base {
    @property() bar = "mybar"
}

@component("no-factory-impl-test")
@template("")
class NoFactoryImplTest extends polymer.Base {
    factoryImpl() {
        return null;
    }
}

@component("listener-test")
@template("")
class ListenerTest extends polymer.Base {
    @property() bar = "mybar";

    constructor() {
        super();
        this.fire("change-bar");
    }

    @listen("change-bar")
    changeBarEvent() {
        this.bar = "foo";
    }
}

ListenerTest.register();

@component("observer-test")
@template("")
class ObserverTest extends polymer.Base {
    @property() bar = "mybar";
    @property() bar_old;
    @property() bar2_old;
    @property() observed_bar;
    @property() nbar_changed = 0;

    @property() foo = "myfoo";
    @property() observed_foo;

    @property() nbar_foo_changed = 0;

    @property() baz;
    @property() baz_old;
    @property() nbaz_changed = 0;

    @property() nmanager_changed = 0;

    @property() blah = "myblah";
    @property() blah_new_val;
    @property() blah_old_val;
    @property() nblah_changed = 0;

    @property({type: Object}) user = {manager: "64"};

    rawProperty: string;

    @observe("bar")
    changedBar(newVal, oldVal) {
        console.debug('changedBar', newVal, oldVal);
        this.nbar_changed++;
        this.bar_old = oldVal;
        console.debug('changedBar', 'nbar_changed', this.nbar_changed, 'bar_old', this.bar_old);
    }

    @observe("bar")
    changedBarAgain(newVal, oldVal) {
        console.debug('changedBarAgain', newVal, oldVal);
        this.nbar_changed++;
        this.bar2_old = oldVal;
        console.debug('changedBarAgain', 'nbar_changed', this.nbar_changed, 'bar2_old', this.bar2_old);
    }

    @observe("baz")
    changedBaz = (newVal, oldVal) => {
        this.nbaz_changed++;
        this.baz_old = oldVal;
    }

    @observe("bar,foo")
    changedBarAndFoo(observedBar, observedFoo) {
        this.nbar_foo_changed++;
        this.observed_bar = observedBar;
        this.observed_foo = observedFoo;
    }

    @observe("user.manager")
    changedManager(newVal) {
        this.nmanager_changed++;
    }

    @lateProperty("blah")
    @observe("blah")
    changedBlah(newVal, oldVal) {
       this.nblah_changed++;
       this.blah_new_val = newVal;
       this.blah_old_val = oldVal;
    }
}


function lateProperty(propertyName: string) {
    return (target: polymer.Element, observerName: string) => {
        const decorator = property();
        decorator(target, propertyName);
    }
}

ObserverTest.register();


// Uncomment this to test for the proper exception when a observed property can't be found. It will hose the other tests.
/*
@component("observer-undefined-property-test")
@template("")
class ObserverNullPropertyTest extends polymer.Base {

    @observe(null)
    foo() {

    }
}

ObserverNullPropertyTest.register();
*/

class BehaviorBaseTest extends polymer.Base {
    hasfired: boolean;

    @listen("base-called")
    onBaseCalled() {
        this.hasfired = true;
    }

    methodInBase() {
        return "this method is defined in BehaviorBaseTest";
    }
}

var PojoBehaviour1 =
    {
        methodInPojo1: function () {
            return "pojo";
        }
    };

var PojoBehaviour2 =
    {
        methodInPojo2: function () {
            return "pojo";
        }
    };


@component("behavior-test1")
@template("")
@behavior(BehaviorBaseTest)
@behavior(PojoBehaviour1)
class BehaviorTest1 extends polymer.Base {
    @property() bar = "mybar";
    @property() hasfired = false;

    @behavior(PojoBehaviour2)

    attached() {
        this.fire("base-called");
    }

    methodInBase: () => string;

    methodInPojo1: () => string;
    methodInPojo2: () => string;

    methodInChild(): string {
        return this.methodInBase();
    }
}

BehaviorTest1.register();

@component("behavior-test2")
@template("")
class BehaviorTest2 extends polymer.Base {
    @property() bar = "mybar";
    @property() hasfired = false;

    @behavior(BehaviorBaseTest)

    attached() {
        this.fire("base-called");
    }

    methodInBase: () => void;

    methodInChild() {
        return this.methodInBase();
    }
}

BehaviorTest2.register();

// Uncomment this to test for the proper exception when a behavior can't be found. It will hose the other tests.
/*
@template("")
@component("missing-behavior-test")
@behavior(Polymer['PaperRippleBehavior'])
class MissingBehaviorTest extends polymer.Base {
    @property() bar = "mybar";


}

MissingBehaviorTest.register();
*/

@component("template-test")
@template("<div>this element is made from a template<div id='inner'>inner text</div></div>")
@style
(`
   :host { display: block; }
   div { color: red; }
   #inner { width: 50px; }
`)
class TemplateTest extends polymer.Base {
    @property() bar = "mybar";
}

TemplateTest.register();

@component("host-attributes-test")

@template("<div>testing host attributes</div>")

@hostAttributes({style: "color: red;"})

class HostAttributesTest extends polymer.Base {
    @property() bar = "mybar";
}

HostAttributesTest.register();


@component("base-element-test")
@template("")
class BaseElementTest extends polymer.Base {
    @property() prop = "mybar";

    attached() {
        this.prop = "A";
    }

    doSomething: () => string;

    doSomethingElse() {
        return "1";
    }
}

class DoSomethingClass {
    doSomething() {
        return "C";
    }
}

class ExtendedElementTestIntermediate extends BaseElementTest {
    doSomethingIntermediate() {
        return "2";
    }
}

@component("extended-element-test")
class ExtendedElementTest extends ExtendedElementTestIntermediate {
    @property() bar = "mybar";

    @property() pmix = "";
    @property() qmix = "";

    attached() {
        super.attached();
        this.prop += "B";
        this.pmix = this.doSomething();
        this.qmix = this.doSomethingElse() + this.doSomethingIntermediate();
    }
}

applyMixins(ExtendedElementTest, [DoSomethingClass]);

ExtendedElementTest.register();

function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        })
    });
}
