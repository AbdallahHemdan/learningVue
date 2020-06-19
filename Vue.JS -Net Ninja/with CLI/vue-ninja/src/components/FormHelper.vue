<template>
  <div class="form-helper">
    <h1>Please fill the following form</h1>
    <form action="">
      <section class="form-header">
        <slot name="form-header"></slot>
      </section>
      <section class="form-fields">
        <slot name="form-fields"></slot>
      </section>
      <section class="form-controls">
        <slot name="form-controls"></slot>
      </section>
      <section class="useful-links">
        <ul>
          <li><a href="https://github.com/AbdallahHemdan">Github</a></li>
          <li><a href="https://facebook.com/AbdallahHemdan99">Facebook</a></li>
          <li><a href="https://twitter.com/AbdallahHemda17">Twitter</a></li>
        </ul>
      </section>
    </form>
  </div>
</template>

<script>
export default {
  name: "FormHelper"
};
</script>

<style scoped>
h1 {
  text-align: center;
}
form {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}
.useful-links ul {
  padding: 0;
}
.useful-links li {
  display: inline-block;
  margin-right: 10px;
}
form > section {
  padding: 20px;
  background: #eee;
  margin: 20px 0;
}
.form-header {
  background: #ddd;
  border: 1px solid #bbb;
}
</style>