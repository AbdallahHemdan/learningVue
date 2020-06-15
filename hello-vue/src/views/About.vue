<template>
  <div class="about">
    <h1 v-font-size="40">{{ pageName }}</h1>
    <p v-bold>{{ pageDescription }}</p>
    <div class="container">
      <div class="alert alert-warning alert-dismissible fade show" role="alert">
        <strong>Holy guacamole!</strong> You should check in on some of those
        fields below.
        <button
          type="button"
          class="close"
          data-dismiss="alert"
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "About",
  data: function() {
    return {
      pageName: "About us",
      pageDescription: "Welcome to About us page "
    };
  }
};
</script>
