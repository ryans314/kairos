import { defineAsyncComponent } from "vue";

export async function GroupList() {
  return {
    props: ["chatId"],
    data() {
      return {};
    },
    methods: {},
    template: await fetch("./group-list.html").then((r) => {
      console.log("success");
      return r.text();
    }),
  };
}
