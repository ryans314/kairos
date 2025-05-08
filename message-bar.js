import { defineAsyncComponent } from "vue";

export async function MessageBar() {
  return {
    props: ["chatId"],
    data() {
      return {
        myMessage: "",
        sending: false,
      };
    },
    methods: {
      async sendMessage(session) {
        if (!this.myMessage) return;
        // if (this.selectedGroupChat === undefined) return;
        this.sending = true;

        await this.$graffiti.put(
          {
            value: {
              activity: "create",
              type: "Message",
              content: this.myMessage,
              published: Date.now(),
            },
            channels: [this.chatId, this.$graffitiSession.value.actor],
          },
          session
        );

        this.sending = false;
        this.myMessage = "";

        // Refocus the input field after sending the message
        await this.$nextTick();
        this.$refs.messageInput.focus();
      },
    },
    template: await fetch("./message-bar.html").then((r) => {
      console.log("success message bar");
      return r.text();
    }),
  };
}
