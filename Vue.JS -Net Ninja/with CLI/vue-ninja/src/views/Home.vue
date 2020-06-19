<template>
  <div class="">
    <form-helper>
      <div slot="form-header">
        <h1>I am the form header</h1>
      </div>
      <div slot="form-fields">
        <input type="text" placeholder="username" required v-model="username" />
        <input type="email" placeholder="email" required v-model="email" />
        <input
          type="password"
          placeholder="password"
          required
          v-model="password"
        />
      </div>
      <div slot="form-controls">
        <button type="submit" @click.prevent="handleSubmit">Sumit</button>
      </div>
    </form-helper>
  </div>
</template>

<script>
import FormHelper from "./../components/FormHelper";

export default {
  name: "Home",
  components: {
    "form-helper": FormHelper
  },
  data: function() {
    return {
      username: "",
      email: "",
      password: ""
    };
  },
  methods: {
    handleSubmit: function() {
      console.log(this.username);
      console.log(this.email);
      console.log(this.password);
    }
  }
};
</script>
