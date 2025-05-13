import { createApp, defineAsyncComponent } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import { TimeStamp } from "./components/TimeStamp.js";
import { fileToGraffitiObject, graffitiFileSchema } from "@graffiti-garden/wrapper-files";
import { GraffitiObjectToFile } from "@graffiti-garden/wrapper-files/vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { GroupList } from "./group-list.js";
import { FooterNav } from "./footer-nav.js";
import { MessageBar } from "./message-bar.js";
import { MessageList } from "./message-list.js";
import { ProfilePage } from "./profile-page.js";
import { CreateButton } from "./components/create-button.js";
import { HeaderBar } from "./header-bar.js";
import { ChatHeader } from "./chat-header.js";
import { CreateEvent } from "./components/create-event.js";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      components: {
        header: defineAsyncComponent(HeaderBar),
        main: defineAsyncComponent(GroupList),
        footer: defineAsyncComponent(FooterNav),
      },
    },
    {
      path: "/chat/:chatId",
      components: {
        header: defineAsyncComponent(ChatHeader),
        main: defineAsyncComponent(MessageList),
        footer: defineAsyncComponent(MessageBar),
      },
      props: { header: true, main: true, footer: true },
    },
    {
      path: "/profile/:profileId(.*)",
      components: {
        header: defineAsyncComponent(HeaderBar),
        main: defineAsyncComponent(ProfilePage),
        footer: defineAsyncComponent(FooterNav),
      },
      props: {
        main: (route) => ({
          profileId: decodeURIComponent(route.params.profileId),
        }),
      },
    },
  ],
});

const app = createApp({
  components: {
    GroupList: defineAsyncComponent(GroupList),
  },
  data() {
    return {
      channels: ["designftw"],
      // manualUsers: [""],
      mostRecentMessages: {},
    };
  },
  methods: {
    async login() {
      console.log("login0");
      this.$graffiti.login();
      console.log("login1");
    },
    logout() {
      router.push("/");
      this.$graffiti.logout(this.$graffitiSession.value);
    },

    /**
     *
     * @param {*} manual form
     */
    async createProfile(manual) {
      const hasProfile = await this.hasProfile();
      if (hasProfile) throw new Error("profile already exists!");

      let name;
      let pronouns;
      let description;
      if (!manual) {
        //Get form data
        const form = document.getElementById("profileForm");
        if (form === null) {
          throw new Error("Form is null");
        }
        const formData = new FormData(form);

        //assign variables
        name = formData.get("profileName");
        pronouns = formData.get("profilePronouns");
        description = formData.get("profileDescription");
      } else {
        name = manual["name"];
        pronouns = "";
        description = "";
      }
      // const imgFile = formData.get("profilePicture");

      // const graffitiImage = fileToGraffitiObject(imgFile);

      //Send graffiti object
      await this.$graffiti.put(
        {
          value: {
            activity: "Create",
            type: "Profile",
            generator: "https://ryans314.github.io/kairos/",
            describes: this.$graffitiSession.value.actor,
            name: name,
            pronouns: pronouns,
            description: description,
            // profilePicture: graffitiImage,
            published: Date.now(),
          },
          channels: ["designftw-2025-studio2", this.$graffitiSession.value.actor],
        },
        this.$graffitiSession.value
      );
    },
    /**
     * Update a profile
     *
     */
    async updateProfile(profile, abort = false) {
      document.getElementById("app").classList.remove("editing");
      if (abort) {
        return;
      }
      //Get form data
      const form = document.getElementById("profileForm");
      form.classList.remove("active");
      if (form === null) {
        throw new Error("Form is null");
      }
      const formData = new FormData(form);

      //assign variables
      const name = formData.get("profileName");
      const pronouns = formData.get("profilePronouns");
      const description = formData.get("profileDescription");
      // const imgURL = formData.get("description");

      //Send graffiti object
      await this.$graffiti.patch(
        {
          value: [
            { op: "replace", path: "/name", value: name },
            { op: "replace", path: "/pronouns", value: pronouns },
            { op: "replace", path: "/description", value: description },
          ],
        },
        profile,
        this.$graffitiSession.value
      );
    },
    async deleteProfile(url) {
      if (
        !confirm(
          "Are you sure you want to delete your account? This action is irreversible, and will delete your account, messages, and all group chats you own"
        )
      ) {
        return;
      }
      console.log("deleting");
      // this.$graffiti.delete(url, this.$graffitiSession.value);
      const userObjects = await this.$graffiti.discover([this.$graffitiSession.value.actor], {});
      console.log(userObjects);
      const objectsToDelete = await Array.fromAsync(userObjects);
      console.log(objectsToDelete);
      for (const object of objectsToDelete) {
        console.log("object:", object);
        console.log("object url:", object.object.url);
        this.$graffiti.delete(object.object.url, this.$graffitiSession.value);
      }
      alert("Account deletion successful! You will now be logged out!");
      this.$graffiti.logout(this.$graffitiSession.value);
    },
    editProfile() {
      const app = document.getElementById("app");
      // const editButton = document.getElementById("editProfile");
      // editButton.textContent = "Cancel";
      app.classList.add("editing");
    },
    async hasProfile(actor = this.$graffitiSession?.value.actor) {
      console.log("this is hasProfile, checking if has profile");
      if (actor === undefined) {
        throw new Error("actor is undefined");
      }
      const profiles = await Array.fromAsync(
        this.$graffiti.discover([actor], {
          properties: {
            value: {
              properties: {
                type: {
                  type: "string",
                  const: "Profile",
                },
              },
            },
          },
        })
      );
      console.log(profiles);
      return profiles.length >= 1;
    },
  },
  async created() {
    //Handler to create profile on opening, if needed
    const afterLogin = async (e) => {
      // const session = this.$graffitiSession.value;
      console.log("running after login!");
      if (!(await this.hasProfile())) {
        //no existing profile
        let name = this.$graffitiSession.value.actor;
        const defaultNameStarter = "https://id.inrupt.com/";
        if (name.includes(defaultNameStarter)) {
          name = name.substring(defaultNameStarter.length);
        }
        await this.createProfile({ name: name });
      }

      this.$router.push("/");
    };

    this.$graffiti.sessionEvents.addEventListener("initialized", afterLogin, { once: true });
    // this.$graffiti.sessionEvents.addEventListener("login", afterLogin);
    this.graffitiAfterLogin = afterLogin;
  },
  beforeUnmount() {
    this.$graffiti.sessionEvents.removeEventListener("initialized", this.graffitiAfterLogin);
    // this.$graffiti.sessionEvents.removeEventListener("login", this.graffitiAfterLogin);
  },
})
  .use(GraffitiPlugin, {
    // graffiti: new GraffitiLocal(),
    graffiti: new GraffitiRemote(),
  })
  .use(router)
  .component("TimeStamp", TimeStamp)
  .component("CreateButton", CreateButton)
  .component("CreateEvent", CreateEvent)
  .mount("#app");

