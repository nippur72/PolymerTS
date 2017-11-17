declare class MyAbstract extends polymer.Base {
    makeSomeNoise(): void;
}
declare class MyInline extends MyAbstract implements MyMixin {
    prop: string;
    marker: string;
    private myprivate;
    constructor(marker: string);
    created(): void;
    ready(): void;
    attached(): void;
    hiChanged(newVal: any, oldVal: any): void;
    noiseMade: () => void;
}
declare class MyMixin extends polymer.Base {
    properties?: Object;
    listeners?: Object;
    behaviors?: Object[];
    observers?: String[];
    prototype?: Object;
    noiseMade(): void;
}
