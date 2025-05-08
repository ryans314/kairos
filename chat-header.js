import { defineAsyncComponent } from "vue";

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
      const schema = {
        properties: {
          value: {
            required: ["object"],
            properties: {
              object: {
                required: ["type", "name"],
                properties: {
                  type: { type: "string", const: "Group Chat" },
                  name: { type: "string" },
                  channel: { type: "string", const: this.chatId },
                },
              },
            },
          },
        },
      };
      const groups = this.$graffiti.discover(["designftw"], schema);
      const groupsArray = await Array.fromAsync(groups);
      console.log(groupsArray);
      this.chatObject = groupsArray[0];
    },
    template: await fetch("./chat-header.html").then((r) => {
      console.log("chat header success");
      return r.text();
    }),
  };
}
