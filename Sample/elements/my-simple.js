var MySimpleFactory;
function createMySimple() {
    MySimpleFactory = Polymer({
        is: 'my-simple',
        properties: {
            prop: { value: "hi" }
        },
        observers: ["propChanged(prop)"],
        propChanged: function (n) {
            console.log(n);
        },
        created: function () {
            console.log("mysimple created");
        },
        ready: function () {
            console.log("mysimple ready");
        },
        attached: function () {
            console.log("mysimple attached");
        },
        factoryImpl: function (foo) {
            console.log("mysimple factoryImpl with foo=" + foo);
        },
    });
}
/*
var maker = Polymer({
      is: 'my-greeter',

      properties: { greet: { value: "hello" } },

      ready: function () {
         console.log( this.greet + " world");
      },

      factoryImpl: function (greetWord) {
         this.greet = greetWord;
      }
})

var el = new maker("hola");
document.body.appendChild(el);
*/
//# sourceMappingURL=my-simple.js.map