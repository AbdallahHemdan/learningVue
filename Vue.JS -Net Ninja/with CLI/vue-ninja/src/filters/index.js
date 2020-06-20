import Vue from "vue";

Vue.filter("toUppercase", function(value) {
  return value.toUpperCase();
});

Vue.filter("shorten", function(value, suffix) {
  return `${value.slice(0, 100)} ${suffix}`;
});
