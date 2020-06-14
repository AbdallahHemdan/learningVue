<template>
  <div class="help-container">
    <h1 class="header">Ahmed Hemdan Help</h1>
    <HelpBody />
  </div>
</template>

<script>
import HelpBody from "@/components/HelpBody.vue";
export default {
  name: "Help",
  components: {
    HelpBody
  }
};
</script>

<style scoped lang="scss">
.help-container {
  padding-top: 50px;
}
</style>
