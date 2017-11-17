declare class ComputedPropertiesTest extends polymer.Base {
    first: number;
    second: number;
    computed1(first: any, second: any): any;
    computed2: number;
    getcomputed2(): number;
}
declare class CustomConstructorTest extends polymer.Base {
    bar: string;
    constructor(foo: string);
}
declare class PropertyInitializationTest extends polymer.Base {
    bar: string;
    foo: string;
    war: any;
    constructorProp: any;
    allValuesSet: boolean;
    readOnlyUndefined: boolean;
    readOnlyInitialized: boolean;
    constructor();
}
declare class DoubleInitializationTest extends polymer.Base {
    bar: string;
    foo: string;
    war: any;
    constructor();
}
declare class UnInitializedTest extends polymer.Base {
    bar: string;
}
declare class NoFactoryImplTest extends polymer.Base {
    factoryImpl(): any;
}
declare class ListenerTest extends polymer.Base {
    bar: string;
    constructor();
    changeBarEvent(): void;
}
declare class ObserverTest extends polymer.Base {
    bar: string;
    bar_old: any;
    bar2_old: any;
    observed_bar: any;
    nbar_changed: number;
    foo: string;
    observed_foo: any;
    nbar_foo_changed: number;
    baz: any;
    baz_old: any;
    nbaz_changed: number;
    nmanager_changed: number;
    blah: string;
    blah_new_val: any;
    blah_old_val: any;
    nblah_changed: number;
    user: {
        manager: string;
    };
    rawProperty: string;
    changedBar(newVal: any, oldVal: any): void;
    changedBarAgain(newVal: any, oldVal: any): void;
    changedBaz: (newVal: any, oldVal: any) => void;
    changedBarAndFoo(observedBar: any, observedFoo: any): void;
    changedManager(newVal: any): void;
    changedBlah(newVal: any, oldVal: any): void;
}
declare function lateProperty(propertyName: string): (target: polymer.Element, observerName: string) => void;
declare class BehaviorBaseTest extends polymer.Base {
    hasfired: boolean;
    onBaseCalled(): void;
    methodInBase(): string;
}
declare var PojoBehaviour1: {
    methodInPojo1: () => string;
};
declare var PojoBehaviour2: {
    methodInPojo2: () => string;
};
declare class BehaviorTest1 extends polymer.Base {
    bar: string;
    hasfired: boolean;
    attached(): void;
    methodInBase: () => string;
    methodInPojo1: () => string;
    methodInPojo2: () => string;
    methodInChild(): string;
}
declare class BehaviorTest2 extends polymer.Base {
    bar: string;
    hasfired: boolean;
    attached(): void;
    methodInBase: () => void;
    methodInChild(): void;
}
declare class TemplateTest extends polymer.Base {
    bar: string;
}
declare class HostAttributesTest extends polymer.Base {
    bar: string;
}
declare class BaseElementTest extends polymer.Base {
    prop: string;
    attached(): void;
    doSomething: () => string;
    doSomethingElse(): string;
}
declare class DoSomethingClass {
    doSomething(): string;
}
declare class ExtendedElementTestIntermediate extends BaseElementTest {
    doSomethingIntermediate(): string;
}
declare class ExtendedElementTest extends ExtendedElementTestIntermediate {
    bar: string;
    pmix: string;
    qmix: string;
    attached(): void;
}
declare function applyMixins(derivedCtor: any, baseCtors: any[]): void;
