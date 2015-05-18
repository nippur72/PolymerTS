function tag(tagname) {
    return function (target) {
        target.prototype["is"] = tagname;
    };
}
function Register(element) {
    Polymer(element.prototype);
}
//# sourceMappingURL=polymer.js.map