export async function groupFromId(groupId, graffiti) {
  const schema = {
    required: ["value"],
    properties: {
      value: {
        required: ["object", "activity"],
        properties: {
          activity: { type: "string", const: "Create" },
          object: {
            required: ["type", "name", "channel"],
            properties: {
              type: { type: "string", const: "Group Chat" },
              name: { type: "string" },
              channel: { type: "string", const: groupId },
            },
          },
        },
      },
    },
  };

  const groups = graffiti.discover(["designftw"], schema);
  const groupsArray = await Array.fromAsync(groups);

  console.log(groupsArray);
  console.log(groupId);
  console.log(groupsArray[0].object.value.object);
  return groupsArray[0];
}

// export async function profileFromId(actorId, graffiti, value) {
//   const profileSchema = {
//     required: ["value"],
//     properties: {
//       activity: { type: "string", const: "Create" },
//       type: { type: "string", const: "Profile" },
//       describes: { type: "string" },
//       name: { type: "string" },
//     },
//   };

//   const profileStream = graffiti.discover([actorId], profileSchema);
//   const profileArray = await Array.fromAsync(profileStream);
//   if (profileArray.length > 1) console.warn("user has more than 1 profile! Profiles: ", profiles);
//   if (profileArray.length === 0) console.warn("user does not have a profile: ", profiles);
//   console.log(profileArray[0]);
//   console.log(profileArray[0].value?.name);
//   console.log(profileArray[0].object?.value?.name);
//   if (value === undefined) return profileArray[0];
//   if (value === "name") return profileArray[0].object.value.name;
// }
