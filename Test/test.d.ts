/// <reference path="typings/jasmine/jasmine.d.ts" />
/// <reference path="bower_components/polymer-ts/polymer-ts.d.ts" />
declare var polymerReady: boolean;
declare var startJasmine: (ev: Event) => any;
declare function waitFor(F: any): void;
declare function querySelector(s: any): Element;
declare function implements(instance: Object, classFunction: Function): boolean;
declare function RunSpecs(): void;
