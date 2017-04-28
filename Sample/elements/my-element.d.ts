declare class MyBehaviour extends polymer.Base {
    onBehave(): void;
}
declare class MyElement extends polymer.Base {
    test: string;
    test1: string;
    dummy_property: any;
    propArray: number[];
    handleClick(): void;
    testChanged(newValue: any, oldValue: any): void;
    test_and_test1_Changed(newTest: any, newTest1: any): void;
    fullname(test: any): string;
}
