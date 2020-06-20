import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import VueResource from "vue-resource";
import "./css/main.css";

Vue.config.productionTip = false;

Vue.use(VueResource);
export const bus = new Vue();

// custom directives
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
new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
