import Vue from "vue";

Vue.directive("rand-color", {
  bind: function(element, binding, vnode) {
    element.style.color = `#${Math.random()
      .toString()
      .slice(2, 8)}`;
  },
});

Vue.directive("theme", {
  bind: function(element, binding, vnode) {
    if (binding.value === "wide") {
      element.style.maxWidth = `1500px`;
    } else if (binding.value === "narrow") {
      element.style.maxWidth = `560px`;
    }

    if (binding.arg === "column") {
      element.style.backgroundColor = `#ddd`;
      element.style.padding = `20px`;
    }
  },
});
