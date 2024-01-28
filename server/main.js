// server/main.js
import { Meteor } from "meteor/meteor";

Meteor.startup(() => {
  // Example method available only on the server
  Meteor.methods({
    serverOnlyMethod() {
      console.log("This method is executed on the server.");
      // Perform server-specific tasks here
    },
  });

  // Example of a publication to send data only to the server
  Meteor.publish("serverData", function () {
    if (this.userId) {
      // Only publish data if the user is logged in
      return SomeCollection.find({ userId: this.userId });
    } else {
      this.ready();
    }
  });
});

// Define a collection (this is just an example, replace with your actual collection)
SomeCollection = new Mongo.Collection("someCollection");
