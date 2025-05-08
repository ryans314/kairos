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

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      components: {
        main: defineAsyncComponent(GroupList),
        footer: defineAsyncComponent(FooterNav),
      },
    },
    {
      path: "/chat/:chatId",
      components: {
        main: defineAsyncComponent(MessageList),
        footer: defineAsyncComponent(MessageBar),
      },
      props: { main: true, footer: true },
    },
    {
      path: "/profile/:profileId",
      components: {
        main: defineAsyncComponent(ProfilePage),
        footer: defineAsyncComponent(FooterNav),
      },
      props: { main: true },
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
      newGroupName: "",
      selectedGroupChat: undefined, //current group chat object (.value.object)
      memberToAdd: "",
      selectedUsers: [],
      manualUsers: [""],
      mostRecentMessages: {},
    };
  },
  methods: {
    async login() {
      await this.$graffiti.login();
      console.log("1");
      try {
        const hasProfile = await this.hasProfile(this.$graffitiSession.value.actor);
        if (!hasProfile) {
          this.createProfile({ name: this.$graffitiSession.value.actor });
        } else {
          console.log("profile exists");
        }
      } catch (e) {
        console.warn(e);
      }
    },
    logout() {
      router.push("/");
      this.$graffiti.logout(this.$graffitiSession.value);
    },
    openCreateGroup() {
      const app = document.getElementById("app");
      app.classList.add("creating");
      document.getElementById("groupName").focus();
    },
    closeCreateGroup() {
      const app = document.getElementById("app");
      app.classList.remove("creating");
    },
    createGroup() {
      this.closeCreateGroup();
      this.$graffiti.put(
        {
          value: {
            activity: "Create",
            object: {
              type: "Group Chat",
              name: this.newGroupName,
              channel: crypto.randomUUID(),
              members: [this.$graffitiSession.value.actor].concat(this.selectedUsers),
            },
          },
          channels: ["designftw", this.$graffitiSession.value.actor],
          allowed: undefined,
        },
        this.$graffitiSession.value
      );
      this.newGroupName = "";
    },
    /**
     * Get a list of shared members
     * @param groups all groups the user is a part of
     * @returns alphabetically sorted list of users that share a group, excluding the current user
     */
    getMembers(groups) {
      const members = new Set();
      for (const group of groups) {
        const groupMembers = group.value.object.members;
        if (groupMembers) {
          groupMembers.forEach((member) => members.add(member));
        }
      }
      members.delete(this.$graffitiSession.value.actor);
      const sortedMembers = Array.from(members).sort();
      this.selectedUsers.forEach((member) => {
        if (!sortedMembers.includes(member)) sortedMembers.push(member);
      });
      return sortedMembers;
    },
    selectMember() {
      if (this.memberToAdd === "" || this.selectedUsers.includes(this.memberToAdd)) {
        this.memberToAdd = "";
        return;
      }
      this.selectedUsers.push(this.memberToAdd);
      this.memberToAdd = "";
    },
    getTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    },
    async createProfile(manual = false) {
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
            activity: "create",
            type: "Profile",
            name: name,
            pronouns: pronouns,
            description: description,
            // profilePicture: graffitiImage,
            published: Date.now(),
          },
          channels: [this.$graffitiSession.value.actor],
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
})
  .use(GraffitiPlugin, {
    graffiti: new GraffitiLocal(),
    // graffiti: new GraffitiRemote(),
  })
  .use(router)
  .component("TimeStamp", TimeStamp)
  .mount("#app");
