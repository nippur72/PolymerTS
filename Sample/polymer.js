
(function() {

  // Ensure that the `unresolved` attribute added by the WebComponents polyfills
  // is removed. This is done as a convenience so users don't have to remember
  // to do so themselves. This attribute provides FOUC prevention when
  // native Custom Elements is not available.

  function resolve() {
    document.body.removeAttribute('unresolved');
  }

  if (window.WebComponents) {
    addEventListener('WebComponentsReady', resolve);
  } else {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      resolve();
    } else {
      addEventListener('DOMContentLoaded', resolve);
    }
  }

})();

  Polymer = {
    Settings: (function() {
      // NOTE: Users must currently opt into using ShadowDOM. They do so by doing:
      // Polymer = {dom: 'shadow'};
      // TODO(sorvell): Decide if this should be auto-use when available.
      // TODO(sorvell): if SD is auto-use, then the flag above should be something
      // like: Polymer = {dom: 'shady'}
      
      // via Polymer object
      var user = window.Polymer || {};

      // via url
      location.search.slice(1).split('&').forEach(function(o) {
        o = o.split('=');
        o[0] && (user[o[0]] = o[1] || true);
      });

      var wantShadow = (user.dom === 'shadow');
      var hasShadow = Boolean(Element.prototype.createShadowRoot);
      var nativeShadow = hasShadow && !window.ShadowDOMPolyfill;
      var useShadow = wantShadow && hasShadow;

      var hasNativeImports = Boolean('import' in document.createElement('link'));
      var useNativeImports = hasNativeImports;

      var useNativeCustomElements = (!window.CustomElements ||
        window.CustomElements.useNative);

      return {
        wantShadow: wantShadow,
        hasShadow: hasShadow,
        nativeShadow: nativeShadow,
        useShadow: useShadow,
        useNativeShadow: useShadow && nativeShadow,
        useNativeImports: useNativeImports,
        useNativeCustomElements: useNativeCustomElements
      };
    })()
  };



  (function() {

    // until ES6 modules become standard, we follow Occam and simply stake out
    // a global namespace

    // Polymer is a Function, but of course this is also an Object, so we
    // hang various other objects off of Polymer.*

    var userPolymer = window.Polymer;

    window.Polymer = function(prototype) {
      var ctor = desugar(prototype);
      // Polymer.Base is now chained to ctor.prototype, and for IE10 compat
      // this may have resulted in a new prototype being created
      prototype = ctor.prototype;
      // native Custom Elements treats 'undefined' extends property
      // as valued, the property must not exist to be ignored
      var options = {
        prototype: prototype
      };
      if (prototype.extends) {
        options.extends = prototype.extends;
      }
      Polymer.telemetry._registrate(prototype);
      document.registerElement(prototype.is, options);
      return ctor;
    };

    var desugar = function(prototype) {
      // Note: need to chain user prorotype with the correct type-extended
      // version of Polymer.Base; this is especially important when you can't
      // prototype swizzle (e.g. IE10), since CustomElemets uses getPrototypeOf
      var base = Polymer.Base;
      if (prototype.extends) {
        base = Polymer.Base._getExtendedPrototype(prototype.extends);
      }
      prototype = Polymer.Base.chainObject(prototype, base);
      prototype.registerCallback();
      return prototype.constructor;
    };

    window.Polymer = Polymer;

    if (userPolymer) {
      for (var i in userPolymer) {
        Polymer[i] = userPolymer[i];
      }
    }

    Polymer.Class = desugar;

  })();

  /*
  // Raw usage
  [ctor =] Polymer.Class(prototype);
  document.registerElement(name, ctor);

  // Simplified usage
  [ctor = ] Polymer(prototype);
  */

  // telemetry: statistics, logging, and debug

  Polymer.telemetry = {
    registrations: [],
    _regLog: function(prototype) {
      console.log('[' + prototype.is + ']: registered')
    },
    _registrate: function(prototype) {
      this.registrations.push(prototype);
      Polymer.log && this._regLog(prototype);
    },
    dumpRegistrations: function() {
      this.registrations.forEach(this._regLog);
    }
  };


  // a tiny bit of sugar for `document.currentScript.ownerDocument`
  Object.defineProperty(window, 'currentImport', {
    enumerable: true,
    configurable: true,
    get: function() {
      return (document._currentScript || document.currentScript).ownerDocument;
    }
  });


  Polymer.Base = {

    // Used for `isInstance` type checking; cannot use `instanceof` because
    // there is no common Polymer.Base in the prototype chain between type
    // extensions and normal custom elements
    __isPolymerInstance__: true,

    // pluggable features
    // `this` context is a prototype, not an instance
    _addFeature: function(feature) {
      this.extend(this, feature);
    },

    // `this` context is a prototype, not an instance
    registerCallback: function() {
      this._registerFeatures();  // abstract
      this._doBehavior('registered'); // abstract
    },

    createdCallback: function() {
      Polymer.telemetry.instanceCount++;
      this.root = this;
      this._doBehavior('created'); // abstract
      this._initFeatures(); // abstract
    },

    // reserved for canonical behavior
    attachedCallback: function() {
      this.isAttached = true;
      this._doBehavior('attached'); // abstract
    },

    // reserved for canonical behavior
    detachedCallback: function() {
      this.isAttached = false;
      this._doBehavior('detached'); // abstract
    },

    // reserved for canonical behavior
    attributeChangedCallback: function(name) {
      this._setAttributeToProperty(this, name); // abstract
      this._doBehavior('attributeChanged', arguments); // abstract
    },

    /**
     * Copies own properties (including accessor descriptors) from a source
     * object to a target object.
     *
     * @method extend
     * @param {Object} prototype Target object to copy properties to.
     * @param {Object} api Source object to copy properties from.
     * @return {Object} prototype object that was passed as first argument.
     */
    extend: function(prototype, api) {
      if (prototype && api) {
        Object.getOwnPropertyNames(api).forEach(function(n) {
          this.copyOwnProperty(n, api, prototype);
        }, this);
      }
      return prototype || api;
    },

    /**
     * Copies props from a source object to a target object.
     *
     * Note, this method uses a simple `for...in` strategy for enumerating
     * properties.  To ensure only `ownProperties` are copied from source
     * to target and that accessor implementations are copied, use `extend`.
     *
     * @method mixin
     * @param {Object} target Target object to copy properties to.
     * @param {Object} source Source object to copy properties from.
     * @return {Object} Target object that was passed as first argument.
     */
    mixin: function(target, source) {
      for (var i in source) {
        target[i] = source[i];
      }
      return target;
    },

    copyOwnProperty: function(name, source, target) {
      var pd = Object.getOwnPropertyDescriptor(source, name);
      if (pd) {
        Object.defineProperty(target, name, pd);
      }
    },

    _log: console.log.apply.bind(console.log, console),
    _warn: console.warn.apply.bind(console.warn, console),
    _error: console.error.apply.bind(console.error, console),
    _logf: function(/* args*/) {
      return this._logPrefix.concat([this.is]).concat(Array.prototype.slice.call(arguments, 0));
    }

  };

  Polymer.Base._logPrefix = (function(){
    var color = window.chrome || (/firefox/i.test(navigator.userAgent));
    return color ? ['%c[%s::%s]:', 'font-weight: bold; background-color:#EEEE00;'] : ['[%s::%s]:'];
  })();

  Polymer.Base.chainObject = function(object, inherited) {
    if (object && inherited && object !== inherited) {
      if (!Object.__proto__) {
        object = Polymer.Base.extend(Object.create(inherited), object);
      }
      object.__proto__ = inherited;
    }
    return object;
  };

  Polymer.Base = Polymer.Base.chainObject(Polymer.Base, HTMLElement.prototype);

  if (window.CustomElements) {
    Polymer.instanceof = CustomElements.instanceof;
  } else {
    Polymer.instanceof = function(obj, ctor) {
      return obj instanceof ctor;
    };
  }

  Polymer.isInstance = function(obj) {
    return Boolean(obj && obj.__isPolymerInstance__);
  };

  // TODO(sjmiles): ad hoc telemetry
  Polymer.telemetry.instanceCount = 0;


(function() {

  var modules = {};

  var DomModule = function() {
    return document.createElement('dom-module');
  };

  DomModule.prototype = Object.create(HTMLElement.prototype);

  DomModule.prototype.constructor = DomModule;

  DomModule.prototype.createdCallback = function() {
    var id = this.id || this.getAttribute('name') || this.getAttribute('is');
    if (id) {
      this.id = id;
      modules[id] = this;
    }
  };

  DomModule.prototype.import = function(id, slctr) {
    var m = modules[id];
    if (!m) {
      // If polyfilling, a script can run before a dom-module element
      // is upgraded. We force the containing document to upgrade
      // and try again to workaround this polyfill limitation.
      forceDocumentUpgrade();
      m = modules[id];
    }
    if (m && slctr) {
      m = m.querySelector(slctr);
    }
    return m;
  };

  // NOTE: HTMLImports polyfill does not
  // block scripts on upgrading elements. However, we want to ensure that
  // any dom-module in the tree is available prior to a subsequent script
  // processing.
  // Therefore, we force any dom-modules in the tree to upgrade when dom-module
  // is registered by temporarily setting CE polyfill to crawl the entire
  // imports tree. (Note: this should only upgrade any imports that have been
  // loaded by this point. In addition the HTMLImports polyfill should be
  // changed to upgrade elements prior to running any scripts.)
  var cePolyfill = window.CustomElements && !CustomElements.useNative;
  if (cePolyfill) {
    var ready = CustomElements.ready;
    CustomElements.ready = true;
  }
  document.registerElement('dom-module', DomModule);
  if (cePolyfill) {
    CustomElements.ready = ready;
  }

  function forceDocumentUpgrade() {
    if (cePolyfill) {
      var script = document._currentScript || document.currentScript;
      if (script) {
        CustomElements.upgradeAll(script.ownerDocument);
      }
    }
  }

})();



  Polymer.Base._addFeature({

    _prepIs: function() {
      if (!this.is) {
        var module =
          (document._currentScript || document.currentScript).parentNode;
        if (module.localName === 'dom-module') {
          var id = module.id || module.getAttribute('name')
            || module.getAttribute('is')
          this.is = id;
        }
      }
    }

  });


  /**
   * Automatically extend using objects referenced in `behaviors` array.
   *
   *     someBehaviorObject = {
   *       accessors: {
   *        value: {type: Number, observer: '_numberChanged'}
   *       },
   *       observers: [
   *         // ...
   *       ],
   *       ready: function() {
   *         // called before prototoype's ready
   *       },
   *       _numberChanged: function() {}
   *     };
   *
   *     Polymer({
   *
   *       behaviors: [
   *         someBehaviorObject
   *       ]
   *
   *       ...
   *
   *     });
   *
   * @class base feature: behaviors
   */

  Polymer.Base._addFeature({

    /**
     * Array of objects to extend this prototype with.
     *
     * Each entry in the array may specify either a behavior object or array
     * of behaviors.
     *
     * Each behavior object may define lifecycle callbacks, `properties`,
     * `hostAttributes`, `observers` and `listeners`.
     *
     * Lifecycle callbacks will be called for each behavior in the order given
     * in the `behaviors` array, followed by the callback on the prototype.
     * Additionally, any non-lifecycle functions on the behavior object are
     * mixed into the base prototype, such that same-named functions on the
     * prototype take precedence, followed by later behaviors over earlier
     * behaviors.
     */
    behaviors: [],

    _prepBehaviors: function() {
      if (this.behaviors.length) {
        this.behaviors = this._flattenBehaviorsList(this.behaviors);
      }
      this._prepAllBehaviors(this.behaviors);
    },

    _flattenBehaviorsList: function(behaviors) {
      var flat = [];
      behaviors.forEach(function(b) {
        if (b instanceof Array) {
          flat = flat.concat(this._flattenBehaviorsList(b));
        }
        // filter out null entries so other iterators don't need to check
        else if (b) {
          flat.push(b);
        } else {
          this._warn(this._logf('_flattenBehaviorsList', 'behavior is null, check for missing or 404 import'));
        }
      }, this);
      return flat;
    },

    _prepAllBehaviors: function(behaviors) {
      // traverse the behaviors in _reverse_ order (youngest first) because
      // `_mixinBehavior` has _first property wins_ behavior, this is done
      // to optimize # of calls to `_copyOwnProperty`
      for (var i=behaviors.length-1; i>=0; i--) {
        this._mixinBehavior(behaviors[i]);
      }
      // we iterate a second time so that `_prepBehavior` goes in natural order
      // otherwise, it's a tricky detail for implementors of `_prepBehavior`
      for (var i=0, l=behaviors.length; i<l; i++) {
        this._prepBehavior(behaviors[i]);
      }
      // prep our prototype-as-behavior
      this._prepBehavior(this);
    },

    _mixinBehavior: function(b) {
       Object.getOwnPropertyNames(b).forEach(function(n) {
        switch (n) {
          case 'hostAttributes':
          case 'registered':
          case 'properties':
          case 'observers':
          case 'listeners':
          case 'created':
          case 'attached':
          case 'detached':
          case 'attributeChanged':
          case 'configure':
          case 'ready':
            break;
          default:
            if (!this.hasOwnProperty(n)) {
              this.copyOwnProperty(n, b, this);
            }
            break;
        }
      }, this);
    },

    _doBehavior: function(name, args) {
      this.behaviors.forEach(function(b) {
        this._invokeBehavior(b, name, args);
      }, this);
      this._invokeBehavior(this, name, args);
    },

    _invokeBehavior: function(b, name, args) {
      var fn = b[name];
      if (fn) {
        fn.apply(this, args || Polymer.nar);
      }
    },

    _marshalBehaviors: function() {
      this.behaviors.forEach(function(b) {
        this._marshalBehavior(b);
      }, this);
      this._marshalBehavior(this);
    }

  });


  /**
   * Support `extends` property (for type-extension only).
   *
   * If the mixin is String-valued, the corresponding Polymer module
   * is mixed in.
   *
   *     Polymer({
   *       is: 'pro-input',
   *       extends: 'input',
   *       ...
   *     });
   *
   * Type-extension objects are created using `is` notation in HTML, or via
   * the secondary argument to `document.createElement` (the type-extension
   * rules are part of the Custom Elements specification, not something
   * created by Polymer).
   *
   * Example:
   *
   *     <!-- right: creates a pro-input element -->
   *     <input is="pro-input">
   *
   *     <!-- wrong: creates an unknown element -->
   *     <pro-input>
   *
   *     
   *        // right: creates a pro-input element
   *        var elt = document.createElement('input', 'pro-input');
   *
   *        // wrong: creates an unknown element
   *        var elt = document.createElement('pro-input');
   *     <\script>
   *
   *   @class base feature: extends
   */

  Polymer.Base._addFeature({

    _getExtendedPrototype: function(tag) {
      return this._getExtendedNativePrototype(tag);
    },

    _nativePrototypes: {}, // static

    _getExtendedNativePrototype: function(tag) {
      var p = this._nativePrototypes[tag];
      if (!p) {
        var np = this.getNativePrototype(tag);
        p = this.extend(Object.create(np), Polymer.Base);
        this._nativePrototypes[tag] = p;
      }
      return p;
    },

    /**
     * Returns the native element prototype for the tag specified.
     *
     * @method getNativePrototype
     * @param {string} tag  HTML tag name.
     * @return {Object} Native prototype for specified tag.
    */
    getNativePrototype: function(tag) {
      // TODO(sjmiles): sad necessity
      return Object.getPrototypeOf(document.createElement(tag));
    }

  });


  /**
   * Generates a boilerplate constructor.
   * 
   *     XFoo = Polymer({
   *       is: 'x-foo'
   *     });
   *     ASSERT(new XFoo() instanceof XFoo);
   *  
   * You can supply a custom constructor on the prototype. But remember that 
   * this constructor will only run if invoked **manually**. Elements created
   * via `document.createElement` or from HTML _will not invoke this method_.
   * 
   * Instead, we reuse the concept of `constructor` for a factory method which 
   * can take arguments. 
   * 
   *     MyFoo = Polymer({
   *       is: 'my-foo',
   *       constructor: function(foo) {
   *         this.foo = foo;
   *       }
   *       ...
   *     });
   * 
   * @class base feature: constructor
   */

  Polymer.Base._addFeature({

    // registration-time

    _prepConstructor: function() {
      // support both possible `createElement` signatures
      this._factoryArgs = this.extends ? [this.extends, this.is] : [this.is];
      // thunk the constructor to delegate allocation to `createElement`
      var ctor = function() { 
        return this._factory(arguments); 
      };
      if (this.hasOwnProperty('extends')) {
        ctor.extends = this.extends; 
      }
      // ensure constructor is set. The `constructor` property is
      // not writable on Safari; note: Chrome requires the property
      // to be configurable.
      Object.defineProperty(this, 'constructor', {value: ctor, 
        writable: true, configurable: true});
      ctor.prototype = this;
    },

    _factory: function(args) {
      var elt = document.createElement.apply(document, this._factoryArgs);
      if (this.factoryImpl) {
        this.factoryImpl.apply(elt, args);
      }
      return elt;
    }

  });


  /**
   * Define property metadata.
   *
   *     properties: {
   *       <property>: <Type || Object>,
   *       ...
   *     }
   *
   * Example:
   *
   *     properties: {
   *       // `foo` property can be assigned via attribute, will be deserialized to
   *       // the specified data-type. All `properties` properties have this behavior.
   *       foo: String,
   *
   *       // `bar` property has additional behavior specifiers.
   *       //   type: as above, type for (de-)serialization
   *       //   notify: true to send a signal when a value is set to this property
   *       //   reflectToAttribute: true to serialize the property to an attribute
   *       //   readOnly: if true, the property has no setter
   *       bar: {
   *         type: Boolean,
   *         notify: true
   *       }
   *     }
   *
   * By itself the properties feature doesn't do anything but provide property
   * information. Other features use this information to control behavior.
   *
   * The `type` information is used by the `attributes` feature to convert
   * String values in attributes to typed properties. The `bind` feature uses
   * property information to control property access.
   *
   * Marking a property as `notify` causes a change in the property to
   * fire a non-bubbling event called `<property>-changed`. Elements that
   * have enabled two-way binding to the property use this event to
   * observe changes.
   *
   * `readOnly` properties have a getter, but no setter. To set a read-only
   * property, use the private setter method `_set_<property>(value)`.
   *
   * @class base feature: properties
   */

  // null object
  Polymer.nob = Object.create(null);

  Polymer.Base._addFeature({

    /*
     * Object containing property configuration data, where keys are property
     * names and values are descriptor objects that configure Polymer features
     * for the property.  Valid fields in the property descriptor object are
     * as follows:
     *
     * * `type` - used to determine how to deserialize attribute value strings
     *    to JS properties.  By convention, this field takes a JS constructor
     *    for the type, such as `String` or `Boolean`.
     * * `value` - default value for the property.  The value may either be a
     *    primitive value, or a function that returns a value (which should be
     *    used for initializing Objects and Arrays to avoid shared objects on
     *    instances).
     * * `notify` - when `true`, configures the property to fire a non-bubbling
     *    event called `<property>-changed` for each change to the property.
     *    Elements that have enabled two-way binding to the property use this
     *    event to observe changes.
     * * `readOnly` - when `true` configures the property to have a getter, but
     *    no setter. To set a read-only property, use the private setter method
     *    `_set_<property>(value)`.
     * * `reflectToAttribute` - when `true` configures the property value to
     *    be serialized to a string and reflected to the attribute each time
     *    it changes.  This can impact performance, so it should be used
     *    only when reflecting the attribute value is important.
     * * `observer` - indicates the name of a funciton that should be called
     *    each time the property changes. `e.g.: `observer: 'valueChanged'
     * * `computed` - configures the property to be computed by a computing
     *    function each time one or more dependent properties change.
     *    `e.g.: `computed: 'computeValue(prop1, prop2)'
     *
     * Note: a shorthand may be used for the object descriptor when only the
     * type needs to be specified by using the type as the descriptor directly.
     */
    properties: {
    },

    /**
     * Returns a property descriptor object for the property specified.
     *
     * This method allows introspecting the configuration of a Polymer element's
     * properties as configured in its `properties` object.  Note, this method
     * normalizes shorthand forms of the `properties` object into longhand form.
     *
     * @method getPropertyInfo
     * @param {string} property Name of property to introspect.
     * @return {Object} Property descriptor for specified property.
    */
    getPropertyInfo: function(property) {
      var info = this._getPropertyInfo(property, this.properties);
      if (!info) {
        this.behaviors.some(function(b) {
          return info = this._getPropertyInfo(property, b.properties);
        }, this);
      }
      return info || Polymer.nob;
    },

    _getPropertyInfo: function(property, properties) {
      var p = properties && properties[property];
      if (typeof(p) === 'function') {
        p = properties[property] = {
          type: p
        };
      }
      // Let users determine whether property was defined without null check
      if (p) {
        p.defined = true;
      }
      return p;
    }

  });


  Polymer.CaseMap = {

    _caseMap: {},

    dashToCamelCase: function(dash) {
      var mapped = Polymer.CaseMap._caseMap[dash];
      if (mapped) {
        return mapped;
      }
      // TODO(sjmiles): is rejection test actually helping perf?
      if (dash.indexOf('-') < 0) {
        return Polymer.CaseMap._caseMap[dash] = dash;
      }
      return Polymer.CaseMap._caseMap[dash] = dash.replace(/-([a-z])/g, 
        function(m) {
          return m[1].toUpperCase(); 
        }
      );
    },

    camelToDashCase: function(camel) {
      var mapped = Polymer.CaseMap._caseMap[camel];
      if (mapped) {
        return mapped;
      }
      return Polymer.CaseMap._caseMap[camel] = camel.replace(/([a-z][A-Z])/g, 
        function (g) { 
          return g[0] + '-' + g[1].toLowerCase() 
        }
      );
    }

  };


  /**
   * Support for `hostAttributes` property.
   *
   *     hostAttributes: {
   *       'aria-role': 'button',
   *       tabindex: 0
   *     }
   *
   * `hostAttributes` is an object containing attribute names as keys and static values
   * to set to attributes when the element is created.
   *
   * Support for mapping attributes to properties.
   *
   * Properties that are configured in `properties` with a type are mapped
   * to attributes.
   *
   * A value set in an attribute is deserialized into the specified
   * data-type and stored into the matching property.
   *
   * Example:
   *
   *     properties: {
   *       // values set to index attribute are converted to Number and propagated
   *       // to index property
   *       index: Number,
   *       // values set to label attribute are propagated to index property
   *       label: String
   *     }
   *
   * Types supported for deserialization:
   *
   * - Number
   * - Boolean
   * - String
   * - Object (JSON)
   * - Array (JSON)
   * - Date
   *
   * This feature implements `attributeChanged` to support automatic
   * propagation of attribute values at run-time. If you override
   * `attributeChanged` be sure to call this base class method
   * if you also want the standard behavior.
   *
   * @class base feature: attributes
   */

  Polymer.Base._addFeature({

    _prepAttributes: function() {
      this._aggregatedAttributes = {};
    },

    _addHostAttributes: function(attributes) {
      if (attributes) {
        this.mixin(this._aggregatedAttributes, attributes);
      }
    },

    _marshalHostAttributes: function() {
      this._applyAttributes(this, this._aggregatedAttributes);
    },

    /* apply attributes to node but avoid overriding existing values */
    _applyAttributes: function(node, attr$) {
      for (var n in attr$) {
        // NOTE: never allow 'class' to be set in hostAttributes
        // since shimming classes would make it work
        // inconsisently under native SD
        if (!this.hasAttribute(n) && (n !== 'class')) {
          this.serializeValueToAttribute(attr$[n], n, this);
        }
      }
    },

    _marshalAttributes: function() {
      this._takeAttributesToModel(this);
    },

    _takeAttributesToModel: function(model) {
      for (var i=0, l=this.attributes.length; i<l; i++) {
        this._setAttributeToProperty(model, this.attributes[i].name);
      }
    },

    _setAttributeToProperty: function(model, attrName) {
      // Don't deserialize back to property if currently reflecting
      if (!this._serializing) {
        var propName = Polymer.CaseMap.dashToCamelCase(attrName);
        var info = this.getPropertyInfo(propName);
        if (info.defined ||
          (this._propertyEffects && this._propertyEffects[propName])) {
          var val = this.getAttribute(attrName);
          model[propName] = this.deserialize(val, info.type);
        }
      }
    },

    _serializing: false,

    /**
     * Serializes a property to its associated attribute.
     *
     * Generally users should set `reflectToAttribute: true` in the
     * `properties` configuration to achieve automatic attribute reflection.
     *
     * @method reflectPropertyToAttribute
     * @param {string} name Property name to reflect.
     */
    reflectPropertyToAttribute: function(name) {
      this._serializing = true;
      this.serializeValueToAttribute(this[name],
        Polymer.CaseMap.camelToDashCase(name));
      this._serializing = false;
    },

    /**
     * Sets a typed value to an HTML attribute on a node.
     *
     * This method calls the `serialize` method to convert the typed
     * value to a string.  If the `serialize` method returns `undefined`,
     * the attribute will be removed (this is the default for boolean
     * type `false`).
     *
     * @method serializeValueToAttribute
     * @param {*} value Value to serialize.
     * @param {string} attribute Attribute name to serialize to.
     * @param {Element=} node Element to set attribute to (defaults to this).
     */
    serializeValueToAttribute: function(value, attribute, node) {
      var str = this.serialize(value);
      // TODO(kschaaf): Consider enabling under a flag
      // if (str && str.length > 250) {
      //   this._warn(this._logf('serializeValueToAttribute',
      //     'serializing long attribute values can lead to poor performance', this));
      // }
      (node || this)
        [str === undefined ? 'removeAttribute' : 'setAttribute']
          (attribute, str);
    },

    /**
     * Converts a string to a typed value.
     *
     * This method is called by Polymer when reading HTML attribute values to
     * JS properties.  Users may override this method on Polymer element
     * prototypes to provide deserialization for custom `type`s.  Note,
     * the `type` argument is the value of the `type` field provided in the
     * `properties` configuration object for a given property, and is
     * by convention the constructor for the type to deserialize.
     *
     * Note: The return value of `undefined` is used as a sentinel value to
     * indicate the attribute should be removed.
     *
     * @method deserialize
     * @param {string} value Attribute value to deserialize.
     * @param {*} type Type to deserialize the string to.
     * @return {*} Typed value deserialized from the provided string.
     */
    deserialize: function(value, type) {
      switch (type) {
        case Number:
          value = Number(value);
          break;

        case Boolean:
          value = (value !== null);
          break;

        case Object:
          try {
            value = JSON.parse(value);
          } catch(x) {
            // allow non-JSON literals like Strings and Numbers
          }
          break;

        case Array:
          try {
            value = JSON.parse(value);
          } catch(x) {
            value = null;
            console.warn('Polymer::Attributes: couldn`t decode Array as JSON');
          }
          break;

        case Date:
          value = new Date(value);
          break;

        case String:
        default:
          break;
      }
      return value;
    },

    /**
     * Converts a typed value to a string.
     *
     * This method is called by Polymer when setting JS property values to
     * HTML attributes.  Users may override this method on Polymer element
     * prototypes to provide serialization for custom types.
     *
     * @method serialize
     * @param {*} value Property value to serialize.
     * @return {string} String serialized from the provided property value.
     */
    serialize: function(value) {
      switch (typeof value) {
        case 'boolean':
          return value ? '' : undefined;

        case 'object':
          if (value instanceof Date) {
            return value;
          } else if (value) {
            try {
              return JSON.stringify(value);
            } catch(x) {
              return '';
            }
          }

        default:
          return value != null ? value : undefined;
      }
    }

  });


  Polymer.Base._addFeature({

    _setupDebouncers: function() {
      this._debouncers = {};
    },

    /**
     * Call `debounce` to collapse multiple requests for a named task into
     * one invocation which is made after the wait time has elapsed with
     * no new request.  If no wait time is given, the callback will be called
     * at microtask timing (guaranteed before paint).
     *
     *     debouncedClickAction: function(e) {
     *       // will not call `processClick` more than once per 100ms
     *       this.debounce('click', function() {
     *        this.processClick;
     *       }, 100);
     *     }
     *
     * @method debounce
     * @param {String} jobName String to indentify the debounce job.
     * @param {Function} callback Function that is called (with `this`
     *   context) when the wait time elapses.
     * @param {number} wait Optional wait time in milliseconds (ms) after the
     *   last signal that must elapse before invoking `callback`
     */
    debounce: function(jobName, callback, wait) {
      this._debouncers[jobName] = Polymer.Debounce.call(this,
        this._debouncers[jobName], callback, wait);
    },

    /**
     * Returns whether a named debouncer is active.
     *
     * @method isDebouncerActive
     * @param {String} jobName The name of the debouncer started with `debounce`
     * @return {boolean} Whether the debouncer is active (has not yet fired).
     */
    isDebouncerActive: function(jobName) {
      var debouncer = this._debouncers[jobName];
      return debouncer && debouncer.finish;
    },

    /**
     * Immediately calls the debouncer `callback` and inactivates it.
     *
     * @method flushDebouncer
     * @param {String} jobName The name of the debouncer started with `debounce`
     */
    flushDebouncer: function(jobName) {
      var debouncer = this._debouncers[jobName];
      if (debouncer) {
        debouncer.complete();
      }
    },

    /**
     * Cancels an active debouncer.  The `callback` will not be called.
     *
     * @method cancelDebouncer
     * @param {String} jobName The name of the debouncer started with `debounce`
     */
    cancelDebouncer: function(jobName) {
      var debouncer = this._debouncers[jobName];
      if (debouncer) {
        debouncer.stop();
      }
    }

  });

  Polymer.version = 'master';

  Polymer.Base._addFeature({

    _registerFeatures: function() {
      // identity
      this._prepIs();
      // attributes
      this._prepAttributes();
      // shared behaviors
      this._prepBehaviors();
      // factory
      this._prepConstructor();
    },

    _prepBehavior: function(b) {
      this._addHostAttributes(b.hostAttributes);
    },

    _marshalBehavior: function(b) {
    },

    _initFeatures: function() {
      // install host attributes
      this._marshalHostAttributes();
      // setup debouncers
      this._setupDebouncers();
      // acquire behaviors
      this._marshalBehaviors();
    }

  });


  /**
   * Automatic template management.
   *
   * The `template` feature locates and instances a `<template>` element
   * corresponding to the current Polymer prototype.
   *
   * The `<template>` element may be immediately preceeding the script that
   * invokes `Polymer()`.
   *
   * @class standard feature: template
   */

  Polymer.Base._addFeature({

    _prepTemplate: function() {
      // locate template using dom-module
      this._template =
        this._template || Polymer.DomModule.import(this.is, 'template');
      // stick finger in footgun
      if (this._template && this._template.hasAttribute('is')) {
        this._warn(this._logf('_prepTemplate', 'top-level Polymer template ' +
          'must not be a type-extension, found', this._template,
          'Move inside simple <template>.'));
      }
    },

    _stampTemplate: function() {
      if (this._template) {
        // note: root is now a fragment which can be manipulated
        // while not attached to the element.
        this.root = this.instanceTemplate(this._template);
      }
    },

    /**
     * Calls `importNode` on the `content` of the `template` specified and
     * returns a document fragment containing the imported content.
     *
     * @method instanceTemplate
     * @param {HTMLTemplateElement} template HTML template element to instance.
     * @return {DocumentFragment} Document fragment containing the imported
     *   template content.
    */
    instanceTemplate: function(template) {
      var dom =
        document.importNode(template._content || template.content, true);
      return dom;
    }

  });



  /**
   * Provides `ready` lifecycle callback which is called parent to child.
   *
   * This can be useful in a number of cases. Here are some examples:
   *
   * Setting a default property value that should have a side effect: To ensure
   * the side effect, an element must set a default value no sooner than
   * `created`; however, since `created` flows child to host, this is before the
   * host has had a chance to set a property value on the child. The `ready`
   * method solves this problem since it's called host to child.
   *
   * Dom distribution: To support reprojection efficiently, it's important to
   * distribute from host to child in one shot. The `attachedCallback` mostly
   * goes in the desired order except for elements that are in dom to start; in
   * this case, all children are attached before the host element. Ready also
   * addresses this case since it's guaranteed to be called host to child.
   *
   * @class standard feature: ready
   */

