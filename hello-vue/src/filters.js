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
