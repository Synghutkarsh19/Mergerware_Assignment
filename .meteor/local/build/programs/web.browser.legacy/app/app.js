var require = meteorInstall({"imports":{"loan-management.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// imports/loan-management.js                                              //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
!function (module1) {
  var Meteor;
  module1.link("meteor/meteor", {
    Meteor: function (v) {
      Meteor = v;
    }
  }, 0);
  var Mongo;
  module1.link("meteor/mongo", {
    Mongo: function (v) {
      Mongo = v;
    }
  }, 1);
  ___INIT_METEOR_FAST_REFRESH(module);
  // imports/loan-management.js

  // Shared methods
  Meteor.methods({
    calculateSquare: function (number) {
      if (typeof number !== "number") {
        throw new Meteor.Error("invalid-input", "Input must be a number");
      }
      return number * number;
    }
  });

  // Shared collection
  SharedCollection = new Mongo.Collection("sharedCollection");
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////

}},"client":{"main.jsx":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// client/main.jsx                                                         //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
!function (module1) {
  var Template;
  module1.link("meteor/templating", {
    Template: function (v) {
      Template = v;
    }
  }, 0);
  var ReactiveVar;
  module1.link("meteor/reactive-var", {
    ReactiveVar: function (v) {
      ReactiveVar = v;
    }
  }, 1);
  var Roles;
  module1.link("meteor/alanning:roles", {
    Roles: function (v) {
      Roles = v;
    }
  }, 2);
  var moment;
  module1.link("meteor/momentjs:moment", {
    moment: function (v) {
      moment = v;
    }
  }, 3);
  module1.link("/imports/loan-management.js");
  module1.link("/server/main.js");
  ___INIT_METEOR_FAST_REFRESH(module);
  // client/main.js

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });
  Template.body.helpers({
    isAdmin: function () {
      return Roles.userIsInRole(Meteor.userId(), 'admin');
    },
    welcomeMessage: function () {
      // Example: Accessing shared logic from imports/loan-management.js
      return 'Welcome to the Loan Management App!';
    }
  });
  Template.registerHelper('formatDate', function (date) {
    return moment(date).format('MMMM D, YYYY');
  });
  Template.dashboard.helpers({
    loans: function () {
      return Loans.find();
    }
  });
  Template.dashboard.events({
    'click #requestLoan': function (event, instance) {
      var amount = parseFloat(prompt('Enter loan amount:'));
      if (!isNaN(amount) && amount > 0) {
        Meteor.call('requestLoan', amount);
      }
    },
    'click #confirmPayment': function (event, instance) {
      var loanId = event.target.dataset.id;
      if (confirm('Confirm payment for this loan?')) {
        Meteor.call('confirmPayment', loanId);
      }
    }
  });

  // Define the Loans collection
  Loans = new Mongo.Collection('loans');
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json",
    ".html",
    ".css",
    ".jsx"
  ]
});

var exports = require("/client/main.jsx");