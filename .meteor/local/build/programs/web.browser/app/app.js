var require = meteorInstall({"imports":{"loan-management.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// imports/loan-management.js                                              //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
!function (module1) {
  let Meteor;
  module1.link("meteor/meteor", {
    Meteor(v) {
      Meteor = v;
    }
  }, 0);
  let Mongo;
  module1.link("meteor/mongo", {
    Mongo(v) {
      Mongo = v;
    }
  }, 1);
  ___INIT_METEOR_FAST_REFRESH(module);
  // imports/loan-management.js

  // Shared methods
  Meteor.methods({
    calculateSquare(number) {
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
  let Template;
  module1.link("meteor/templating", {
    Template(v) {
      Template = v;
    }
  }, 0);
  let ReactiveVar;
  module1.link("meteor/reactive-var", {
    ReactiveVar(v) {
      ReactiveVar = v;
    }
  }, 1);
  let Roles;
  module1.link("meteor/alanning:roles", {
    Roles(v) {
      Roles = v;
    }
  }, 2);
  let moment;
  module1.link("meteor/momentjs:moment", {
    moment(v) {
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
    isAdmin() {
      return Roles.userIsInRole(Meteor.userId(), 'admin');
    },
    welcomeMessage() {
      // Example: Accessing shared logic from imports/loan-management.js
      return 'Welcome to the Loan Management App!';
    }
  });
  Template.registerHelper('formatDate', function (date) {
    return moment(date).format('MMMM D, YYYY');
  });
  Template.dashboard.helpers({
    loans() {
      return Loans.find();
    }
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