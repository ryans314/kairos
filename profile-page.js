import { defineAsyncComponent } from "vue";

export async function ProfilePage() {
  return {
    props: ["profileId"],
    data() {
      return {
        editing: false,
      };
    },
    methods: {
      /**
       * Update a profile
       *
       */
      async updateProfile(profile, abort = false) {
        this.editing = false;
        // document.getElementById("app").classList.remove("editing");
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
        // app.classList.add("editing");
        this.editing = true;
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
    template: await fetch("./profile-page.html").then((r) => {
      console.log("profile success");
      return r.text();
    }),
  };
}
