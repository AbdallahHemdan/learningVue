<template>
  <div class="">
    <keep-alive>
      <component :is="component"></component>
    </keep-alive>
    <button @click="component = 'form-one'">first form</button>
    <button @click="component = 'form-two'">second form</button>
  </div>
</template>

<script>
import formOne from "./../components/formOne";
import formTwo from "./../components/formTwo";

export default {
  name: "Home",
  components: {
    "form-one": formOne,
    "form-two": formTwo
  },
  data: function() {
    return {
      component: "form-two"
    };
  },
  methods: {}
};
</script>