(function() {

  var baseAttachedCallback = Polymer.Base.attachedCallback;

  Polymer.Base._addFeature({

    _hostStack: [],

    /**
     * Lifecycle callback invoked when all local DOM children of this element
     * have been created and "configured" with data bound from this element,
     * attribute values, or defaults.
     *
     * @method ready
     */
    ready: function() {
    },

    // NOTE: The concept of 'host' is overloaded. There are two different
    // notions:
    // 1. an element hosts the elements in its local dom root.
    // 2. an element hosts the elements on which it configures data.
    // Practially, these notions are almost always coincident.
    // Some special elements like templates may separate them.
    // In order not to over-emphaisize this technical difference, we expose
    // one concept to the user and it maps to the dom-related meaning of host.
    //
    // 1. set this element's `host` and push this element onto the `host`'s
    // list of `client` elements
    // 2. establish this element as the current hosting element (allows
    // any elements we stamp to easily set host to us).
    _pushHost: function(host) {
      // NOTE: The `dataHost` of an element never changes.
      this.dataHost = host = host ||
        Polymer.Base._hostStack[Polymer.Base._hostStack.length-1];
      // this.dataHost reflects the parent element who manages
      // any bindings for the element.  Only elements originally
      // stamped from Polymer templates have a dataHost, and this
      // never changes
      if (host && host._clients) {
        host._clients.push(this);
      }
      this._beginHost();
    },

    _beginHost: function() {
      Polymer.Base._hostStack.push(this);
      if (!this._clients) {
        this._clients = [];
      }
    },

    _popHost: function() {
      // this element is no longer the current hosting element
      Polymer.Base._hostStack.pop();
    },

    _tryReady: function() {
      if (this._canReady()) {
        this._ready();
      }
    },

    _canReady: function() {
      return !this.dataHost || this.dataHost._clientsReadied;
    },

    _ready: function() {
      // extension point
      this._beforeClientsReady();
      // prepare root
      this._setupRoot();
      this._readyClients();
      // extension point
      this._afterClientsReady();
      this._readySelf();
    },

    _readyClients: function() {
      // logically distribute self
      this._beginDistribute();
      // now fully prepare localChildren
      var c$ = this._clients;
      for (var i=0, l= c$.length, c; (i<l) && (c=c$[i]); i++) {
        c._ready();
      }
      // perform actual dom composition
      this._finishDistribute();
      // ensure elements are attached if they are in the dom at ready time
      // helps normalize attached ordering between native and polyfill ce.
      // TODO(sorvell): worth perf cost? ~6%
      // if (!Polymer.Settings.useNativeCustomElements) {
      //   CustomElements.takeRecords();
      // }
      this._clientsReadied = true;
      this._clients = null;
    },

    // mark readied and call `ready`
    // note: called localChildren -> host
    _readySelf: function() {
      this._doBehavior('ready');
      this._readied = true;
      if (this._attachedPending) {
        this._attachedPending = false;
        this.attachedCallback();
      }
    },

    // for system overriding
    _beforeClientsReady: function() {},
    _afterClientsReady: function() {},
    _beforeAttached: function() {},

    /**
     * Polymer library implementation of the Custom Elements `attachedCallback`.
     *
     * Note, users should not override `attachedCallback`, and instead should
     * implement the `attached` method on Polymer elements to receive
     * attached-time callbacks.
     *
     * @protected
     */
    attachedCallback: function() {
      if (this._readied) {
        this._beforeAttached();
        baseAttachedCallback.call(this);
      } else {
        this._attachedPending = true;
      }
    }

  });

})();


Polymer.ArraySplice = (function() {
  
  function newSplice(index, removed, addedCount) {
    return {
      index: index,
      removed: removed,
      addedCount: addedCount
    };
  }

  var EDIT_LEAVE = 0;
  var EDIT_UPDATE = 1;
  var EDIT_ADD = 2;
  var EDIT_DELETE = 3;

  function ArraySplice() {}

  ArraySplice.prototype = {

    // Note: This function is *based* on the computation of the Levenshtein
    // "edit" distance. The one change is that "updates" are treated as two
    // edits - not one. With Array splices, an update is really a delete
    // followed by an add. By retaining this, we optimize for "keeping" the
    // maximum array items in the original array. For example:
    //
    //   'xxxx123' -> '123yyyy'
    //
    // With 1-edit updates, the shortest path would be just to update all seven
    // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
    // leaves the substring '123' intact.
    calcEditDistances: function(current, currentStart, currentEnd,
                                old, oldStart, oldEnd) {
      // "Deletion" columns
      var rowCount = oldEnd - oldStart + 1;
      var columnCount = currentEnd - currentStart + 1;
      var distances = new Array(rowCount);

      // "Addition" rows. Initialize null column.
      for (var i = 0; i < rowCount; i++) {
        distances[i] = new Array(columnCount);
        distances[i][0] = i;
      }

      // Initialize null row
      for (var j = 0; j < columnCount; j++)
        distances[0][j] = j;

      for (var i = 1; i < rowCount; i++) {
        for (var j = 1; j < columnCount; j++) {
          if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
            distances[i][j] = distances[i - 1][j - 1];
          else {
            var north = distances[i - 1][j] + 1;
            var west = distances[i][j - 1] + 1;
            distances[i][j] = north < west ? north : west;
          }
        }
      }

      return distances;
    },

    // This starts at the final weight, and walks "backward" by finding
    // the minimum previous weight recursively until the origin of the weight
    // matrix.
    spliceOperationsFromEditDistances: function(distances) {
      var i = distances.length - 1;
      var j = distances[0].length - 1;
      var current = distances[i][j];
      var edits = [];
      while (i > 0 || j > 0) {
        if (i == 0) {
          edits.push(EDIT_ADD);
          j--;
          continue;
        }
        if (j == 0) {
          edits.push(EDIT_DELETE);
          i--;
          continue;
        }
        var northWest = distances[i - 1][j - 1];
        var west = distances[i - 1][j];
        var north = distances[i][j - 1];

        var min;
        if (west < north)
          min = west < northWest ? west : northWest;
        else
          min = north < northWest ? north : northWest;

        if (min == northWest) {
          if (northWest == current) {
            edits.push(EDIT_LEAVE);
          } else {
            edits.push(EDIT_UPDATE);
            current = northWest;
          }
          i--;
          j--;
        } else if (min == west) {
          edits.push(EDIT_DELETE);
          i--;
          current = west;
        } else {
          edits.push(EDIT_ADD);
          j--;
          current = north;
        }
      }

      edits.reverse();
      return edits;
    },

    /**
     * Splice Projection functions:
     *
     * A splice map is a representation of how a previous array of items
     * was transformed into a new array of items. Conceptually it is a list of
     * tuples of
     *
     *   <index, removed, addedCount>
     *
     * which are kept in ascending index order of. The tuple represents that at
     * the |index|, |removed| sequence of items were removed, and counting forward
     * from |index|, |addedCount| items were added.
     */

    /**
     * Lacking individual splice mutation information, the minimal set of
     * splices can be synthesized given the previous state and final state of an
     * array. The basic approach is to calculate the edit distance matrix and
     * choose the shortest path through it.
     *
     * Complexity: O(l * p)
     *   l: The length of the current array
     *   p: The length of the old array
     */
    calcSplices: function(current, currentStart, currentEnd,
                          old, oldStart, oldEnd) {
      var prefixCount = 0;
      var suffixCount = 0;

      var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
      if (currentStart == 0 && oldStart == 0)
        prefixCount = this.sharedPrefix(current, old, minLength);

      if (currentEnd == current.length && oldEnd == old.length)
        suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);

      currentStart += prefixCount;
      oldStart += prefixCount;
      currentEnd -= suffixCount;
      oldEnd -= suffixCount;

      if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
        return [];

      if (currentStart == currentEnd) {
        var splice = newSplice(currentStart, [], 0);
        while (oldStart < oldEnd)
          splice.removed.push(old[oldStart++]);

        return [ splice ];
      } else if (oldStart == oldEnd)
        return [ newSplice(currentStart, [], currentEnd - currentStart) ];

      var ops = this.spliceOperationsFromEditDistances(
          this.calcEditDistances(current, currentStart, currentEnd,
                                 old, oldStart, oldEnd));

      var splice = undefined;
      var splices = [];
      var index = currentStart;
      var oldIndex = oldStart;
      for (var i = 0; i < ops.length; i++) {
        switch(ops[i]) {
          case EDIT_LEAVE:
            if (splice) {
              splices.push(splice);
              splice = undefined;
            }

            index++;
            oldIndex++;
            break;
          case EDIT_UPDATE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
          case EDIT_ADD:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;
            break;
          case EDIT_DELETE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
        }
      }

      if (splice) {
        splices.push(splice);
      }
      return splices;
    },

    sharedPrefix: function(current, old, searchLength) {
      for (var i = 0; i < searchLength; i++)
        if (!this.equals(current[i], old[i]))
          return i;
      return searchLength;
    },

    sharedSuffix: function(current, old, searchLength) {
      var index1 = current.length;
      var index2 = old.length;
      var count = 0;
      while (count < searchLength && this.equals(current[--index1], old[--index2]))
        count++;

      return count;
    },

    calculateSplices: function(current, previous) {
      return this.calcSplices(current, 0, current.length, previous, 0,
                              previous.length);
    },

    equals: function(currentValue, previousValue) {
      return currentValue === previousValue;
    }
  };

  return new ArraySplice();

})();


  Polymer.EventApi = (function() {

    var Settings = Polymer.Settings;

    var EventApi = function(event) {
      this.event = event;
    };

    if (Settings.useShadow) {

      EventApi.prototype = {
        
        get rootTarget() {
          return this.event.path[0];
        },

        get localTarget() {
          return this.event.target;
        },

        get path() {
          return this.event.path;
        }

      };

    } else {

      EventApi.prototype = {
      
        get rootTarget() {
          return this.event.target;
        },

        get localTarget() {
          var current = this.event.currentTarget;
          var currentRoot = current && Polymer.dom(current).getOwnerRoot();
          var p$ = this.path;
          for (var i=0; i < p$.length; i++) {
            if (Polymer.dom(p$[i]).getOwnerRoot() === currentRoot) {
              return p$[i];
            }
          }
        },

        // TODO(sorvell): simulate event.path. This probably incorrect for
        // non-bubbling events.
        get path() {
          if (!this.event._path) {
            var path = [];
            var o = this.rootTarget;
            while (o) {
              path.push(o);
              o = Polymer.dom(o).parentNode || o.host;
            }
            // event path includes window in most recent native implementations
            path.push(window);
            this.event._path = path;
          }
          return this.event._path;
        }

      };

    }

    var factory = function(event) {
      if (!event.__eventApi) {
        event.__eventApi = new EventApi(event);
      }
      return event.__eventApi;
    };

    return {
      factory: factory
    };

  })();


Polymer.domInnerHTML = (function() {

  // Cribbed from ShadowDOM polyfill
  // https://github.com/webcomponents/webcomponentsjs/blob/master/src/ShadowDOM/wrappers/HTMLElement.js#L28
  /////////////////////////////////////////////////////////////////////////////
  // innerHTML and outerHTML

  // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-end.html#escapingString
  var escapeAttrRegExp = /[&\u00A0"]/g;
  var escapeDataRegExp = /[&\u00A0<>]/g;

  function escapeReplace(c) {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;'
      case '\u00A0':
        return '&nbsp;';
    }
  }

  function escapeAttr(s) {
    return s.replace(escapeAttrRegExp, escapeReplace);
  }

  function escapeData(s) {
    return s.replace(escapeDataRegExp, escapeReplace);
  }

  function makeSet(arr) {
    var set = {};
    for (var i = 0; i < arr.length; i++) {
      set[arr[i]] = true;
    }
    return set;
  }

  // http://www.whatwg.org/specs/web-apps/current-work/#void-elements
  var voidElements = makeSet([
    'area',
    'base',
    'br',
    'col',
    'command',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr'
  ]);

  var plaintextParents = makeSet([
    'style',
    'script',
    'xmp',
    'iframe',
    'noembed',
    'noframes',
    'plaintext',
    'noscript'
  ]);

  function getOuterHTML(node, parentNode, composed) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        //var tagName = node.tagName.toLowerCase();
        var tagName = node.localName;
        var s = '<' + tagName;
        var attrs = node.attributes;
        for (var i = 0, attr; attr = attrs[i]; i++) {
          s += ' ' + attr.name + '="' + escapeAttr(attr.value) + '"';
        }
        s += '>';
        if (voidElements[tagName]) {
          return s;
        }
        return s + getInnerHTML(node, composed) + '</' + tagName + '>';
      case Node.TEXT_NODE:
        var data = node.data;
        if (parentNode && plaintextParents[parentNode.localName]) {
          return data;
        }
        return escapeData(data);
      case Node.COMMENT_NODE:
        return '<!--' + node.data + '-->';
      default:
        console.error(node);
        throw new Error('not implemented');
    }
  }

  function getInnerHTML(node, composed) {
    if (node instanceof HTMLTemplateElement)
      node = node.content;
    var s = '';
    var c$ = Polymer.dom(node).childNodes;
    c$ = composed ? node._composedChildren : c$;
    for (var i=0, l=c$.length, child; (i<l) && (child=c$[i]); i++) {  
      s += getOuterHTML(child, node, composed);
    }
    return s;
  }

  return {
    getInnerHTML: getInnerHTML
  };

})();


  Polymer.DomApi = (function() {
    'use strict';

    var Settings = Polymer.Settings;
    var getInnerHTML = Polymer.domInnerHTML.getInnerHTML;

    var nativeInsertBefore = Element.prototype.insertBefore;
    var nativeRemoveChild = Element.prototype.removeChild;
    var nativeAppendChild = Element.prototype.appendChild;
    var nativeCloneNode = Element.prototype.cloneNode;
    var nativeImportNode = Document.prototype.importNode;

    var dirtyRoots = [];

    var DomApi = function(node) {
      this.node = node;
      if (this.patch) {
        this.patch();
      }
    };

    DomApi.prototype = {

      flush: function() {
        for (var i=0, host; i<dirtyRoots.length; i++) {
          host = dirtyRoots[i];
          host.flushDebouncer('_distribute');
        }
        dirtyRoots = [];
      },

      _lazyDistribute: function(host) {
        // note: only try to distribute if the root is not clean; this ensures
        // we don't distribute before initial distribution
        if (host.shadyRoot && host.shadyRoot._distributionClean) {
          host.shadyRoot._distributionClean = false;
          host.debounce('_distribute', host._distributeContent);
          dirtyRoots.push(host);
        }
      },

      // cases in which we may not be able to just do standard appendChild
      // 1. container has a shadyRoot (needsDistribution IFF the shadyRoot
      // has an insertion point)
      // 2. container is a shadyRoot (don't distribute, instead set
      // container to container.host.
      // 3. node is <content> (host of container needs distribution)
      appendChild: function(node) {
        var handled;
        this._removeNodeFromHost(node, true);
        if (this._nodeIsInLogicalTree(this.node)) {
          this._addLogicalInfo(node, this.node);
          this._addNodeToHost(node);
          handled = this._maybeDistribute(node, this.node);
        }
        // if not distributing and not adding to host, do a fast path addition
        if (!handled && !this._tryRemoveUndistributedNode(node)) {
          // if adding to a shadyRoot, add to host instead
          var container = this.node._isShadyRoot ? this.node.host : this.node;
          addToComposedParent(container, node);
          nativeAppendChild.call(container, node);
        }
        return node;
      },

      insertBefore: function(node, ref_node) {
        if (!ref_node) {
          return this.appendChild(node);
        }
        var handled;
        this._removeNodeFromHost(node, true);
        if (this._nodeIsInLogicalTree(this.node)) {
          saveLightChildrenIfNeeded(this.node);
          var children = this.childNodes;
          var index = children.indexOf(ref_node);
          if (index < 0) {
            throw Error('The ref_node to be inserted before is not a child ' +
              'of this node');
          }
          this._addLogicalInfo(node, this.node, index);
          this._addNodeToHost(node);
          handled = this._maybeDistribute(node, this.node);
        }
        // if not distributing and not adding to host, do a fast path addition
        if (!handled && !this._tryRemoveUndistributedNode(node)) {
          // if ref_node is <content> replace with first distributed node
          ref_node = ref_node.localName === CONTENT ?
            this._firstComposedNode(ref_node) : ref_node;
          // if adding to a shadyRoot, add to host instead
          var container = this.node._isShadyRoot ? this.node.host : this.node;
          addToComposedParent(container, node, ref_node);
          nativeInsertBefore.call(container, node, ref_node);
        }
        return node;
      },

      /**
        Removes the given `node` from the element's `lightChildren`.
        This method also performs dom composition.
      */
      removeChild: function(node) {
        if (factory(node).parentNode !== this.node) {
          console.warn('The node to be removed is not a child of this node',
            node);
        }
        var handled;
        if (this._nodeIsInLogicalTree(this.node)) {
          this._removeNodeFromHost(node);
          handled = this._maybeDistribute(node, this.node);
        }
        if (!handled) {
          // if removing from a shadyRoot, remove form host instead
          var container = this.node._isShadyRoot ? this.node.host : this.node;
          // not guaranteed to physically be in container; e.g.
          // undistributed nodes.
          if (container === node.parentNode) {
            removeFromComposedParent(container, node);
            nativeRemoveChild.call(container, node);
          }
        }
        return node;
      },

      replaceChild: function(node, ref_node) {
        this.insertBefore(node, ref_node);
        this.removeChild(ref_node);
        return node;
      },

      getOwnerRoot: function() {
        return this._ownerShadyRootForNode(this.node);
      },

      _ownerShadyRootForNode: function(node) {
        if (!node) {
          return;
        }
        if (node._ownerShadyRoot === undefined) {
          var root;
          if (node._isShadyRoot) {
            root = node;
          } else {
            var parent = Polymer.dom(node).parentNode;
            if (parent) {
              root = parent._isShadyRoot ? parent :
                this._ownerShadyRootForNode(parent);
            } else {
             root = null;
            }
          }
          node._ownerShadyRoot = root;
        }
        return node._ownerShadyRoot;
      },

      _maybeDistribute: function(node, parent) {
        // TODO(sorvell): technically we should check non-fragment nodes for
        // <content> children but since this case is assumed to be exceedingly
        // rare, we avoid the cost and will address with some specific api
        // when the need arises.  For now, the user must call
        // distributeContent(true), which updates insertion points manually
        // and forces distribution.
        var fragContent = (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) &&
          !node.__noContent && Polymer.dom(node).querySelector(CONTENT);
        var wrappedContent = fragContent &&
          (Polymer.dom(fragContent).parentNode.nodeType !==
          Node.DOCUMENT_FRAGMENT_NODE);
        var hasContent = fragContent || (node.localName === CONTENT);
        // There are 2 possible cases where a distribution may need to occur:
        // 1. <content> being inserted (the host of the shady root where
        //    content is inserted needs distribution)
        // 2. children being inserted into parent with a shady root (parent
        //    needs distribution)
        if (hasContent) {
          var root = this._ownerShadyRootForNode(parent);
          if (root) {
            var host = root.host;
            this._updateInsertionPoints(host);
            this._lazyDistribute(host);
          }
        }
        var parentNeedsDist = this._parentNeedsDistribution(parent);
        if (parentNeedsDist) {
          this._lazyDistribute(parent);
        }
        // Return true when distribution will fully handle the composition
        // Note that if a content was being inserted that was wrapped by a node,
        // and the parent does not need distribution, return false to allow
        // the nodes to be added directly, after which children may be
        // distributed and composed into the wrapping node(s)
        return parentNeedsDist || (hasContent && !wrappedContent);
      },

      _tryRemoveUndistributedNode: function(node) {
        if (this.node.shadyRoot) {
          if (node._composedParent) {
            nativeRemoveChild.call(node._composedParent, node);
          }
          return true;
        }
      },

      _updateInsertionPoints: function(host) {
        host.shadyRoot._insertionPoints =
          factory(host.shadyRoot).querySelectorAll(CONTENT);
      },

      // a node is in a shadyRoot, is a shadyRoot,
      // or has a lightParent
      _nodeIsInLogicalTree: function(node) {
        return Boolean((node._lightParent !== undefined) || node._isShadyRoot ||
          this._ownerShadyRootForNode(node) ||
          node.shadyRoot);
      },

      _parentNeedsDistribution: function(parent) {
        return parent && parent.shadyRoot && hasInsertionPoint(parent.shadyRoot);
      },

      // NOTE: if `ensureComposedRemoval` is true then the node should be
      // removed from its composed parent.
      _removeNodeFromHost: function(node, ensureComposedRemoval) {
        var hostNeedsDist;
        var root;
        var parent = node._lightParent;
        if (parent) {
          root = this._ownerShadyRootForNode(node);
          if (root) {
            root.host._elementRemove(node);
            hostNeedsDist = this._removeDistributedChildren(root, node);
          }
          this._removeLogicalInfo(node, node._lightParent);
        }
        this._removeOwnerShadyRoot(node);
        if (root && hostNeedsDist) {
          this._updateInsertionPoints(root.host);
          this._lazyDistribute(root.host);
        } else if (ensureComposedRemoval) {
          removeFromComposedParent(parent || node.parentNode, node);
        }
      },

      _removeDistributedChildren: function(root, container) {
        var hostNeedsDist;
        var ip$ = root._insertionPoints;
        for (var i=0; i<ip$.length; i++) {
          var content = ip$[i];
          if (this._contains(container, content)) {
            var dc$ = factory(content).getDistributedNodes();
            for (var j=0; j<dc$.length; j++) {
              hostNeedsDist = true;
              var node = dc$[j];
              var parent = node.parentNode;
              if (parent) {
                removeFromComposedParent(parent, node);
                nativeRemoveChild.call(parent, node);
              }
            }
          }
        }
        return hostNeedsDist;
      },

      _contains: function(container, node) {
        while (node) {
          if (node == container) {
            return true;
          }
          node = factory(node).parentNode;
        }
      },

      _addNodeToHost: function(node) {
        var checkNode = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ?
          node.firstChild : node;
        var root = this._ownerShadyRootForNode(checkNode);
        if (root) {
          root.host._elementAdd(node);
        }
      },

      _addLogicalInfo: function(node, container, index) {
        saveLightChildrenIfNeeded(container);
        var children = factory(container).childNodes;
        index = index === undefined ? children.length : index;
        // handle document fragments
        if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
          // NOTE: the act of setting this info can affect patched nodes
          // getters; therefore capture childNodes before patching.
          var c$ = Array.prototype.slice.call(node.childNodes);
          for (var i=0, n; (i<c$.length) && (n=c$[i]); i++) {
            children.splice(index++, 0, n);
            n._lightParent = container;
          }
        } else {
          children.splice(index, 0, node);
          node._lightParent = container;
        }
      },

      // NOTE: in general, we expect contents of the lists here to be small-ish
      // and therefore indexOf to be nbd. Other optimizations can be made
      // for larger lists (linked list)
      _removeLogicalInfo: function(node, container) {
        var children = factory(container).childNodes;
        var index = children.indexOf(node);
        if ((index < 0) || (container !== node._lightParent)) {
          throw Error('The node to be removed is not a child of this node');
        }
        children.splice(index, 1);
        node._lightParent = null;
      },

      _removeOwnerShadyRoot: function(node) {
        // optimization: only reset the tree if node is actually in a root
        var hasCachedRoot = factory(node).getOwnerRoot() !== undefined;
        if (hasCachedRoot) {
          var c$ = factory(node).childNodes;
          for (var i=0, l=c$.length, n; (i<l) && (n=c$[i]); i++) {
            this._removeOwnerShadyRoot(n);
          }
        }
        node._ownerShadyRoot = undefined;
      },

      // TODO(sorvell): This will fail if distribution that affects this
      // question is pending; this is expected to be exceedingly rare, but if
      // the issue comes up, we can force a flush in this case.
      _firstComposedNode: function(content) {
        var n$ = factory(content).getDistributedNodes();
        for (var i=0, l=n$.length, n, p$; (i<l) && (n=n$[i]); i++) {
          p$ = factory(n).getDestinationInsertionPoints();
          // means that we're composed to this spot.
          if (p$[p$.length-1] === content) {
            return n;
          }
        }
      },

      // TODO(sorvell): consider doing native QSA and filtering results.
      querySelector: function(selector) {
        return this.querySelectorAll(selector)[0];
      },

      querySelectorAll: function(selector) {
        return this._query(function(n) {
          return matchesSelector.call(n, selector);
        }, this.node);
      },

      _query: function(matcher, node) {
        node = node || this.node;
        var list = [];
        this._queryElements(factory(node).childNodes, matcher, list);
        return list;
      },

      _queryElements: function(elements, matcher, list) {
        for (var i=0, l=elements.length, c; (i<l) && (c=elements[i]); i++) {
          if (c.nodeType === Node.ELEMENT_NODE) {
            this._queryElement(c, matcher, list);
          }
        }
      },

      _queryElement: function(node, matcher, list) {
        if (matcher(node)) {
          list.push(node);
        }
        this._queryElements(factory(node).childNodes, matcher, list);
      },

      getDestinationInsertionPoints: function() {
        return this.node._destinationInsertionPoints || [];
      },

      getDistributedNodes: function() {
        return this.node._distributedNodes || [];
      },

      /*
        Returns a list of nodes distributed within this element. These can be
        dom children or elements distributed to children that are insertion
        points.
      */
      queryDistributedElements: function(selector) {
        var c$ = this.childNodes;
        var list = [];
        this._distributedFilter(selector, c$, list);
        for (var i=0, l=c$.length, c; (i<l) && (c=c$[i]); i++) {
          if (c.localName === CONTENT) {
            this._distributedFilter(selector, factory(c).getDistributedNodes(),
              list);
          }
        }
        return list;
      },

      _distributedFilter: function(selector, list, results) {
        results = results || [];
        for (var i=0, l=list.length, d; (i<l) && (d=list[i]); i++) {
          if ((d.nodeType === Node.ELEMENT_NODE) &&
            (d.localName !== CONTENT) &&
            matchesSelector.call(d, selector)) {
            results.push(d);
          }
        }
        return results;
      },

      _clear: function() {
        while (this.childNodes.length) {
          this.removeChild(this.childNodes[0]);
        }
      },

      setAttribute: function(name, value) {
        this.node.setAttribute(name, value);
        this._distributeParent();
      },

      removeAttribute: function(name) {
        this.node.removeAttribute(name);
        this._distributeParent();
      },

      _distributeParent: function() {
        if (this._parentNeedsDistribution(this.parentNode)) {
          this._lazyDistribute(this.parentNode);
        }
      },

      cloneNode: function(deep) {
        var n = nativeCloneNode.call(this.node, false);
        if (deep) {
          var c$ = this.childNodes;
          var d = factory(n);
          for (var i=0, nc; i < c$.length; i++) {
            nc = factory(c$[i]).cloneNode(true);
            d.appendChild(nc);
          }
        }
        return n;
      },

      importNode: function(externalNode, deep) {
        // for convenience use this node's ownerDoc if the node isn't a document
        var doc = this.node instanceof Document ? this.node :
          this.node.ownerDocument;
        var n = nativeImportNode.call(doc, externalNode, false);
        if (deep) {
          var c$ = factory(externalNode).childNodes;
          var d = factory(n);
          for (var i=0, nc; i < c$.length; i++) {
            nc = factory(doc).importNode(c$[i], true);
            d.appendChild(nc);
          }
        }
        return n;
      }

    };

    Object.defineProperty(DomApi.prototype, 'classList', {
      get: function() {
        if (!this._classList) {
          this._classList = new DomApi.ClassList(this);
        }
        return this._classList;
      },
      configurable: true
    });

    DomApi.ClassList = function(host) {
      this.domApi = host;
      this.node = host.node;
    }

    DomApi.ClassList.prototype = {
      add: function() {
        this.node.classList.add.apply(this.node.classList, arguments);
        this.domApi._distributeParent();
      },

      remove: function() {
        this.node.classList.remove.apply(this.node.classList, arguments);
        this.domApi._distributeParent();
      },

      toggle: function() {
        this.node.classList.toggle.apply(this.node.classList, arguments);
        this.domApi._distributeParent();
      },
      contains: function() {
        return this.node.classList.contains.apply(this.node.classList,
          arguments);
      }
    }

    // changes and accessors...
    if (!Settings.useShadow) {

      Object.defineProperties(DomApi.prototype, {

        childNodes: {
          get: function() {
            var c$ = getLightChildren(this.node);
            return Array.isArray(c$) ? c$ : Array.prototype.slice.call(c$);
          },
          configurable: true
        },

        children: {
          get: function() {
            return Array.prototype.filter.call(this.childNodes, function(n) {
              return (n.nodeType === Node.ELEMENT_NODE);
            });
          },
          configurable: true
        },

        parentNode: {
          get: function() {
            return this.node._lightParent ||
              (this.node.__patched ? this.node._composedParent :
              this.node.parentNode);
          },
          configurable: true
        },

        firstChild: {
          get: function() {
            return this.childNodes[0];
          },
          configurable: true
        },

        lastChild: {
          get: function() {
            var c$ = this.childNodes;
            return c$[c$.length-1];
          },
          configurable: true
        },

        nextSibling: {
          get: function() {
            var c$ = this.parentNode && factory(this.parentNode).childNodes;
            if (c$) {
              return c$[Array.prototype.indexOf.call(c$, this.node) + 1];
            }
          },
          configurable: true
        },

        previousSibling: {
          get: function() {
            var c$ = this.parentNode && factory(this.parentNode).childNodes;
            if (c$) {
              return c$[Array.prototype.indexOf.call(c$, this.node) - 1];
            }
          },
          configurable: true
        },

        firstElementChild: {
          get: function() {
            return this.children[0];
          },
          configurable: true
        },

        lastElementChild: {
          get: function() {
            var c$ = this.children;
            return c$[c$.length-1];
          },
          configurable: true
        },

        nextElementSibling: {
          get: function() {
            var c$ = this.parentNode && factory(this.parentNode).children;
            if (c$) {
              return c$[Array.prototype.indexOf.call(c$, this.node) + 1];
            }
          },
          configurable: true
        },

        previousElementSibling: {
          get: function() {
            var c$ = this.parentNode && factory(this.parentNode).children;
            if (c$) {
              return c$[Array.prototype.indexOf.call(c$, this.node) - 1];
            }
          },
          configurable: true
        },

        // textContent / innerHTML
        textContent: {
          get: function() {
            if (this.node.nodeType === Node.TEXT_NODE) {
              return this.node.textContent;
            } else {
              return Array.prototype.map.call(this.childNodes, function(c) {
                return c.textContent;
              }).join('');
            }
          },
          set: function(text) {
            this._clear();
            if (text) {
              this.appendChild(document.createTextNode(text));
            }
          },
          configurable: true
        },

        innerHTML: {
          get: function() {
            if (this.node.nodeType === Node.TEXT_NODE) {
              return null;
            } else {
              return getInnerHTML(this.node);
            }
          },
          set: function(text) {
            if (this.node.nodeType !== Node.TEXT_NODE) {
              this._clear();
              var d = document.createElement('div');
              d.innerHTML = text;
              var c$ = Array.prototype.slice.call(d.childNodes);
              for (var i=0; i < c$.length; i++) {
                this.appendChild(c$[i]);
              }
            }
          },
          configurable: true
        }

      });

      DomApi.prototype._getComposedInnerHTML = function() {
        return getInnerHTML(this.node, true);
      };


    } else {

      DomApi.prototype.querySelectorAll = function(selector) {
        return Array.prototype.slice.call(this.node.querySelectorAll(selector));
      };

      DomApi.prototype.getOwnerRoot = function() {
        var n = this.node;
        while (n) {
          if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE && n.host) {
            return n;
          }
          n = n.parentNode;
        }
      };

      DomApi.prototype.cloneNode = function(deep) {
        return this.node.cloneNode(deep);
      }

      DomApi.prototype.importNode = function(externalNode, deep) {
        var doc = this.node instanceof Document ? this.node :
          this.node.ownerDocument;
        return doc.importNode(externalNode, deep);
      }

      DomApi.prototype.getDestinationInsertionPoints = function() {
        var n$ = this.node.getDestinationInsertionPoints && 
          this.node.getDestinationInsertionPoints();
        return n$ ? Array.prototype.slice.call(n$) : [];
      };

      DomApi.prototype.getDistributedNodes = function() {
        var n$ = this.node.getDistributedNodes && 
          this.node.getDistributedNodes();
        return n$ ? Array.prototype.slice.call(n$) : [];
      };

      DomApi.prototype._distributeParent = function() {}

      Object.defineProperties(DomApi.prototype, {

        childNodes: {
          get: function() {
            return Array.prototype.slice.call(this.node.childNodes);
          },
          configurable: true
        },

        children: {
          get: function() {
            return Array.prototype.slice.call(this.node.children);
          },
          configurable: true
        },

        // textContent / innerHTML
        textContent: {
          get: function() {
            return this.node.textContent;
          },
          set: function(value) {
            return this.node.textContent = value;
          },
          configurable: true
        },

        innerHTML: {
          get: function() {
            return this.node.innerHTML;
          },
          set: function(value) {
            return this.node.innerHTML = value;
          },
          configurable: true
        }

      });

      var forwards = ['parentNode', 'firstChild', 'lastChild', 'nextSibling',
      'previousSibling', 'firstElementChild', 'lastElementChild',
      'nextElementSibling', 'previousElementSibling'];

      forwards.forEach(function(name) {
        Object.defineProperty(DomApi.prototype, name, {
          get: function() {
            return this.node[name];
          },
          configurable: true
        });
      });

    }

    var CONTENT = 'content';

    var factory = function(node, patch) {
      node = node || document;
      if (!node.__domApi) {
        node.__domApi = new DomApi(node, patch);
      }
      return node.__domApi;
    };

    Polymer.dom = function(obj, patch) {
      if (obj instanceof Event) {
        return Polymer.EventApi.factory(obj);
      } else {
        return factory(obj, patch);
      }
    };

    // make flush available directly.
    Polymer.dom.flush = DomApi.prototype.flush;

    function getLightChildren(node) {
      var children = node._lightChildren;
      // TODO(sorvell): it's more correct to use _composedChildren instead of
      // childNodes here but any trivial failure to use Polymer.dom
      // will result in an error so we avoid using _composedChildren
      return children ? children : node.childNodes;
    }

    function getComposedChildren(node) {
      if (!node._composedChildren) {
        node._composedChildren = Array.prototype.slice.call(node.childNodes);
      }
      return node._composedChildren;
    }

    function addToComposedParent(parent, node, ref_node) {
      var children = getComposedChildren(parent);
      var i = ref_node ? children.indexOf(ref_node) : -1;
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var fragChildren = getComposedChildren(node);
        for (var j=0; j < fragChildren.length; j++) {
          addNodeToComposedChildren(fragChildren[j], parent, children, i + j);
        }
        node._composedChildren = null;
      } else {
        addNodeToComposedChildren(node, parent, children, i);
      }

    }

    function addNodeToComposedChildren(node, parent, children, i) {
      node._composedParent = parent;
      children.splice(i >= 0 ? i : children.length, 0, node);
    }

    function removeFromComposedParent(parent, node) {
      node._composedParent = null;
      if (parent) {
        var children = getComposedChildren(parent);
        var i = children.indexOf(node);
        if (i >= 0) {
          children.splice(i, 1);
        }
      }
    }

    function saveLightChildrenIfNeeded(node) {
      // Capture the list of light children. It's important to do this before we
      // start transforming the DOM into "rendered" state.
      //
      // Children may be added to this list dynamically. It will be treated as the
      // source of truth for the light children of the element. This element's
      // actual children will be treated as the rendered state once lightChildren
      // is populated.
      if (!node._lightChildren) {
        var c$ = Array.prototype.slice.call(node.childNodes);
        for (var i=0, l=c$.length, child; (i<l) && (child=c$[i]); i++) {
          child._lightParent = child._lightParent || node;
        }
        node._lightChildren = c$;
      }
    }

    function hasInsertionPoint(root) {
      return Boolean(root._insertionPoints.length);
    }

    var p = Element.prototype;
    var matchesSelector = p.matches || p.matchesSelector ||
        p.mozMatchesSelector || p.msMatchesSelector ||
        p.oMatchesSelector || p.webkitMatchesSelector;

    return {
      getLightChildren: getLightChildren,
      getComposedChildren: getComposedChildren,
      removeFromComposedParent: removeFromComposedParent,
      saveLightChildrenIfNeeded: saveLightChildrenIfNeeded,
      matchesSelector: matchesSelector,
      hasInsertionPoint: hasInsertionPoint,
      ctor: DomApi,
      factory: factory
    };

  })();


  (function() {
    /**

      Implements a pared down version of ShadowDOM's scoping, which is easy to
      polyfill across browsers.

    */
    Polymer.Base._addFeature({

      _prepShady: function() {
        // Use this system iff localDom is needed.
        this._useContent = this._useContent || Boolean(this._template);
      },

      // called as part of content initialization, prior to template stamping
      _poolContent: function() {
        if (this._useContent) {
          // capture lightChildren to help reify dom scoping
          saveLightChildrenIfNeeded(this);
        }
      },

      // called as part of content initialization, after template stamping
      _setupRoot: function() {
        if (this._useContent) {
          this._createLocalRoot();
          // light elements may not be upgraded if they are light children
          // and there is no configuration flow (no dataHost) and they are
          // removed from document by shadyDOM distribution
          // so we ensure this here
          if (!this.dataHost) {
            upgradeLightChildren(this._lightChildren);
          }
        }
      },

      _createLocalRoot: function() {
        this.shadyRoot = this.root;
        this.shadyRoot._distributionClean = false;
        this.shadyRoot._isShadyRoot = true;
        this.shadyRoot._dirtyRoots = [];
        // capture insertion point list
        this.shadyRoot._insertionPoints = !this._notes || 
          this._notes._hasContent ?
          this.shadyRoot.querySelectorAll('content') : [];
        // save logical tree info for shadyRoot.
        saveLightChildrenIfNeeded(this.shadyRoot);
        this.shadyRoot.host = this;
      },

      /**
       * Return the element whose local dom within which this element
       * is contained. This is a shorthand for
       * `Polymer.dom(this).getOwnerRoot().host`.
       */
      get domHost() {
        var root = Polymer.dom(this).getOwnerRoot();
        return root && root.host;
      },

      /**
       * Force this element to distribute its children to its local dom.
       * A user should call `distributeContent` if distribution has been
       * invalidated due to changes to selectors on child elements that
       * effect distribution that were not made via `Polymer.dom`.
       * For example, if an element contains an insertion point with
       * `<content select=".foo">` and a `foo` class is added to a child,
       * then `distributeContent` must be called to update
       * local dom distribution.
       * @method distributeContent
       * @param {boolean} updateInsertionPoints Shady DOM does not detect
       *   <content> insertion that is nested in a sub-tree being appended.
       *   Set to true to distribute to newly added nested <content>'s.
       */
      distributeContent: function(updateInsertionPoints) {
        if (this.shadyRoot) {
          var dom = Polymer.dom(this);
          if (updateInsertionPoints) {
            dom._updateInsertionPoints(this);
          }
          // Distribute the host that's the top of this element's distribution
          // tree. Distributing that host will *always* distibute this element.
          var host = getTopDistributingHost(this);
          dom._lazyDistribute(host);
        }
      },

      _distributeContent: function() {
        if (this._useContent && !this.shadyRoot._distributionClean) {
          // logically distribute self
          this._beginDistribute();
          this._distributeDirtyRoots();
          this._finishDistribute();
        }
      },

      _beginDistribute: function() {
        if (this._useContent && hasInsertionPoint(this.shadyRoot)) {
          // reset distributions
          this._resetDistribution();
          // compute which nodes should be distributed where
          // TODO(jmesserly): this is simplified because we assume a single
          // ShadowRoot per host and no `<shadow>`.
          this._distributePool(this.shadyRoot, this._collectPool());
        }
      },

      _distributeDirtyRoots: function() {
        var c$ = this.shadyRoot._dirtyRoots;
        for (var i=0, l= c$.length, c; (i<l) && (c=c$[i]); i++) {
          c._distributeContent();
        }
        this.shadyRoot._dirtyRoots = [];
      },

      _finishDistribute: function() {
        // compose self
        if (this._useContent) {
          if (hasInsertionPoint(this.shadyRoot)) {
            this._composeTree();
          } else {
            if (!this.shadyRoot._hasDistributed) {
              this.textContent = '';
              // reset composed children here in case they may have already
              // been set (this shouldn't happen but can if dependency ordering
              // is incorrect and as a result upgrade order is unexpected)
              this._composedChildren = null;
              this.appendChild(this.shadyRoot);
            } else {
              // simplified non-tree walk composition
              var children = this._composeNode(this);
              this._updateChildNodes(this, children);
            }
          }
          this.shadyRoot._hasDistributed = true;
          this.shadyRoot._distributionClean = true;
        }
      },

      /**
       * Polyfill for Element.prototype.matches, which is sometimes still
       * prefixed.
       *
       * @method elementMatches
       * @param {string} selector Selector to test.
       * @param {Element=} node Element to test the selector against.
       * @return {boolean} Whether the element matches the selector.
       */
      elementMatches: function(selector, node) {
        // Alternatively we could just polyfill it somewhere.
        // Note that the arguments are reversed from what you might expect.
        node = node || this;
        return matchesSelector.call(node, selector);
      },

      // Many of the following methods are all conceptually static, but they are
      // included here as "protected" methods to allow overriding.

      _resetDistribution: function() {
        // light children
        var children = getLightChildren(this);
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child._destinationInsertionPoints) {
            child._destinationInsertionPoints = undefined;
          }
          if (isInsertionPoint(child)) {
            clearDistributedDestinationInsertionPoints(child);
          }
        }
        // insertion points
        var root = this.shadyRoot;
        var p$ = root._insertionPoints;
        for (var j = 0; j < p$.length; j++) {
          p$[j]._distributedNodes = [];
        }
      },

      // Gather the pool of nodes that should be distributed. We will combine
      // these with the "content root" to arrive at the composed tree.
      _collectPool: function() {
        var pool = [];
        var children = getLightChildren(this);
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (isInsertionPoint(child)) {
            pool.push.apply(pool, child._distributedNodes);
          } else {
            pool.push(child);
          }
        }
        return pool;
      },

      // perform "logical" distribution; note, no actual dom is moved here,
      // instead elements are distributed into a `content._distributedNodes`
      // array where applicable.
      _distributePool: function(node, pool) {
        var p$ = node._insertionPoints;
        for (var i=0, l=p$.length, p; (i<l) && (p=p$[i]); i++) {
          this._distributeInsertionPoint(p, pool);
          // provoke redistribution on insertion point parents
          // must do this on all candidate hosts since distribution in this
          // scope invalidates their distribution.
          maybeRedistributeParent(p, this);
        }
      },

      _distributeInsertionPoint: function(content, pool) {
        // distribute nodes from the pool that this selector matches
        var anyDistributed = false;
        for (var i=0, l=pool.length, node; i < l; i++) {
          node=pool[i];
          // skip nodes that were already used
          if (!node) {
            continue;
          }
          // distribute this node if it matches
          if (this._matchesContentSelect(node, content)) {
            distributeNodeInto(node, content);
            // remove this node from the pool
            pool[i] = undefined;
            // since at least one node matched, we won't need fallback content
            anyDistributed = true;
          }
        }
        // Fallback content if nothing was distributed here
        if (!anyDistributed) {
          var children = getLightChildren(content);
          for (var j = 0; j < children.length; j++) {
            distributeNodeInto(children[j], content);
          }
        }
      },

      // Reify dom such that it is at its correct rendering position
      // based on logical distribution.
      _composeTree: function() {
        this._updateChildNodes(this, this._composeNode(this));
        var p$ = this.shadyRoot._insertionPoints;
        for (var i=0, l=p$.length, p, parent; (i<l) && (p=p$[i]); i++) {
          parent = p._lightParent || p.parentNode;
          if (!parent._useContent && (parent !== this) &&
            (parent !== this.shadyRoot)) {
            this._updateChildNodes(parent, this._composeNode(parent));
          }
        }
      },

      // Returns the list of nodes which should be rendered inside `node`.
      _composeNode: function(node) {
        var children = [];
        var c$ = getLightChildren(node.shadyRoot || node);
        for (var i = 0; i < c$.length; i++) {
          var child = c$[i];
          if (isInsertionPoint(child)) {
            var distributedNodes = child._distributedNodes;
            for (var j = 0; j < distributedNodes.length; j++) {
              var distributedNode = distributedNodes[j];
              if (isFinalDestination(child, distributedNode)) {
                children.push(distributedNode);
              }
            }
          } else {
            children.push(child);
          }
        }
        return children;
      },

      // Ensures that the rendered node list inside `container` is `children`.
      _updateChildNodes: function(container, children) {
        var composed = getComposedChildren(container);
        var splices =
          Polymer.ArraySplice.calculateSplices(children, composed);
        // process removals
        for (var i=0, d=0, s; (i<splices.length) && (s=splices[i]); i++) {
          for (var j=0, n; (j < s.removed.length) && (n=s.removed[j]); j++) {
            remove(n);
            composed.splice(s.index + d, 1);
          }
          d -= s.addedCount;
        }
        // process adds
        for (var i=0, s, next; (i<splices.length) && (s=splices[i]); i++) {
          next = composed[s.index];
          for (var j=s.index, n; j < s.index + s.addedCount; j++) {
            n = children[j];
            insertBefore(container, n, next);
            composed.splice(j, 0, n);
          }
        }
      },

      _matchesContentSelect: function(node, contentElement) {
        var select = contentElement.getAttribute('select');
        // no selector matches all nodes (including text)
        if (!select) {
          return true;
        }
        select = select.trim();
        // same thing if it had only whitespace
        if (!select) {
          return true;
        }
        // selectors can only match Elements
        if (!(node instanceof Element)) {
          return false;
        }
        // only valid selectors can match:
        //   TypeSelector
        //   *
        //   ClassSelector
        //   IDSelector
        //   AttributeSelector
        //   negation
        var validSelectors = /^(:not\()?[*.#[a-zA-Z_|]/;
        if (!validSelectors.test(select)) {
          return false;
        }
        return this.elementMatches(select, node);
      },

      // system override point
      _elementAdd: function() {},

      // system override point
      _elementRemove: function() {}

    });

    var saveLightChildrenIfNeeded = Polymer.DomApi.saveLightChildrenIfNeeded;
    var getLightChildren = Polymer.DomApi.getLightChildren;
    var matchesSelector = Polymer.DomApi.matchesSelector;
    var hasInsertionPoint = Polymer.DomApi.hasInsertionPoint;
    var getComposedChildren = Polymer.DomApi.getComposedChildren;
    var removeFromComposedParent = Polymer.DomApi.removeFromComposedParent;

    function distributeNodeInto(child, insertionPoint) {
      insertionPoint._distributedNodes.push(child);
      var points = child._destinationInsertionPoints;
      if (!points) {
        child._destinationInsertionPoints = [insertionPoint];
      } else {
        points.push(insertionPoint);
      }
    }

    function clearDistributedDestinationInsertionPoints(content) {
      var e$ = content._distributedNodes;
      if (e$) {
        for (var i=0; i < e$.length; i++) {
          var d = e$[i]._destinationInsertionPoints;
          if (d) {
            // this is +1 because these insertion points are *not* in this scope
            d.splice(d.indexOf(content)+1, d.length);
          }
        }
      }
    }

    // dirty a shadyRoot if a change may trigger reprojection!
    function maybeRedistributeParent(content, host) {
      var parent = content._lightParent;
      if (parent && parent.shadyRoot &&
          hasInsertionPoint(parent.shadyRoot) &&
          parent.shadyRoot._distributionClean) {
        parent.shadyRoot._distributionClean = false;
        host.shadyRoot._dirtyRoots.push(parent);
      }
    }

    function isFinalDestination(insertionPoint, node) {
      var points = node._destinationInsertionPoints;
      return points && points[points.length - 1] === insertionPoint;
    }

    function isInsertionPoint(node) {
      // TODO(jmesserly): we could add back 'shadow' support here.
      return node.localName == 'content';
    }

    var nativeInsertBefore = Element.prototype.insertBefore;
    var nativeRemoveChild = Element.prototype.removeChild;

    function insertBefore(parentNode, newChild, refChild) {
      var newChildParent = getComposedParent(newChild);
      if (newChildParent !== parentNode) {
        removeFromComposedParent(newChildParent, newChild);
      }
      // remove child from its old parent first
      remove(newChild);
      // make sure we never lose logical DOM information:
      // if the parentNode doesn't have lightChildren, save that information now.
      saveLightChildrenIfNeeded(parentNode);
      // insert it into the real DOM
      nativeInsertBefore.call(parentNode, newChild, refChild || null);
      newChild._composedParent = parentNode;
    }

    function remove(node) {
      var parentNode = getComposedParent(node);
      if (parentNode) {
        // make sure we never lose logical DOM information:
        // if the parentNode doesn't have lightChildren, save that information now.
        saveLightChildrenIfNeeded(parentNode);
        node._composedParent = null;
        // remove it from the real DOM
        nativeRemoveChild.call(parentNode, node);
      }
    }

    function getComposedParent(node) {
      return node.__patched ? node._composedParent : node.parentNode;
    }

    // returns the host that's the top of this host's distribution tree
    function getTopDistributingHost(host) {
      while (host && hostNeedsRedistribution(host)) {
        host = host.domHost;
      }
      return host;
    }

    // Return true if a host's children includes
    // an insertion point that selects selectively
    function hostNeedsRedistribution(host) {
      var c$ = Polymer.dom(host).children;
      for (var i=0, c; i < c$.length; i++) {
        c = c$[i];
        if (c.localName === 'content') {
          return host.domHost;
        }
      }
    }

    var needsUpgrade = window.CustomElements && !CustomElements.useNative;

    function upgradeLightChildren(children) {
      if (needsUpgrade && children) {
        for (var i=0; i < children.length; i++) {
          CustomElements.upgrade(children[i]);
        }
      }
    }
  })();

  
  /**
    Implements `shadyRoot` compatible dom scoping using native ShadowDOM.
  */

  // Transform styles if not using ShadowDOM or if flag is set.

  if (Polymer.Settings.useShadow) {

    Polymer.Base._addFeature({

      // no-op's when ShadowDOM is in use
      _poolContent: function() {},
      _beginDistribute: function() {},
      distributeContent: function() {},
      _distributeContent: function() {},
      _finishDistribute: function() {},
      
      // create a shadowRoot
      _createLocalRoot: function() {
        this.createShadowRoot();
        this.shadowRoot.appendChild(this.root);
        this.root = this.shadowRoot;
      }

    });

  }




  Polymer.DomModule = document.createElement('dom-module');

  Polymer.Base._addFeature({

    _registerFeatures: function() {
      // identity
      this._prepIs();
      // attributes
      this._prepAttributes();
      // shared behaviors
      this._prepBehaviors();
      // factory
      this._prepConstructor();
      // template
      this._prepTemplate();
      // dom encapsulation
      this._prepShady();
    },

    _prepBehavior: function(b) {
      this._addHostAttributes(b.hostAttributes);
    },

    _initFeatures: function() {
      // manage local dom
      this._poolContent();
      // host stack
      this._pushHost();
      // instantiate template
      this._stampTemplate();
      // host stack
      this._popHost();
      // install host attributes
      this._marshalHostAttributes();
      // setup debouncers
      this._setupDebouncers();
      // instance shared behaviors
      this._marshalBehaviors();
      // top-down initial distribution, configuration, & ready callback
      this._tryReady();
    },

    _marshalBehavior: function(b) {
    }

  });




