<template>
  <div class="post-container">
    <span class="post-views">51</span>
    <h3 class="post-title">Blog Post Titel</h3>
    <span class="post-date">25-10-2020</span>
    <p class="post-content">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Amet nulla
      dolorem ducimus hic earum praesentium voluptates adipisci repellendus
      fugit iusto ipsa repudiandae delectus nam, sint a deleniti debitis quos
      beatae?
    </p>
    <div class="row">
      <div class="col-md-6">
        <span class="post-author">Post Author</span>
      </div>
      <div class="col-md-6 text-right">
        <span class="post-cateogry">Category Name</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BlogPosts"
};
</script>

<style lang="scss" scoped>
.post-container {
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 0 10px #ddd;
  position: relative;
  text-align: left;
  .post-views {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: #007bff;
    border-radius: 4px;
    padding: 1px 5px;
    color: #fff;
    text-align: center;
    font-weight: bold;
  }
  .post-title {
    font-weight: bold;
    color: #4d6680;
  }
  .post-date {
    display: block;
    margin: 0 0 9px;
    color: #888;
    font-size: 15px;
  }
  .post-content {
    display: block;
    margin: 0 0 9px;
    color: #282828;
    font-size: 15px;
  }
  .post-author {
    background-color: #ddd;
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 10px;
  }
  .post-cateogry {
    background-color: #007bff;
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 10px;
    color: #fff;
  }
}
</style>
