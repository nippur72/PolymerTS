function createMySimple() {
    Polymer({
        is: 'my-simple',
        properties: {
            prop: { value: "hi" }
        },
        observers: ["propChanged(prop)"],
        propChanged: function (n) {
            console.log(n);
        },
        created: function () {
            console.log("created");
        }
    });
}
//# sourceMappingURL=my-simple.js.map