// imports/loan-management.js
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

// Shared methods
Meteor.methods({
  calculateSquare(number) {
    if (typeof number !== "number") {
      throw new Meteor.Error("invalid-input", "Input must be a number");
    }

    return number * number;
  },
});

// Shared collection
SharedCollection = new Mongo.Collection("sharedCollection");
