import { defineAsyncComponent } from "vue";

export async function MessageList() {
  return {
    props: ["chatId"],
    data() {
      return {
        messageToEdit: undefined,
        editContent: "",
      };
    },
    methods: {
      async deleteMessage(msg) {
        await this.$graffiti.delete(msg.url, this.$graffitiSession.value);
      },
      startEdit(msg) {
        this.messageToEdit = msg.url;
        this.editContent = msg.value.content;
      },
      async finishEdit(msg) {
        await this.$graffiti.patch(
          {
            value: [
              {
                op: "replace",
                path: "/content",
                value: this.editContent,
              },
            ],
          },
          msg,
          this.$graffitiSession.value
        );
        this.cancelEdit();
      },
      cancelEdit() {
        this.messageToEdit = undefined;
        this.editContent = undefined;
      },
    },
    template: await fetch("./message-list.html").then((r) => {
      console.log("success message list");
      return r.text();
    }),
  };
}