/**
 * Scans a template to produce an annotation list that that associates
 * metadata culled from markup with tree locations
 * metadata and information to associate the metadata with nodes in an instance.
 *
 * Supported expressions include:
 *
 * Double-mustache annotations in text content. The annotation must be the only
 * content in the tag, compound expressions are not supported.
 *
 *     <[tag]>{{annotation}}<[tag]>
 *
 * Double-escaped annotations in an attribute, either {{}} or [[]].
 *
 *     <[tag] someAttribute="{{annotation}}" another="[[annotation]]"><[tag]>
 *
 * `on-` style event declarations.
 *
 *     <[tag] on-<event-name>="annotation"><[tag]>
 *
 * Note that the `annotations` feature does not implement any behaviors
 * associated with these expressions, it only captures the data.
 *
 * Generated data-structure:
 *
 *     [
 *       {
 *         id: '<id>',
 *         events: [
 *           {
 *             name: '<name>'
 *             value: '<annotation>'
 *           }, ...
 *         ],
 *         bindings: [
 *           {
 *             kind: ['text'|'attribute'],
 *             mode: ['{'|'['],
 *             name: '<name>'
 *             value: '<annotation>'
 *           }, ...
 *         ],
 *         // TODO(sjmiles): this is annotation-parent, not node-parent
 *         parent: <reference to parent annotation object>,
 *         index: <integer index in parent's childNodes collection>
 *       },
 *       ...
 *     ]
 *
 * @class Template feature
 */

  // null-array (shared empty array to avoid null-checks)
  Polymer.nar = [];

  Polymer.Annotations = {

    // preprocess-time

    // construct and return a list of annotation records
    // by scanning `template`'s content
    //
    parseAnnotations: function(template) {
      var list = [];
      var content = template._content || template.content;
      this._parseNodeAnnotations(content, list);
      return list;
    },

    // add annotations gleaned from subtree at `node` to `list`
    _parseNodeAnnotations: function(node, list) {
      return node.nodeType === Node.TEXT_NODE ?
        this._parseTextNodeAnnotation(node, list) :
          // TODO(sjmiles): are there other nodes we may encounter
          // that are not TEXT_NODE but also not ELEMENT?
          this._parseElementAnnotations(node, list);
    },

    _testEscape: function(value) {
      var escape = value.slice(0, 2);
      if (escape === '{{' || escape === '[[') {
        return escape;
      }
    },

    // add annotations gleaned from TextNode `node` to `list`
    _parseTextNodeAnnotation: function(node, list) {
      var v = node.textContent;
      var escape = this._testEscape(v);
      if (escape) {
        // NOTE: use a space here so the textNode remains; some browsers
        // (IE) evacipate an empty textNode.
        node.textContent = ' ';
        var annote = {
          bindings: [{
            kind: 'text',
            mode: escape[0],
            value: v.slice(2, -2).trim()
          }]
        };
        list.push(annote);
        return annote;
      }
    },

    // add annotations gleaned from Element `node` to `list`
    _parseElementAnnotations: function(element, list) {
      var annote = {
        bindings: [],
        events: []
      };
      if (element.localName === 'content') {
        list._hasContent = true;
      }
      this._parseChildNodesAnnotations(element, annote, list);
      // TODO(sjmiles): is this for non-ELEMENT nodes? If so, we should
      // change the contract of this method, or filter these out above.
      if (element.attributes) {
        this._parseNodeAttributeAnnotations(element, annote, list);
        // TODO(sorvell): ad hoc callback for doing work on elements while
        // leveraging annotator's tree walk.
        // Consider adding an node callback registry and moving specific
        // processing out of this module.
        if (this.prepElement) {
          this.prepElement(element);
        }
      }
      if (annote.bindings.length || annote.events.length || annote.id) {
        list.push(annote);
      }
      return annote;
    },

    // add annotations gleaned from children of `root` to `list`, `root`'s
    // `annote` is supplied as it is the annote.parent of added annotations
    _parseChildNodesAnnotations: function(root, annote, list, callback) {
      if (root.firstChild) {
        for (var i=0, node=root.firstChild; node; node=node.nextSibling, i++) {
          if (node.localName === 'template' &&
            !node.hasAttribute('preserve-content')) {
            this._parseTemplate(node, i, list, annote);
          }
          // collapse adjacent textNodes: fixes an IE issue that can cause 
          // text nodes to be inexplicably split =(
          // note that root.normalize() should work but does not so we do this
          // manually.
          if (node.nodeType === Node.TEXT_NODE) {
            var n = node.nextSibling;
            while (n && (n.nodeType === Node.TEXT_NODE)) {
              node.textContent += n.textContent;
              root.removeChild(n);
              n = n.nextSibling;
            }
          }
          var childAnnotation = this._parseNodeAnnotations(node, list, callback);
          if (childAnnotation) {
            childAnnotation.parent = annote;
            childAnnotation.index = i;
          }
        }
      }
    },

    // 1. Parse annotations from the template and memoize them on
    //    content._notes (recurses into nested templates)
    // 2. Remove template.content and store it in annotation list, where it
    //    will be the responsibility of the host to set it back to the template
    //    (this is both an optimization to avoid re-stamping nested template
    //    children and avoids a bug in Chrome where nested template children
    //    upgrade)
    _parseTemplate: function(node, index, list, parent) {
      // TODO(sjmiles): simply altering the .content reference didn't
      // work (there was some confusion, might need verification)
      var content = document.createDocumentFragment();
      content._notes = this.parseAnnotations(node);
      content.appendChild(node.content);
      // TODO(sjmiles): using `nar` to avoid unnecessary allocation;
      // in general the handling of these arrays needs some cleanup
      // in this module
      list.push({
        bindings: Polymer.nar,
        events: Polymer.nar,
        templateContent: content,
        parent: parent,
        index: index
      });
    },

    // add annotation data from attributes to the `annotation` for node `node`
    // TODO(sjmiles): the distinction between an `annotation` and
    // `annotation data` is not as clear as it could be
    _parseNodeAttributeAnnotations: function(node, annotation) {
      for (var i=node.attributes.length-1, a; (a=node.attributes[i]); i--) {
        var n = a.name, v = a.value;
        // id (unless actually an escaped binding annotation)
        if (n === 'id' && !this._testEscape(v)) {
          annotation.id = v;
        }
        // events (on-*)
        else if (n.slice(0, 3) === 'on-') {
          node.removeAttribute(n);
          annotation.events.push({
            name: n.slice(3),
            value: v
          });
        }
        // bindings (other attributes)
        else {
          var b = this._parseNodeAttributeAnnotation(node, n, v);
          if (b) {
            annotation.bindings.push(b);
          }
        }
      }
    },

    // construct annotation data from a generic attribute, or undefined
    _parseNodeAttributeAnnotation: function(node, n, v) {
      var escape = this._testEscape(v);
      if (escape) {
        var customEvent;
        // Cache name (`n` will be mangled)
        var name = n;
        // Mode (one-way or two)
        var mode = escape[0];
        v = v.slice(2, -2).trim();
        // Negate
        var not = false;
        if (v[0] == '!') {
          v = v.substring(1);
          not = true;
        }
        // Attribute or property
        var kind = 'property';
        if (n[n.length-1] == '$') {
          name = n.slice(0, -1);
          kind = 'attribute';
        }
        // Custom notification event
        var notifyEvent, colon;
        if (mode == '{' && (colon = v.indexOf('::')) > 0) {
          notifyEvent = v.substring(colon + 2);
          v = v.substring(0, colon);
          customEvent = true;
        }
        // Clear attribute before removing, since IE won't allow removing
        // `value` attribute if it previously had a value (can't
        // unconditionally set '' before removing since attributes with `$`
        // can't be set using setAttribute)
        if (node.localName == 'input' && n == 'value') {
          node.setAttribute(n, '');
        }
        // Remove annotation
        node.removeAttribute(n);
        // Case hackery: attributes are lower-case, but bind targets
        // (properties) are case sensitive. Gambit is to map dash-case to
        // camel-case: `foo-bar` becomes `fooBar`.
        // Attribute bindings are excepted.
        if (kind === 'property') {
          name = Polymer.CaseMap.dashToCamelCase(name);
        }
        return {
          kind: kind,
          mode: mode,
          name: name,
          value: v,
          negate: not,
          event: notifyEvent,
          customEvent: customEvent
        };
      }
    },

    // instance-time

    _localSubTree: function(node, host) {
      return (node === host) ? node.childNodes :
         (node._lightChildren || node.childNodes);
    },

    findAnnotatedNode: function(root, annote) {
      // recursively ascend tree until we hit root
      var parent = annote.parent &&
        Polymer.Annotations.findAnnotatedNode(root, annote.parent);
      // unwind the stack, returning the indexed node at each level
      return !parent ? root :
        Polymer.Annotations._localSubTree(parent, root)[annote.index];
    }

  };




  (function() {

    // path fixup for urls in cssText that's expected to 
    // come from a given ownerDocument
    function resolveCss(cssText, ownerDocument) {
      return cssText.replace(CSS_URL_RX, function(m, pre, url, post) {
        return pre + '\'' + 
          resolve(url.replace(/["']/g, ''), ownerDocument) + 
          '\'' + post;
      });
    }

    // url fixup for urls in an element's attributes made relative to 
    // ownerDoc's base url
    function resolveAttrs(element, ownerDocument) {
      for (var name in URL_ATTRS) {
        var a$ = URL_ATTRS[name];
        for (var i=0, l=a$.length, a, at, v; (i<l) && (a=a$[i]); i++) {
          if (name === '*' || element.localName === name) {
            at = element.attributes[a];
            v = at && at.value;
            if (v && (v.search(BINDING_RX) < 0)) {
              at.value = (a === 'style') ?
                resolveCss(v, ownerDocument) :
                resolve(v, ownerDocument);
            }
          }
        }
      }
    }

    function resolve(url, ownerDocument) {
      // do not resolve '#' links, they are used for routing
      if (url && url[0] === '#') {
        return url;
      }      
      var resolver = getUrlResolver(ownerDocument);
      resolver.href = url;
      return resolver.href || url;
    }

    var tempDoc;
    var tempDocBase;
    function resolveUrl(url, baseUri) {
      if (!tempDoc) {
        tempDoc = document.implementation.createHTMLDocument('temp');
        tempDocBase = tempDoc.createElement('base');
        tempDoc.head.appendChild(tempDocBase);
      }
      tempDocBase.href = baseUri;
      return resolve(url, tempDoc);
    }

    function getUrlResolver(ownerDocument) {
      return ownerDocument.__urlResolver || 
        (ownerDocument.__urlResolver = ownerDocument.createElement('a'));
    }

    var CSS_URL_RX = /(url\()([^)]*)(\))/g;
    var URL_ATTRS = {
      '*': ['href', 'src', 'style', 'url'],
      form: ['action']
    };
    var BINDING_RX = /\{\{|\[\[/;

    // exports
    Polymer.ResolveUrl = {
      resolveCss: resolveCss,
      resolveAttrs: resolveAttrs,
      resolveUrl: resolveUrl
    };

  })();




/**
 * Scans a template to produce an annotation object that stores expression
 * metadata along with information to associate the metadata with nodes in an
 * instance.
 *
 * Elements with `id` in the template are noted and marshaled into an
 * the `$` hash in an instance.
 *
 * Example
 *
 *     &lt;template>
 *       &lt;div id="foo">&lt;/div>
 *     &lt;/template>
 *     &lt;script>
 *      Polymer({
 *        task: function() {
 *          this.$.foo.style.color = 'red';
 *        }
 *      });
 *     &lt;/script>
 *
 * Other expressions that are noted include:
 *
 * Double-mustache annotations in text content. The annotation must be the only
 * content in the tag, compound expressions are not (currently) supported.
 *
 *     <[tag]>{{path.to.host.property}}<[tag]>
 *
 * Double-mustache annotations in an attribute.
 *
 *     <[tag] someAttribute="{{path.to.host.property}}"><[tag]>
 *
 * Only immediate host properties can automatically trigger side-effects.
 * Setting `host.path` in the example above triggers the binding, setting
 * `host.path.to.host.property` does not.
 *
 * `on-` style event declarations.
 *
 *     <[tag] on-<event-name>="{{hostMethodName}}"><[tag]>
 *
 * Note: **the `annotations` feature does not actually implement the behaviors
 * associated with these expressions, it only captures the data**.
 *
 * Other optional features contain actual data implementations.
 *
 * @class standard feature: annotations
 */

/*

Scans a template to produce an annotation map that stores expression metadata
and information that associates the metadata to nodes in a template instance.

Supported annotations are:

  * id attributes
  * binding annotations in text nodes
    * double-mustache expressions: {{expression}}
    * double-bracket expressions: [[expression]]
  * binding annotations in attributes
    * attribute-bind expressions: name="{{expression}} || [[expression]]"
    * property-bind expressions: name*="{{expression}} || [[expression]]"
    * property-bind expressions: name:="expression"
  * event annotations
    * event delegation directives: on-<eventName>="expression"

Generated data-structure:

  [
    {
      id: '<id>',
      events: [
        {
          mode: ['auto'|''],
          name: '<name>'
          value: '<expression>'
        }, ...
      ],
      bindings: [
        {
          kind: ['text'|'attribute'|'property'],
          mode: ['auto'|''],
          name: '<name>'
          value: '<expression>'
        }, ...
      ],
      // TODO(sjmiles): confusingly, this is annotation-parent, not node-parent
      parent: <reference to parent annotation>,
      index: <integer index in parent's childNodes collection>
    },
    ...
  ]

TODO(sjmiles): this module should produce either syntactic metadata
(e.g. double-mustache, double-bracket, star-attr), or semantic metadata
(e.g. manual-bind, auto-bind, property-bind). Right now it's half and half.

*/

  Polymer.Base._addFeature({

    // registration-time

    _prepAnnotations: function() {
      if (!this._template) {
        this._notes = [];
      } else {
        // TODO(sorvell): ad hoc method of plugging behavior into Annotations
        Polymer.Annotations.prepElement = this._prepElement.bind(this);
        this._notes = Polymer.Annotations.parseAnnotations(this._template);
        this._processAnnotations(this._notes);
        Polymer.Annotations.prepElement = null;
      }
    },

    _processAnnotations: function(notes) {
      for (var i=0; i<notes.length; i++) {
        var note = notes[i];
        // Parse bindings for methods & path roots (models)
        for (var j=0; j<note.bindings.length; j++) {
          var b = note.bindings[j];
          b.signature = this._parseMethod(b.value);
          if (!b.signature) {
            b.model = this._modelForPath(b.value);
          }
        }
        // Recurse into nested templates & bind parent props
        if (note.templateContent) {
          this._processAnnotations(note.templateContent._notes);
          var pp = note.templateContent._parentProps =
            this._discoverTemplateParentProps(note.templateContent._notes);
          var bindings = [];
          for (var prop in pp) {
            bindings.push({
              index: note.index,
              kind: 'property',
              mode: '{',
              name: '_parent_' + prop,
              model: prop,
              value: prop
            });
          }
          note.bindings = note.bindings.concat(bindings);
        }
      }
    },

    // Finds all bindings in template content and stores the path roots in
    // the path members in content._parentProps. Each outer template merges
    // inner _parentProps to propagate inner parent property needs to outer
    // templates.
    _discoverTemplateParentProps: function(notes) {
      var pp = {};
      notes.forEach(function(n) {
        // Find all bindings to parent.* and spread them into _parentPropChain
        n.bindings.forEach(function(b) {
          if (b.signature) {
            var args = b.signature.args;
            for (var k=0; k<args.length; k++) {
              pp[args[k].model] = true;
            }
          } else {
            pp[b.model] = true;
          }
        });
        // Merge child _parentProps into this _parentProps
        if (n.templateContent) {
          var tpp = n.templateContent._parentProps;
          Polymer.Base.mixin(pp, tpp);
        }
      });
      return pp;
    },

    _prepElement: function(element) {
      Polymer.ResolveUrl.resolveAttrs(element, this._template.ownerDocument);
    },

    // instance-time

    _findAnnotatedNode: Polymer.Annotations.findAnnotatedNode,

    // marshal all teh things
    _marshalAnnotationReferences: function() {
      if (this._template) {
        this._marshalIdNodes();
        this._marshalAnnotatedNodes();
        this._marshalAnnotatedListeners();
      }
    },

    // push configuration references at configure time
    _configureAnnotationReferences: function() {
      this._configureTemplateContent();
    },

    // nested template contents have been stored prototypically to avoid
    // unnecessary duplication, here we put references to the
    // indirected contents onto the nested template instances
    _configureTemplateContent: function() {
      this._notes.forEach(function(note, i) {
        if (note.templateContent) {
          // note: we can rely on _nodes being set here and having the same
          // index as _notes
          this._nodes[i]._content = note.templateContent;
        }
      }, this);
    },

    // construct `$` map (from id annotations)
    _marshalIdNodes: function() {
      this.$ = {};
      this._notes.forEach(function(a) {
        if (a.id) {
          this.$[a.id] = this._findAnnotatedNode(this.root, a);
        }
      }, this);
    },

    // concretize `_nodes` map (from anonymous annotations)
    _marshalAnnotatedNodes: function() {
      if (this._nodes) {
        this._nodes = this._nodes.map(function(a) {
          return this._findAnnotatedNode(this.root, a);
        }, this);
      }
    },

    // install event listeners (from event annotations)
    _marshalAnnotatedListeners: function() {
      this._notes.forEach(function(a) {
        if (a.events && a.events.length) {
          var node = this._findAnnotatedNode(this.root, a);
          a.events.forEach(function(e) {
            this.listen(node, e.name, e.value);
          }, this);
        }
      }, this);
    }

  });




  /**
   * Supports `listeners` object.
   *
   * Example:
   *
   *
   *     Polymer({
   *
   *       listeners: {
   *         // `click` events on the host are delegated to `clickHandler`
   *         'click': 'clickHandler'
   *       },
   *
   *       ...
   *
   *     });
   *
   *
   * @class standard feature: events
   *
   */

  Polymer.Base._addFeature({

    /**
     * Object containing entries specifying event listeners to create on each
     * instance of this element, where keys specify the event name and values
     * specify the name of the handler method to call on this prototype.
     *
     * Example:
     *
     *
     *     Polymer({
     *
     *       listeners: {
     *         // `click` events on the host are delegated to `clickHandler`
     *         'tap': 'tapHandler'
     *       },
     *
     *       ...
     *
     *     });
     */
    listeners: {},

    _listenListeners: function(listeners) {
      var node, name, key;
      for (key in listeners) {
        if (key.indexOf('.') < 0) {
          node = this;
          name = key;
        } else {
          name = key.split('.');
          node = this.$[name[0]];
          name = name[1];
        }
        this.listen(node, name, listeners[key]);
      }
    },

    /**
     * Convenience method to add an event listener on a given element,
     * late bound to a named method on this element.
     *
     * @method listen
     * @param {Element} node Element to add event listener to.
     * @param {string} eventName Name of event to listen for.
     * @param {string} methodName Name of handler method on `this` to call.
     */
    listen: function(node, eventName, methodName) {
      this._listen(node, eventName,
        this._createEventHandler(node, eventName, methodName));
    },

    _boundListenerKey: function(eventName, methodName) {
      return (eventName + ':' + methodName);
    },

    _recordEventHandler: function(host, eventName, target, methodName, handler) {
      var hbl = host.__boundListeners;
      if (!hbl) {
        hbl = host.__boundListeners = new WeakMap();
      }
      var bl = hbl.get(target);
      if (!bl) {
        bl = {};
        hbl.set(target, bl);
      }
      var key = this._boundListenerKey(eventName, methodName);
      bl[key] = handler;
    },

    _recallEventHandler: function(host, eventName, target, methodName) {
      var hbl = host.__boundListeners;
      if (!hbl) {
        return;
      }
      var bl = hbl.get(target);
      if (!bl) {
        return;
      }
      var key = this._boundListenerKey(eventName, methodName);
      return bl[key];
    },

    _createEventHandler: function(node, eventName, methodName) {
      var host = this;
      var handler = function(e) {
        if (host[methodName]) {
          host[methodName](e, e.detail);
        } else {
          host._warn(host._logf('_createEventHandler', 'listener method `' +
            methodName + '` not defined'));
        }
      };
      this._recordEventHandler(host, eventName, node, methodName, handler);
      return handler;
    },

    /**
     * Convenience method to remove an event listener from a given element,
     * late bound to a named method on this element.
     *
     * @method unlisten
     * @param {Element} node Element to remove event listener from.
     * @param {string} eventName Name of event to stop listening to.
     * @param {string} methodName Name of handler method on `this` to not call
     anymore.
     */
    unlisten: function(node, eventName, methodName) {
      var handler = this._recallEventHandler(this, eventName, node, methodName);
      if (handler) {
        this._unlisten(node, eventName, handler);
      }
    },

    _listen: function(node, eventName, handler) {
      node.addEventListener(eventName, handler);
    },

    _unlisten: function(node, eventName, handler) {
      node.removeEventListener(eventName, handler);
    }
  });



(function() {

  'use strict';

  // detect native touch action support
  var HAS_NATIVE_TA = typeof document.head.style.touchAction === 'string';
  var GESTURE_KEY = '__polymerGestures';
  var HANDLED_OBJ = '__polymerGesturesHandled';
  var TOUCH_ACTION = '__polymerGesturesTouchAction';
  // radius for tap and track
  var TAP_DISTANCE = 25;
  var TRACK_DISTANCE = 5;
  // number of last N track positions to keep
  var TRACK_LENGTH = 2;

  // Disabling "mouse" handlers for 2500ms is enough
  var MOUSE_TIMEOUT = 2500;
  var MOUSE_EVENTS = ['mousedown', 'mousemove', 'mouseup', 'click'];

  // Check for touch-only devices
  var IS_TOUCH_ONLY = navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);

  // touch will make synthetic mouse events
  // `preventDefault` on touchend will cancel them,
  // but this breaks `<input>` focus and link clicks
  // disable mouse handlers for MOUSE_TIMEOUT ms after
  // a touchend to ignore synthetic mouse events
  var mouseCanceller = function(mouseEvent) {
    // skip synthetic mouse events
    mouseEvent[HANDLED_OBJ] = {skip: true};
    // disable "ghost clicks"
    if (mouseEvent.type === 'click') {
      var path = Polymer.dom(mouseEvent).path;
      for (var i = 0; i < path.length; i++) {
        if (path[i] === POINTERSTATE.mouse.target) {
          return;
        }
      }
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
    }
  };

  function setupTeardownMouseCanceller(setup) {
    for (var i = 0, en; i < MOUSE_EVENTS.length; i++) {
      en = MOUSE_EVENTS[i];
      if (setup) {
        document.addEventListener(en, mouseCanceller, true);
      } else {
        document.removeEventListener(en, mouseCanceller, true);
      }
    }
  }

  function ignoreMouse() {
    if (IS_TOUCH_ONLY) {
      return;
    }
    if (!POINTERSTATE.mouse.mouseIgnoreJob) {
      setupTeardownMouseCanceller(true);
    }
    var unset = function() {
      setupTeardownMouseCanceller();
      POINTERSTATE.mouse.target = null;
      POINTERSTATE.mouse.mouseIgnoreJob = null;
    };
    POINTERSTATE.mouse.mouseIgnoreJob =
      Polymer.Debounce(POINTERSTATE.mouse.mouseIgnoreJob, unset, MOUSE_TIMEOUT);
  }

  var POINTERSTATE = {
    mouse: {
      target: null,
      mouseIgnoreJob: null
    },
    touch: {
      x: 0,
      y: 0,
      id: -1,
      scrollDecided: false
    }
  };

  function firstTouchAction(ev) {
    var path = Polymer.dom(ev).path;
    var ta = 'auto';
    for (var i = 0, n; i < path.length; i++) {
      n = path[i];
      if (n[TOUCH_ACTION]) {
        ta = n[TOUCH_ACTION];
        break;
      }
    }
    return ta;
  }

  var Gestures = {
    gestures: {},
    recognizers: [],

    deepTargetFind: function(x, y) {
      var node = document.elementFromPoint(x, y);
      var next = node;
      // this code path is only taken when native ShadowDOM is used
      // if there is a shadowroot, it may have a node at x/y
      // if there is not a shadowroot, exit the loop
      while (next && next.shadowRoot) {
        // if there is a node at x/y in the shadowroot, look deeper
        next = next.shadowRoot.elementFromPoint(x, y);
        if (next) {
          node = next;
        }
      }
      return node;
    },
    // a cheaper check than Polymer.dom(ev).path[0];
    findOriginalTarget: function(ev) {
      // shadowdom
      if (ev.path) {
        return ev.path[0];
      }
      // shadydom
      return ev.target;
    },
    handleNative: function(ev) {
      var handled;
      var type = ev.type;
      var node = ev.currentTarget;
      var gobj = node[GESTURE_KEY];
      var gs = gobj[type];
      if (!gs) {
        return;
      }
      if (!ev[HANDLED_OBJ]) {
        ev[HANDLED_OBJ] = {};
        if (type.slice(0, 5) === 'touch') {
          var t = ev.changedTouches[0];
          if (type === 'touchstart') {
            // only handle the first finger
            if (ev.touches.length === 1) {
              POINTERSTATE.touch.id = t.identifier;
            }
          }
          if (POINTERSTATE.touch.id !== t.identifier) {
            return;
          }
          if (!HAS_NATIVE_TA) {
            if (type === 'touchstart' || type === 'touchmove') {
              Gestures.handleTouchAction(ev);
            }
          }
          if (type === 'touchend') {
            POINTERSTATE.mouse.target = Polymer.dom(ev).rootTarget;
            // ignore syntethic mouse events after a touch
            ignoreMouse(true);
          }
        }
      }
      handled = ev[HANDLED_OBJ];
      // used to ignore synthetic mouse events
      if (handled.skip) {
        return;
      }
      var recognizers = Gestures.recognizers;
      // enforce gesture recognizer order
      for (var i = 0, r; i < recognizers.length; i++) {
        r = recognizers[i];
        if (gs[r.name] && !handled[r.name]) {
          handled[r.name] = true;
          r[type](ev);
        }
      }
    },

    handleTouchAction: function(ev) {
      var t = ev.changedTouches[0];
      var type = ev.type;
      if (type === 'touchstart') {
        POINTERSTATE.touch.x = t.clientX;
        POINTERSTATE.touch.y = t.clientY;
        POINTERSTATE.touch.scrollDecided = false;
      } else if (type === 'touchmove') {
        if (POINTERSTATE.touch.scrollDecided) {
          return;
        }
        POINTERSTATE.touch.scrollDecided = true;
        var ta = firstTouchAction(ev);
        var prevent = false;
        var dx = Math.abs(POINTERSTATE.touch.x - t.clientX);
        var dy = Math.abs(POINTERSTATE.touch.y - t.clientY);
        if (!ev.cancelable) {
          // scrolling is happening
        } else if (ta === 'none') {
          prevent = true;
        } else if (ta === 'pan-x') {
          prevent = dy > dx;
        } else if (ta === 'pan-y') {
          prevent = dx > dy;
        }
        if (prevent) {
          ev.preventDefault();
        }
      }
    },

    // automate the event listeners for the native events
    add: function(node, evType, handler) {
      var recognizer = this.gestures[evType];
      var deps = recognizer.deps;
      var name = recognizer.name;
      var gobj = node[GESTURE_KEY];
      if (!gobj) {
        node[GESTURE_KEY] = gobj = {};
      }
      for (var i = 0, dep, gd; i < deps.length; i++) {
        dep = deps[i];
        // don't add mouse handlers on iOS because they cause gray selection overlays
        if (IS_TOUCH_ONLY && MOUSE_EVENTS.indexOf(dep) > -1) {
          continue;
        }
        gd = gobj[dep];
        if (!gd) {
          gobj[dep] = gd = {_count: 0};
        }
        if (gd._count === 0) {
          node.addEventListener(dep, this.handleNative);
        }
        gd[name] = (gd[name] || 0) + 1;
        gd._count = (gd._count || 0) + 1;
      }
      node.addEventListener(evType, handler);
      if (recognizer.touchAction) {
        this.setTouchAction(node, recognizer.touchAction);
      }
    },

    // automate event listener removal for native events
    remove: function(node, evType, handler) {
      var recognizer = this.gestures[evType];
      var deps = recognizer.deps;
      var name = recognizer.name;
      var gobj = node[GESTURE_KEY];
      if (gobj) {
        for (var i = 0, dep, gd; i < deps.length; i++) {
          dep = deps[i];
          gd = gobj[dep];
          if (gd && gd[name]) {
            gd[name] = (gd[name] || 1) - 1;
            gd._count = (gd._count || 1) - 1;
          }
          if (gd._count === 0) {
            node.removeEventListener(dep, this.handleNative);
          }
        }
      }
      node.removeEventListener(evType, handler);
    },

    register: function(recog) {
      this.recognizers.push(recog);
      for (var i = 0; i < recog.emits.length; i++) {
        this.gestures[recog.emits[i]] = recog;
      }
    },

    findRecognizerByEvent: function(evName) {
      for (var i = 0, r; i < this.recognizers.length; i++) {
        r = this.recognizers[i];
        for (var j = 0, n; j < r.emits.length; j++) {
          n = r.emits[j];
          if (n === evName) {
            return r;
          }
        }
      }
      return null;
    },

    // set scrolling direction on node to check later on first move
    // must call this before adding event listeners!
    setTouchAction: function(node, value) {
      if (HAS_NATIVE_TA) {
        node.style.touchAction = value;
      }
      node[TOUCH_ACTION] = value;
    },

    fire: function(target, type, detail) {
      var ev = Polymer.Base.fire(type, detail, {
        node: target,
        bubbles: true,
        cancelable: true
      });

      // forward `preventDefault` in a clean way
      if (ev.defaultPrevented) {
        var se = detail.sourceEvent;
        // sourceEvent may be a touch, which is not preventable this way
        if (se && se.preventDefault) {
          se.preventDefault();
        }
      }
    },

    prevent: function(evName) {
      var recognizer = this.findRecognizerByEvent(evName);
      if (recognizer.info) {
        recognizer.info.prevent = true;
      }
    }
  };

  Gestures.register({
    name: 'downup',
    deps: ['mousedown', 'touchstart', 'touchend'],
    emits: ['down', 'up'],

    mousedown: function(e) {
      var t = Gestures.findOriginalTarget(e);
      var self = this;
      var upfn = function upfn(e) {
        self.fire('up', t, e);
        document.removeEventListener('mouseup', upfn);
      };
      document.addEventListener('mouseup', upfn);
      this.fire('down', t, e);
    },
    touchstart: function(e) {
      this.fire('down', Gestures.findOriginalTarget(e), e.changedTouches[0]);
    },
    touchend: function(e) {
      this.fire('up', Gestures.findOriginalTarget(e), e.changedTouches[0]);
    },
    fire: function(type, target, event) {
      var self = this;
      Gestures.fire(target, type, {
        x: event.clientX,
        y: event.clientY,
        sourceEvent: event,
        prevent: Gestures.prevent.bind(Gestures)
      });
    }
  });

  Gestures.register({
    name: 'track',
    touchAction: 'none',
    deps: ['mousedown', 'touchstart', 'touchmove', 'touchend'],
    emits: ['track'],

    info: {
      x: 0,
      y: 0,
      state: 'start',
      started: false,
      moves: [],
      addMove: function(move) {
        if (this.moves.length > TRACK_LENGTH) {
          this.moves.shift();
        }
        this.moves.push(move);
      },
      prevent: false
    },

    clearInfo: function() {
      this.info.state = 'start';
      this.info.started = false;
      this.info.moves = [];
      this.info.x = 0;
      this.info.y = 0;
      this.info.prevent = false;
    },

    hasMovedEnough: function(x, y) {
      if (this.info.prevent) {
        return false;
      }
      if (this.info.started) {
        return true;
      }
      var dx = Math.abs(this.info.x - x);
      var dy = Math.abs(this.info.y - y);
      return (dx >= TRACK_DISTANCE || dy >= TRACK_DISTANCE);
    },

    mousedown: function(e) {
      var t = Gestures.findOriginalTarget(e);
      var self = this;
      var movefn = function movefn(e) {
        var x = e.clientX, y = e.clientY;
        if (self.hasMovedEnough(x, y)) {
          // first move is 'start', subsequent moves are 'move', mouseup is 'end'
          self.info.state = self.info.started ? (e.type === 'mouseup' ? 'end' : 'track') : 'start';
          self.info.addMove({x: x, y: y});
          self.fire(t, e);
          self.info.started = true;
        }
      };
      var upfn = function upfn(e) {
        if (self.info.started) {
          Gestures.prevent('tap');
          movefn(e);
        }
        self.clearInfo();
        // remove the temporary listeners
        document.removeEventListener('mousemove', movefn);
        document.removeEventListener('mouseup', upfn);
      };
      // add temporary document listeners as mouse retargets
      document.addEventListener('mousemove', movefn);
      document.addEventListener('mouseup', upfn);
      this.info.x = e.clientX;
      this.info.y = e.clientY;
    },

    touchstart: function(e) {
      var ct = e.changedTouches[0];
      this.info.x = ct.clientX;
      this.info.y = ct.clientY;
    },

    touchmove: function(e) {
      var t = Gestures.findOriginalTarget(e);
      var ct = e.changedTouches[0];
      var x = ct.clientX, y = ct.clientY;
      if (this.hasMovedEnough(x, y)) {
        this.info.addMove({x: x, y: y});
        this.fire(t, ct);
        this.info.state = 'track';
        this.info.started = true;
      }
    },

    touchend: function(e) {
      var t = Gestures.findOriginalTarget(e);
      var ct = e.changedTouches[0];
      // only trackend if track was started and not aborted
      if (this.info.started) {
        // iff tracking, always prevent tap
        Gestures.prevent('tap');
        // reset started state on up
        this.info.state = 'end';
        this.info.addMove({x: ct.clientX, y: ct.clientY});
        this.fire(t, ct);
      }
      this.clearInfo();
    },

    fire: function(target, touch) {
      var secondlast = this.info.moves[this.info.moves.length - 2];
      var lastmove = this.info.moves[this.info.moves.length - 1];
      var dx = lastmove.x - this.info.x;
      var dy = lastmove.y - this.info.y;
      var ddx, ddy = 0;
      if (secondlast) {
        ddx = lastmove.x - secondlast.x;
        ddy = lastmove.y - secondlast.y;
      }
      return Gestures.fire(target, 'track', {
        state: this.info.state,
        x: touch.clientX,
        y: touch.clientY,
        dx: dx,
        dy: dy,
        ddx: ddx,
        ddy: ddy,
        sourceEvent: touch,
        hover: function() {
          return Gestures.deepTargetFind(touch.clientX, touch.clientY);
        }
      });
    }

  });

  Gestures.register({
    name: 'tap',
    deps: ['mousedown', 'click', 'touchstart', 'touchend'],
    emits: ['tap'],
    info: {
      x: NaN,
      y: NaN,
      prevent: false
    },
    reset: function() {
      this.info.x = NaN;
      this.info.y = NaN;
      this.info.prevent = false;
    },
    save: function(e) {
      this.info.x = e.clientX;
      this.info.y = e.clientY;
    },

    mousedown: function(e) {
      this.save(e);
    },
    click: function(e) {
      this.forward(e);
    },

    touchstart: function(e) {
      this.save(e.changedTouches[0]);
    },
    touchend: function(e) {
      this.forward(e.changedTouches[0]);
    },

    forward: function(e) {
      var dx = Math.abs(e.clientX - this.info.x);
      var dy = Math.abs(e.clientY - this.info.y);
      var t = Gestures.findOriginalTarget(e);
      // dx,dy can be NaN if `click` has been simulated and there was no `down` for `start`
      if (isNaN(dx) || isNaN(dy) || (dx <= TAP_DISTANCE && dy <= TAP_DISTANCE)) {
        // prevent taps from being generated if an event has canceled them
        if (!this.info.prevent) {
          Gestures.fire(t, 'tap', {
            x: e.clientX,
            y: e.clientY,
            sourceEvent: e
          });
        }
      }
      this.reset();
    }
  });

  var DIRECTION_MAP = {
    x: 'pan-x',
    y: 'pan-y',
    none: 'none',
    all: 'auto'
  };

  Polymer.Base._addFeature({
    // override _listen to handle gestures
    _listen: function(node, eventName, handler) {
      if (Gestures.gestures[eventName]) {
        Gestures.add(node, eventName, handler);
      } else {
        node.addEventListener(eventName, handler);
      }
    },
    // override _unlisten to handle gestures
    _unlisten: function(node, eventName, handler) {
      if (Gestures.gestures[eventName]) {
        Gestures.remove(node, eventName, handler);
      } else {
        node.removeEventListener(eventName, handler);
      }
    },
    /**
     * Override scrolling behavior to all direction, one direction, or none.
     *
     * Valid scroll directions:
     *   - 'all': scroll in any direction
     *   - 'x': scroll only in the 'x' direction
     *   - 'y': scroll only in the 'y' direction
     *   - 'none': disable scrolling for this node
     *
     * @method setScrollDirection
     * @param {String=} direction Direction to allow scrolling
     * Defaults to `all`.
     * @param {HTMLElement=} node Element to apply scroll direction setting.
     * Defaults to `this`.
     */
    setScrollDirection: function(direction, node) {
      node = node || this;
      Gestures.setTouchAction(node, DIRECTION_MAP[direction] || 'auto');
    }
  });

  // export

  Polymer.Gestures = Gestures;

})();



Polymer.Async = {

  _currVal: 0,
  _lastVal: 0,
  _callbacks: [],
  _twiddleContent: 0,
  _twiddle: document.createTextNode(''),

  run: function (callback, waitTime) {
    if (waitTime > 0) {
      return ~setTimeout(callback, waitTime);
    } else {
      this._twiddle.textContent = this._twiddleContent++;
      this._callbacks.push(callback);
      return this._currVal++;
    }
  },

  cancel: function(handle) {
    if (handle < 0) {
      clearTimeout(~handle);
    } else {
      var idx = handle - this._lastVal;
      if (idx >= 0) {
        if (!this._callbacks[idx]) {
          throw 'invalid async handle: ' + handle;
        }
        this._callbacks[idx] = null;
      }
    }
  },

  _atEndOfMicrotask: function() {
    var len = this._callbacks.length;
    for (var i=0; i<len; i++) {
      var cb = this._callbacks[i];
      if (cb) {
        try {
          cb();
        } catch(e) {
          // Clear queue up to this point & start over after throwing
          i++;
          this._callbacks.splice(0, i);
          this._lastVal += i;
          this._twiddle.textContent = this._twiddleContent++;
          throw e;
        }
      }
    }
    this._callbacks.splice(0, len);
    this._lastVal += len;
  }
};

new (window.MutationObserver || JsMutationObserver)
  (Polymer.Async._atEndOfMicrotask.bind(Polymer.Async))
  .observe(Polymer.Async._twiddle, {characterData: true});




Polymer.Debounce = (function() {
  
  // usage
  
  // invoke cb.call(this) in 100ms, unless the job is re-registered,
  // which resets the timer
  // 
  // this.job = this.debounce(this.job, cb, 100)
  //
  // returns a handle which can be used to re-register a job

  var Async = Polymer.Async;
  
  var Debouncer = function(context) {
    this.context = context;
    this.boundComplete = this.complete.bind(this);
  };
  
  Debouncer.prototype = {
    go: function(callback, wait) {
      var h;
      this.finish = function() {
        Async.cancel(h);
      };
      h = Async.run(this.boundComplete, wait);
      this.callback = callback;
    },
    stop: function() {
      if (this.finish) {
        this.finish();
        this.finish = null;
      }
    },
    complete: function() {
      if (this.finish) {
        this.stop();
        this.callback.call(this.context);
      }
    }
  };

  function debounce(debouncer, callback, wait) {
    if (debouncer) {
      debouncer.stop();
    } else {
      debouncer = new Debouncer(this);
    }
    debouncer.go(callback, wait);
    return debouncer;
  }
  
  // exports 

  return debounce;
  
})();




  Polymer.Base._addFeature({

    /**
     * Convenience method to run `querySelector` on this local DOM scope.
     *
     * This function calls `Polymer.dom(this.root).querySelector(slctr)`.
     *
     * @method $$
     * @param {string} slctr Selector to run on this local DOM scope
     * @return {Element} Element found by the selector, or null if not found.
     */
    $$: function(slctr) {
      return Polymer.dom(this.root).querySelector(slctr);
    },

    /**
     * Toggles a CSS class on or off.
     *
     * @method toggleClass
     * @param {String} name CSS class name
     * @param {boolean=} bool Boolean to force the class on or off.
     *    When unspecified, the state of the class will be reversed.
     * @param {HTMLElement=} node Node to target.  Defaults to `this`.
     */
    toggleClass: function(name, bool, node) {
      node = node || this;
      if (arguments.length == 1) {
        bool = !node.classList.contains(name);
      }
      if (bool) {
        Polymer.dom(node).classList.add(name);
      } else {
        Polymer.dom(node).classList.remove(name);
      }
    },

    /**
     * Toggles an HTML attribute on or off.
     *
     * @method toggleAttribute
     * @param {String} name HTML attribute name
     * @param {boolean=} bool Boolean to force the attribute on or off.
     *    When unspecified, the state of the attribute will be reversed.
     * @param {HTMLElement=} node Node to target.  Defaults to `this`.
     */
    toggleAttribute: function(name, bool, node) {
      node = node || this;
      if (arguments.length == 1) {
        bool = !node.hasAttribute(name);
      }
      if (bool) {
        Polymer.dom(node).setAttribute(name, '');
      } else {
        Polymer.dom(node).removeAttribute(name);
      }
    },

    /**
     * Removes a class from one node, and adds it to another.
     *
     * @method classFollows
     * @param {String} name CSS class name
     * @param {HTMLElement} toElement New element to add the class to.
     * @param {HTMLElement} fromElement Old element to remove the class from.
     */
    classFollows: function(name, toElement, fromElement) {
      if (fromElement) {
        Polymer.dom(fromElement).classList.remove(name);
      }
      if (toElement) {
        Polymer.dom(toElement).classList.add(name);
      }
    },

    /**
     * Removes an HTML attribute from one node, and adds it to another.
     *
     * @method attributeFollows
     * @param {String} name HTML attribute name
     * @param {HTMLElement} toElement New element to add the attribute to.
     * @param {HTMLElement} fromElement Old element to remove the attribute from.
     */
    attributeFollows: function(name, toElement, fromElement) {
      if (fromElement) {
        Polymer.dom(fromElement).removeAttribute(name);
      }
      if (toElement) {
        Polymer.dom(toElement).setAttribute(name, '');
      }
    },

    /**
     * Returns a list of nodes distributed to this element's `<content>`.
     *
     * If this element contans more than one `<content>` in its local DOM,
     * an optional selector may be passed to choose the desired content.
     *
     * @method getContentChildNodes
     * @param {String=} slctr CSS selector to choose the desired
     *   `<content>`.  Defaults to `content`.
     * @return {Array<Node>} List of distributed nodes for the `<content>`.
     */
    getContentChildNodes: function(slctr) {
      var content = Polymer.dom(this.root).querySelector(slctr || 'content');
      return content ? Polymer.dom(content).getDistributedNodes() : [];
    },

    /**
     * Returns a list of element children distributed to this element's
     * `<content>`.
     *
     * If this element contans more than one `<content>` in its
     * local DOM, an optional selector may be passed to choose the desired
     * content.  This method differs from `getContentChildNodes` in that only
     * elements are returned.
     *
     * @method getContentChildNodes
     * @param {String=} slctr CSS selector to choose the desired
     *   `<content>`.  Defaults to `content`.
     * @return {Array<HTMLElement>} List of distributed nodes for the
     *   `<content>`.
     */
    getContentChildren: function(slctr) {
      return this.getContentChildNodes(slctr).filter(function(n) {
        return (n.nodeType === Node.ELEMENT_NODE);
      });
    },

    /**
     * Dispatches a custom event with an optional detail object.
     *
     * @method fire
     * @param {String} type Name of event type.
     * @param {Object=} detail Detail object containing event-specific
     *   payload.
     * @param {Object=} options Object specifying options.  These
     *   may include `bubbles` (boolean), `cancelable` (boolean), and `node`
     *   on which to fire the event (HTMLElement, defaults to `this`).
     * @return {CustomEvent} The new event that was fired.
     */
    fire: function(type, detail, options) {
      options = options || Polymer.nob;
      var node = options.node || this;
      var detail = (detail === null || detail === undefined) ? Polymer.nob : detail;
      var bubbles = options.bubbles === undefined ? true : options.bubbles;
      var cancelable = Boolean(options.cancelable);
      var event = new CustomEvent(type, {
        bubbles: Boolean(bubbles),
        cancelable: cancelable,
        detail: detail
      });
      node.dispatchEvent(event);
      return event;
    },

    /**
     * Runs a callback function asyncronously.
     *
     * By default (if no waitTime is specified), async callbacks are run at
     * microtask timing, which will occur before paint.
     *
     * @method async
     * @param {Function} callback The callback function to run, bound to `this`.
     * @param {number=} waitTime Time to wait before calling the
     *   `callback`.  If unspecified or 0, the callback will be run at microtask
     *   timing (before paint).
     * @return {number} Handle that may be used to cancel the async job.
     */
    async: function(callback, waitTime) {
      return Polymer.Async.run(callback.bind(this), waitTime);
    },

    /**
     * Cancels an async operation started with `async`.
     *
     * @method cancelAsync
     * @param {number} handle Handle returned from original `async` call to
     *   cancel.
     */
    cancelAsync: function(handle) {
      Polymer.Async.cancel(handle);
    },

    /**
     * Removes an item from an array, if it exists.
     *
     * @method arrayDelete
     * @param {String|Array} path Path torray from which to remove the item
     *   (or the array itself).
     * @param {any} item Item to remove.
     * @return {Array} Array containing item removed.
     */
    arrayDelete: function(path, item) {
      var index;
      if (Array.isArray(path)) {
        index = path.indexOf(item);
        if (index >= 0) {
          return path.splice(index, 1);
        }
      } else {
        var arr = this.get(path);
        index = arr.indexOf(item);
        if (index >= 0) {
          return this.splice(path, index, 1);
        }
      }
    },

    /**
     * Cross-platform helper for setting an element's CSS `transform` property.
     *
     * @method transform
     * @param {String} transform Transform setting.
     * @param {HTMLElement=} node Element to apply the transform to.
     * Defaults to `this`
     */
    transform: function(transform, node) {
      node = node || this;
      node.style.webkitTransform = transform;
      node.style.transform = transform;
    },

    /**
     * Cross-platform helper for setting an element's CSS `translate3d`
     * property.
     *
     * @method translate3d
     * @param {number} x X offset.
     * @param {number} y Y offset.
     * @param {number} z Z offset.
     * @param {HTMLElement=} node Element to apply the transform to.
     * Defaults to `this`.
     */
    translate3d: function(x, y, z, node) {
      node = node || this;
      this.transform('translate3d(' + x + ',' + y + ',' + z + ')', node);
    },

    /**
     * Convenience method for importing an HTML document imperatively.
     *
     * This method creates a new `<link rel="import">` element with
     * the provided URL and appends it to the document to start loading.
     * In the `onload` callback, the `import` property of the `link`
     * element will contain the imported document contents.
     *
     * @method importHref
     * @param {string} href URL to document to load.
     * @param {Function} onload Callback to notify when an import successfully
     *   loaded.
     * @param {Function} onerror Callback to notify when an import
     *   unsuccessfully loaded.
     * @return {HTMLLinkElement} The link element for the URL to be loaded.
     */
    importHref: function(href, onload, onerror) {
      var l = document.createElement('link');
      l.rel = 'import';
      l.href = href;
      if (onload) {
        l.onload = onload.bind(this);
      }
      if (onerror) {
        l.onerror = onerror.bind(this);
      }
      document.head.appendChild(l);
      return l;
    },

    /**
     * Convenience method for creating an element and configuring it.
     *
     * @method create
     * @param {string} tag HTML element tag to create.
     * @param {Object} props Object of properties to configure on the
     *    instance.
     * @return {Element} Newly created and configured element.
     */
    create: function(tag, props) {
      var elt = document.createElement(tag);
      if (props) {
        for (var n in props) {
          elt[n] = props[n];
        }
      }
      return elt;
    }

  });




  Polymer.Bind = {

    // for prototypes (usually)

    prepareModel: function(model) {
      model._propertyEffects = {};
      model._bindListeners = [];
      Polymer.Base.mixin(model, this._modelApi);
    },

    _modelApi: {

      _notifyChange: function(property) {
        var eventName = Polymer.CaseMap.camelToDashCase(property) + '-changed';
        Polymer.Base.fire(eventName, {
          value: this[property]
        }, {bubbles: false, node: this});
      },

      // TODO(sjmiles): removing _notifyListener from here breaks accessors.html
      // as a standalone lib. This is temporary, as standard/configure.html
      // installs it's own version on Polymer.Base, and we need that to work
      // right now.
      // NOTE: exists as a hook for processing listeners
      /*
      _notifyListener: function(fn, e) {
        // NOTE: pass e.target because e.target can get lost if this function
        // is queued asynchrously
        return fn.call(this, e, e.target);
      },
      */

      // Called from accessors, where effects is pre-stored
      // in the closure for the accessor for efficiency
      _propertySetter: function(property, value, effects, fromAbove) {
        var old = this.__data__[property];
        // NaN is always not equal to itself,
        // if old and value are both NaN we treat them as equal
        // x === x is 10x faster, and equivalent to !isNaN(x)
        if (old !== value && (old === old || value === value)) {
          this.__data__[property] = value;
          if (typeof value == 'object') {
            this._clearPath(property);
          }
          if (this._propertyChanged) {
            this._propertyChanged(property, value, old);
          }
          if (effects) {
            this._effectEffects(property, value, effects, old, fromAbove);
          }
        }
        return old;
      },

      // Called during _applyConfig (well-known downward data-flow hot path)
      // in order to avoid firing notify events
      // TODO(kschaaf): downward bindings (e.g. _applyEffectValue) should also
      // use non-notifying setters but right now that would require looking
      // up readOnly property config in the hot-path
      __setProperty: function(property, value, quiet, node) {
        node = node || this;
        var effects = node._propertyEffects && node._propertyEffects[property];
        if (effects) {
          node._propertySetter(property, value, effects, quiet);
        } else {
          node[property] = value;
        }
      },

      _effectEffects: function(property, value, effects, old, fromAbove) {
        effects.forEach(function(fx) {
          //console.log(fx);
          var fn = Polymer.Bind['_' + fx.kind + 'Effect'];
          if (fn) {
            fn.call(this, property, value, fx.effect, old, fromAbove);
          }
        }, this);
      },

      _clearPath: function(path) {
        for (var prop in this.__data__) {
          if (prop.indexOf(path + '.') === 0) {
            this.__data__[prop] = undefined;
          }
        }
      }

    },

    // a prepared model can acquire effects

    ensurePropertyEffects: function(model, property) {
      var fx = model._propertyEffects[property];
      if (!fx) {
        fx = model._propertyEffects[property] = [];
      }
      return fx;
    },

    addPropertyEffect: function(model, property, kind, effect) {
      var fx = this.ensurePropertyEffects(model, property);
      fx.push({
        kind: kind,
        effect: effect
      });
    },

    createBindings: function(model) {
      //console.group(model.is);
      // map of properties to effects
      var fx$ = model._propertyEffects;
      if (fx$) {
        // for each property with effects
        for (var n in fx$) {
          // array of effects
          var fx = fx$[n];
          // effects have priority
          fx.sort(this._sortPropertyEffects);
          // create accessors
          this._createAccessors(model, n, fx);
        }
      }
      //console.groupEnd();
    },

    _sortPropertyEffects: (function() {
      // TODO(sjmiles): EFFECT_ORDER buried this way is not ideal,
      // but presumably the sort method is going to be a hot path and not
      // have a `this`. There is also a problematic dependency on effect.kind
      // values here, which are otherwise pluggable.
      var EFFECT_ORDER = {
        'compute': 0,
        'annotation': 1,
        'computedAnnotation': 2,
        'reflect': 3,
        'notify': 4,
        'observer': 5,
        'complexObserver': 6,
        'function': 7
      };
      return function(a, b) {
        return EFFECT_ORDER[a.kind] - EFFECT_ORDER[b.kind];
      };
    })(),

    // create accessors that implement effects

    _createAccessors: function(model, property, effects) {
      var defun = {
        get: function() {
          // TODO(sjmiles): elide delegation for performance, good ROI?
          return this.__data__[property];
        }
      };
      var setter = function(value) {
        this._propertySetter(property, value, effects);
      };
      // ReadOnly properties have a private setter only
      // TODO(kschaaf): Per current Bind factoring, we shouldn't
      // be interrogating the prototype here
      var info = model.getPropertyInfo && model.getPropertyInfo(property);
      if (info && info.readOnly) {
        // Computed properties are read-only (no property setter), but also don't
        // need a private setter since they should not be called by the user
        if (!info.computed) {
          model['_set' + this.upper(property)] = setter;
        }
      } else {
        defun.set = setter;
      }
      Object.defineProperty(model, property, defun);
    },

    upper: function(name) {
      return name[0].toUpperCase() + name.substring(1);
    },

    _addAnnotatedListener: function(model, index, property, path, event) {
      var fn = this._notedListenerFactory(property, path,
        this._isStructured(path), this._isEventBogus);
      var eventName = event ||
        (Polymer.CaseMap.camelToDashCase(property) + '-changed');
      model._bindListeners.push({
        index: index,
        property: property,
        path: path,
        changedFn: fn,
        event: eventName
      });
    },

    _isStructured: function(path) {
      return path.indexOf('.') > 0;
    },

    _isEventBogus: function(e, target) {
      return e.path && e.path[0] !== target;
    },

    _notedListenerFactory: function(property, path, isStructured, bogusTest) {
      return function(e, target) {
        if (!bogusTest(e, target)) {
          if (e.detail && e.detail.path) {
            this.notifyPath(this._fixPath(path, property, e.detail.path),
              e.detail.value);
          } else {
            var value = target[property];
            if (!isStructured) {
              this[path] = target[property];
            } else {
              // TODO(kschaaf): dirty check avoids null references when the object has gone away
              if (this.__data__[path] != value) {
                this.set(path, value);
              }
            }
          }
        }
      };
    },

    // for instances

    prepareInstance: function(inst) {
      inst.__data__ = Object.create(null);
    },

    setupBindListeners: function(inst) {
      inst._bindListeners.forEach(function(info) {
        // Property listeners:
        // <node>.on.<property>-changed: <path]> = e.detail.value
        //console.log('[_setupBindListener]: [%s][%s] listening for [%s][%s-changed]', this.localName, info.path, info.id || info.index, info.property);
        var node = inst._nodes[info.index];
        node.addEventListener(info.event, inst._notifyListener.bind(inst, info.changedFn));
      });
    }

  };




  Polymer.Base.extend(Polymer.Bind, {

    _shouldAddListener: function(effect) {
      return effect.name &&
             effect.mode === '{' &&
             !effect.negate &&
             effect.kind != 'attribute'
             ;
    },

    _annotationEffect: function(source, value, effect) {
      if (source != effect.value) {
        value = this.get(effect.value);
        this.__data__[effect.value] = value;
      }
      var calc = effect.negate ? !value : value;
      // For better interop, dirty check before setting when custom events
      // are used, since the target element may not dirty check (e.g. <input>)
      if (!effect.customEvent ||
          this._nodes[effect.index][effect.name] !== calc) {
        return this._applyEffectValue(calc, effect);
      }
    },

    _reflectEffect: function(source) {
      this.reflectPropertyToAttribute(source);
    },

    _notifyEffect: function(source, value, effect, old, fromAbove) {
      if (!fromAbove) {
        this._notifyChange(source);
      }
    },

    // Raw effect for extension
    _functionEffect: function(source, value, fn, old, fromAbove) {
      fn.call(this, source, value, old, fromAbove);
    },

    _observerEffect: function(source, value, effect, old) {
      var fn = this[effect.method];
      if (fn) {
        fn.call(this, value, old);
      } else {
        this._warn(this._logf('_observerEffect', 'observer method `' +
          effect.method + '` not defined'));
      }
    },

    _complexObserverEffect: function(source, value, effect) {
      var fn = this[effect.method];
      if (fn) {
        var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
        if (args) {
          fn.apply(this, args);
        }
      } else {
        this._warn(this._logf('_complexObserverEffect', 'observer method `' +
          effect.method + '` not defined'));
      }
    },

    _computeEffect: function(source, value, effect) {
      var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
      if (args) {
        var fn = this[effect.method];
        if (fn) {
          this.__setProperty(effect.property, fn.apply(this, args));
        } else {
          this._warn(this._logf('_computeEffect', 'compute method `' +
            effect.method + '` not defined'));
        }
      }
    },

    _annotatedComputationEffect: function(source, value, effect) {
      var computedHost = this._rootDataHost || this;
      var fn = computedHost[effect.method];
      if (fn) {
        var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
        if (args) {
          var computedvalue = fn.apply(computedHost, args);
          if (effect.negate) {
            computedvalue = !computedvalue;
          }
          this._applyEffectValue(computedvalue, effect);
        }
      } else {
        computedHost._warn(computedHost._logf('_annotatedComputationEffect',
          'compute method `' + effect.method + '` not defined'));
      }
    },

    // path & value are used to fill in wildcard descriptor when effect is
    // being called as a result of a path notification
    _marshalArgs: function(model, effect, path, value) {
      var values = [];
      var args = effect.args;
      for (var i=0, l=args.length; i<l; i++) {
        var arg = args[i];
        var name = arg.name;
        var v;
        if (arg.literal) {
          v = arg.value;
        } else if (arg.structured) {
          v = Polymer.Base.get(name, model);
        } else {
          v = model[name];
        }
        if (args.length > 1 && v === undefined) {
          return;
        }
        if (arg.wildcard) {
          // Only send the actual path changed info if the change that
          // caused the observer to run matched the wildcard
          var baseChanged = (name.indexOf(path + '.') === 0);
          var matches = (effect.trigger.name.indexOf(name) === 0 && !baseChanged);
          values[i] = {
            path: matches ? path : name,
            value: matches ? value : v,
            base: v
          };
        } else {
          values[i] = v;
        }
      }
      return values;
    }

  });




  /**
   * Support for property side effects.
   *
   * Key for effect objects:
   *
   * property | ann | anCmp | cmp | obs | cplxOb | description
   * ---------|-----|-------|-----|-----|--------|----------------------------------------
   * method   |     | X     | X   | X   | X      | function name to call on instance
   * args     |     | X     | X   |     | X      | arg descriptors for triggers of fn
   * trigger  |     | X     | X   |     | X      | describes triggering dependency (one of args)
   * property |     |       | X   | X   |        | property for effect to set or get
   * name     | X   |       |     |     |        | annotation value (text inside {{...}})
   * kind     | X   | X     |     |     |        | binding type (property or attribute)
   * index    | X   | X     |     |     |        | node index to set
   *
   */

  Polymer.Base._addFeature({

    _addPropertyEffect: function(property, kind, effect) {
     Polymer.Bind.addPropertyEffect(this, property, kind, effect);
    },

    // prototyping

    _prepEffects: function() {
      Polymer.Bind.prepareModel(this);
      this._addAnnotationEffects(this._notes);
    },

    _prepBindings: function() {
      Polymer.Bind.createBindings(this);
    },

    _addPropertyEffects: function(properties) {
      if (properties) {
        for (var p in properties) {
          var prop = properties[p];
          if (prop.observer) {
            this._addObserverEffect(p, prop.observer);
          }
          if (prop.computed) {
            // Computed properties are implicitly readOnly
            prop.readOnly = true;
            this._addComputedEffect(p, prop.computed);
          }
          if (prop.notify) {
            this._addPropertyEffect(p, 'notify');
          }
          if (prop.reflectToAttribute) {
            this._addPropertyEffect(p, 'reflect');
          }
          if (prop.readOnly) {
            // Ensure accessor is created
            Polymer.Bind.ensurePropertyEffects(this, p);
          }
        }
      }
    },

    _addComputedEffect: function(name, expression) {
      var sig = this._parseMethod(expression);
      sig.args.forEach(function(arg) {
        this._addPropertyEffect(arg.model, 'compute', {
          method: sig.method,
          args: sig.args,
          trigger: arg,
          property: name
        });
      }, this);
    },

    _addObserverEffect: function(property, observer) {
      this._addPropertyEffect(property, 'observer', {
        method: observer,
        property: property
      });
    },

    _addComplexObserverEffects: function(observers) {
      if (observers) {
        observers.forEach(function(observer) {
          this._addComplexObserverEffect(observer);
        }, this);
      }
    },

    _addComplexObserverEffect: function(observer) {
      var sig = this._parseMethod(observer);
      sig.args.forEach(function(arg) {
        this._addPropertyEffect(arg.model, 'complexObserver', {
          method: sig.method,
          args: sig.args,
          trigger: arg
        });
      }, this);
    },

    _addAnnotationEffects: function(notes) {
      // create a virtual annotation list, must be concretized at instance time
      this._nodes = [];
      // process annotations that have been parsed from template
      notes.forEach(function(note) {
        // where to find the node in the concretized list
        var index = this._nodes.push(note) - 1;
        note.bindings.forEach(function(binding) {
          this._addAnnotationEffect(binding, index);
        }, this);
      }, this);
    },

    _addAnnotationEffect: function(note, index) {
      // TODO(sjmiles): annotations have 'effects' proper and 'listener'
      if (Polymer.Bind._shouldAddListener(note)) {
        // <node>.on.<dash-case-property>-changed: <path> = e.detail.value
        Polymer.Bind._addAnnotatedListener(this, index,
          note.name, note.value, note.event);
      }
      if (note.signature) {
        this._addAnnotatedComputationEffect(note, index);
      } else {
        // capture the node index
        note.index = index;
        // add 'annotation' binding effect for property 'model'
        this._addPropertyEffect(note.model, 'annotation', note);
      }
    },

    _addAnnotatedComputationEffect: function(note, index) {
      var sig = note.signature;
      if (sig.static) {
        this.__addAnnotatedComputationEffect('__static__', index, note, sig, null);
      } else {
        sig.args.forEach(function(arg) {
          if (!arg.literal) {
            this.__addAnnotatedComputationEffect(arg.model, index, note, sig, arg);
          }
        }, this);
      }
    },

    __addAnnotatedComputationEffect: function(property, index, note, sig, trigger) {
      this._addPropertyEffect(property, 'annotatedComputation', {
        index: index,
        kind: note.kind,
        property: note.name,
        negate: note.negate,
        method: sig.method,
        args: sig.args,
        trigger: trigger
      });
    },

    // method expressions are of the form: `name([arg1, arg2, .... argn])`
    _parseMethod: function(expression) {
      var m = expression.match(/(\w*)\((.*)\)/);
      if (m) {
        var sig = { method: m[1], static: true };
        if (m[2].trim()) {
          // replace escaped commas with comma entity, split on un-escaped commas
          var args = m[2].replace(/\\,/g, '&comma;').split(',');
          return this._parseArgs(args, sig);
        } else {
          sig.args = Polymer.nar;
          return sig;
        }
      }
    },

    _parseArgs: function(argList, sig) {
      sig.args = argList.map(function(rawArg) {
        var arg = this._parseArg(rawArg);
        if (!arg.literal) {
          sig.static = false;
        }
        return arg;
      }, this);
      return sig;
    },

    _parseArg: function(rawArg) {
      // clean up whitespace
      var arg = rawArg.trim()
        // replace comma entity with comma
        .replace(/&comma;/g, ',')
        // repair extra escape sequences; note only commas strictly need
        // escaping, but we allow any other char to be escaped since its
        // likely users will do this
        .replace(/\\(.)/g, '\$1')
        ;
      // basic argument descriptor
      var a = {
        name: arg,
        model: this._modelForPath(arg)
      };
      // detect literal value (must be String or Number)
      var fc = arg[0];
      if (fc >= '0' && fc <= '9') {
        fc = '#';
      }
      switch(fc) {
        case "'":
        case '"':
          a.value = arg.slice(1, -1);
          a.literal = true;
          break;
        case '#':
          a.value = Number(arg);
          a.literal = true;
          break;
      }
      // if not literal, look for structured path
      if (!a.literal) {
        // detect structured path (has dots)
        a.structured = arg.indexOf('.') > 0;
        if (a.structured) {
          a.wildcard = (arg.slice(-2) == '.*');
          if (a.wildcard) {
            a.name = arg.slice(0, -2);
          }
        }
      }
      return a;
    },

    // instancing

    _marshalInstanceEffects: function() {
      Polymer.Bind.prepareInstance(this);
      Polymer.Bind.setupBindListeners(this);
    },

    _applyEffectValue: function(value, info) {
      var node = this._nodes[info.index];
      // TODO(sorvell): ideally, the info object is normalized for easy
      // lookup here.
      var property = info.property || info.name || 'textContent';
      // special processing for 'class' and 'className'; 'class' handled
      // when attr is serialized.
      if (info.kind == 'attribute') {
        this.serializeValueToAttribute(value, property, node);
      } else {
        // TODO(sorvell): consider pre-processing the following two string
        // comparisons in the hot path so this can be a boolean check
        if (property === 'className') {
          value = this._scopeElementClass(node, value);
        }
        // Some browsers serialize `undefined` to `"undefined"`
        if (property === 'textContent' ||
            (node.localName == 'input' && property == 'value')) {
          value = value == undefined ? '' : value;
        }
        // TODO(kschaaf): Ideally we'd use `fromAbove: true`, but this
        // breaks read-only properties
        // this.__setProperty(property, value, true, node);
        return node[property] = value;
      }
    },

    _executeStaticEffects: function() {
      if (this._propertyEffects.__static__) {
        this._effectEffects('__static__', null, this._propertyEffects.__static__);
      }
    }

  });




  /*
    Process inputs efficiently via a configure lifecycle callback.
    Configure is called top-down, host before local dom. Users should
    implement configure to supply a set of default values for the element by
    returning an object containing the properties and values to set.

    Configured values are not immediately set, instead they are set when
    an element becomes ready, after its local dom is ready. This ensures
    that any user change handlers are not called before ready time.

  */

  /*
  Implementation notes:

  Configured values are collected into _config. At ready time, properties
  are set to the values in _config. This ensures properties are set child
  before host and change handlers are called only at ready time. The host
  will reset a value already propagated to a child, but this is not
  inefficient because of dirty checking at the set point.

  Bind notification events are sent when properties are set at ready time
  and thus received by the host before it is ready. Since notifications result
  in property updates and this triggers side effects, handling notifications
  is deferred until ready time.

  In general, events can be heard before an element is ready. This may occur
  when a user sends an event in a change handler or listens to a data event
  directly (on-foo-changed).
  */

  Polymer.Base._addFeature({

    // storage for configuration
    _setupConfigure: function(initialConfig) {
      this._config = initialConfig || {};
      this._handlers = [];
    },

    // static attributes are deserialized into _config
    _marshalAttributes: function() {
      this._takeAttributesToModel(this._config);
    },

    // at configure time values are stored in _config
    _configValue: function(name, value) {
      this._config[name] = value;
    },

    // Override polymer-mini thunk
    _beforeClientsReady: function() {
      this._configure();
    },

    // configure: returns user supplied default property values
    // combines with _config to create final property values
    _configure: function() {
      // some annotation data needs to be handed from host to client
      // e.g. hand template content stored in notes to children as part of
      // configure flow so templates have their content at ready time
      this._configureAnnotationReferences();
      // save copy of configuration that came from above
      this._aboveConfig = this.mixin({}, this._config);
      // get individual default values from property configs
      var config = {};
      // mixed-in behaviors
      this.behaviors.forEach(function(b) {
        this._configureProperties(b.properties, config);
      }, this);
      // prototypical behavior
      this._configureProperties(this.properties, config);
      // override local configuration with configuration from above
      this._mixinConfigure(config, this._aboveConfig);
      // this is the new _config, which are the final values to be applied
      this._config = config;
      // pass configuration data to bindings
      this._distributeConfig(this._config);
    },

    _configureProperties: function(properties, config) {
      for (var i in properties) {
        var c = properties[i];
        if (c.value !== undefined) {
          var value = c.value;
          if (typeof value == 'function') {
            // pass existing config values (this._config) to value function
            value = value.call(this, this._config);
          }
          config[i] = value;
        }
      }
    },

    _mixinConfigure: function(a, b) {
      for (var prop in b) {
        if (!this.getPropertyInfo(prop).readOnly) {
          a[prop] = b[prop];
        }
      }
    },

    // distribute config values to bound nodes.
    _distributeConfig: function(config) {
      var fx$ = this._propertyEffects;
      if (fx$) {
        for (var p in config) {
          var fx = fx$[p];
          if (fx) {
            for (var i=0, l=fx.length, x; (i<l) && (x=fx[i]); i++) {
              if (x.kind === 'annotation') {
                var node = this._nodes[x.effect.index];
                // seeding configuration only
                if (node._configValue) {
                  var value = (p === x.effect.value) ? config[p] :
                    this.get(x.effect.value, config);
                  node._configValue(x.effect.name, value);
                }
              }
            }
          }
        }
      }
    },

    // Override polymer-mini thunk
    _afterClientsReady: function() {
      // process static effects, e.g. computations that have only literal arguments
      this._executeStaticEffects();
      this._applyConfig(this._config, this._aboveConfig);
      this._flushHandlers();
    },

    // NOTE: values are already propagated to children via
    // _distributeConfig so propagation triggered by effects here is
    // redundant, but safe due to dirty checking
    _applyConfig: function(config, aboveConfig) {
      for (var n in config) {
        // Don't stomp on values that may have been set by other side effects
        if (this[n] === undefined) {
          // Call _propertySet for any properties with accessors, which will
          // initialize read-only properties also; set quietly if value was
          // configured from above, as opposed to default
          this.__setProperty(n, config[n], n in aboveConfig);
        }
      }
    },

    // NOTE: Notifications can be processed before ready since
    // they are sent at *child* ready time. Since notifications cause side
    // effects and side effects must not be processed before ready time,
    // handling is queue/defered until then.
    _notifyListener: function(fn, e) {
      if (!this._clientsReadied) {
        this._queueHandler([fn, e, e.target]);
      } else {
        return fn.call(this, e, e.target);
      }
    },

    _queueHandler: function(args) {
      this._handlers.push(args);
    },

    _flushHandlers: function() {
      var h$ = this._handlers;
      for (var i=0, l=h$.length, h; (i<l) && (h=h$[i]); i++) {
        h[0].call(this, h[1], h[2]);
      }
    }

  });



  /**
   * Changes to an object sub-field (aka "path") via a binding
   * (e.g. `<x-foo value="{{item.subfield}}"`) will notify other elements bound to
   * the same object automatically.
   *
   * When modifying a sub-field of an object imperatively
   * (e.g. `this.item.subfield = 42`), in order to have the new value propagated
   * to other elements, a special `set(path, value)` API is provided.
   * `set` sets the object field at the path specified, and then notifies the
   * binding system so that other elements bound to the same path will update.
   *
   * Example:
   *
   *     Polymer({
   *
   *       is: 'x-date',
   *
   *       properties: {
   *         date: {
   *           type: Object,
   *           notify: true
   *          }
   *       },
   *
   *       attached: function() {
   *         this.date = {};
   *         setInterval(function() {
   *           var d = new Date();
   *           // Required to notify elements bound to date of changes to sub-fields
   *           // this.date.seconds = d.getSeconds(); <-- Will not notify
   *           this.set('date.seconds', d.getSeconds());
   *           this.set('date.minutes', d.getMinutes());
   *           this.set('date.hours', d.getHours() % 12);
   *         }.bind(this), 1000);
   *       }
   *
   *     });
   *
   *  Allows bindings to `date` sub-fields to update on changes:
   *
   *     <x-date date="{{date}}"></x-date>
   *
   *     Hour: <span>{{date.hours}}</span>
   *     Min:  <span>{{date.minutes}}</span>
   *     Sec:  <span>{{date.seconds}}</span>
   *
   * @class data feature: path notification
   */

  (function() {
    // Using strict here to ensure fast argument manipulation in array methods
    'use strict';

    Polymer.Base._addFeature({
      /**
       * Notify that a path has changed. For example:
       *
       *   this.item.user.name = 'Bob';
       *   this.notifyPath('item.user.name', this.item.user.name);
       *
       * @param {string} path Path that should be notified.
       * @param {*} value Value of the specified path.
       * @param {boolean=} fromAbove When true, specifies that the change came
       *   from above this element and thus upward notification is not
       *   necessary.
       * @return {boolean} Returns true if notification actually took place,
       *   based on a dirty check of whether the new value was already known.
      */
      notifyPath: function(path, value, fromAbove) {
        var old = this._propertySetter(path, value);
        // manual dirty checking for now...
        // NaN is always not equal to itself,
        // if old and value are both NaN we treat them as equal
        // x === x is 10x faster, and equivalent to !isNaN(x)
        if (old !== value && (old === old || value === value)) {
          // console.group((this.localName || this.dataHost.id + '-' + this.dataHost.dataHost.index) + '#' + (this.id || this.index) + ' ' + path, value);
          // Take path effects at this level for exact path matches,
          // and notify down for any bindings to a subset of this path
          this._pathEffector(path, value);
          // Send event to notify the path change upwards
          // Optimization: don't notify up if we know the notification
          // is coming from above already (avoid wasted event dispatch)
          if (!fromAbove) {
            // TODO(sorvell): should only notify if notify: true?
            this._notifyPath(path, value);
          }
          // console.groupEnd((this.localName || this.dataHost.id + '-' + this.dataHost.dataHost.index) + '#' + (this.id || this.index) + ' ' + path, value);
          return true;
        }
      },

      /**
        Converts a path to an array of path parts.  A path may be specified
        as a dotted string or an array of one or more dotted strings (or numbers,
        for number-valued keys).
      */
      _getPathParts: function(path) {
        if (Array.isArray(path)) {
          var parts = [];
          for (var i=0; i<path.length; i++) {
            var args = path[i].toString().split('.');
            for (var j=0; j<args.length; j++) {
              parts.push(args[j]);
            }
          }
          return parts;
        } else {
          return path.toString().split('.');
        }
      },

      /**
       * Convienence method for setting a value to a path and notifying any
       * elements bound to the same path.
       *
       * Note, if any part in the path except for the last is undefined,
       * this method does nothing (this method does not throw when
       * dereferencing undefined paths).
       *
       * @method set
       * @param {(string|Array<(string|number)>)} path Path to the value
       *   to read.  The path may be specified as a string (e.g. `foo.bar.baz`)
       *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
       *   bracketed expressions are not supported; string-based path parts
       *   *must* be separated by dots.  Note that when dereferencing array
       *   indicies, the index may be used as a dotted part directly
       *   (e.g. `users.12.name` or `['users', 12, 'name']`).
       * @param {*} value Value to set at the specified path.
       * @param {Object=} root Root object from which the path is evaluated.
      */
      set: function(path, value, root) {
        var prop = root || this;
        var parts = this._getPathParts(path);
        var array;
        var last = parts[parts.length-1];
        if (parts.length > 1) {
          for (var i=0; i<parts.length-1; i++) {
            prop = prop[parts[i]];
            if (array) {
              parts[i] = Polymer.Collection.get(array).getKey(prop);
            }
            if (!prop) {
              return;
            }
            array = Array.isArray(prop) ? prop : null;
          }
          if (array) {
            var coll = Polymer.Collection.get(array);
            var old = prop[last];
            var key = coll.getKey(old);
            if (key) {
              parts[i] = key;
              coll.setItem(key, value);
            }
          }
          prop[last] = value;
          if (!root) {
            this.notifyPath(parts.join('.'), value);
          }
        } else {
          prop[path] = value;
        }
      },

      /**
       * Convienence method for reading a value from a path.
       *
       * Note, if any part in the path is undefined, this method returns
       * `undefined` (this method does not throw when dereferencing undefined
       * paths).
       *
       * @method get
       * @param {(string|Array<(string|number)>)} path Path to the value
       *   to read.  The path may be specified as a string (e.g. `foo.bar.baz`)
       *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
       *   bracketed expressions are not supported; string-based path parts
       *   *must* be separated by dots.  Note that when dereferencing array
       *   indicies, the index may be used as a dotted part directly
       *   (e.g. `users.12.name` or `['users', 12, 'name']`).
       * @param {Object=} root Root object from which the path is evaluated.
       * @return {*} Value at the path, or `undefined` if any part of the path
       *   is undefined.
       */
      get: function(path, root) {
        var prop = root || this;
        var parts = this._getPathParts(path);
        var last = parts.pop();
        while (parts.length) {
          prop = prop[parts.shift()];
          if (!prop) {
            return;
          }
        }
        return prop[last];
      },

      _pathEffector: function(path, value) {
        // get root property
        var model = this._modelForPath(path);
        // search property effects of the root property for 'annotation' effects
        var fx$ = this._propertyEffects[model];
        if (fx$) {
          fx$.forEach(function(fx) {
            var fxFn = this['_' + fx.kind + 'PathEffect'];
            if (fxFn) {
              fxFn.call(this, path, value, fx.effect);
            }
          }, this);
        }
        // notify runtime-bound paths
        if (this._boundPaths) {
          this._notifyBoundPaths(path, value);
        }
      },

      _annotationPathEffect: function(path, value, effect) {
        if (effect.value === path || effect.value.indexOf(path + '.') === 0) {
          // TODO(sorvell): ideally the effect function is on this prototype
          // so we don't have to call it like this.
          Polymer.Bind._annotationEffect.call(this, path, value, effect);
        } else if ((path.indexOf(effect.value + '.') === 0) && !effect.negate) {
          // locate the bound node
          var node = this._nodes[effect.index];
          if (node && node.notifyPath) {
            var p = this._fixPath(effect.name , effect.value, path);
            node.notifyPath(p, value, true);
          }
        }
      },

      _complexObserverPathEffect: function(path, value, effect) {
        if (this._pathMatchesEffect(path, effect)) {
          Polymer.Bind._complexObserverEffect.call(this, path, value, effect);
        }
      },

      _computePathEffect: function(path, value, effect) {
        if (this._pathMatchesEffect(path, effect)) {
          Polymer.Bind._computeEffect.call(this, path, value, effect);
        }
      },

      _annotatedComputationPathEffect: function(path, value, effect) {
        if (this._pathMatchesEffect(path, effect)) {
          Polymer.Bind._annotatedComputationEffect.call(this, path, value, effect);
        }
      },

      _pathMatchesEffect: function(path, effect) {
        var effectArg = effect.trigger.name;
        return (effectArg == path) ||
          (effectArg.indexOf(path + '.') === 0) ||
          (effect.trigger.wildcard && path.indexOf(effectArg) === 0);
      },

      /**
       * Aliases one data path as another, such that path notifications from one
       * are routed to the other.
       *
       * @method linkPaths
       * @param {string} to Target path to link.
       * @param {string} from Source path to link.
       */
      linkPaths: function(to, from) {
        this._boundPaths = this._boundPaths || {};
        if (from) {
          this._boundPaths[to] = from;
          // this.set(to, this.get(from));
        } else {
          this.unbindPath(to);
          // this.set(to, from);
        }
      },

      /**
       * Removes a data path alias previously established with `linkPaths`.
       *
       * Note, the path to unlink should be the target (`to`) used when
       * linking the paths.
       *
       * @method unlinkPaths
       * @param {string} path Target path to unlink.
       */
      unlinkPaths: function(path) {
        if (this._boundPaths) {
          delete this._boundPaths[path];
        }
      },

      _notifyBoundPaths: function(path, value) {
        var from, to;
        for (var a in this._boundPaths) {
          var b = this._boundPaths[a];
          if (path.indexOf(a + '.') == 0) {
            from = a;
            to = b;
            break;
          }
          if (path.indexOf(b + '.') == 0) {
            from = b;
            to = a;
            break;
          }
        }
        if (from && to) {
          var p = this._fixPath(to, from, path);
          this.notifyPath(p, value);
        }
      },

      _fixPath: function(property, root, path) {
        return property + path.slice(root.length);
      },

      _notifyPath: function(path, value) {
        var rootName = this._modelForPath(path);
        var dashCaseName = Polymer.CaseMap.camelToDashCase(rootName);
        var eventName = dashCaseName + this._EVENT_CHANGED;
        this.fire(eventName, {
          path: path,
          value: value
        }, {bubbles: false});
      },

      _modelForPath: function(path) {
        var dot = path.indexOf('.');
        return (dot < 0) ? path : path.slice(0, dot);
      },

      _EVENT_CHANGED: '-changed',

      _notifySplice: function(array, path, index, added, removed) {
        var splices = [{
          index: index,
          addedCount: added,
          removed: removed,
          object: array,
          type: 'splice'
        }];
        var change = {
          keySplices: Polymer.Collection.applySplices(array, splices),
          indexSplices: splices
        };
        this.set(path + '.splices', change);
        if (added != removed.length) {
          this.notifyPath(path + '.length', array.length);
        }
        // Null here to allow potentially large splice records to be GC'ed
        change.keySplices = null;
        change.indexSplices = null;
      },

      /**
       * Adds items onto the end of the array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.push`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method push
       * @param {String} path Path to array.
       * @param {...any} var_args Items to push onto array
       * @return {number} New length of the array.
       */
      push: function(path) {
        var array = this.get(path);
        var args = Array.prototype.slice.call(arguments, 1);
        var len = array.length;
        var ret = array.push.apply(array, args);
        this._notifySplice(array, path, len, args.length, []);
        return ret;
      },

      /**
       * Removes an item from the end of array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.pop`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method pop
       * @param {String} path Path to array.
       * @return {any} Item that was removed.
       */
      pop: function(path) {
        var array = this.get(path);
        var args = Array.prototype.slice.call(arguments, 1);
        var rem = array.slice(-1);
        var ret = array.pop.apply(array, args);
        this._notifySplice(array, path, array.length, 0, rem);
        return ret;
      },

      /**
       * Starting from the start index specified, removes 0 or more items
       * from the array and inserts 0 or more new itms in their place.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.splice`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method splice
       * @param {String} path Path to array.
       * @param {number} start Index from which to start removing/inserting.
       * @param {number} deleteCount Number of items to remove.
       * @param {...any} var_args Items to insert into array.
       * @return {Array} Array of removed items.
       */
      splice: function(path, start, deleteCount) {
        var array = this.get(path);
        var args = Array.prototype.slice.call(arguments, 1);
        var ret = array.splice.apply(array, args);
        this._notifySplice(array, path, start, args.length - 2, ret);
        return ret;
      },

      /**
       * Removes an item from the beginning of array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.pop`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method shift
       * @param {String} path Path to array.
       * @return {any} Item that was removed.
       */
      shift: function(path) {
        var array = this.get(path);
        var args = Array.prototype.slice.call(arguments, 1);
        var ret = array.shift.apply(array, args);
        this._notifySplice(array, path, 0, 0, [ret]);
        return ret;
      },

      /**
       * Adds items onto the beginning of the array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.push`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method unshift
       * @param {String} path Path to array.
       * @param {...any} var_args Items to insert info array
       * @return {number} New length of the array.
       */
      unshift: function(path) {
        var array = this.get(path);
        var args = Array.prototype.slice.call(arguments, 1);
        var ret = array.unshift.apply(array, args);
        this._notifySplice(array, path, 0, args.length, []);
        return ret;
      }

    });

  })();





  Polymer.Base._addFeature({

    /**
     * Rewrites a given URL relative to the original location of the document
     * containing the `dom-module` for this element.  This method will return
     * the same URL before and after vulcanization.
     *
     * @method resolveUrl
     * @param {string} url URL to resolve.
     * @return {string} Rewritten URL relative to the import
     */
    resolveUrl: function(url) {
      // TODO(sorvell): do we want to put the module reference on the prototype?
      var module = Polymer.DomModule.import(this.is);
      var root = '';
      if (module) {
        var assetPath = module.getAttribute('assetpath') || '';
        root = Polymer.ResolveUrl.resolveUrl(assetPath, module.ownerDocument.baseURI);
      }
      return Polymer.ResolveUrl.resolveUrl(url, root);
    }

  });




/*
  Extremely simple css parser. Intended to be not more than what we need
  and definitely not necessarly correct =).
*/
Polymer.CssParse = (function() {

  var api = {
    // given a string of css, return a simple rule tree
    parse: function(text) {
      text = this._clean(text);
      return this._parseCss(this._lex(text), text);
    },

    // remove stuff we don't care about that may hinder parsing
    _clean: function (cssText) {
      return cssText.replace(rx.comments, '').replace(rx.port, '');
    },

    // super simple {...} lexer that returns a node tree
    _lex: function(text) {
      var root = {start: 0, end: text.length};
      var n = root;
      for (var i=0, s=0, l=text.length; i < l; i++) {
        switch (text[i]) {
          case this.OPEN_BRACE:
            //console.group(i);
            if (!n.rules) {
              n.rules = [];
            }
            var p = n;
            var previous = p.rules[p.rules.length-1];
            n = {start: i+1, parent: p, previous: previous};
            p.rules.push(n);
            break;
          case this.CLOSE_BRACE: 
            //console.groupEnd(n.start);
            n.end = i+1;
            n = n.parent || root;
            break;
        }
      }
      return root;
    },

    // add selectors/cssText to node tree
    _parseCss: function(node, text) {
      var t = text.substring(node.start, node.end-1);
      node.parsedCssText = node.cssText = t.trim();
      if (node.parent) {
        var ss = node.previous ? node.previous.end : node.parent.start;
        t = text.substring(ss, node.start-1);
        // TODO(sorvell): ad hoc; make selector include only after last ;
        // helps with mixin syntax
        t = t.substring(t.lastIndexOf(';')+1);
        var s = node.parsedSelector = node.selector = t.trim();
        node.atRule = (s.indexOf(AT_START) === 0);
        // note, support a subset of rule types...
        if (node.atRule) {
          if (s.indexOf(MEDIA_START) === 0) {
            node.type = this.types.MEDIA_RULE;
          } else if (s.match(rx.keyframesRule)) {
            node.type = this.types.KEYFRAMES_RULE;
          }
        } else {
          if (s.indexOf(VAR_START) === 0) {
            node.type = this.types.MIXIN_RULE;
          } else {
            node.type = this.types.STYLE_RULE;
          }
        }
      }
      var r$ = node.rules;
      if (r$) {
        for (var i=0, l=r$.length, r; (i<l) && (r=r$[i]); i++) {
          this._parseCss(r, text);
        }  
      }
      return node;  
    },

    // stringify parsed css.
    stringify: function(node, preserveProperties, text) {
      text = text || '';
      // calc rule cssText
      var cssText = '';
      if (node.cssText || node.rules) {
        var r$ = node.rules;
        if (r$ && (preserveProperties || !hasMixinRules(r$))) {
          for (var i=0, l=r$.length, r; (i<l) && (r=r$[i]); i++) {
            cssText = this.stringify(r, preserveProperties, cssText);
          }  
        } else {
          cssText = preserveProperties ? node.cssText : 
            removeCustomProps(node.cssText);  
          cssText = cssText.trim();
          if (cssText) {
            cssText = '  ' + cssText + '\n';
          }
        }
      }
      // emit rule iff there is cssText
      if (cssText) {
        if (node.selector) {
          text += node.selector + ' ' + this.OPEN_BRACE + '\n';
        }
        text += cssText;
        if (node.selector) {
          text += this.CLOSE_BRACE + '\n\n';
        }
      }
      return text;
    },

    types: {
      STYLE_RULE: 1,
      KEYFRAMES_RULE: 7,
      MEDIA_RULE: 4,
      MIXIN_RULE: 1000
    },

    OPEN_BRACE: '{',
    CLOSE_BRACE: '}'

  };

  function hasMixinRules(rules) {
    return (rules[0].selector.indexOf(VAR_START) >= 0);
  }

  function removeCustomProps(cssText) {
    return cssText
      .replace(rx.customProp, '')
      .replace(rx.mixinProp, '')
      .replace(rx.mixinApply, '')
      .replace(rx.varApply, '');
  }

  var VAR_START = '--';
  var MEDIA_START = '@media';
  var AT_START = '@';

  // helper regexp's
  var rx = {
    comments: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,
    port: /@import[^;]*;/gim,
    customProp: /(?:^|[\s;])--[^;{]*?:[^{};]*?(?:[;\n]|$)/gim,
    mixinProp: /(?:^|[\s;])--[^;{]*?:[^{;]*?{[^}]*?}(?:[;\n]|$)?/gim,
    mixinApply: /@apply[\s]*\([^)]*?\)[\s]*(?:[;\n]|$)?/gim,
    varApply: /[^;:]*?:[^;]*var[^;]*(?:[;\n]|$)?/gim,
    keyframesRule: /^@[^\s]*keyframes/,
  };

  // exports 
  return api;

})();




  Polymer.StyleUtil = (function() {

    return {

      MODULE_STYLES_SELECTOR: 'style, link[rel=import][type~=css]',

      toCssText: function(rules, callback, preserveProperties) {
        if (typeof rules === 'string') {
          rules = this.parser.parse(rules);
        } 
        if (callback) {
          this.forEachStyleRule(rules, callback);
        }
        return this.parser.stringify(rules, preserveProperties);
      },

      forRulesInStyles: function(styles, callback) {
        if (styles) {
          for (var i=0, l=styles.length, s; (i<l) && (s=styles[i]); i++) {
            this.forEachStyleRule(this.rulesForStyle(s), callback);
          }
        }
      },

      rulesForStyle: function(style) {
        if (!style.__cssRules && style.textContent) {
          style.__cssRules =  this.parser.parse(style.textContent);
        }
        return style.__cssRules;
      },

      clearStyleRules: function(style) {
        style.__cssRules = null;
      },

      forEachStyleRule: function(node, callback) {
        var s = node.selector;
        var skipRules = false;
        if (node.type === this.ruleTypes.STYLE_RULE) {
          callback(node);
        } else if (node.type === this.ruleTypes.KEYFRAMES_RULE || 
            node.type === this.ruleTypes.MIXIN_RULE) {
          skipRules = true;
        }
        var r$ = node.rules;
        if (r$ && !skipRules) {
          for (var i=0, l=r$.length, r; (i<l) && (r=r$[i]); i++) {
            this.forEachStyleRule(r, callback);
          }
        }
      },

      // add a string of cssText to the document.
      applyCss: function(cssText, moniker, target, afterNode) {
        var style = document.createElement('style');
        if (moniker) {
          style.setAttribute('scope', moniker);
        }
        style.textContent = cssText;
        target = target || document.head;
        if (!afterNode) {
          var n$ = target.querySelectorAll('style[scope]');
          afterNode = n$[n$.length-1];
        } 
        target.insertBefore(style, 
          (afterNode && afterNode.nextSibling) || target.firstChild);
        return style;
      },

      // returns cssText of styles in a given module; also un-applies any
      // styles that apply to the document.
      cssFromModule: function(moduleId) {
        var m = Polymer.DomModule.import(moduleId);
        if (m && !m._cssText) {
          var cssText = '';
          var e$ = Array.prototype.slice.call(
            m.querySelectorAll(this.MODULE_STYLES_SELECTOR));
          for (var i=0, e; i < e$.length; i++) {
            e = e$[i];
            // style elements inside dom-modules will apply to the main document
            // we don't want this, so we remove them here.
            if (e.localName === 'style') {
              // get style element applied to main doc via HTMLImports polyfill
              e = e.__appliedElement || e;
              e.parentNode.removeChild(e);
            // it's an import, assume this is a text file of css content.
            } else {
              e = e.import && e.import.body;
            }
            // adjust paths in css.
            if (e) {
              cssText += 
                Polymer.ResolveUrl.resolveCss(e.textContent, e.ownerDocument);
            }
          }
          m._cssText = cssText;
        }
        return m && m._cssText || '';
      },

      parser: Polymer.CssParse,
      ruleTypes: Polymer.CssParse.types

    };

  })();



  Polymer.StyleTransformer = (function() {

    var nativeShadow = Polymer.Settings.useNativeShadow;
    var styleUtil = Polymer.StyleUtil;

    /* Transforms ShadowDOM styling into ShadyDOM styling

     * scoping: 

        * elements in scope get scoping selector class="x-foo-scope"
        * selectors re-written as follows:

          div button -> div.x-foo-scope button.x-foo-scope

     * :host -> scopeName

     * :host(...) -> scopeName...

     * ::content -> ' ' NOTE: requires use of scoping selector and selectors
       cannot otherwise be scoped:
       e.g. :host ::content > .bar -> x-foo > .bar

     * ::shadow, /deep/: processed simimlar to ::content

     * :host-context(...): scopeName..., ... scopeName

    */
    var api = {

      // Given a node and scope name, add a scoping class to each node 
      // in the tree. This facilitates transforming css into scoped rules. 
      dom: function(node, scope, useAttr, shouldRemoveScope) {
        this._transformDom(node, scope || '', useAttr, shouldRemoveScope);
      },

      _transformDom: function(node, selector, useAttr, shouldRemoveScope) {
        if (node.setAttribute) {
          this.element(node, selector, useAttr, shouldRemoveScope);
        }
        var c$ = Polymer.dom(node).childNodes;
        for (var i=0; i<c$.length; i++) {
          this._transformDom(c$[i], selector, useAttr, shouldRemoveScope);
        }
      },

      element: function(element, scope, useAttr, shouldRemoveScope) {
        if (useAttr) {
          if (shouldRemoveScope) {
            element.removeAttribute(SCOPE_NAME);
          } else {
            element.setAttribute(SCOPE_NAME, scope);
          }
        } else {
          // note: if using classes, we add both the general 'style-scope' class
          // as well as the specific scope. This enables easy filtering of all
          // `style-scope` elements
          if (scope) {
            // note: svg on IE does not have classList so fallback to class
            if (element.classList) {
              if (shouldRemoveScope) {
                element.classList.remove(SCOPE_NAME);
                element.classList.remove(scope);
              } else {
                element.classList.add(SCOPE_NAME);
                element.classList.add(scope);
              }
            } else if (element.getAttribute) {
              var c = element.getAttribute(CLASS);
              if (shouldRemoveScope) {
                if (c) {
                  element.setAttribute(CLASS, c.replace(SCOPE_NAME, '')
                    .replace(scope, ''));
                }
              } else {
                element.setAttribute(CLASS, c + (c ? ' ' : '') + 
                  SCOPE_NAME + ' ' + scope);
              }
            }
          }
        }
      },

      elementStyles: function(element, callback) {
        var styles = element._styles;
        var cssText = '';
        for (var i=0, l=styles.length, s, text; (i<l) && (s=styles[i]); i++) {
          var rules = styleUtil.rulesForStyle(s);
          cssText += nativeShadow ?
            styleUtil.toCssText(rules, callback) :
            this.css(rules, element.is, element.extends, callback,
            element._scopeCssViaAttr) + '\n\n';
        }
        return cssText.trim();
      },

      // Given a string of cssText and a scoping string (scope), returns
      // a string of scoped css where each selector is transformed to include
      // a class created from the scope. ShadowDOM selectors are also transformed
      // (e.g. :host) to use the scoping selector.
      css: function(rules, scope, ext, callback, useAttr) {
        var hostScope = this._calcHostScope(scope, ext);
        scope = this._calcElementScope(scope, useAttr);
        var self = this;
        return styleUtil.toCssText(rules, function(rule) {
          if (!rule.isScoped) {
            self.rule(rule, scope, hostScope);
            rule.isScoped = true;
          }
          if (callback) {
            callback(rule, scope, hostScope);
          }
        });
      },

      _calcElementScope: function (scope, useAttr) {
        if (scope) {
          return useAttr ?
            CSS_ATTR_PREFIX + scope + CSS_ATTR_SUFFIX :
            CSS_CLASS_PREFIX + scope;
        } else {
          return '';
        }
      },

      _calcHostScope: function(scope, ext) {
        return ext ? '[is=' +  scope + ']' : scope;
      },

      rule: function (rule, scope, hostScope) {
        this._transformRule(rule, this._transformComplexSelector,
          scope, hostScope);
      },

      // transforms a css rule to a scoped rule.
      _transformRule: function(rule, transformer, scope, hostScope) {
        var p$ = rule.selector.split(COMPLEX_SELECTOR_SEP);
        for (var i=0, l=p$.length, p; (i<l) && (p=p$[i]); i++) {
          p$[i] = transformer.call(this, p, scope, hostScope);
        }
        rule.selector = p$.join(COMPLEX_SELECTOR_SEP);
      },

      _transformComplexSelector: function(selector, scope, hostScope) {
        var stop = false;
        var hostContext = false;
        var self = this;
        selector = selector.replace(SIMPLE_SELECTOR_SEP, function(m, c, s) {
          if (!stop) {
            var info = self._transformCompoundSelector(s, c, scope, hostScope);
            stop = stop || info.stop;
            hostContext = hostContext || info.hostContext;
            c = info.combinator;
            s = info.value;  
          } else {
            s = s.replace(SCOPE_JUMP, ' ');
          }
          return c + s;
        });
        if (hostContext) {
          selector = selector.replace(HOST_CONTEXT_PAREN, 
            function(m, pre, paren, post) {
              return pre + paren + ' ' + hostScope + post + 
                COMPLEX_SELECTOR_SEP + ' ' + pre + hostScope + paren + post;
             });
        }
        return selector;
      },

      _transformCompoundSelector: function(selector, combinator, scope, hostScope) {
        // replace :host with host scoping class
        var jumpIndex = selector.search(SCOPE_JUMP);
        var hostContext = false;
        if (selector.indexOf(HOST_CONTEXT) >=0) {
          hostContext = true;
        } else if (selector.indexOf(HOST) >=0) {
          // :host(...) -> scopeName...
          selector = selector.replace(HOST_PAREN, function(m, host, paren) {
            return hostScope + paren;
          });
          // now normal :host
          selector = selector.replace(HOST, hostScope);
        // replace other selectors with scoping class
        } else if (jumpIndex !== 0) {
          selector = scope ? this._transformSimpleSelector(selector, scope) : 
            selector;
        }
        // remove left-side combinator when dealing with ::content.
        if (selector.indexOf(CONTENT) >= 0) {
          combinator = '';
        }
        // process scope jumping selectors up to the scope jump and then stop
        // e.g. .zonk ::content > .foo ==> .zonk.scope > .foo
        var stop;
        if (jumpIndex >= 0) {
          selector = selector.replace(SCOPE_JUMP, ' ');
          stop = true;
        }
        return {value: selector, combinator: combinator, stop: stop, 
          hostContext: hostContext};
      },

      _transformSimpleSelector: function(selector, scope) {
        var p$ = selector.split(PSEUDO_PREFIX);
        p$[0] += scope;
        return p$.join(PSEUDO_PREFIX);
      },

      documentRule: function(rule) {
        // reset selector in case this is redone.
        rule.selector = rule.parsedSelector;
        this.normalizeRootSelector(rule);
        if (!nativeShadow) {
          this._transformRule(rule, this._transformDocumentSelector);
        }
      },

      normalizeRootSelector: function(rule) {
        if (rule.selector === ROOT) {
          rule.selector = 'body';
        }
      },

      _transformDocumentSelector: function(selector) {
        return selector.match(SCOPE_JUMP) ?
          this._transformComplexSelector(selector, SCOPE_DOC_SELECTOR) :
          this._transformSimpleSelector(selector.trim(), SCOPE_DOC_SELECTOR);
      },

      SCOPE_NAME: 'style-scope'
    };

    var SCOPE_NAME = api.SCOPE_NAME;
    var SCOPE_DOC_SELECTOR = ':not([' + SCOPE_NAME + '])' + 
      ':not(.' + SCOPE_NAME + ')';
    var COMPLEX_SELECTOR_SEP = ',';
    var SIMPLE_SELECTOR_SEP = /(^|[\s>+~]+)([^\s>+~]+)/g;
    var HOST = ':host';
    var ROOT = ':root';
    // NOTE: this supports 1 nested () pair for things like 
    // :host(:not([selected]), more general support requires
    // parsing which seems like overkill
    var HOST_PAREN = /(\:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/g;
    var HOST_CONTEXT = ':host-context';
    var HOST_CONTEXT_PAREN = /(.*)(?:\:host-context)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))(.*)/;
    var CONTENT = '::content';
    var SCOPE_JUMP = /\:\:content|\:\:shadow|\/deep\//;
    var CSS_CLASS_PREFIX = '.';
    var CSS_ATTR_PREFIX = '[' + SCOPE_NAME + '~=';
    var CSS_ATTR_SUFFIX = ']';
    var PSEUDO_PREFIX = ':';
    var CLASS = 'class';

    // exports
    return api;

  })();




Polymer.StyleExtends = (function() {

  var styleUtil = Polymer.StyleUtil;

  return {
    
    hasExtends: function(cssText) {
      return Boolean(cssText.match(this.rx.EXTEND));
    },

    transform: function(style) {
      var rules = styleUtil.rulesForStyle(style);
      var self = this;
      styleUtil.forEachStyleRule(rules, function(rule) {
        var map = self._mapRule(rule);
        if (rule.parent) {
          var m;
          while (m = self.rx.EXTEND.exec(rule.cssText)) {
            var extend = m[1];
            var extendor = self._findExtendor(extend, rule);
            if (extendor) {
              self._extendRule(rule, extendor);
            }
          }
        }
        rule.cssText = rule.cssText.replace(self.rx.EXTEND, '');
      });
      // strip unused % selectors
      return styleUtil.toCssText(rules, function(rule) {
        if (rule.selector.match(self.rx.STRIP)) {
          rule.cssText = '';
        }
      }, true);
    },

    _mapRule: function(rule) {
      if (rule.parent) {
        var map = rule.parent.map || (rule.parent.map = {});
        var parts = rule.selector.split(',');
        for (var i=0, p; i < parts.length; i++) {
          p = parts[i];
          map[p.trim()] = rule;
        }
        return map;
      }
    },

    _findExtendor: function(extend, rule) {
      return rule.parent && rule.parent.map && rule.parent.map[extend] ||
        this._findExtendor(extend, rule.parent);
    },

    _extendRule: function(target, source) {
      if (target.parent !== source.parent) {
        this._cloneAndAddRuleToParent(source, target.parent);
      }
      target.extends = target.extends || (target.extends = []);
      target.extends.push(source);
      // TODO: this misses `%foo, .bar` as an unetended selector but
      // this seems rare and could possibly be unsupported.
      source.selector = source.selector.replace(this.rx.STRIP, '');
      source.selector = (source.selector && source.selector + ',\n') + 
        target.selector;
      if (source.extends) {
        source.extends.forEach(function(e) {
          this._extendRule(target, e);
        }, this);
      }
    },

    _cloneAndAddRuleToParent: function(rule, parent) {
      rule = Object.create(rule);
      rule.parent = parent;
      if (rule.extends) {
        rule.extends = rule.extends.slice();
      }
      parent.rules.push(rule);
    },

    rx: {
      EXTEND: /@extends\(([^)]*)\)\s*?;/gim,
      STRIP: /%[^,]*$/
    }

  };

})();



  (function() {

    var prepElement = Polymer.Base._prepElement;
    var nativeShadow = Polymer.Settings.useNativeShadow;

    var styleUtil = Polymer.StyleUtil;
    var styleTransformer = Polymer.StyleTransformer;
    var styleExtends = Polymer.StyleExtends;

    Polymer.Base._addFeature({

      _prepElement: function(element) {
        if (this._encapsulateStyle) {
          styleTransformer.element(element, this.is,
            this._scopeCssViaAttr);
        }
        prepElement.call(this, element);
      },

      _prepStyles: function() {
        if (this._encapsulateStyle === undefined) {
          this._encapsulateStyle = !nativeShadow &&
            Boolean(this._template);
        }
        this._styles = this._collectStyles();
        var cssText = styleTransformer.elementStyles(this);
        if (cssText && this._template) {
          var style = styleUtil.applyCss(cssText, this.is,
            nativeShadow ? this._template.content : null);
          // keep track of style when in document scope (polyfill) so we can
          // attach property styles after it.
          if (!nativeShadow) {
            this._scopeStyle = style;
          }
        }
      },

      // search for extra style modules via `styleModules`
      // TODO(sorvell): consider dropping support for `styleModules`
      _collectStyles: function() {
        var styles = [];
        var cssText = '', m$ = this.styleModules;
        if (m$) {
          for (var i=0, l=m$.length, m; (i<l) && (m=m$[i]); i++) {
            cssText += styleUtil.cssFromModule(m);
          }
        }
        cssText += styleUtil.cssFromModule(this.is);
        if (cssText) {
          var style = document.createElement('style');
          style.textContent = cssText;
          // extends!!
          if (styleExtends.hasExtends(style.textContent)) {
            cssText = styleExtends.transform(style);
          }
          styles.push(style);
        }
        return styles;
      },

      // instance-y
      // add scoping class whenever an element is added to localDOM
      _elementAdd: function(node) {
        if (this._encapsulateStyle) {
          // If __styleScoped is set, this is a one-time optimization to
          // avoid scoping pre-scoped document fragments
          if (node.__styleScoped) {
            node.__styleScoped = false;
          } else {
            styleTransformer.dom(node, this.is, this._scopeCssViaAttr);
          }
        }
      },

      // remove scoping class whenever an element is removed from localDOM
      _elementRemove: function(node) {
        if (this._encapsulateStyle) {
          styleTransformer.dom(node, this.is, this._scopeCssViaAttr, true);
        }
      },

      /**
       * Apply style scoping to the specified `container` and all its
       * descendants. If `shoudlObserve` is true, changes to the container are
       * monitored via mutation observer and scoping is applied.
       *
       * This method is useful for ensuring proper local DOM CSS scoping
       * for elements created in this local DOM scope, but out of the
       * control of this element (i.e., by a 3rd-party library)
       * when running in non-native Shadow DOM environments.
       *
       * @method scopeSubtree
       * @param {Element} container Element to scope.
       * @param {boolean} shouldObserve When true, monitors the container
       *   for changes and re-applies scoping for any future changes.
       */
      scopeSubtree: function(container, shouldObserve) {
        if (nativeShadow) {
          return;
        }
        var self = this;
        var scopify = function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            node.className = self._scopeElementClass(node, node.className);
            var n$ = node.querySelectorAll('*');
            Array.prototype.forEach.call(n$, function(n) {
              n.className = self._scopeElementClass(n, n.className);
            });
          }
        };
        scopify(container);
        if (shouldObserve) {
          var mo = new MutationObserver(function(mxns) {
            mxns.forEach(function(m) {
              if (m.addedNodes) {
                for (var i=0; i < m.addedNodes.length; i++) {
                  scopify(m.addedNodes[i]);
                }
              }
            });
          });
          mo.observe(container, {childList: true, subtree: true});
          return mo;
        }
      }

    });

  })();




  Polymer.StyleProperties = (function() {
    'use strict';

    var nativeShadow = Polymer.Settings.useNativeShadow;
    var matchesSelector = Polymer.DomApi.matchesSelector;
    var styleUtil = Polymer.StyleUtil;
    var styleTransformer = Polymer.StyleTransformer;

    return {

      // decorates styles with rule info and returns an array of used style
      // property names
      decorateStyles: function(styles) {
        var self = this, props = {};
        styleUtil.forRulesInStyles(styles, function(rule) {
          self.decorateRule(rule);
          self.collectPropertiesInCssText(rule.propertyInfo.cssText, props);
        });
        // return this list of property names *consumes* in these styles.
        var names = [];
        for (var i in props) {
          names.push(i);
        }
        return names;
      },

      // decorate a single rule with property info
      decorateRule: function(rule) {
        if (rule.propertyInfo) {
          return rule.propertyInfo;
        }
        var info = {}, properties = {};
        var hasProperties = this.collectProperties(rule, properties);
        if (hasProperties) {
          info.properties = properties;
          // TODO(sorvell): workaround parser seeing mixins as additional rules
          rule.rules = null;
        }
        info.cssText = this.collectCssText(rule);
        rule.propertyInfo = info;
        return info;
      },

      // collects the custom properties from a rule's cssText
      collectProperties: function(rule, properties) {
        var info = rule.propertyInfo;
        if (info) {
          if (info.properties) {
            Polymer.Base.mixin(properties, info.properties);
            return true;
          }
        } else {
          var m, rx = this.rx.VAR_ASSIGN;
          var cssText = rule.parsedCssText;
          var any;
          while (m = rx.exec(cssText)) {
            // note: group 2 is var, 3 is mixin
            properties[m[1]] = (m[2] || m[3]).trim();
            any = true;
          }
          return any;
        }
      },

      // returns cssText of properties that consume variables/mixins
      collectCssText: function(rule) {
        var customCssText = '';
        var cssText = rule.parsedCssText;
        // NOTE: we support consumption inside mixin assignment
        // but not production, so strip out {...}
        cssText = cssText.replace(this.rx.BRACKETED, '')
          .replace(this.rx.VAR_ASSIGN, '');
        var parts = cssText.split(';');
        for (var i=0, p; i<parts.length; i++) {
          p = parts[i];
          if (p.match(this.rx.MIXIN_MATCH) || p.match(this.rx.VAR_MATCH)) {
            customCssText += p + ';\n';
          }
        }
        return customCssText;
      },

      collectPropertiesInCssText: function(cssText, props) {
        var m;
        while (m = this.rx.VAR_CAPTURE.exec(cssText)) {
          props[m[1]] = true;
          var def = m[2];
          if (def && def.match(this.rx.IS_VAR)) {
            props[def] = true;
          }
        }
      },

      // turns custom properties into realized values.
      reify: function(props) {
        // big perf optimization here: reify only *own* properties
        // since this object has __proto__ of the element's scope properties
        var names = Object.getOwnPropertyNames(props);
        for (var i=0, n; i < names.length; i++) {
          n = names[i];
          props[n] = this.valueForProperty(props[n], props);
        }
      },

      // given a property value, returns the reified value
      // a property value may be:
      // (1) a literal value like: red or 5px;
      // (2) a variable value like: var(--a), var(--a, red), or var(--a, --b);
      // (3) a literal mixin value like { properties }. Each of these properties
      // can have values that are: (a) literal, (b) variables, (c) @apply mixins.
      valueForProperty: function(property, props) {
        // case (1) default
        // case (3) defines a mixin and we have to reify the internals
        if (property) {
          if (property.indexOf(';') >=0) {
            property = this.valueForProperties(property, props);
          } else {
            // case (2) variable
            var self = this;
            var fn = function(all, prefix, value, fallback) {
              var propertyValue = (self.valueForProperty(props[value], props) ||
                (props[fallback] ? 
                self.valueForProperty(props[fallback], props) : 
                fallback));
              return prefix + (propertyValue || '');
            };
            property = property.replace(this.rx.VAR_MATCH, fn);
          }
        }
        return property && property.trim() || '';
      },

      // note: we do not yet support mixin within mixin
      valueForProperties: function(property, props) {
        var parts = property.split(';');
        for (var i=0, p, m; (i<parts.length) && (p=parts[i]); i++) {
          m = p.match(this.rx.MIXIN_MATCH);
          if (m) {
            p = this.valueForProperty(props[m[1]], props);
          } else {
            var pp = p.split(':');
            if (pp[1]) {
              pp[1] = pp[1].trim();
              pp[1] = this.valueForProperty(pp[1], props) || pp[1];
            }
            p = pp.join(':');
          }
          parts[i] = (p && p.lastIndexOf(';') === p.length - 1) ? 
            // strip trailing ;
            p.slice(0, -1) :
            p || '';
        }
        return parts.join(';');
      },

      applyProperties: function(rule, props) {
        var output = '';
        // dynamically added sheets may not be decorated so ensure they are.
        if (!rule.propertyInfo) {
          this.decorateRule(rule);
        }
        if (rule.propertyInfo.cssText) {
          output = this.valueForProperties(rule.propertyInfo.cssText, props);
        }
        rule.cssText = output;
      },

      // Test if the rules in these styles matche the given `element` and if so,
      // collect any custom properties into `props`.
      propertyDataFromStyles: function(styles, element) {
        var props = {}, self = this;
        // generates a unique key for these matches
        var o = [], i = 0;
        styleUtil.forRulesInStyles(styles, function(rule) {
          // TODO(sorvell): we could trim the set of rules at declaration 
          // time to only include ones that have properties
          if (!rule.propertyInfo) {
            self.decorateRule(rule);
          }
          if (element && rule.propertyInfo.properties &&
              matchesSelector.call(element, rule.selector)) {
            self.collectProperties(rule, props);
            // produce numeric key for these matches for lookup
            addToBitMask(i, o);
          }
          i++;
        });
        return {properties: props, key: o};
      },

      // Test if a rule matches scope crteria (* or :root) and if so,
      // collect any custom properties into `props`.
      scopePropertiesFromStyles: function(styles) {
        if (!styles._scopeStyleProperties) {
          styles._scopeStyleProperties = 
            this.selectedPropertiesFromStyles(styles, this.SCOPE_SELECTORS);
        }
        return styles._scopeStyleProperties;
      },

      // Test if a rule matches host crteria (:host) and if so,
      // collect any custom properties into `props`.
      //
      // TODO(sorvell): this should change to collecting properties from any
      // :host(...) and then matching these against self.
      hostPropertiesFromStyles: function(styles) {
        if (!styles._hostStyleProperties) {
          styles._hostStyleProperties = 
            this.selectedPropertiesFromStyles(styles, this.HOST_SELECTORS);
        }
        return styles._hostStyleProperties;
      },

      selectedPropertiesFromStyles: function(styles, selectors) {
        var props = {}, self = this;
        styleUtil.forRulesInStyles(styles, function(rule) {
          if (!rule.propertyInfo) {
            self.decorateRule(rule);
          }
          for (var i=0; i < selectors.length; i++) {
            if (rule.parsedSelector === selectors[i]) {
              self.collectProperties(rule, props);
              return;
            }
          }
        });
        return props;
      },

      transformStyles: function(element, properties, scopeSelector) {
        var self = this;
        var hostSelector = styleTransformer
          ._calcHostScope(element.is, element.extends);
        var rxHostSelector = element.extends ? 
          '\\' + hostSelector.slice(0, -1) + '\\]' : 
          hostSelector;
        var hostRx = new RegExp(this.rx.HOST_PREFIX + rxHostSelector + 
          this.rx.HOST_SUFFIX);
        return styleTransformer.elementStyles(element, function(rule) {
          self.applyProperties(rule, properties);
          if (rule.cssText && !nativeShadow) {
            self._scopeSelector(rule, hostRx, hostSelector, 
              element._scopeCssViaAttr, scopeSelector);
          }
        });
      },

      // Strategy: x scope shim a selector e.g. to scope `.x-foo-42` (via classes):
      // non-host selector: .a.x-foo -> .x-foo-42 .a.x-foo
      // host selector: x-foo.wide -> x-foo.x-foo-42.wide
      _scopeSelector: function(rule, hostRx, hostSelector, viaAttr, scopeId) {
        rule.transformedSelector = rule.transformedSelector || rule.selector;
        var selector = rule.transformedSelector;
        var scope = viaAttr ? '[' + styleTransformer.SCOPE_NAME + '~=' + 
          scopeId + ']' : 
          '.' + scopeId;
        var parts = selector.split(',');
        for (var i=0, l=parts.length, p; (i<l) && (p=parts[i]); i++) {
          parts[i] = p.match(hostRx) ?
            p.replace(hostSelector, hostSelector + scope) :
            scope + ' ' + p;
        }
        rule.selector = parts.join(',');
      },

      applyElementScopeSelector: function(element, selector, old, viaAttr) {
        var c = viaAttr ? element.getAttribute(styleTransformer.SCOPE_NAME) :
          element.className;
        var v = old ? c.replace(old, selector) :
          (c ? c + ' ' : '') + this.XSCOPE_NAME + ' ' + selector;
        if (c !== v) {
          if (viaAttr) {
            element.setAttribute(styleTransformer.SCOPE_NAME, v);
          } else {
            element.className = v;
          }
        }
      },

      applyElementStyle: function(element, properties, selector, style) {
        // calculate cssText to apply
        var cssText = style ? style.textContent || '' : 
          this.transformStyles(element, properties, selector);  
        // if shady and we have a cached style that is not style, decrement
        var s = element._customStyle;
        if (s && !nativeShadow && (s !== style)) {
          s._useCount--;
          if (s._useCount <= 0 && s.parentNode) {
            s.parentNode.removeChild(s);
          }
        }
        // apply styling always under native or if we generated style
        // or the cached style is not in document(!)
        if (nativeShadow || (!style || !style.parentNode)) {
          // update existing style only under native
          if (nativeShadow && element._customStyle) {
            element._customStyle.textContent = cssText;
            style = element._customStyle;
          // otherwise, if we have css to apply, do so
          } else if (cssText) {
            // apply css after the scope style of the element to help with
            // style predence rules.
            style = styleUtil.applyCss(cssText, selector, 
              nativeShadow ? element.root : null, element._scopeStyle);
          }
        }
        // ensure this style is our custom style and increment its use count.
        if (style) {
          style._useCount = style._useCount || 0;
          // increment use count if we changed styles
          if (element._customStyle != style) {
            style._useCount++;
          }
          element._customStyle = style;
        }
        return style;
      },

      // customStyle properties are applied if they are truthy or 0. Otherwise,
      // they are skipped; this allows properties previously set in customStyle
      // to be easily reset to inherited values.
      mixinCustomStyle: function(props, customStyle) {
        var v;
        for (var i in customStyle) {
          v = customStyle[i];
          if (v || v === 0) {
            props[i] = v;
          }
        }
      },

      rx: {
        VAR_ASSIGN: /(?:^|[;\n]\s*)(--[\w-]*?):\s*(?:([^;{]*)|{([^}]*)})(?:(?=[;\n])|$)/gi,
        MIXIN_MATCH: /(?:^|\W+)@apply[\s]*\(([^)]*)\)/i, 
        // note, this supports:
        // var(--a)
        // var(--a, --b)
        // var(--a, fallback-literal)
        // var(--a, fallback-literal(with-one-nested-parens))
        VAR_MATCH: /(^|\W+)var\([\s]*([^,)]*)[\s]*,?[\s]*((?:[^,)]*)|(?:[^;]*\([^;)]*\)))[\s]*?\)/gi,
        VAR_CAPTURE: /\([\s]*(--[^,\s)]*)(?:,[\s]*(--[^,\s)]*))?(?:\)|,)/gi,
        IS_VAR: /^--/,
        BRACKETED: /\{[^}]*\}/g,
        HOST_PREFIX: '(?:^|[^.#[:])',
        HOST_SUFFIX: '($|[.:[\\s>+~])'
      },

      HOST_SELECTORS: [':host'],
      SCOPE_SELECTORS: [':root'],
      XSCOPE_NAME: 'x-scope'

    };

    function addToBitMask(n, bits) {
      var o = parseInt(n / 32);
      var v = 1 << (n % 32);
      bits[o] = (bits[o] || 0) | v;
    }

  })();



