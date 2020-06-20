import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import VueResource from "vue-resource";

import "./css/main.css";
import "./filters/index";
import "./custom-directives/index";

Vue.config.productionTip = false;
Vue.use(VueResource);
export const bus = new Vue();

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
