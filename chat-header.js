import { defineAsyncComponent } from "vue";
import { groupFromId } from "./index.js";
export async function ChatHeader() {
  return {
    props: ["chatId"],
    data() {
      return {
        chatObject: undefined,
      };
    },

    methods: {},
    async mounted() {
      console.log("starting mount");
      this.chatObject = await groupFromId(this.chatId, this.$graffiti);
    },
    template: await fetch("./chat-header.html").then((r) => {
      console.log("chat header success");
      return r.text();
    }),
  };
}
