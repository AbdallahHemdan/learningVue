import Vue from "vue";

Vue.directive("bold", {
  bind: function(element) {
    element.style.fontWeight = "bold";
  }
});

Vue.directive("font-size", {
  bind: function(el, binding) {
    el.style.fontSize = `${binding.value}px`;
    console.log("Binding Object : ", binding);
  }
});

Vue.directive("format", {
  bind: function(el, binding) {
    el.style.fontSize = `${binding.value}px`;

    if (binding.modifiers.bold) {
      el.style.fontWeight = "bold";
    }

    if (binding.modifiers.orange) {
      el.style.color = "orange";
    }
  }
});
