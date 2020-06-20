import Error404 from "./../views/Error404";
import Vue from "vue";
import VueRouter from "vue-router";
import DisplayBlogs from "./../components/DisplayBlogs";
import Blog from "./../components/Blog";
import SingleBlog from "./../components/SingleBlog.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Blogs",
    component: DisplayBlogs,
  },
  {
    path: "/add-blog",
    name: "AddBlogs",
    component: Blog,
  },
  {
    path: "/blog/:id",
    name: "SingleBlog",
    component: SingleBlog,
  },
  {
    path: "*",
    name: "Error404",
    component: Error404,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
