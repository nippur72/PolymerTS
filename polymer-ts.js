// PolymerTS - Polymer for TypeScript
//
// https://github.com/nippur72/PolymerTS
//
// Antonino Porcino, nino.porcino@gmail.com
var polymer;
(function (polymer) {
    // create an ES6 inheritable Polymer.Base object, referenced as "polymer.Base"
    function createEs6PolymerBase() {
        // create a placeholder class
        var pb = function () { };
        // make it available as polymer.Base
        window["polymer"]["Base"] = pb;
        // add a default create method()
        pb["create"] = function () {
            throw "element not yet registered in Polymer";
        };
        // add a default create method()
        pb["register"] = function (dontRegister) {
            if (dontRegister === true)
                polymer.createClass(this);
            else
                polymer.createElement(this);
        };
    }
    polymer.createEs6PolymerBase = createEs6PolymerBase;
    function prepareForRegistration(elementClass) {
        // copies members from inheritance chain to Polymer object
        function copyMembers(dest, source) {
            if (source === undefined || source === null)
                return;
            Object.keys(source).map(function (member) {
                // copy only if has not been defined
                if (!dest.hasOwnProperty(member))
                    dest[member] = source[member];
            });
            copyMembers(dest, source.__proto__);
        }
        // backward compatibility with TypeScript 1.4 (no decorators)
        if (elementClass.prototype.is === undefined) {
            var proto = elementClass.prototype;
            var instance = new elementClass();
            if (!instance.is) {
                throw new Error("no name for " + elementClass);
            }
            proto.is = instance.is;
            if (instance.extends) {
                proto.extends = instance.extends;
            }
            if (instance.properties) {
                proto.properties = instance.properties;
            }
            if (instance.listeners) {
                proto.listeners = instance.listeners;
            }
            if (instance.observers) {
                proto.observers = instance.observers;
            }
            if (instance.behaviors) {
                proto.behaviors = instance.behaviors;
            }
            if (instance.hostAttributes) {
                proto.hostAttributes = instance.hostAttributes;
            }
            if (instance.style) {
                proto.style = instance.style;
            }
            if (instance.template) {
                proto.template = instance.template;
            }
        }
        var preparedElement = elementClass.prototype;
        // artificial constructor: call constructor() and copies members
        preparedElement["$custom_cons"] = function () {
            // reads arguments coming from factoryImpl
            var args = this.$custom_cons_args;
            // applies class constructor on the polymer element (this)
            elementClass.apply(this, args);
        };
        // arguments for artifical constructor
        preparedElement["$custom_cons_args"] = [];
        // modify "factoryImpl"
        if (preparedElement["factoryImpl"] !== undefined) {
            throw "do not use factoryImpl() use constructor() instead";
        }
        else {
            preparedElement["factoryImpl"] = function () {
                this.$custom_cons_args = arguments;
            };
        }
        // modify "attached" event function
        var attachToFunction = "attached";
        var oldFunction = preparedElement[attachToFunction];
        preparedElement[attachToFunction] = function () {
            this.$custom_cons();
            if (oldFunction !== undefined)
                oldFunction.apply(this);
        };
        // copy inherited class members
        copyMembers(preparedElement, elementClass.prototype.__proto__);
        return preparedElement;
    }
    polymer.prepareForRegistration = prepareForRegistration;
    /*
    // see https://github.com/Polymer/polymer/issues/2114
    export function createDomModule(definition: polymer.Element) {
       var domModule: any = document.createElement('dom-module');
 
       var proto = <any> definition.prototype;
 
       domModule.id = proto.is;
 
       // attaches style
       if (proto.style !== undefined) {
          var elemStyle = (<any> document).createElement('style', 'custom-style');
          domModule.appendChild(elemStyle);
          elemStyle.textContent = proto.style;
       }
 
       // attaches template
       if (proto.template !== undefined) {
          var elemTemplate = document.createElement('template');
          domModule.appendChild(elemTemplate);
          elemTemplate.innerHTML = proto.template;
       }
 
       // tells polymer the element has been created
       domModule.createdCallback();
    }
    */
    // a version that works in IE11 too
    function createDomModule(definition) {
        var domModule = document.createElement('dom-module');
        var proto = definition.prototype;
        domModule.id = proto.is;
        var html = "";
        if (proto.style !== undefined)
            html += "<style>" + proto.style + "</style>";
        if (proto.template !== undefined)
            html += "<template>" + proto.template + "</template>";
        domModule.innerHTML = html;
        domModule.createdCallback();
    }
    polymer.createDomModule = createDomModule;
    /*
    // temporary version until https://github.com/Polymer/polymer/issues/2114 is fixed
    export function createDomModule(definition: polymer.Element) {
       var contentDoc = document.implementation.createHTMLDocument('template');
 
       var domModule: any = document.createElement('dom-module');
 
       var proto = <any> definition.prototype;
 
       domModule.id = proto.is;
 
       // attaches style
       if (proto.style !== undefined) {
          var elemStyle = (<any> document).createElement('style', 'custom-style');
          domModule.appendChild(elemStyle);
          elemStyle.textContent = proto.style;
       }
 
       // attaches template
       if (proto.template !== undefined) {
          var elemTemplate = document.createElement('template');
          domModule.appendChild(elemTemplate);
          contentDoc.body.innerHTML = proto.template;
          while (contentDoc.body.firstChild) {
            (<any>elemTemplate).content.appendChild(contentDoc.body.firstChild);
          }
       }
 
       // tells polymer the element has been created
       domModule.createdCallback();
    }
    */
    function createElement(element) {
        if (polymer.isRegistered(element)) {
            throw "element already registered in Polymer";
        }
        if ((element.prototype).template !== undefined || (element.prototype).style !== undefined) {
            polymer.createDomModule(element);
        }
        // register element and make available its constructor as "create()"
        var maker = Polymer(polymer.prepareForRegistration(element));
        element["create"] = function () {
            var newOb = Object.create(maker.prototype);
            return maker.apply(newOb, arguments);
        };
        return maker;
    }
    polymer.createElement = createElement;
    function createClass(element) {
        if (polymer.isRegistered(element)) {
            throw "element already registered in Polymer";
        }
        if ((element.prototype).template !== undefined || (element.prototype).style !== undefined) {
            polymer.createDomModule(element);
        }
        // register element and make available its constructor as "create()"
        var maker = Polymer.Class(polymer.prepareForRegistration(element));
        element["create"] = function () {
            var newOb = Object.create(maker.prototype);
            return maker.apply(newOb, arguments);
        };
        return maker;
    }
    polymer.createClass = createClass;
    function isRegistered(element) {
        return (element.prototype).$custom_cons !== undefined;
    }
    polymer.isRegistered = isRegistered;
})(polymer || (polymer = {})); // end module
// modifies Polymer.Base and makes it available as an ES6 class named polymer.Base
polymer.createEs6PolymerBase();
// @component decorator
function component(tagname, extendsTag) {
    return function (target) {
        target.prototype["is"] = tagname;
        if (extendsTag !== undefined) {
            target.prototype["extends"] = extendsTag;
        }
    };
}
// @extend decorator
function extend(tagname) {
    return function (target) {
        target.prototype["extends"] = tagname;
    };
}
// @template decorator
function template(templateString) {
    return function (target) {
        target.prototype["template"] = templateString;
    };
}
// @style decorator
function style(styleString) {
    return function (target) {
        target.prototype["style"] = styleString;
    };
}
// @hostAttributes decorator
function hostAttributes(attributes) {
    return function (target) {
        target.prototype["hostAttributes"] = attributes;
    };
}
// @property decorator with automatic name for computed props
function property(ob) {
    return function (target, propertyKey) {
        target.properties = target.properties || {};
        if (typeof (target[propertyKey]) === "function") {
            // property is function, treat it as a computed property
            var params = ob["computed"];
            var getterName = "get_computed_" + propertyKey;
            ob["computed"] = getterName + "(" + params + ")";
            target.properties[propertyKey] = ob;
            target[getterName] = target[propertyKey];
        }
        else {
            // normal property
            target.properties[propertyKey] = ob || {};
        }
    };
}
// @computed decorator
function computed(ob) {
    return function (target, computedFuncName) {
        target.properties = target.properties || {};
        var propOb = ob || {};
        var getterName = "get_computed_" + computedFuncName;
        var funcText = target[computedFuncName].toString();
        var start = funcText.indexOf("(");
        var end = funcText.indexOf(")");
        var propertiesList = funcText.substring(start + 1, end);
        propOb["computed"] = getterName + "(" + propertiesList + ")";
        target.properties[computedFuncName] = propOb;
        target[getterName] = target[computedFuncName];
    };
}
// @listen decorator
function listen(eventName) {
    return function (target, propertyKey) {
        target.listeners = target.listeners || {};
        target.listeners[eventName] = propertyKey;
    };
}
// @behavior decorator
function behavior(behaviorObject) {
    return function (target) {
        if (typeof (target) === "function") {
            // decorator applied externally, target is the class object
            target.prototype["behaviors"] = target.prototype["behaviors"] || [];
            var beObject = behaviorObject.prototype === undefined ? behaviorObject : behaviorObject.prototype;
            target.prototype["behaviors"].push(beObject);
        }
        else {
            // decorator applied internally, target is class.prototype
            target.behaviors = target.behaviors || [];
            var beObject = behaviorObject.prototype === undefined ? behaviorObject : behaviorObject.prototype;
            target.behaviors.push(beObject);
        }
    };
}
// @observe decorator
function observe(observedProps) {
    if (observedProps.indexOf(",") > 0 || observedProps.indexOf(".") > 0) {
        // observing multiple properties or path
        return function (target, observerFuncName) {
            target.observers = target.observers || [];
            target.observers.push(observerFuncName + "(" + observedProps + ")");
        };
    }
    else {
        // observing single property
        return function (target, observerName) {
            target.properties = target.properties || {};
            target.properties[observedProps] = target.properties[observedProps] || {};
            target.properties[observedProps].observer = observerName;
        };
    }
}
//# sourceMappingURL=polymer-ts.js.map