(function() {

  Polymer.StyleCache = function() {
    this.cache = {};
  }

  Polymer.StyleCache.prototype = {
    
    MAX: 100,

    store: function(is, data, keyValues, keyStyles) {
      data.keyValues = keyValues;
      data.styles = keyStyles;
      var s$ = this.cache[is] = this.cache[is] || [];
      s$.push(data);
      if (s$.length > this.MAX) {
        s$.shift();
      }
    },

    retrieve: function(is, keyValues, keyStyles) {
      var cache = this.cache[is];
      if (cache) {
        // look through cache backwards as most recent push is last.
        for (var i=cache.length-1, data; i >= 0; i--) {
          data = cache[i];
          if (keyStyles === data.styles &&
              this._objectsEqual(keyValues, data.keyValues)) {
            return data;
          }
        }
      }
    },

    clear: function() {
      this.cache = {};
    },

    // note, this is intentially limited to support just the cases we need
    // right now. The objects we're checking here are either objects that must 
    // always have the same keys OR arrays.
    _objectsEqual: function(target, source) {
      var t, s;
      for (var i in target) {
        t = target[i], s = source[i];
        if (!(typeof t === 'object' && t ? this._objectsStrictlyEqual(t, s) : 
            t === s)) {
          return false;
        }
      }
      if (Array.isArray(target)) {
        return target.length === source.length;
      }
      return true;
    },

    _objectsStrictlyEqual: function(target, source) {
      return this._objectsEqual(target, source) && 
        this._objectsEqual(source, target);
    }

  };

})();


  Polymer.StyleDefaults = (function() {

    var styleProperties = Polymer.StyleProperties;
    var styleUtil = Polymer.StyleUtil;
    var StyleCache = Polymer.StyleCache;

    var api = {

      _styles: [],
      _properties: null,
      customStyle: {},
      _styleCache: new StyleCache(),

      addStyle: function(style) {
        this._styles.push(style);
        this._properties = null;
      },

      // NOTE: this object can be used as a styling scope so it has an api
      // similar to that of an element wrt style properties
      get _styleProperties() {
        if (!this._properties) {
          // force rules to reparse since they may be out of date
          styleProperties.decorateStyles(this._styles);
          // NOTE: reset cache for own properties; it may have been set when
          // an element in an import applied styles (e.g. custom-style)
          this._styles._scopeStyleProperties = null;
          this._properties = styleProperties
            .scopePropertiesFromStyles(this._styles);
          // mixin customStyle
          styleProperties.mixinCustomStyle(this._properties, this.customStyle);
          styleProperties.reify(this._properties);
        }
        return this._properties;
      },

      _needsStyleProperties: function() {},

      _computeStyleProperties: function() {
        return this._styleProperties;
      },

      /**
       * Re-evaluates and applies custom CSS properties to all elements in the
       * document based on dynamic changes, such as adding or removing classes.
       *
       * For performance reasons, Polymer's custom CSS property shim relies
       * on this explicit signal from the user to indicate when changes have
       * been made that affect the values of custom properties.
       *
       * @method updateStyles
       * @param {Object=} properties Properties object which is mixed into 
       * the document root `customStyle` property. This argument provides a 
       * shortcut for setting `customStyle` and then calling `updateStyles`.
      */
      updateStyles: function(properties) {
        // force properties update.
        this._properties = null;
        if (properties) {
          Polymer.Base.mixin(this.customStyle, properties);
        }
        // invalidate the cache
        this._styleCache.clear();
        // update any custom-styles we are tracking
        for (var i=0, s; i < this._styles.length; i++) {
          s = this._styles[i];
          s = s.__importElement || s;
          s._apply();
        }
      }

    };

    // exports
    return api;

  })();


  (function() {
    'use strict';

    var serializeValueToAttribute = Polymer.Base.serializeValueToAttribute;

    var propertyUtils = Polymer.StyleProperties;
    var styleTransformer = Polymer.StyleTransformer;
    var styleUtil = Polymer.StyleUtil;
    var styleDefaults = Polymer.StyleDefaults;

    var nativeShadow = Polymer.Settings.useNativeShadow;

    Polymer.Base._addFeature({

      _prepStyleProperties: function() {
        // note: an element should produce an x-scope stylesheet
        // if it has any _stylePropertyNames
        this._ownStylePropertyNames = this._styles ?
          propertyUtils.decorateStyles(this._styles) :
          [];
      },

      // here we have an instance time spot to put custom property data
      _setupStyleProperties: function() {
        this.customStyle = {};
      },

      _needsStyleProperties: function() {
        return Boolean(this._ownStylePropertyNames &&
          this._ownStylePropertyNames.length);
      },

      _beforeAttached: function() {
        // note: do this once automatically,
        // then requires calling `updateStyles`
        if (!this._scopeSelector && this._needsStyleProperties()) {
          this._updateStyleProperties();
        }
      },

      _findStyleHost: function() {
        var e = this, root;
        while (root = Polymer.dom(e).getOwnerRoot()) {
          if (Polymer.isInstance(root.host)) {
            return root.host;
          }
          e = root.host;
        }
        return styleDefaults;
      },

      _updateStyleProperties: function() {
        var info, scope = this._findStyleHost();
        // install cache in host if it doesn't exist.
        if (!scope._styleCache) {
          scope._styleCache = new Polymer.StyleCache();
        }
        var scopeData = propertyUtils
          .propertyDataFromStyles(scope._styles, this);
        // look in scope cache
        scopeData.key.customStyle = this.customStyle;
        info = scope._styleCache.retrieve(this.is, scopeData.key, this._styles);
        // compute style properties (fast path, if cache hit)
        var scopeCached = Boolean(info);
        if (scopeCached) {
          // when scope cached, we can safely take style propertis out of the
          // scope cache because they are only for this scope.
          this._styleProperties = info._styleProperties;
        } else {
          this._computeStyleProperties(scopeData.properties);
        }
        this._computeOwnStyleProperties();
        // cache miss, do work!
        if (!scopeCached) {
          // and look in 2ndary global cache
          info = styleCache.retrieve(this.is,
            this._ownStyleProperties, this._styles);
        }
        var globalCached = Boolean(info) && !scopeCached;
        // now we have properties and a cached style if one
        // is available.
        var style = this._applyStyleProperties(info);
        // no cache so store in cache
        //console.warn(this.is, scopeCached, globalCached, info && info._scopeSelector);
        if (!scopeCached) {
          // create an info object for caching
          // TODO(sorvell): clone style node when using native Shadow DOM
          // so a style used in a root does not itself get stored in the cache
          // This can lead to incorrect sharing, but should be fixed
          // in `Polymer.StyleProperties.applyElementStyle`
          style = style && nativeShadow ? style.cloneNode(true) : style;
          info = {
            style: style,
            _scopeSelector: this._scopeSelector,
            _styleProperties: this._styleProperties
          }
          scopeData.key.customStyle = {};
          this.mixin(scopeData.key.customStyle, this.customStyle);
          scope._styleCache.store(this.is, info, scopeData.key, this._styles);
          if (!globalCached) {
            // save in global cache
            styleCache.store(this.is, Object.create(info), this._ownStyleProperties,
            this._styles);
          }
        }
      },

      _computeStyleProperties: function(scopeProps) {
        // get scope and make sure it has properties
        var scope = this._findStyleHost();
        // force scope to compute properties if they don't exist or if forcing
        // and it doesn't need properties
        if (!scope._styleProperties) {
          scope._computeStyleProperties();
        }
        // start with scope style properties
        var props = Object.create(scope._styleProperties);
        // mixin own host properties (lower specifity than scope props)
        this.mixin(props, propertyUtils.hostPropertiesFromStyles(this._styles));
        // mixin properties matching this element in scope
        scopeProps = scopeProps ||
          propertyUtils.propertyDataFromStyles(scope._styles, this).properties;
        this.mixin(props, scopeProps);
        // finally mixin properties inherent to this element
        this.mixin(props,
          propertyUtils.scopePropertiesFromStyles(this._styles));
        propertyUtils.mixinCustomStyle(props, this.customStyle);
        // reify properties (note: only does own properties)
        propertyUtils.reify(props);
        this._styleProperties = props;
      },

      _computeOwnStyleProperties: function() {
        var props = {};
        for (var i=0, n; i < this._ownStylePropertyNames.length; i++) {
          n = this._ownStylePropertyNames[i];
          props[n] = this._styleProperties[n];
        }
        this._ownStyleProperties = props;
      },

      _scopeCount: 0,

      _applyStyleProperties: function(info) {
        // update scope selector (needed for style transformation)
        var oldScopeSelector = this._scopeSelector;
        // note, the scope selector is incremented per class counter
        this._scopeSelector = info ? info._scopeSelector :
          this.is + '-' + this.__proto__._scopeCount++;
        var style = propertyUtils.applyElementStyle(this,
          this._styleProperties, this._scopeSelector, info && info.style);
        // apply scope selector
        if (!nativeShadow) {
          propertyUtils.applyElementScopeSelector(this, this._scopeSelector,
            oldScopeSelector, this._scopeCssViaAttr);
        }
        return style;
      },

      serializeValueToAttribute: function(value, attribute, node) {
        // override to ensure whenever classes are set, we need to shim them.
        node = node || this;
        if (attribute === 'class' && !nativeShadow) {
          // host needed to scope styling.
          // Under Shady DOM, domHost is safe to use here because we know it
          // is a Polymer element
          var host = node === this ? (this.domHost || this.dataHost) : this;
          if (host) {
            value = host._scopeElementClass(node, value);
          }
        }
        // note: using Polymer.dom here ensures that any attribute sets
        // will provoke distribution if necessary
        node = Polymer.dom(node);
        serializeValueToAttribute.call(this, value, attribute, node);
      },

      _scopeElementClass: function(element, selector) {
        if (!nativeShadow && !this._scopeCssViaAttr) {
          selector += (selector ? ' ' : '') + SCOPE_NAME + ' ' + this.is +
            (element._scopeSelector ? ' ' +  XSCOPE_NAME + ' ' +
            element._scopeSelector : '');
        }
        return selector;
      },

      /**
       * Re-evaluates and applies custom CSS properties based on dynamic
       * changes to this element's scope, such as adding or removing classes
       * in this element's local DOM.
       *
       * For performance reasons, Polymer's custom CSS property shim relies
       * on this explicit signal from the user to indicate when changes have
       * been made that affect the values of custom properties.
       *
       * @method updateStyles
       * @param {Object=} properties Properties object which is mixed into
       * the element's `customStyle` property. This argument provides a shortcut
       * for setting `customStyle` and then calling `updateStyles`.
      */
      updateStyles: function(properties) {
        if (this.isAttached) {
          if (properties) {
            this.mixin(this.customStyle, properties);
          }
          // skip applying properties to self if not used
          if (this._needsStyleProperties()) {
            this._updateStyleProperties();
          // when an element doesn't use style properties, its own properties
          // should be invalidated so elements down the tree update ok.
          } else {
            this._styleProperties = null;
          }
          if (this._styleCache) {
            this._styleCache.clear();
          }
          // always apply properties to root
          this._updateRootStyles();
        }
      },

      _updateRootStyles: function(root) {
        root = root || this.root;
        var c$ = Polymer.dom(root)._query(function(e) {
          return e.shadyRoot || e.shadowRoot;
        });
        for (var i=0, l= c$.length, c; (i<l) && (c=c$[i]); i++) {
          if (c.updateStyles) {
            c.updateStyles();
          }
        }
      }

    });

    /**
     * Force all custom elements using cross scope custom properties,
     * to update styling.
     */
    Polymer.updateStyles = function(properties) {
      // update default/custom styles
      styleDefaults.updateStyles(properties);
      // search the document for elements to update
      Polymer.Base._updateRootStyles(document);
    };

    var styleCache = new Polymer.StyleCache();
    Polymer.customStyleCache = styleCache;

    var SCOPE_NAME = styleTransformer.SCOPE_NAME;
    var XSCOPE_NAME = propertyUtils.XSCOPE_NAME;

  })();



  Polymer.Base._addFeature({

    _registerFeatures: function() {
      // identity
      this._prepIs();
      // attributes
      this._prepAttributes();
      // factory
      this._prepConstructor();
      // template
      this._prepTemplate();
      // styles
      this._prepStyles();
      // style properties
      this._prepStyleProperties();
      // template markup
      this._prepAnnotations();
      // accessors
      this._prepEffects();
      // shared behaviors
      this._prepBehaviors();
      // accessors part 2
      this._prepBindings();
      // dom encapsulation
      this._prepShady();
    },

    _prepBehavior: function(b) {
      this._addPropertyEffects(b.properties);
      this._addComplexObserverEffects(b.observers);
      this._addHostAttributes(b.hostAttributes);
    },

    _initFeatures: function() {
      // manage local dom
      this._poolContent();
      // manage configuration
      this._setupConfigure();
      // setup style properties
      this._setupStyleProperties();
      // host stack
      this._pushHost();
      // instantiate template
      this._stampTemplate();
      // host stack
      this._popHost();
      // concretize template references
      this._marshalAnnotationReferences();
      // install host attributes
      this._marshalHostAttributes();
      // setup debouncers
      this._setupDebouncers();
      // concretize effects on instance
      this._marshalInstanceEffects();
      // acquire instance behaviors
      this._marshalBehaviors();
      // acquire initial instance attribute values
      this._marshalAttributes();
      // top-down initial distribution, configuration, & ready callback
      this._tryReady();
    },

    _marshalBehavior: function(b) {
      // establish listeners on instance
      this._listenListeners(b.listeners);
    }

  });






