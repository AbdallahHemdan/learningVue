<template>
  <div class="contactus-container">
    <h1>{{ pageName }}</h1>
    <p>{{ pageDescription }}</p>
  </div>
</template>

<script>
export default {
  name: "ContactUs",
  data: function() {
    return {
      pageName: "Contact us",
      pageDescription: "Hello from Contact us page"
    };
  }
};
</script>

<style></style>
