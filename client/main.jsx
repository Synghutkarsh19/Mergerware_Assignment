// client/main.js
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Roles } from 'meteor/alanning:roles';
import { moment } from 'meteor/momentjs:moment';

// Importing the shared logic file
import '/imports/loan-management.js';

// Importing the server-side logic file (Note: this import does not execute code on the client)
import '/server/main.js';

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL',
});

Template.body.helpers({
  isAdmin() {
    return Roles.userIsInRole(Meteor.userId(), 'admin');
  },
  welcomeMessage() {
    // Example: Accessing shared logic from imports/loan-management.js
    return 'Welcome to the Loan Management App!';
  },
});

Template.registerHelper('formatDate', function (date) {
  return moment(date).format('MMMM D, YYYY');
});

Template.dashboard.helpers({
  loans() {
    return Loans.find();
  },
});

Template.dashboard.events({
  'click #requestLoan'(event, instance) {
    const amount = parseFloat(prompt('Enter loan amount:'));
    if (!isNaN(amount) && amount > 0) {
      Meteor.call('requestLoan', amount);
    }
  },

  'click #confirmPayment'(event, instance) {
    const loanId = event.target.dataset.id;
    if (confirm('Confirm payment for this loan?')) {
      Meteor.call('confirmPayment', loanId);
    }
  },
});

// Define the Loans collection
Loans = new Mongo.Collection('loans');
