import { defineAsyncComponent } from "vue";

export async function HeaderBar() {
  return {
    data() {
      return {};
    },
    methods: {
      logout() {
        this.$router.push("/");
        this.$graffiti.logout(this.$graffitiSession.value);
      },
    },
    template: await fetch("./header-bar.html").then((r) => {
      console.log("header success");
      return r.text();
    }),
  };
}
