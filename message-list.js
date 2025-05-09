import { defineAsyncComponent } from "vue";

export async function MessageList() {
  return {
    watch: {
      // async $route(to, from) {
      //   console.log(to);
      //   console.log("THIS HAPPENS");
      //   if (to.includes("/chat/")) {
      //     await new Promise((r) => setTimeout(r, 2000));
      //     console.log("scrolling to: " + document.body.scrollHeight);
      //     window.scrollTo(0, document.body.scrollHeight);
      //   }
      // },
    },
    props: ["chatId"],
    data() {
      return {
        messageObjects: [],
        messageToEdit: undefined,
        editContent: "",
      };
    },
    async mounted() {
      window.addEventListener("scroll", (evt) => {
        this.updateScroll();
      });
      // // <graffiti-discover
      // //   id="messageFrame"
      // //   v-slot="{ objects: messageObjects, isInitialPolling }"
      // //   :channels="[chatId]"
      // //   :schema="{
      // //                   properties: {
      // //                       value: {
      // //                           required: ['content', 'published'],
      // //                           properties: {
      // //                               content: { type: 'string' },
      // //                               published: { type: 'number' }
      // //                           }
      // //                       }
      // //                   }
      // //               }"
      // // >
      // this.isInitialPolling = true;
      // const messageStream = this.$graffiti.discover([this.chatId], {
      //   properties: {
      //     value: {
      //       required: ["content", "published"],
      //       properties: {
      //         content: { type: "string" },
      //         published: { type: "number" },
      //       },
      //     },
      //   },
      // });
      // const messages = Array.fromAsync(messageStream);
      // this.messageObjects = messages;
      // this.isInitialPolling = false;
      await new Promise((r) => setTimeout(r, 1000));
      // console.log("scrolling to: " + document.body.scrollHeight);
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
      // // }
    },
    methods: {
      updateScroll() {
        console.log("updating scroll");
        const threshold = Math.min(document.body.scrollHeight * 0.6, document.body.scrollHeight - 1500);
        console.log("threshold", threshold);
        const scrollAmount = window.scrollY;
        console.log("scroll amount", scrollAmount);
        const scrollButton = document.getElementById("scrollButton");
        if (scrollAmount < threshold) {
          scrollButton.classList.add("scrolled");
        } else {
          scrollButton.classList.remove("scrolled");
        }
      },
      scroll() {
        // console.log("scrolling via scroll()");
        window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
      },
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