(function() {

  var nativeShadow = Polymer.Settings.useNativeShadow;
  var propertyUtils = Polymer.StyleProperties;
  var styleUtil = Polymer.StyleUtil;
  var styleDefaults = Polymer.StyleDefaults;
  var styleTransformer = Polymer.StyleTransformer;

  Polymer({

    is: 'custom-style',
    extends: 'style',

    created: function() {
      // NOTE: we cannot just check attached because custom elements in 
      // HTMLImports do not get attached.
      this._tryApply();
    },

    attached: function() {
      this._tryApply();
    },

    _tryApply: function() {
      if (!this._appliesToDocument) {
        // only apply variables iff this style is not inside a dom-module
        if (this.parentNode && 
          (this.parentNode.localName !== 'dom-module')) {
          this._appliesToDocument = true;
          // used applied element from HTMLImports polyfill or this
          var e = this.__appliedElement || this;
          styleDefaults.addStyle(e);
          // we may not have any textContent yet due to parser yielding
          // if so, wait until we do...
          if (e.textContent) {
            this._apply();
          } else {
            var observer = new MutationObserver(function() {
              observer.disconnect();
              this._apply();
            }.bind(this));
            observer.observe(e, {childList: true});
          }
        }
      }
    },

    // polyfill this style with root scoping and 
    // apply custom properties!
    _apply: function() {
      // used applied element from HTMLImports polyfill or this
      var e = this.__appliedElement || this;
      this._computeStyleProperties();
      var props = this._styleProperties;
      var self = this;
      e.textContent = styleUtil.toCssText(styleUtil.rulesForStyle(e), 
        function(rule) {
          var css = rule.cssText = rule.parsedCssText;
          if (rule.propertyInfo && rule.propertyInfo.cssText) {
            // TODO(sorvell): factor better
            // remove property assignments so next function isn't confused
            css = css.replace(propertyUtils.rx.VAR_ASSIGN, '');
            // replace with reified properties, scenario is same as mixin
            rule.cssText = propertyUtils.valueForProperties(css, props);
          }
          styleTransformer.documentRule(rule);
        }
      );
    }

  });

})();



  /**
   * The `Polymer.Templatizer` behavior adds methods to generate instances of
   * templates that are each managed by an anonymous `Polymer.Base` instance.
   *
   * Example:
   *
   *     // Get a template from somewhere, e.g. light DOM
   *     var template = Polymer.dom(this).querySelector('template');
   *     // Prepare the template
   *     this.templatize(template);
   *     // Instance the template with an initial data model
   *     var instance = this.stamp({myProp: 'initial'});
   *     // Insert the instance's DOM somewhere, e.g. light DOM
   *     Polymer.dom(this).appendChild(instance.root);
   *     // Changing a property on the instance will propagate to bindings
   *     // in the template
   *     instance.myProp = 'new value';
   *
   * Users of `Templatizer` may need to implement the following abstract
   * API's to determine how properties and paths from the host should be
   * forwarded into to instances:
   *
   *     _forwardParentProp: function(prop, value)
   *     _forwardParentPath: function(path, value)
   *
   * Likewise, users may implement these additional abstract API's to determine
   * how instance-specific properties that change on the instance should be
   * forwarded out to the host, if necessary.
   *
   *     _forwardInstanceProp: function(inst, prop, value)
   *     _forwardInstancePath: function(inst, path, value)
   *
   * In order to determine which properties are instance-specific and require
   * custom forwarding via `_forwardInstanceProp`/`_forwardInstancePath`,
   * define an `_instanceProps` map containing keys for each instance prop,
   * for example:
   *
   *     _instanceProps: {
   *       item: true,
   *       index: true
   *     }
   *
   * Any properties used in the template that are not defined in _instanceProp
   * will be forwarded out to the host automatically.
   *
   * Users should also implement the following abstract function to show or
   * hide any DOM generated using `stamp`:
   *
   *     _showHideChildren: function(shouldHide)
   *
   * @polymerBehavior
   */
  Polymer.Templatizer = {

    properties: {
      __hideTemplateChildren__: {
        observer: '_showHideChildren'
      }
    },

    // Intentionally static object
    _templatizerStatic: {
      count: 0,
      callbacks: {},
      debouncer: null
    },

    // Extension point for overrides
    _instanceProps: Polymer.nob,

    created: function() {
      // id used for consolidated debouncer
      this._templatizerId = this._templatizerStatic.count++;
    },

    /**
     * Prepares a template containing Polymer bindings by generating
     * a constructor for an anonymous `Polymer.Base` subclass to serve as the
     * binding context for the provided template.
     *
     * Use `this.stamp` to create instances of the template context containing
     * a `root` fragment that may be stamped into the DOM.
     *
     * @method templatize
     * @param {HTMLTemplateElement} template The template to process.
     */
    templatize: function(template) {
      // TODO(sjmiles): supply _alternate_ content reference missing from root
      // templates (not nested). `_content` exists to provide content sharing
      // for nested templates.
      if (!template._content) {
        template._content = template.content;
      }
      // fast path if template's anonymous class has been memoized
      if (template._content._ctor) {
        this.ctor = template._content._ctor;
        //console.log('Templatizer.templatize: using memoized archetype');
        // forward parent properties to archetype
        this._prepParentProperties(this.ctor.prototype, template);
        return;
      }
      // `archetype` is the prototype of the anonymous
      // class created by the templatizer
      var archetype = Object.create(Polymer.Base);
      // normally Annotations.parseAnnotations(template) but
      // archetypes do special caching
      this._customPrepAnnotations(archetype, template);

      // setup accessors
      archetype._prepEffects();
      this._customPrepEffects(archetype);
      archetype._prepBehaviors();
      archetype._prepBindings();

      // forward parent properties to archetype
      this._prepParentProperties(archetype, template);

      // boilerplate code
      archetype._notifyPath = this._notifyPathImpl;
      archetype._scopeElementClass = this._scopeElementClassImpl;
      archetype.listen = this._listenImpl;
      archetype._showHideChildren = this._showHideChildrenImpl;
      // boilerplate code
      var _constructor = this._constructorImpl;
      var ctor = function TemplateInstance(model, host) {
        _constructor.call(this, model, host);
      };
      // standard references
      ctor.prototype = archetype;
      archetype.constructor = ctor;
      // TODO(sjmiles): constructor cache?
      template._content._ctor = ctor;
      // TODO(sjmiles): choose less general name
      this.ctor = ctor;
    },

    _getRootDataHost: function() {
      return (this.dataHost && this.dataHost._rootDataHost) || this.dataHost;
    },

    _showHideChildrenImpl: function(hide) {
      var c = this._children;
      for (var i=0; i<c.length; i++) {
        var n = c[i];
        if (n.style) {
          n.style.display = hide ? 'none' : '';
          n.__hideTemplateChildren__ = hide;
        }
      }
    },

    _debounceTemplate: function(fn) {
      this._templatizerStatic.callbacks[this._templatizerId] = fn.bind(this);
      this._templatizerStatic.debouncer =
        Polymer.Debounce(this._templatizerStatic.debouncer,
          this._flushTemplates.bind(this, true));
    },

    _flushTemplates: function(debouncerExpired) {
      var db = this._templatizerStatic.debouncer;
      // completely flush any re-queued callbacks resulting from stamping
      while (debouncerExpired || (db && db.finish)) {
        db.stop();
        var cbs = this._templatizerStatic.callbacks;
        this._templatizerStatic.callbacks = {};
        for (var id in cbs) {
          cbs[id]();
        }
        debouncerExpired = false;
      }
    },

    _customPrepEffects: function(archetype) {
      var parentProps = archetype._parentProps;
      for (var prop in parentProps) {
        archetype._addPropertyEffect(prop, 'function',
          this._createHostPropEffector(prop));
      }
      for (var prop in this._instanceProps) {
        archetype._addPropertyEffect(prop, 'function',
          this._createInstancePropEffector(prop));
      }
    },

    _customPrepAnnotations: function(archetype, template) {
      archetype._template = template;
      var c = template._content;
      if (!c._notes) {
        var rootDataHost = archetype._rootDataHost;
        if (rootDataHost) {
          Polymer.Annotations.prepElement =
            rootDataHost._prepElement.bind(rootDataHost);
        }
        c._notes = Polymer.Annotations.parseAnnotations(template);
        Polymer.Annotations.prepElement = null;
        this._processAnnotations(c._notes);
      }
      archetype._notes = c._notes;
      archetype._parentProps = c._parentProps;
    },

    // Sets up accessors on the template to call abstract _forwardParentProp
    // API that should be implemented by Templatizer users to get parent
    // properties to their template instances.  These accessors are memoized
    // on the archetype and copied to instances.
    _prepParentProperties: function(archetype, template) {
      var parentProps = this._parentProps = archetype._parentProps;
      if (this._forwardParentProp && parentProps) {
        // Prototype setup (memoized on archetype)
        var proto = archetype._parentPropProto;
        var prop;
        if (!proto) {
          for (prop in this._instanceProps) {
            delete parentProps[prop];
          }
          proto = archetype._parentPropProto = Object.create(null);
          if (template != this) {
            // Assumption: if `this` isn't the template being templatized,
            // assume that the template is not a Poylmer.Base, so prep it
            // for binding
            Polymer.Bind.prepareModel(proto);
          }
          // Create accessors for each parent prop that forward the property
          // to template instances through abstract _forwardParentProp API
          // that should be implemented by Templatizer users
          for (prop in parentProps) {
            var parentProp = '_parent_' + prop;
            var effects = [{
              kind: 'function',
              effect: this._createForwardPropEffector(prop)
            }, {
              kind: 'notify'
            }];
            Polymer.Bind._createAccessors(proto, parentProp, effects);
          }
        }
        // Instance setup
        if (template != this) {
          Polymer.Bind.prepareInstance(template);
          template._forwardParentProp =
            this._forwardParentProp.bind(this);
        }
        this._extendTemplate(template, proto);
      }
    },

    _createForwardPropEffector: function(prop) {
      return function(source, value) {
        this._forwardParentProp(prop, value);
      };
    },

    _createHostPropEffector: function(prop) {
      return function(source, value) {
        this.dataHost['_parent_' + prop] = value;
      };
    },

    _createInstancePropEffector: function(prop) {
      return function(source, value, old, fromAbove) {
        if (!fromAbove) {
          this.dataHost._forwardInstanceProp(this, prop, value);
        }
      };
    },

    // Similar to Polymer.Base.extend, but retains any previously set instance
    // values (_propertySetter back on instance once accessor is installed)
    _extendTemplate: function(template, proto) {
      Object.getOwnPropertyNames(proto).forEach(function(n) {
        var val = template[n];
        var pd = Object.getOwnPropertyDescriptor(proto, n);
        Object.defineProperty(template, n, pd);
        if (val !== undefined) {
          template._propertySetter(n, val);
        }
      });
    },

    // Extension points for Templatizer sub-classes
    _showHideChildren: function(hidden) { },
    _forwardInstancePath: function(inst, path, value) { },
    _forwardInstanceProp: function(inst, prop, value) { },
    // Defined-check rather than thunk used to avoid unnecessary work for these:
    // _forwardParentPath: function(path, value) { },
    // _forwardParentProp: function(prop, value) { },

    _notifyPathImpl: function(path, value) {
      var dataHost = this.dataHost;
      var dot = path.indexOf('.');
      var root = dot < 0 ? path : path.slice(0, dot);
      // Call extension point for Templatizer sub-classes
      dataHost._forwardInstancePath.call(dataHost, this, path, value);
      if (root in dataHost._parentProps) {
        dataHost.notifyPath('_parent_' + path, value);
      }
    },

    // Overrides Base notify-path module
    _pathEffector: function(path, value, fromAbove) {
      if (this._forwardParentPath) {
        if (path.indexOf('_parent_') === 0) {
          this._forwardParentPath(path.substring(8), value);
        }
      }
      Polymer.Base._pathEffector.apply(this, arguments);
    },

    _constructorImpl: function(model, host) {
      this._rootDataHost = host._getRootDataHost();
      this._setupConfigure(model);
      this._pushHost(host);
      this.root = this.instanceTemplate(this._template);
      this.root.__noContent = !this._notes._hasContent;
      this.root.__styleScoped = true;
      this._popHost();
      this._marshalAnnotatedNodes();
      this._marshalInstanceEffects();
      this._marshalAnnotatedListeners();
      // each row is a document fragment which is lost when we appendChild,
      // so we have to track each child individually
      var children = [];
      for (var n = this.root.firstChild; n; n=n.nextSibling) {
        children.push(n);
        n._templateInstance = this;
      }
      // Since archetype overrides Base/HTMLElement, Safari complains
      // when accessing `children`
      this._children = children;
      // Ensure newly stamped nodes reflect host's hidden state
      if (host.__hideTemplateChildren__) {
        this._showHideChildren(true);
      }
      // ready self and children
      this._tryReady();
    },

    // Decorate events with model (template instance)
    _listenImpl: function(node, eventName, methodName) {
      var model = this;
      var host = this._rootDataHost;
      var handler = host._createEventHandler(node, eventName, methodName);
      var decorated = function(e) {
        e.model = model;
        handler(e);
      };
      host._listen(node, eventName, decorated);
    },

    _scopeElementClassImpl: function(node, value) {
      var host = this._rootDataHost;
      if (host) {
        return host._scopeElementClass(node, value);
      }
    },

    /**
     * Creates an instance of the template previously processed via
     * a call to `templatize`.
     *
     * The object returned is an anonymous subclass of Polymer.Base that
     * has accessors generated to manage data in the template.  The DOM for
     * the instance is contained in a DocumentFragment called `root` on
     * the instance returned and must be manually inserted into the DOM
     * by the user.
     *
     * Note that a call to `templatize` must be called once before using
     * `stamp`.
     *
     * @method stamp
     * @param {Object} model An object containing key/values to serve as the
     *   initial data configuration for the instance.  Note that properties
     *   from the host used in the template are automatically copied into
     *   the model.
     * @param {Polymer.Base} The Polymer.Base instance to manage the template
     *   instance.
     */
    stamp: function(model) {
      model = model || {};
      if (this._parentProps) {
        for (var prop in this._parentProps) {
          model[prop] = this['_parent_' + prop];
        }
      }
      return new this.ctor(model, this);
    },

    /**
     * Returns the template "model" associated with a given element, which
     * serves as the binding scope for the template instance the element is
     * contained in. A template model is an instance of `Polymer.Base`, and
     * should be used to manipulate data associated with this template instance.
     *
     * Example:
     *
     *   var model = modelForElement(el);
     *   if (model.index < 10) {
     *     model.set('item.checked', true);
     *   }
     *
     * @method modelForElement
     * @param {HTMLElement} el Element for which to return a template model.
     * @return {Object<Polymer.Base>} Model representing the binding scope for
     *   the element.
     */
    modelForElement: function(el) {
      var model;
      while (el) {
        // An element with a _templateInstance marks the top boundary
        // of a scope; walk up until we find one, and then ensure that
        // its dataHost matches `this`, meaning this dom-repeat stamped it
        if (model = el._templateInstance) {
          // Found an element stamped by another template; keep walking up
          // from its dataHost
          if (model.dataHost != this) {
            el = model.dataHost;
          } else {
            return model;
          }
        } else {
          // Still in a template scope, keep going up until
          // a _templateInstance is found
          el = el.parentNode;
        }
      }
    }

    // TODO(sorvell): note, using the template as host is ~5-10% faster if
    // elements have no default values.
    // _constructorImpl: function(model, host) {
    //   this._setupConfigure(model);
    //   host._beginHost();
    //   this.root = this.instanceTemplate(this._template);
    //   host._popHost();
    //   this._marshalTemplateContent();
    //   this._marshalAnnotatedNodes();
    //   this._marshalInstanceEffects();
    //   this._marshalAnnotatedListeners();
    //   this._ready();
    // },

    // stamp: function(model) {
    //   return new this.ctor(model, this.dataHost);
    // }


  };



  /**
   * Creates a pseudo-custom-element that maps property values to bindings
   * in DOM.
   * 
   * `stamp` method creates an instance of the pseudo-element. The instance
   * references a document-fragment containing the stamped and bound dom
   * via it's `root` property. 
   *  
   */
  Polymer({

    is: 'dom-template',
    extends: 'template',

    behaviors: [
      Polymer.Templatizer
    ],

    ready: function() {
      this.templatize(this);
    }

  });




  Polymer._collections = new WeakMap();

  Polymer.Collection = function(userArray) {
    Polymer._collections.set(userArray, this);
    this.userArray = userArray;
    this.store = userArray.slice();
    this.initMap();
  };

  Polymer.Collection.prototype = {

    constructor: Polymer.Collection,

    initMap: function() {
      var omap = this.omap = new WeakMap();
      var pmap = this.pmap = {};
      var s = this.store;
      for (var i=0; i<s.length; i++) {
        var item = s[i];
        if (item && typeof item == 'object') {
          omap.set(item, i);
        } else {
          pmap[item] = i;
        }
      }
    },

    add: function(item) {
      var key = this.store.push(item) - 1;
      if (item && typeof item == 'object') {
        this.omap.set(item, key);
      } else {
        this.pmap[item] = key;
      }
      return key;
    },

    removeKey: function(key) {
      this._removeFromMap(this.store[key]);
      delete this.store[key];
    },

    _removeFromMap: function(item) {
      if (item && typeof item == 'object') {
        this.omap.delete(item);
      } else {
        delete this.pmap[item];
      }
    },

    remove: function(item) {
      var key = this.getKey(item);
      this.removeKey(key);
      return key;
    },

    getKey: function(item) {
      if (item && typeof item == 'object') {
        return this.omap.get(item);
      } else {
        return this.pmap[item];
      }
    },

    getKeys: function() {
      return Object.keys(this.store);
    },

    setItem: function(key, item) {
      var old = this.store[key];
      if (old) {
        this._removeFromMap(old);
      }
      if (item && typeof item == 'object') {
        this.omap.set(item, key);
      } else {
        this.pmap[item] = key;
      }
      this.store[key] = item;
    },

    getItem: function(key) {
      return this.store[key];
    },

    getItems: function() {
      var items = [], store = this.store;
      for (var key in store) {
        items.push(store[key]);
      }
      return items;
    },

    _applySplices: function(splices) {
      var keySplices = [];
      for (var i=0; i<splices.length; i++) {
        var j, o, key, s = splices[i];
        // Removed keys
        var removed = [];
        for (j=0; j<s.removed.length; j++) {
          o = s.removed[j];
          key = this.remove(o);
          removed.push(key);
        }
        // Added keys
        var added = [];
        for (j=0; j<s.addedCount; j++) {
          o = this.userArray[s.index + j];
          key = this.add(o);
          added.push(key);
        }
        // Record splice
        keySplices.push({
          index: s.index,
          removed: removed,
          removedItems: s.removed,
          added: added
        });
      }
      return keySplices;
    }

  };

  Polymer.Collection.get = function(userArray) {
    return Polymer._collections.get(userArray) ||
      new Polymer.Collection(userArray);
  };

  Polymer.Collection.applySplices = function(userArray, splices) {
    // Only apply splices & generate keySplices if the array already has a
    // backing Collection, meaning there is an element monitoring its keys;
    // Splices that happen before the collection has been created must be
    // discarded to avoid double-entries
    var coll = Polymer._collections.get(userArray);
    return coll ? coll._applySplices(splices) : null;
  };




  Polymer({

    is: 'dom-repeat',
    extends: 'template',

    /**
     * Fired whenever DOM is added or removed by this template (by
     * default, rendering occurs lazily).  To force immediate rendering, call
     * `render`.
     *
     * @event dom-change
     */

    properties: {

      /**
       * An array containing items determining how many instances of the template
       * to stamp and that that each template instance should bind to.
       */
      items: {
        type: Array
      },

      /**
       * The name of the variable to add to the binding scope for the array
       * element associated with a given template instance.
       */
      as: {
        type: String,
        value: 'item'
      },

      /**
       * The name of the variable to add to the binding scope with the index
       * for the inst.  If `sort` is provided, the index will reflect the
       * sorted order (rather than the original array order).
       */
      indexAs: {
        type: String,
        value: 'index'
      },

      /**
       * A function that should determine the sort order of the items.  This
       * property should either be provided as a string, indicating a method
       * name on the element's host, or else be an actual function.  The
       * function should match the sort function passed to `Array.sort`.
       * Using a sort function has no effect on the underlying `items` array.
       */
      sort: {
        type: Function,
        observer: '_sortChanged'
      },

      /**
       * A function that can be used to filter items out of the view.  This
       * property should either be provided as a string, indicating a method
       * name on the element's host, or else be an actual function.  The
       * function should match the sort function passed to `Array.filter`.
       * Using a filter function has no effect on the underlying `items` array.
       */
      filter: {
        type: Function,
        observer: '_filterChanged'
      },

      /**
       * When using a `filter` or `sort` function, the `observe` property
       * should be set to a space-separated list of the names of item
       * sub-fields that should trigger a re-sort or re-filter when changed.
       * These should generally be fields of `item` that the sort or filter
       * function depends on.
       */
      observe: {
        type: String,
        observer: '_observeChanged'
      },

      /**
       * When using a `filter` or `sort` function, the `delay` property
       * determines a debounce time after a change to observed item
       * properties that must pass before the filter or sort is re-run.
       * This is useful in rate-limiting shuffing of the view when
       * item changes may be frequent.
       */
      delay: Number
    },

    behaviors: [
      Polymer.Templatizer
    ],

    observers: [
      '_itemsChanged(items.*)'
    ],

    created: function() {
      this._instances = [];
    },

    detached: function() {
      for (var i=0; i<this._instances.length; i++) {
        this._detachRow(i);
      }
    },

    attached: function() {
      var parentNode = Polymer.dom(this).parentNode;
      for (var i=0; i<this._instances.length; i++) {
        Polymer.dom(parentNode).insertBefore(this._instances[i].root, this);
      }
    },

    ready: function() {
      // Template instance props that should be excluded from forwarding
      this._instanceProps = {
        __key__: true
      };
      this._instanceProps[this.as] = true;
      this._instanceProps[this.indexAs] = true;
      // Templatizing (generating the instance constructor) needs to wait
      // until ready, since won't have its template content handed back to
      // it until then
      if (!this.ctor) {
        this.templatize(this);
      }
    },

    _sortChanged: function() {
      var dataHost = this._getRootDataHost();
      var sort = this.sort;
      this._sortFn = sort && (typeof sort == 'function' ? sort :
        function() { return dataHost[sort].apply(dataHost, arguments); });
      this._needFullRefresh = true;
      if (this.items) {
        this._debounceTemplate(this._render);
      }
    },

    _filterChanged: function() {
      var dataHost = this._getRootDataHost();
      var filter = this.filter;
      this._filterFn = filter && (typeof filter == 'function' ? filter :
        function() { return dataHost[filter].apply(dataHost, arguments); });
      this._needFullRefresh = true;
      if (this.items) {
        this._debounceTemplate(this._render);
      }
    },

    _observeChanged: function() {
      this._observePaths = this.observe &&
        this.observe.replace('.*', '.').split(' ');
    },

    _itemsChanged: function(change) {
      if (change.path == 'items') {
        if (Array.isArray(this.items)) {
          this.collection = Polymer.Collection.get(this.items);
        } else if (!this.items) {
          this.collection = null;
        } else {
          this._error(this._logf('dom-repeat', 'expected array for `items`,' +
            ' found', this.items));
        }
        this._splices = [];
        this._needFullRefresh = true;
        this._debounceTemplate(this._render);
      } else if (change.path == 'items.splices') {
        this._splices = this._splices.concat(change.value.keySplices);
        this._debounceTemplate(this._render);
      } else { // items.*
        // slice off 'items.' ('items.'.length == 6)
        var subpath = change.path.slice(6);
        this._forwardItemPath(subpath, change.value);
        this._checkObservedPaths(subpath);
      }
    },

    _checkObservedPaths: function(path) {
      if (this._observePaths) {
        path = path.substring(path.indexOf('.') + 1);
        var paths = this._observePaths;
        for (var i=0; i<paths.length; i++) {
          if (path.indexOf(paths[i]) === 0) {
            // TODO(kschaaf): interim solution: ideally this is just an incremental
            // insertion sort of the changed item
            this._needFullRefresh = true;
            if (this.delay) {
              this.debounce('render', this._render, this.delay);
            } else {
              this._debounceTemplate(this._render);
            }
            return;
          }
        }
      }
    },

    render: function() {
      // Queue this repeater, then flush all in order
      this._needFullRefresh = true;
      this._debounceTemplate(this._render);
      this._flushTemplates();
    },

    _render: function() {
      var c = this.collection;
      // Choose rendering path: full vs. incremental using splices
      if (this._needFullRefresh) {
        this._applyFullRefresh();
        this._needFullRefresh = false;
      } else {
        if (this._sortFn) {
          this._applySplicesUserSort(this._splices);
        } else {
          if (this._filterFn) {
            // TODK(kschaaf): Filtering using array sort takes slow path
            this._applyFullRefresh();
          } else {
            this._applySplicesArrayOrder(this._splices);
          }
        }
      }
      this._splices = [];
      // Update final _keyToInstIdx and instance indices
      var keyToIdx = this._keyToInstIdx = {};
      for (var i=0; i<this._instances.length; i++) {
        var inst = this._instances[i];
        keyToIdx[inst.__key__] = i;
        inst.__setProperty(this.indexAs, i, true);
      }
      this.fire('dom-change');
    },

    // Render method 1: full refesh
    // ----
    // Full list of keys is pulled from the collection, then sorted, filtered,
    // and iterated to create (or reuse) existing instances
    _applyFullRefresh: function() {
      var c = this.collection;
      // Start with unordered keys for user sort,
      // or get them in array order for array order
      var keys;
      if (this._sortFn) {
        keys = c ? c.getKeys() : [];
      } else {
        keys = [];
        var items = this.items;
        if (items) {
          for (var i=0; i<items.length; i++) {
            keys.push(c.getKey(items[i]));
          }
        }
      }
      // Apply user filter to keys
      if (this._filterFn) {
        keys = keys.filter(function(a) {
          return this._filterFn(c.getItem(a));
        }, this);
      }
      // Apply user sort to keys
      if (this._sortFn) {
        keys.sort(function(a, b) {
          return this._sortFn(c.getItem(a), c.getItem(b));
        }.bind(this));
      }
      // Generate instances and assign items and keys
      for (var i=0; i<keys.length; i++) {
        var key = keys[i];
        var inst = this._instances[i];
        if (inst) {
          inst.__setProperty('__key__', key, true);
          inst.__setProperty(this.as, c.getItem(key), true);
        } else {
          this._instances.push(this._insertRow(i, key));
        }
      }
      // Remove any extra instances from previous state
      for (; i<this._instances.length; i++) {
        this._detachRow(i);
      }
      this._instances.splice(keys.length, this._instances.length-keys.length);
    },

    _keySort: function(a, b) {
      return this.collection.getKey(a) - this.collection.getKey(b);
    },

    // Render method 2: incremental update using splices with user sort applied
    // ----
    // Removed/added keys are deduped, all removed rows are detached and pooled
    // first, and added rows are insertion-sorted into place using user sort
    _applySplicesUserSort: function(splices) {
      var c = this.collection;
      var instances = this._instances;
      var keyMap = {};
      var pool = [];
      var sortFn = this._sortFn || this._keySort.bind(this);
      // Dedupe added and removed keys to a final added/removed map
      splices.forEach(function(s) {
        for (var i=0; i<s.removed.length; i++) {
          var key = s.removed[i];
          keyMap[key] = keyMap[key] ? null : -1;
        }
        for (var i=0; i<s.added.length; i++) {
          var key = s.added[i];
          keyMap[key] = keyMap[key] ? null : 1;
        }
      }, this);
      // Convert added/removed key map to added/removed arrays
      var removedIdxs = [];
      var addedKeys = [];
      for (var key in keyMap) {
        if (keyMap[key] === -1) {
          removedIdxs.push(this._keyToInstIdx[key]);
        }
        if (keyMap[key] === 1) {
          addedKeys.push(key);
        }
      }
      // Remove & pool removed instances
      if (removedIdxs.length) {
        // Sort removed instances idx's then remove backwards,
        // so we don't invalidate instance index
        removedIdxs.sort();
        for (var i=removedIdxs.length-1; i>=0 ; i--) {
          var idx = removedIdxs[i];
          // Removed idx may be undefined if item was previously filtered out
          if (idx !== undefined) {
            pool.push(this._detachRow(idx));
            instances.splice(idx, 1);
          }
        }
      }
      // Add instances for added keys
      if (addedKeys.length) {
        // Filter added keys
        if (this._filterFn) {
          addedKeys = addedKeys.filter(function(a) {
            return this._filterFn(c.getItem(a));
          }, this);
        }
        // Sort added keys
        addedKeys.sort(function(a, b) {
          return this._sortFn(c.getItem(a), c.getItem(b));
        }.bind(this));
        // Insertion-sort new instances into place (from pool or newly created)
        var start = 0;
        for (var i=0; i<addedKeys.length; i++) {
          start = this._insertRowUserSort(start, addedKeys[i], pool);
        }
      }
    },

    _insertRowUserSort: function(start, key, pool) {
      var c = this.collection;
      var item = c.getItem(key);
      var end = this._instances.length - 1;
      var idx = -1;
      var sortFn = this._sortFn || this._keySort.bind(this);
      // Binary search for insertion point
      while (start <= end) {
        var mid = (start + end) >> 1;
        var midKey = this._instances[mid].__key__;
        var cmp = sortFn(c.getItem(midKey), item);
        if (cmp < 0) {
          start = mid + 1;
        } else if (cmp > 0) {
          end = mid - 1;
        } else {
          idx = mid;
          break;
        }
      }
      if (idx < 0) {
        idx = end + 1;
      }
      // Insert instance at insertion point
      this._instances.splice(idx, 0, this._insertRow(idx, key, pool));
      return idx;
    },

    // Render method 3: incremental update using splices with array order
    // ----
    // Splices are processed in order; removed rows are pooled, and added
    // rows are as placeholders, and placeholders are updated to
    // actual rows at the end to take full advantage of removed rows
    _applySplicesArrayOrder: function(splices) {
      var pool = [];
      var c = this.collection;
      splices.forEach(function(s) {
        // Detach & pool removed instances
        for (var i=0; i<s.removed.length; i++) {
          var inst = this._detachRow(s.index + i);
          if (!inst.isPlaceholder) {
            pool.push(inst);
          }
        }
        this._instances.splice(s.index, s.removed.length);
        // Insert placeholders for new rows
        for (var i=0; i<s.added.length; i++) {
          var inst = {
            isPlaceholder: true,
            key: s.added[i]
          };
          this._instances.splice(s.index + i, 0, inst);
        }
      }, this);
      // Replace placeholders with actual instances (from pool or newly created)
      // Iterate backwards to ensure insertBefore refrence is never a placeholder
      for (var i=this._instances.length-1; i>=0; i--) {
        var inst = this._instances[i];
        if (inst.isPlaceholder) {
          this._instances[i] = this._insertRow(i, inst.key, pool, true);
        }
      }
    },

    _detachRow: function(idx) {
      var inst = this._instances[idx];
      if (!inst.isPlaceholder) {
        var parentNode = Polymer.dom(this).parentNode;
        for (var i=0; i<inst._children.length; i++) {
          var el = inst._children[i];
          Polymer.dom(inst.root).appendChild(el);
        }
      }
      return inst;
    },

    _insertRow: function(idx, key, pool, replace) {
      var inst;
      if (inst = pool && pool.pop()) {
        inst.__setProperty(this.as, this.collection.getItem(key), true);
        inst.__setProperty('__key__', key, true);
      } else {
        inst = this._generateRow(idx, key);
      }
      var beforeRow = this._instances[replace ? idx + 1 : idx];
      var beforeNode = beforeRow ? beforeRow._children[0] : this;
      var parentNode = Polymer.dom(this).parentNode;
      Polymer.dom(parentNode).insertBefore(inst.root, beforeNode);
      return inst;
    },

    _generateRow: function(idx, key) {
      var model = {
        __key__: key
      };
      model[this.as] = this.collection.getItem(key);
      model[this.indexAs] = idx;
      var inst = this.stamp(model);
      return inst;
    },

    // Implements extension point from Templatizer mixin
    _showHideChildren: function(hidden) {
      for (var i=0; i<this._instances.length; i++) {
        this._instances[i]._showHideChildren(hidden);
      }
    },

    // Called as a side effect of a template item change, responsible
    // for notifying items.<key-for-inst> change up to host
    _forwardInstanceProp: function(inst, prop, value) {
      if (prop == this.as) {
        var idx;
        if (this._sortFn || this._filterFn) {
          // Known slow lookup: when sorted/filtered, there is no way to
          // efficiently memoize the array index and keep it in sync with array
          // mutations, so we need to look the item up in the array
          // This can happen e.g. when array of strings is repeated into inputs
          idx = this.items.indexOf(this.collection.getItem(inst.__key__));
        } else {
          // When there is no sort/filter, the view index is the array index
          idx = inst[this.indexAs];
        }
        this.set('items.' + idx, value);
      }
    },

    // Implements extension point from Templatizer
    // Called as a side effect of a template instance path change, responsible
    // for notifying items.<key-for-inst>.<path> change up to host
    _forwardInstancePath: function(inst, path, value) {
      if (path.indexOf(this.as + '.') === 0) {
        this.notifyPath('items.' + inst.__key__ + '.' +
          path.slice(this.as.length + 1), value);
      }
    },

    // Implements extension point from Templatizer mixin
    // Called as side-effect of a host property change, responsible for
    // notifying parent path change on each inst
    _forwardParentProp: function(prop, value) {
      this._instances.forEach(function(inst) {
        inst.__setProperty(prop, value, true);
      }, this);
    },

    // Implements extension point from Templatizer
    // Called as side-effect of a host path change, responsible for
    // notifying parent path change on each inst
    _forwardParentPath: function(path, value) {
      this._instances.forEach(function(inst) {
        inst.notifyPath(path, value, true);
      }, this);
    },

    // Called as a side effect of a host items.<key>.<path> path change,
    // responsible for notifying item.<path> changes to inst for key
    _forwardItemPath: function(path, value) {
      if (this._keyToInstIdx) {
        var dot = path.indexOf('.');
        var key = path.substring(0, dot < 0 ? path.length : dot);
        var idx = this._keyToInstIdx[key];
        var inst = this._instances[idx];
        if (inst) {
          if (dot >= 0) {
            path = this.as + '.' + path.substring(dot+1);
            inst.notifyPath(path, value, true);
          } else {
            inst.__setProperty(this.as, value, true);
          }
        }
      }
    },

    /**
     * Returns the item associated with a given element stamped by
     * this `dom-repeat`.
     *
     * Note, to modify sub-properties of the item,
     * `modelForElement(el).set('item.<sub-prop>', value)`
     * should be used.
     *
     * @method itemForElement
     * @param {HTMLElement} el Element for which to return the item.
     * @return {any} Item associated with the element.
     */
    itemForElement: function(el) {
      var instance = this.modelForElement(el);
      return instance && instance[this.as];
    },

    /**
     * Returns the `Polymer.Collection` key associated with a given
     * element stamped by this `dom-repeat`.
     *
     * @method keyForElement
     * @param {HTMLElement} el Element for which to return the key.
     * @return {any} Key associated with the element.
     */
    keyForElement: function(el) {
      var instance = this.modelForElement(el);
      return instance && instance.__key__;
    },

    /**
     * Returns the inst index for a given element stamped by this `dom-repeat`.
     * If `sort` is provided, the index will reflect the sorted order (rather
     * than the original array order).
     *
     * @method indexForElement
     * @param {HTMLElement} el Element for which to return the index.
     * @return {any} Row index associated with the element (note this may
     *   not correspond to the array index if a user `sort` is applied).
     */
    indexForElement: function(el) {
      var instance = this.modelForElement(el);
      return instance && instance[this.indexAs];
    }

  });





  Polymer({
    is: 'array-selector',

    properties: {

      /**
       * An array containing items from which selection will be made.
       */
      items: {
        type: Array,
        observer: '_itemsChanged'
      },

      /**
       * When `multi` is true, this is an array that contains any selected.
       * When `multi` is false, this is the currently selected item, or `null`
       * if no item is selected.
       */
      selected: {
        type: Object,
        notify: true
      },

      /**
       * When `true`, calling `select` on an item that is already selected
       * will deselect the item.
       */
      toggle: Boolean,

      /**
       * When `true`, multiple items may be selected at once (in this case,
       * `selected` is an array of currently selected items).  When `false`,
       * only one item may be selected at a time.
       */
      multi: Boolean
    },

    _itemsChanged: function() {
      // Unbind previous selection
      if (Array.isArray(this.selected)) {
        for (var i=0; i<this.selected.length; i++) {
          this.unlinkPaths('selected.' + i);
        }
      } else {
        this.unlinkPaths('selected');
      }
      // Initialize selection
      if (this.multi) {
        this.selected = [];
      } else {
        this.selected = null;
      }
    },

    /**
     * Deselects the given item if it is already selected.
     */
    deselect: function(item) {
      if (this.multi) {
        var scol = Polymer.Collection.get(this.selected);
        // var skey = scol.getKey(item);
        // if (skey >= 0) {
        var sidx = this.selected.indexOf(item);
        if (sidx >= 0) {
          var skey = scol.getKey(item);
          this.splice('selected', sidx, 1);
          // scol.remove(item);
          this.unlinkPaths('selected.' + skey);
          return true;
        }
      } else {
        this.selected = null;
        this.unlinkPaths('selected');
      }
    },

    /**
     * Selects the given item.  When `toggle` is true, this will automatically
     * deselect the item if already selected.
     */
    select: function(item) {
      var icol = Polymer.Collection.get(this.items);
      var key = icol.getKey(item);
      if (this.multi) {
        // var sidx = this.selected.indexOf(item);
        // if (sidx < 0) {
        var scol = Polymer.Collection.get(this.selected);
        var skey = scol.getKey(item);
        if (skey >= 0) {
          if (this.toggle) {
            this.deselect(item);
          }
        } else {
          this.push('selected', item);
          // this.linkPaths('selected.' + sidx, 'items.' + skey);
          // skey = Polymer.Collection.get(this.selected).add(item);
          this.async(function() {
            skey = scol.getKey(item);
            this.linkPaths('selected.' + skey, 'items.' + key);
          });
        }
      } else {
        if (this.toggle && item == this.selected) {
          this.deselect();
        } else {
          this.linkPaths('selected', 'items.' + key);
          this.selected = item;
        }
      }
    }

  });




  /**
   * Stamps the template iff the `if` property is truthy.
   *
   * When `if` becomes falsey, the stamped content is hidden but not
   * removed from dom. When `if` subsequently becomes truthy again, the content
   * is simply re-shown. This approach is used due to its favorable performance
   * characteristics: the expense of creating template content is paid only
   * once and lazily.
   *
   * Set the `restamp` property to true to force the stamped content to be
   * created / destroyed when the `if` condition changes.
   */
  Polymer({

    is: 'dom-if',
    extends: 'template',

    /**
     * Fired whenever DOM is added or removed/hidden by this template (by
     * default, rendering occurs lazily).  To force immediate rendering, call
     * `render`.
     *
     * @event dom-change
     */

    properties: {

      /**
       * A boolean indicating whether this template should stamp.
       */
      'if': {
        type: Boolean,
        value: false,
        observer: '_queueRender'
      },

      /**
       * When true, elements will be removed from DOM and discarded when `if`
       * becomes false and re-created and added back to the DOM when `if`
       * becomes true.  By default, stamped elements will be hidden but left
       * in the DOM when `if` becomes false, which is generally results
       * in better performance.
       */
      restamp: {
        type: Boolean,
        value: false,
        observer: '_queueRender'
      }

    },

    behaviors: [
      Polymer.Templatizer
    ],

    _queueRender: function() {
      this._debounceTemplate(this._render);
    },

    detached: function() {
      // TODO(kschaaf): add logic to re-stamp in attached?
      this._teardownInstance();
    },

    attached: function() {
      if (this.if && this.ctor) {
        // TODO(sorvell): should not be async, but node can be attached
        // when shady dom is in the act of distributing/composing so push it out
        this.async(this._ensureInstance);
      }
    },

    render: function() {
      this._flushTemplates();
    },

    _render: function() {
      if (this.if) {
        if (!this.ctor) {
          this._wrapTextNodes(this._content || this.content);
          this.templatize(this);
        }
        this._ensureInstance();
        this._showHideChildren();
      } else if (this.restamp) {
        this._teardownInstance();
      }
      if (!this.restamp && this._instance) {
        this._showHideChildren();
      }
      if (this.if != this._lastIf) {
        this.fire('dom-change');
        this._lastIf = this.if;
      }
    },

    _ensureInstance: function() {
      if (!this._instance) {
        // TODO(sorvell): pickup stamping logic from x-repeat
        this._instance = this.stamp();
        var root = this._instance.root;
        // TODO(sorvell): this incantation needs to be simpler.
        var parent = Polymer.dom(Polymer.dom(this).parentNode);
        parent.insertBefore(root, this);
      }
    },

    _teardownInstance: function() {
      if (this._instance) {
        var c = this._instance._children;
        if (c) {
          // use first child parent, for case when dom-if may have been detached
          var parent = Polymer.dom(Polymer.dom(c[0]).parentNode);
          c.forEach(function(n) {
            parent.removeChild(n);
          });
        }
        this._instance = null;
      }
    },

    _wrapTextNodes: function(root) {
      // wrap text nodes in span so they can be hidden.
      for (var n = root.firstChild; n; n=n.nextSibling) {
        if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
          var s = document.createElement('span');
          root.insertBefore(s, n);
          s.appendChild(n);
          n = s;
        }
      }
    },

    _showHideChildren: function() {
      var hidden = this.__hideTemplateChildren__ || !this.if;
      if (this._instance) {
        this._instance._showHideChildren(hidden);
      }
    },

    // Implements extension point from Templatizer mixin
    // Called as side-effect of a host property change, responsible for
    // notifying parent.<prop> path change on instance
    _forwardParentProp: function(prop, value) {
      if (this._instance) {
        this._instance[prop] = value;
      }
    },

    // Implements extension point from Templatizer
    // Called as side-effect of a host path change, responsible for
    // notifying parent.<path> path change on each row
    _forwardParentPath: function(path, value) {
      if (this._instance) {
        this._instance.notifyPath(path, value, true);
      }
    }

  });




  Polymer.ImportStatus = {

    _ready: false,

    _callbacks: [],

    whenLoaded: function(cb) {
      if (this._ready) {
        cb();
      } else {
        this._callbacks.push(cb);
      }
    },

    _importsLoaded: function() {
      this._ready = true;
      this._callbacks.forEach(function(cb) {
        cb();
      });
      this._callbacks = [];
    }
  };

  window.addEventListener('load', function() {
    Polymer.ImportStatus._importsLoaded();
  });

  if (window.HTMLImports) {
    HTMLImports.whenReady(function() {
      Polymer.ImportStatus._importsLoaded();
    });
  }



  Polymer({

    /**
     * Fired whenever DOM is stamped by this template (rendering
     * will be deferred until all HTML imports have resolved).
     *
     * @event dom-change
     */

    is: 'dom-bind',

    extends: 'template',

    created: function() {
      // Ensure dom-bind doesn't stamp until all possible dependencies
      // have resolved
      Polymer.ImportStatus.whenLoaded(this._readySelf.bind(this));
    },

    _registerFeatures: function() {
      this._prepConstructor();
    },

    _insertChildren: function() {
      var parentDom = Polymer.dom(Polymer.dom(this).parentNode);
      parentDom.insertBefore(this.root, this);
    },

    _removeChildren: function() {
      if (this._children) {
        for (var i=0; i<this._children.length; i++) {
          this.root.appendChild(this._children[i]);
        }
      }
    },

    _initFeatures: function() {
      // defer _initFeatures and stamping until after attached, to support
      // document.createElement('template', 'dom-bind') use case,
      // where template content is filled in after creation
    },

    // avoid scoping elements as we expect dom-bind output to be in the main
    // document
    _scopeElementClass: function(element, selector) {
      if (this.dataHost) {
        return this.dataHost._scopeElementClass(element, selector);
      } else {
        return selector;
      }
    },

    _prepConfigure: function() {
      var config = {};
      for (var prop in this._propertyEffects) {
        config[prop] = this[prop];
      }
      // Pass values set before attached as initialConfig to _setupConfigure
      this._setupConfigure = this._setupConfigure.bind(this, config);
    },

    attached: function() {
      if (!this._children) {
        this._template = this;
        this._prepAnnotations();
        this._prepEffects();
        this._prepBehaviors();
        this._prepConfigure();
        this._prepBindings();
        Polymer.Base._initFeatures.call(this);
        this._children = Array.prototype.slice.call(this.root.childNodes);
      }
      this._insertChildren();
      this.fire('dom-change');
    },

    detached: function() {
      this._removeChildren();
    }

  });



