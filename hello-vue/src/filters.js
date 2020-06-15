import Vue from "vue";

Vue.filter("convertToUpperCase", function(value) {
  return value.toUpperCase();
});

Vue.filter("reverseString", function(value) {
  return value
    .split("")
    .reverse()
    .join("");
});

Vue.filter("shortenText", function(value, mxLength, suffix) {
  return `${value.slice(0, mxLength)} ${suffix}`;
});
