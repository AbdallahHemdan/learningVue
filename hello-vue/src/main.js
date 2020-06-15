import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import "./scss/main.scss";
import "normalize.css";
import "./filters";

Vue.config.productionTip = false;

Vue.directive("bold", {
  bind: function(element) {
    element.style.fontWeight = "bold";
  }
});

Vue.directive("font-size", {
  bind: function(el, binding) {
    el.style.fontSize = `${binding.value}px`;
  }
});

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
