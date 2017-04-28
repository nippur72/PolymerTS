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
    foo: string;
    baz: string;
    nbar_changed: number;
    nbaz_changed: number;
    nbar_foo_changed: number;
    nmanager_changed: number;
    user: {
        manager: string;
    };
    changedBar(): void;
    changedBaz: (newVal: any, OldVal: any) => void;
    changedBarAndFoo(): void;
    changedManager(newVal: any): void;
}
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
    methodInBase: () => void;
    methodInPojo1: () => string;
    methodInPojo2: () => string;
    methodInChild(): void;
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
