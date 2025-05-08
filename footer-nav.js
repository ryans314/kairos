import { defineAsyncComponent } from "vue";

export async function FooterNav() {
  return {
    data() {
      return {};
    },
    methods: {},
    template: await fetch("./footer-nav.html").then((r) => {
      console.log("footer success");
      return r.text();
    }),
  };
}
