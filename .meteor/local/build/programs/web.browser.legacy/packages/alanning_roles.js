//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Mongo = Package.mongo.Mongo;
var check = Package.check.check;
var Match = Package.check.Match;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package.modules.meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;

/* Package-scope variables */
var Roles;

var require = meteorInstall({"node_modules":{"meteor":{"alanning:roles":{"roles":{"roles_common.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/alanning_roles/roles/roles_common.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  var _typeof;
  module1.link("@babel/runtime/helpers/typeof", {
    default: function (v) {
      _typeof = v;
    }
  }, 0);
  var _toConsumableArray;
  module1.link("@babel/runtime/helpers/toConsumableArray", {
    default: function (v) {
      _toConsumableArray = v;
    }
  }, 1);
  /* global Meteor, Roles, Mongo */

  /**
   * Provides functions related to user authorization. Compatible with built-in Meteor accounts packages.
   *
   * Roles are accessible throgh `Meteor.roles` collection and documents consist of:
   *  - `_id`: role name
   *  - `children`: list of subdocuments:
   *    - `_id`
   *
   * Children list elements are subdocuments so that they can be easier extended in the future or by plugins.
   *
   * Roles can have multiple parents and can be children (subroles) of multiple roles.
   *
   * Example: `{_id: 'admin', children: [{_id: 'editor'}]}`
   *
   * The assignment of a role to a user is stored in a collection, accessible through `Meteor.roleAssignment`.
   * It's documents consist of
   *  - `_id`: Internal MongoDB id
   *  - `role`: A role object which got assigned. Usually only contains the `_id` property
   *  - `user`: A user object, usually only contains the `_id` property
   *  - `scope`: scope name
   *  - `inheritedRoles`: A list of all the roles objects inherited by the assigned role.
   *
   * @module Roles
   */
  if (!Meteor.roles) {
    Meteor.roles = new Mongo.Collection('roles');
  }
  if (!Meteor.roleAssignment) {
    Meteor.roleAssignment = new Mongo.Collection('role-assignment');
  }

  /**
   * @class Roles
   */
  if (typeof Roles === 'undefined') {
    Roles = {}; // eslint-disable-line no-global-assign
  }
  var getGroupsForUserDeprecationWarning = false;
  Object.assign(Roles, {
    /**
     * Used as a global group (now scope) name. Not used anymore.
     *
     * @property GLOBAL_GROUP
     * @static
     * @deprecated
     */
    GLOBAL_GROUP: null,
    /**
     * Create a new role.
     *
     * @method createRole
     * @param {String} roleName Name of role.
     * @param {Object} [options] Options:
     *   - `unlessExists`: if `true`, exception will not be thrown in the role already exists
     * @return {String} ID of the new role or null.
     * @static
     */
    createRole: function (roleName, options) {
      Roles._checkRoleName(roleName);
      options = Object.assign({
        unlessExists: false
      }, options);
      var result = Meteor.roles.upsert({
        _id: roleName
      }, {
        $setOnInsert: {
          children: []
        }
      });
      if (!result.insertedId) {
        if (options.unlessExists) return null;
        throw new Error('Role \'' + roleName + '\' already exists.');
      }
      return result.insertedId;
    },
    /**
     * Delete an existing role.
     *
     * If the role is set for any user, it is automatically unset.
     *
     * @method deleteRole
     * @param {String} roleName Name of role.
     * @static
     */
    deleteRole: function (roleName) {
      var roles;
      var inheritedRoles;
      Roles._checkRoleName(roleName);

      // Remove all assignments
      Meteor.roleAssignment.remove({
        'role._id': roleName
      });
      do {
        // For all roles who have it as a dependency ...
        roles = Roles._getParentRoleNames(Meteor.roles.findOne({
          _id: roleName
        }));
        Meteor.roles.find({
          _id: {
            $in: roles
          }
        }).fetch().forEach(function (r) {
          Meteor.roles.update({
            _id: r._id
          }, {
            $pull: {
              children: {
                _id: roleName
              }
            }
          });
          inheritedRoles = Roles._getInheritedRoleNames(Meteor.roles.findOne({
            _id: r._id
          }));
          Meteor.roleAssignment.update({
            'role._id': r._id
          }, {
            $set: {
              inheritedRoles: [r._id].concat(_toConsumableArray(inheritedRoles)).map(function (r2) {
                return {
                  _id: r2
                };
              })
            }
          }, {
            multi: true
          });
        });
      } while (roles.length > 0);

      // And finally remove the role itself
      Meteor.roles.remove({
        _id: roleName
      });
    },
    /**
     * Rename an existing role.
     *
     * @method renameRole
     * @param {String} oldName Old name of a role.
     * @param {String} newName New name of a role.
     * @static
     */
    renameRole: function (oldName, newName) {
      var count;
      Roles._checkRoleName(oldName);
      Roles._checkRoleName(newName);
      if (oldName === newName) return;
      var role = Meteor.roles.findOne({
        _id: oldName
      });
      if (!role) {
        throw new Error('Role \'' + oldName + '\' does not exist.');
      }
      role._id = newName;
      Meteor.roles.insert(role);
      do {
        count = Meteor.roleAssignment.update({
          'role._id': oldName
        }, {
          $set: {
            'role._id': newName
          }
        }, {
          multi: true
        });
      } while (count > 0);
      do {
        count = Meteor.roleAssignment.update({
          'inheritedRoles._id': oldName
        }, {
          $set: {
            'inheritedRoles.$._id': newName
          }
        }, {
          multi: true
        });
      } while (count > 0);
      do {
        count = Meteor.roles.update({
          'children._id': oldName
        }, {
          $set: {
            'children.$._id': newName
          }
        }, {
          multi: true
        });
      } while (count > 0);
      Meteor.roles.remove({
        _id: oldName
      });
    },
    /**
     * Add role parent to roles.
     *
     * Previous parents are kept (role can have multiple parents). For users which have the
     * parent role set, new subroles are added automatically.
     *
     * @method addRolesToParent
     * @param {Array|String} rolesNames Name(s) of role(s).
     * @param {String} parentName Name of parent role.
     * @static
     */
    addRolesToParent: function (rolesNames, parentName) {
      // ensure arrays
      if (!Array.isArray(rolesNames)) rolesNames = [rolesNames];
      rolesNames.forEach(function (roleName) {
        Roles._addRoleToParent(roleName, parentName);
      });
    },
    /**
     * @method _addRoleToParent
     * @param {String} roleName Name of role.
     * @param {String} parentName Name of parent role.
     * @private
     * @static
     */
    _addRoleToParent: function (roleName, parentName) {
      Roles._checkRoleName(roleName);
      Roles._checkRoleName(parentName);

      // query to get role's children
      var role = Meteor.roles.findOne({
        _id: roleName
      });
      if (!role) {
        throw new Error('Role \'' + roleName + '\' does not exist.');
      }

      // detect cycles
      if (Roles._getInheritedRoleNames(role).includes(parentName)) {
        throw new Error('Roles \'' + roleName + '\' and \'' + parentName + '\' would form a cycle.');
      }
      var count = Meteor.roles.update({
        _id: parentName,
        'children._id': {
          $ne: role._id
        }
      }, {
        $push: {
          children: {
            _id: role._id
          }
        }
      });

      // if there was no change, parent role might not exist, or role is
      // already a subrole; in any case we do not have anything more to do
      if (!count) return;
      Meteor.roleAssignment.update({
        'inheritedRoles._id': parentName
      }, {
        $push: {
          inheritedRoles: {
            $each: [role._id].concat(_toConsumableArray(Roles._getInheritedRoleNames(role))).map(function (r) {
              return {
                _id: r
              };
            })
          }
        }
      }, {
        multi: true
      });
    },
    /**
     * Remove role parent from roles.
     *
     * Other parents are kept (role can have multiple parents). For users which have the
     * parent role set, removed subrole is removed automatically.
     *
     * @method removeRolesFromParent
     * @param {Array|String} rolesNames Name(s) of role(s).
     * @param {String} parentName Name of parent role.
     * @static
     */
    removeRolesFromParent: function (rolesNames, parentName) {
      // ensure arrays
      if (!Array.isArray(rolesNames)) rolesNames = [rolesNames];
      rolesNames.forEach(function (roleName) {
        Roles._removeRoleFromParent(roleName, parentName);
      });
    },
    /**
     * @method _removeRoleFromParent
     * @param {String} roleName Name of role.
     * @param {String} parentName Name of parent role.
     * @private
     * @static
     */
    _removeRoleFromParent: function (roleName, parentName) {
      Roles._checkRoleName(roleName);
      Roles._checkRoleName(parentName);

      // check for role existence
      // this would not really be needed, but we are trying to match addRolesToParent
      var role = Meteor.roles.findOne({
        _id: roleName
      }, {
        fields: {
          _id: 1
        }
      });
      if (!role) {
        throw new Error('Role \'' + roleName + '\' does not exist.');
      }
      var count = Meteor.roles.update({
        _id: parentName
      }, {
        $pull: {
          children: {
            _id: role._id
          }
        }
      });

      // if there was no change, parent role might not exist, or role was
      // already not a subrole; in any case we do not have anything more to do
      if (!count) return;

      // For all roles who have had it as a dependency ...
      var roles = [].concat(_toConsumableArray(Roles._getParentRoleNames(Meteor.roles.findOne({
        _id: parentName
      }))), [parentName]);
      Meteor.roles.find({
        _id: {
          $in: roles
        }
      }).fetch().forEach(function (r) {
        var inheritedRoles = Roles._getInheritedRoleNames(Meteor.roles.findOne({
          _id: r._id
        }));
        Meteor.roleAssignment.update({
          'role._id': r._id,
          'inheritedRoles._id': role._id
        }, {
          $set: {
            inheritedRoles: [r._id].concat(_toConsumableArray(inheritedRoles)).map(function (r2) {
              return {
                _id: r2
              };
            })
          }
        }, {
          multi: true
        });
      });
    },
    /**
     * Add users to roles.
     *
     * Adds roles to existing roles for each user.
     *
     * @example
     *     Roles.addUsersToRoles(userId, 'admin')
     *     Roles.addUsersToRoles(userId, ['view-secrets'], 'example.com')
     *     Roles.addUsersToRoles([user1, user2], ['user','editor'])
     *     Roles.addUsersToRoles([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *
     * @method addUsersToRoles
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to add users to. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    addUsersToRoles: function (users, roles, options) {
      var id;
      if (!users) throw new Error('Missing \'users\' param.');
      if (!roles) throw new Error('Missing \'roles\' param.');
      options = Roles._normalizeOptions(options);

      // ensure arrays
      if (!Array.isArray(users)) users = [users];
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      options = Object.assign({
        ifExists: false
      }, options);
      users.forEach(function (user) {
        if (_typeof(user) === 'object') {
          id = user._id;
        } else {
          id = user;
        }
        roles.forEach(function (role) {
          Roles._addUserToRole(id, role, options);
        });
      });
    },
    /**
     * Set users' roles.
     *
     * Replaces all existing roles with a new set of roles.
     *
     * @example
     *     Roles.setUserRoles(userId, 'admin')
     *     Roles.setUserRoles(userId, ['view-secrets'], 'example.com')
     *     Roles.setUserRoles([user1, user2], ['user','editor'])
     *     Roles.setUserRoles([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *
     * @method setUserRoles
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to add users to. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if `true`, remove all roles the user has, of any scope, if `false`, only the one in the same scope
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    setUserRoles: function (users, roles, options) {
      var id;
      if (!users) throw new Error('Missing \'users\' param.');
      if (!roles) throw new Error('Missing \'roles\' param.');
      options = Roles._normalizeOptions(options);

      // ensure arrays
      if (!Array.isArray(users)) users = [users];
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      options = Object.assign({
        ifExists: false,
        anyScope: false
      }, options);
      users.forEach(function (user) {
        if (_typeof(user) === 'object') {
          id = user._id;
        } else {
          id = user;
        }
        // we first clear all roles for the user
        var selector = {
          'user._id': id
        };
        if (!options.anyScope) {
          selector.scope = options.scope;
        }
        Meteor.roleAssignment.remove(selector);

        // and then add all
        roles.forEach(function (role) {
          Roles._addUserToRole(id, role, options);
        });
      });
    },
    /**
     * Add one user to one role.
     *
     * @method _addUserToRole
     * @param {String} userId The user ID.
     * @param {String} roleName Name of the role to add the user to. The role have to exist.
     * @param {Object} options Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     * @private
     * @static
     */
    _addUserToRole: function (userId, roleName, options) {
      Roles._checkRoleName(roleName);
      Roles._checkScopeName(options.scope);
      if (!userId) {
        return;
      }
      var role = Meteor.roles.findOne({
        _id: roleName
      }, {
        fields: {
          children: 1
        }
      });
      if (!role) {
        if (options.ifExists) {
          return [];
        } else {
          throw new Error('Role \'' + roleName + '\' does not exist.');
        }
      }

      // This might create duplicates, because we don't have a unique index, but that's all right. In case there are two, withdrawing the role will effectively kill them both.
      var res = Meteor.roleAssignment.upsert({
        'user._id': userId,
        'role._id': roleName,
        scope: options.scope
      }, {
        $setOnInsert: {
          user: {
            _id: userId
          },
          role: {
            _id: roleName
          },
          scope: options.scope
        }
      });
      if (res.insertedId) {
        Meteor.roleAssignment.update({
          _id: res.insertedId
        }, {
          $set: {
            inheritedRoles: [roleName].concat(_toConsumableArray(Roles._getInheritedRoleNames(role))).map(function (r) {
              return {
                _id: r
              };
            })
          }
        });
      }
      return res;
    },
    /**
     * Returns an array of role names the given role name is a child of.
     *
     * @example
     *     Roles._getParentRoleNames({ _id: 'admin', children; [] })
     *
     * @method _getParentRoleNames
     * @param {object} role The role object
     * @private
     * @static
     */
    _getParentRoleNames: function (role) {
      if (!role) {
        return [];
      }
      var parentRoles = new Set([role._id]);
      parentRoles.forEach(function (roleName) {
        Meteor.roles.find({
          'children._id': roleName
        }).fetch().forEach(function (parentRole) {
          parentRoles.add(parentRole._id);
        });
      });
      parentRoles.delete(role._id);
      return _toConsumableArray(parentRoles);
    },
    /**
     * Returns an array of role names the given role name is a parent of.
     *
     * @example
     *     Roles._getInheritedRoleNames({ _id: 'admin', children; [] })
     *
     * @method _getInheritedRoleNames
     * @param {object} role The role object
     * @private
     * @static
     */
    _getInheritedRoleNames: function (role) {
      var inheritedRoles = new Set();
      var nestedRoles = new Set([role]);
      nestedRoles.forEach(function (r) {
        var roles = Meteor.roles.find({
          _id: {
            $in: r.children.map(function (r) {
              return r._id;
            })
          }
        }, {
          fields: {
            children: 1
          }
        }).fetch();
        roles.forEach(function (r2) {
          inheritedRoles.add(r2._id);
          nestedRoles.add(r2);
        });
      });
      return _toConsumableArray(inheritedRoles);
    },
    /**
     * Remove users from assigned roles.
     *
     * @example
     *     Roles.removeUsersFromRoles(userId, 'admin')
     *     Roles.removeUsersFromRoles([userId, user2], ['editor'])
     *     Roles.removeUsersFromRoles(userId, ['user'], 'group1')
     *
     * @method removeUsersFromRoles
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to remove users from. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    removeUsersFromRoles: function (users, roles, options) {
      if (!users) throw new Error('Missing \'users\' param.');
      if (!roles) throw new Error('Missing \'roles\' param.');
      options = Roles._normalizeOptions(options);

      // ensure arrays
      if (!Array.isArray(users)) users = [users];
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      users.forEach(function (user) {
        if (!user) return;
        roles.forEach(function (role) {
          var id;
          if (_typeof(user) === 'object') {
            id = user._id;
          } else {
            id = user;
          }
          Roles._removeUserFromRole(id, role, options);
        });
      });
    },
    /**
     * Remove one user from one role.
     *
     * @method _removeUserFromRole
     * @param {String} userId The user ID.
     * @param {String} roleName Name of the role to add the user to. The role have to exist.
     * @param {Object} options Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     * @private
     * @static
     */
    _removeUserFromRole: function (userId, roleName, options) {
      Roles._checkRoleName(roleName);
      Roles._checkScopeName(options.scope);
      if (!userId) return;
      var selector = {
        'user._id': userId,
        'role._id': roleName
      };
      if (!options.anyScope) {
        selector.scope = options.scope;
      }
      Meteor.roleAssignment.remove(selector);
    },
    /**
     * Check if user has specified roles.
     *
     * @example
     *     // global roles
     *     Roles.userIsInRole(user, 'admin')
     *     Roles.userIsInRole(user, ['admin','editor'])
     *     Roles.userIsInRole(userId, 'admin')
     *     Roles.userIsInRole(userId, ['admin','editor'])
     *
     *     // scope roles (global roles are still checked)
     *     Roles.userIsInRole(user, 'admin', 'group1')
     *     Roles.userIsInRole(userId, ['admin','editor'], 'group1')
     *     Roles.userIsInRole(userId, ['admin','editor'], {scope: 'group1'})
     *
     * @method userIsInRole
     * @param {String|Object} user User ID or an actual user object.
     * @param {Array|String} roles Name of role or an array of roles to check against. If array,
     *                             will return `true` if user is in _any_ role.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope; if supplied, limits check to just that scope
     *     the user's global roles will always be checked whether scope is specified or not
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @return {Boolean} `true` if user is in _any_ of the target roles
     * @static
     */
    userIsInRole: function (user, roles, options) {
      var id;
      options = Roles._normalizeOptions(options);

      // ensure array to simplify code
      if (!Array.isArray(roles)) roles = [roles];
      roles = roles.filter(function (r) {
        return r != null;
      });
      if (!roles.length) return false;
      Roles._checkScopeName(options.scope);
      options = Object.assign({
        anyScope: false
      }, options);
      if (user && _typeof(user) === 'object') {
        id = user._id;
      } else {
        id = user;
      }
      if (!id) return false;
      if (typeof id !== 'string') return false;
      var selector = {
        'user._id': id
      };
      if (!options.anyScope) {
        selector.scope = {
          $in: [options.scope, null]
        };
      }
      return roles.some(function (roleName) {
        selector['inheritedRoles._id'] = roleName;
        return Meteor.roleAssignment.find(selector, {
          limit: 1
        }).count() > 0;
      });
    },
    /**
     * Retrieve user's roles.
     *
     * @method getRolesForUser
     * @param {String|Object} user User ID or an actual user object.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of scope to provide roles for; if not specified, global roles are returned
     *   - `anyScope`: if set, role can be in any scope (`scope` and `onlyAssigned` options are ignored)
     *   - `onlyScoped`: if set, only roles in the specified scope are returned
     *   - `onlyAssigned`: return only assigned roles and not automatically inferred (like subroles)
     *   - `fullObjects`: return full roles objects (`true`) or just names (`false`) (`onlyAssigned` option is ignored) (default `false`)
     *     If you have a use-case for this option, please file a feature-request. You shouldn't need to use it as it's
     *     result strongly dependent on the internal data structure of this plugin.
     *
     * Alternatively, it can be a scope name string.
     * @return {Array} Array of user's roles, unsorted.
     * @static
     */
    getRolesForUser: function (user, options) {
      var id;
      options = Roles._normalizeOptions(options);
      Roles._checkScopeName(options.scope);
      options = Object.assign({
        fullObjects: false,
        onlyAssigned: false,
        anyScope: false,
        onlyScoped: false
      }, options);
      if (user && _typeof(user) === 'object') {
        id = user._id;
      } else {
        id = user;
      }
      if (!id) return [];
      var selector = {
        'user._id': id
      };
      var filter = {
        fields: {
          'inheritedRoles._id': 1
        }
      };
      if (!options.anyScope) {
        selector.scope = {
          $in: [options.scope]
        };
        if (!options.onlyScoped) {
          selector.scope.$in.push(null);
        }
      }
      if (options.onlyAssigned) {
        delete filter.fields['inheritedRoles._id'];
        filter.fields['role._id'] = 1;
      }
      if (options.fullObjects) {
        delete filter.fields;
      }
      var roles = Meteor.roleAssignment.find(selector, filter).fetch();
      if (options.fullObjects) {
        return roles;
      }
      return _toConsumableArray(new Set(roles.reduce(function (rev, current) {
        if (current.inheritedRoles) {
          return rev.concat(current.inheritedRoles.map(function (r) {
            return r._id;
          }));
        } else if (current.role) {
          rev.push(current.role._id);
        }
        return rev;
      }, [])));
    },
    /**
     * Retrieve cursor of all existing roles.
     *
     * @method getAllRoles
     * @param {Object} queryOptions Options which are passed directly
     *                                through to `Meteor.roles.find(query, options)`.
     * @return {Cursor} Cursor of existing roles.
     * @static
     */
    getAllRoles: function (queryOptions) {
      queryOptions = queryOptions || {
        sort: {
          _id: 1
        }
      };
      return Meteor.roles.find({}, queryOptions);
    },
    /**
     * Retrieve all users who are in target role.
     *
     * Options:
     *
     * @method getUsersInRole
     * @param {Array|String} roles Name of role or an array of roles. If array, users
     *                             returned will have at least one of the roles
     *                             specified but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *   - `onlyScoped`: if set, only roles in the specified scope are returned
     *   - `queryOptions`: options which are passed directly
     *     through to `Meteor.users.find(query, options)`
     *
     * Alternatively, it can be a scope name string.
     * @param {Object} [queryOptions] Options which are passed directly
     *                                through to `Meteor.users.find(query, options)`
     * @return {Cursor} Cursor of users in roles.
     * @static
     */
    getUsersInRole: function (roles, options, queryOptions) {
      var ids = Roles.getUserAssignmentsForRole(roles, options).fetch().map(function (a) {
        return a.user._id;
      });
      return Meteor.users.find({
        _id: {
          $in: ids
        }
      }, options && options.queryOptions || queryOptions || {});
    },
    /**
     * Retrieve all assignments of a user which are for the target role.
     *
     * Options:
     *
     * @method getUserAssignmentsForRole
     * @param {Array|String} roles Name of role or an array of roles. If array, users
     *                             returned will have at least one of the roles
     *                             specified but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *   - `queryOptions`: options which are passed directly
     *     through to `Meteor.roleAssignment.find(query, options)`
     *
     * Alternatively, it can be a scope name string.
     * @return {Cursor} Cursor of user assignments for roles.
     * @static
     */
    getUserAssignmentsForRole: function (roles, options) {
      options = Roles._normalizeOptions(options);
      options = Object.assign({
        anyScope: false,
        queryOptions: {}
      }, options);
      return Roles._getUsersInRoleCursor(roles, options, options.queryOptions);
    },
    /**
     * @method _getUsersInRoleCursor
     * @param {Array|String} roles Name of role or an array of roles. If array, ids of users are
     *                             returned which have at least one of the roles
     *                             assigned but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @param {Object} [filter] Options which are passed directly
     *                                through to `Meteor.roleAssignment.find(query, options)`
     * @return {Object} Cursor to the assignment documents
     * @private
     * @static
     */
    _getUsersInRoleCursor: function (roles, options, filter) {
      options = Roles._normalizeOptions(options);
      options = Object.assign({
        anyScope: false,
        onlyScoped: false
      }, options);

      // ensure array to simplify code
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      filter = Object.assign({
        fields: {
          'user._id': 1
        }
      }, filter);
      var selector = {
        'inheritedRoles._id': {
          $in: roles
        }
      };
      if (!options.anyScope) {
        selector.scope = {
          $in: [options.scope]
        };
        if (!options.onlyScoped) {
          selector.scope.$in.push(null);
        }
      }
      return Meteor.roleAssignment.find(selector, filter);
    },
    /**
     * Deprecated. Use `getScopesForUser` instead.
     *
     * @method getGroupsForUser
     * @static
     * @deprecated
     */
    getGroupsForUser: function () {
      var _Roles;
      if (!getGroupsForUserDeprecationWarning) {
        getGroupsForUserDeprecationWarning = true;
        console && console.warn('getGroupsForUser has been deprecated. Use getScopesForUser instead.');
      }
      return (_Roles = Roles).getScopesForUser.apply(_Roles, arguments);
    },
    /**
     * Retrieve users scopes, if any.
     *
     * @method getScopesForUser
     * @param {String|Object} user User ID or an actual user object.
     * @param {Array|String} [roles] Name of roles to restrict scopes to.
     *
     * @return {Array} Array of user's scopes, unsorted.
     * @static
     */
    getScopesForUser: function (user, roles) {
      var id;
      if (roles && !Array.isArray(roles)) roles = [roles];
      if (user && _typeof(user) === 'object') {
        id = user._id;
      } else {
        id = user;
      }
      if (!id) return [];
      var selector = {
        'user._id': id,
        scope: {
          $ne: null
        }
      };
      if (roles) {
        selector['inheritedRoles._id'] = {
          $in: roles
        };
      }
      var scopes = Meteor.roleAssignment.find(selector, {
        fields: {
          scope: 1
        }
      }).fetch().map(function (obi) {
        return obi.scope;
      });
      return _toConsumableArray(new Set(scopes));
    },
    /**
     * Rename a scope.
     *
     * Roles assigned with a given scope are changed to be under the new scope.
     *
     * @method renameScope
     * @param {String} oldName Old name of a scope.
     * @param {String} newName New name of a scope.
     * @static
     */
    renameScope: function (oldName, newName) {
      var count;
      Roles._checkScopeName(oldName);
      Roles._checkScopeName(newName);
      if (oldName === newName) return;
      do {
        count = Meteor.roleAssignment.update({
          scope: oldName
        }, {
          $set: {
            scope: newName
          }
        }, {
          multi: true
        });
      } while (count > 0);
    },
    /**
     * Remove a scope.
     *
     * Roles assigned with a given scope are removed.
     *
     * @method removeScope
     * @param {String} name The name of a scope.
     * @static
     */
    removeScope: function (name) {
      Roles._checkScopeName(name);
      Meteor.roleAssignment.remove({
        scope: name
      });
    },
    /**
     * Throw an exception if `roleName` is an invalid role name.
     *
     * @method _checkRoleName
     * @param {String} roleName A role name to match against.
     * @private
     * @static
     */
    _checkRoleName: function (roleName) {
      if (!roleName || typeof roleName !== 'string' || roleName.trim() !== roleName) {
        throw new Error('Invalid role name \'' + roleName + '\'.');
      }
    },
    /**
     * Find out if a role is an ancestor of another role.
     *
     * WARNING: If you check this on the client, please make sure all roles are published.
     *
     * @method isParentOf
     * @param {String} parentRoleName The role you want to research.
     * @param {String} childRoleName The role you expect to be among the children of parentRoleName.
     * @static
     */
    isParentOf: function (parentRoleName, childRoleName) {
      if (parentRoleName === childRoleName) {
        return true;
      }
      if (parentRoleName == null || childRoleName == null) {
        return false;
      }
      Roles._checkRoleName(parentRoleName);
      Roles._checkRoleName(childRoleName);
      var rolesToCheck = [parentRoleName];
      while (rolesToCheck.length !== 0) {
        var roleName = rolesToCheck.pop();
        if (roleName === childRoleName) {
          return true;
        }
        var role = Meteor.roles.findOne({
          _id: roleName
        });

        // This should not happen, but this is a problem to address at some other time.
        if (!role) continue;
        rolesToCheck = rolesToCheck.concat(role.children.map(function (r) {
          return r._id;
        }));
      }
      return false;
    },
    /**
     * Normalize options.
     *
     * @method _normalizeOptions
     * @param {Object} options Options to normalize.
     * @return {Object} Normalized options.
     * @private
     * @static
     */
    _normalizeOptions: function (options) {
      options = options === undefined ? {} : options;
      if (options === null || typeof options === 'string') {
        options = {
          scope: options
        };
      }
      options.scope = Roles._normalizeScopeName(options.scope);
      return options;
    },
    /**
     * Normalize scope name.
     *
     * @method _normalizeScopeName
     * @param {String} scopeName A scope name to normalize.
     * @return {String} Normalized scope name.
     * @private
     * @static
     */
    _normalizeScopeName: function (scopeName) {
      // map undefined and null to null
      if (scopeName == null) {
        return null;
      } else {
        return scopeName;
      }
    },
    /**
     * Throw an exception if `scopeName` is an invalid scope name.
     *
     * @method _checkRoleName
     * @param {String} scopeName A scope name to match against.
     * @private
     * @static
     */
    _checkScopeName: function (scopeName) {
      if (scopeName === null) return;
      if (!scopeName || typeof scopeName !== 'string' || scopeName.trim() !== scopeName) {
        throw new Error('Invalid scope name \'' + scopeName + '\'.');
      }
    }
  });
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roles_common_async.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/alanning_roles/roles/roles_common_async.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  var _regeneratorRuntime;
  module1.link("@babel/runtime/regenerator", {
    default: function (v) {
      _regeneratorRuntime = v;
    }
  }, 0);
  var _typeof;
  module1.link("@babel/runtime/helpers/typeof", {
    default: function (v) {
      _typeof = v;
    }
  }, 1);
  var _toConsumableArray;
  module1.link("@babel/runtime/helpers/toConsumableArray", {
    default: function (v) {
      _toConsumableArray = v;
    }
  }, 2);
  var _createForOfIteratorHelperLoose;
  module1.link("@babel/runtime/helpers/createForOfIteratorHelperLoose", {
    default: function (v) {
      _createForOfIteratorHelperLoose = v;
    }
  }, 3);
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
  /**
   * Provides functions related to user authorization. Compatible with built-in Meteor accounts packages.
   *
   * Roles are accessible throgh `Meteor.roles` collection and documents consist of:
   *  - `_id`: role name
   *  - `children`: list of subdocuments:
   *    - `_id`
   *
   * Children list elements are subdocuments so that they can be easier extended in the future or by plugins.
   *
   * Roles can have multiple parents and can be children (subroles) of multiple roles.
   *
   * Example: `{_id: 'admin', children: [{_id: 'editor'}]}`
   *
   * The assignment of a role to a user is stored in a collection, accessible through `Meteor.roleAssignment`.
   * It's documents consist of
   *  - `_id`: Internal MongoDB id
   *  - `role`: A role object which got assigned. Usually only contains the `_id` property
   *  - `user`: A user object, usually only contains the `_id` property
   *  - `scope`: scope name
   *  - `inheritedRoles`: A list of all the roles objects inherited by the assigned role.
   *
   * @module Roles
   */
  if (!Meteor.roles) {
    Meteor.roles = new Mongo.Collection('roles');
  }
  if (!Meteor.roleAssignment) {
    Meteor.roleAssignment = new Mongo.Collection('role-assignment');
  }

  /**
   * @class Roles
   */
  if (typeof Roles === 'undefined') {
    Roles = {}; // eslint-disable-line no-global-assign
  }
  var getGroupsForUserDeprecationWarning = false;

  /**
   * Helper, resolves async some
   * @param {*} arr
   * @param {*} predicate
   * @returns {Promise<Boolean>}
   */
  var asyncSome = function () {
    function _callee(arr, predicate) {
      var _iterator, _step, e;
      return _regeneratorRuntime.async(function () {
        function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _iterator = _createForOfIteratorHelperLoose(arr);
            case 1:
              if ((_step = _iterator()).done) {
                _context.next = 9;
                break;
              }
              e = _step.value;
              _context.next = 5;
              return _regeneratorRuntime.awrap(predicate(e));
            case 5:
              if (!_context.sent) {
                _context.next = 7;
                break;
              }
              return _context.abrupt("return", true);
            case 7:
              _context.next = 1;
              break;
            case 9:
              return _context.abrupt("return", false);
            case 10:
            case "end":
              return _context.stop();
          }
        }
        return _callee$;
      }(), null, null, null, Promise);
    }
    return _callee;
  }();
  Object.assign(Roles, {
    /**
     * Used as a global group (now scope) name. Not used anymore.
     *
     * @property GLOBAL_GROUP
     * @static
     * @deprecated
     */
    GLOBAL_GROUP: null,
    /**
     * Create a new role.
     *
     * @method createRoleAsync
     * @param {String} roleName Name of role.
     * @param {Object} [options] Options:
     *   - `unlessExists`: if `true`, exception will not be thrown in the role already exists
     * @return {Promise<String>} ID of the new role or null.
     * @static
     */
    createRoleAsync: function () {
      function _callee2(roleName, options) {
        var insertedId, existingRole;
        return _regeneratorRuntime.async(function () {
          function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                Roles._checkRoleName(roleName);
                options = Object.assign({
                  unlessExists: false
                }, options);
                insertedId = null;
                _context2.next = 5;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: roleName
                }));
              case 5:
                existingRole = _context2.sent;
                if (!existingRole) {
                  _context2.next = 12;
                  break;
                }
                _context2.next = 9;
                return _regeneratorRuntime.awrap(Meteor.roles.updateAsync({
                  _id: roleName
                }, {
                  $setOnInsert: {
                    children: []
                  }
                }));
              case 9:
                return _context2.abrupt("return", null);
              case 12:
                _context2.next = 14;
                return _regeneratorRuntime.awrap(Meteor.roles.insertAsync({
                  _id: roleName,
                  children: []
                }));
              case 14:
                insertedId = _context2.sent;
              case 15:
                if (insertedId) {
                  _context2.next = 19;
                  break;
                }
                if (!options.unlessExists) {
                  _context2.next = 18;
                  break;
                }
                return _context2.abrupt("return", null);
              case 18:
                throw new Error("Role '" + roleName + "' already exists.");
              case 19:
                return _context2.abrupt("return", insertedId);
              case 20:
              case "end":
                return _context2.stop();
            }
          }
          return _callee2$;
        }(), null, null, null, Promise);
      }
      return _callee2;
    }(),
    /**
     * Delete an existing role.
     *
     * If the role is set for any user, it is automatically unset.
     *
     * @method deleteRoleAsync
     * @param {String} roleName Name of role.
     * @returns {Promise}
     * @static
     */
    deleteRoleAsync: function () {
      function _callee3(roleName) {
        var roles, inheritedRoles, _iterator2, _step2, r;
        return _regeneratorRuntime.async(function () {
          function _callee3$(_context3) {
            while (1) switch (_context3.prev = _context3.next) {
              case 0:
                Roles._checkRoleName(roleName);

                // Remove all assignments
                _context3.next = 3;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.removeAsync({
                  'role._id': roleName
                }));
              case 3:
                _context3.t0 = Roles;
                _context3.next = 6;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: roleName
                }));
              case 6:
                _context3.t1 = _context3.sent;
                roles = _context3.t0._getParentRoleNames.call(_context3.t0, _context3.t1);
                _context3.t2 = _createForOfIteratorHelperLoose;
                _context3.next = 11;
                return _regeneratorRuntime.awrap(Meteor.roles.find({
                  _id: {
                    $in: roles
                  }
                }).fetchAsync());
              case 11:
                _context3.t3 = _context3.sent;
                _iterator2 = (0, _context3.t2)(_context3.t3);
              case 13:
                if ((_step2 = _iterator2()).done) {
                  _context3.next = 30;
                  break;
                }
                r = _step2.value;
                _context3.next = 17;
                return _regeneratorRuntime.awrap(Meteor.roles.updateAsync({
                  _id: r._id
                }, {
                  $pull: {
                    children: {
                      _id: roleName
                    }
                  }
                }));
              case 17:
                _context3.t4 = _regeneratorRuntime;
                _context3.t5 = Roles;
                _context3.next = 21;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: r._id
                }));
              case 21:
                _context3.t6 = _context3.sent;
                _context3.t7 = _context3.t5._getInheritedRoleNamesAsync.call(_context3.t5, _context3.t6);
                _context3.next = 25;
                return _context3.t4.awrap.call(_context3.t4, _context3.t7);
              case 25:
                inheritedRoles = _context3.sent;
                _context3.next = 28;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.updateAsync({
                  'role._id': r._id
                }, {
                  $set: {
                    inheritedRoles: [r._id].concat(_toConsumableArray(inheritedRoles)).map(function (r2) {
                      return {
                        _id: r2
                      };
                    })
                  }
                }, {
                  multi: true
                }));
              case 28:
                _context3.next = 13;
                break;
              case 30:
                if (roles.length > 0) {
                  _context3.next = 3;
                  break;
                }
              case 31:
                _context3.next = 33;
                return _regeneratorRuntime.awrap(Meteor.roles.removeAsync({
                  _id: roleName
                }));
              case 33:
              case "end":
                return _context3.stop();
            }
          }
          return _callee3$;
        }(), null, null, null, Promise);
      }
      return _callee3;
    }(),
    /**
     * Rename an existing role.
     *
     * @method renameRoleAsync
     * @param {String} oldName Old name of a role.
     * @param {String} newName New name of a role.
     * @returns {Promise}
     * @static
     */
    renameRoleAsync: function () {
      function _callee4(oldName, newName) {
        var count, role;
        return _regeneratorRuntime.async(function () {
          function _callee4$(_context4) {
            while (1) switch (_context4.prev = _context4.next) {
              case 0:
                Roles._checkRoleName(oldName);
                Roles._checkRoleName(newName);
                if (!(oldName === newName)) {
                  _context4.next = 4;
                  break;
                }
                return _context4.abrupt("return");
              case 4:
                _context4.next = 6;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: oldName
                }));
              case 6:
                role = _context4.sent;
                if (role) {
                  _context4.next = 9;
                  break;
                }
                throw new Error("Role '" + oldName + "' does not exist.");
              case 9:
                role._id = newName;
                _context4.next = 12;
                return _regeneratorRuntime.awrap(Meteor.roles.insertAsync(role));
              case 12:
                _context4.next = 14;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.updateAsync({
                  'role._id': oldName
                }, {
                  $set: {
                    'role._id': newName
                  }
                }, {
                  multi: true
                }));
              case 14:
                count = _context4.sent;
              case 15:
                if (count > 0) {
                  _context4.next = 12;
                  break;
                }
              case 16:
                _context4.next = 18;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.updateAsync({
                  'inheritedRoles._id': oldName
                }, {
                  $set: {
                    'inheritedRoles.$._id': newName
                  }
                }, {
                  multi: true
                }));
              case 18:
                count = _context4.sent;
              case 19:
                if (count > 0) {
                  _context4.next = 16;
                  break;
                }
              case 20:
                _context4.next = 22;
                return _regeneratorRuntime.awrap(Meteor.roles.updateAsync({
                  'children._id': oldName
                }, {
                  $set: {
                    'children.$._id': newName
                  }
                }, {
                  multi: true
                }));
              case 22:
                count = _context4.sent;
              case 23:
                if (count > 0) {
                  _context4.next = 20;
                  break;
                }
              case 24:
                _context4.next = 26;
                return _regeneratorRuntime.awrap(Meteor.roles.removeAsync({
                  _id: oldName
                }));
              case 26:
              case "end":
                return _context4.stop();
            }
          }
          return _callee4$;
        }(), null, null, null, Promise);
      }
      return _callee4;
    }(),
    /**
     * Add role parent to roles.
     *
     * Previous parents are kept (role can have multiple parents). For users which have the
     * parent role set, new subroles are added automatically.
     *
     * @method addRolesToParentAsync
     * @param {Array|String} rolesNames Name(s) of role(s).
     * @param {String} parentName Name of parent role.
     * @returns {Promise}
     * @static
     */
    addRolesToParentAsync: function () {
      function _callee5(rolesNames, parentName) {
        var _iterator3, _step3, roleName;
        return _regeneratorRuntime.async(function () {
          function _callee5$(_context5) {
            while (1) switch (_context5.prev = _context5.next) {
              case 0:
                // ensure arrays
                if (!Array.isArray(rolesNames)) rolesNames = [rolesNames];
                _iterator3 = _createForOfIteratorHelperLoose(rolesNames);
              case 2:
                if ((_step3 = _iterator3()).done) {
                  _context5.next = 8;
                  break;
                }
                roleName = _step3.value;
                _context5.next = 6;
                return _regeneratorRuntime.awrap(Roles._addRoleToParentAsync(roleName, parentName));
              case 6:
                _context5.next = 2;
                break;
              case 8:
              case "end":
                return _context5.stop();
            }
          }
          return _callee5$;
        }(), null, null, null, Promise);
      }
      return _callee5;
    }(),
    /**
     * @method _addRoleToParentAsync
     * @param {String} roleName Name of role.
     * @param {String} parentName Name of parent role.
     * @returns {Promise}
     * @private
     * @static
     */
    _addRoleToParentAsync: function () {
      function _callee6(roleName, parentName) {
        var role, count;
        return _regeneratorRuntime.async(function () {
          function _callee6$(_context6) {
            while (1) switch (_context6.prev = _context6.next) {
              case 0:
                Roles._checkRoleName(roleName);
                Roles._checkRoleName(parentName);

                // query to get role's children
                _context6.next = 4;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: roleName
                }));
              case 4:
                role = _context6.sent;
                if (role) {
                  _context6.next = 7;
                  break;
                }
                throw new Error("Role '" + roleName + "' does not exist.");
              case 7:
                _context6.next = 9;
                return _regeneratorRuntime.awrap(Roles._getInheritedRoleNamesAsync(role));
              case 9:
                if (!_context6.sent.includes(parentName)) {
                  _context6.next = 11;
                  break;
                }
                throw new Error("Roles '" + roleName + "' and '" + parentName + "' would form a cycle.");
              case 11:
                _context6.next = 13;
                return _regeneratorRuntime.awrap(Meteor.roles.updateAsync({
                  _id: parentName,
                  'children._id': {
                    $ne: role._id
                  }
                }, {
                  $push: {
                    children: {
                      _id: role._id
                    }
                  }
                }));
              case 13:
                count = _context6.sent;
                if (count) {
                  _context6.next = 16;
                  break;
                }
                return _context6.abrupt("return");
              case 16:
                _context6.t0 = _regeneratorRuntime;
                _context6.t1 = Meteor.roleAssignment;
                _context6.t2 = {
                  'inheritedRoles._id': parentName
                };
                _context6.t3 = [role._id];
                _context6.t4 = _toConsumableArray;
                _context6.next = 23;
                return _regeneratorRuntime.awrap(Roles._getInheritedRoleNamesAsync(role));
              case 23:
                _context6.t5 = _context6.sent;
                _context6.t6 = (0, _context6.t4)(_context6.t5);
                _context6.t7 = _context6.t3.concat.call(_context6.t3, _context6.t6).map(function (r) {
                  return {
                    _id: r
                  };
                });
                _context6.t8 = {
                  $each: _context6.t7
                };
                _context6.t9 = {
                  inheritedRoles: _context6.t8
                };
                _context6.t10 = {
                  $push: _context6.t9
                };
                _context6.t11 = {
                  multi: true
                };
                _context6.t12 = _context6.t1.updateAsync.call(_context6.t1, _context6.t2, _context6.t10, _context6.t11);
                _context6.next = 33;
                return _context6.t0.awrap.call(_context6.t0, _context6.t12);
              case 33:
              case "end":
                return _context6.stop();
            }
          }
          return _callee6$;
        }(), null, null, null, Promise);
      }
      return _callee6;
    }(),
    /**
     * Remove role parent from roles.
     *
     * Other parents are kept (role can have multiple parents). For users which have the
     * parent role set, removed subrole is removed automatically.
     *
     * @method removeRolesFromParentAsync
     * @param {Array|String} rolesNames Name(s) of role(s).
     * @param {String} parentName Name of parent role.
     * @returns {Promise}
     * @static
     */
    removeRolesFromParentAsync: function () {
      function _callee7(rolesNames, parentName) {
        var _iterator4, _step4, roleName;
        return _regeneratorRuntime.async(function () {
          function _callee7$(_context7) {
            while (1) switch (_context7.prev = _context7.next) {
              case 0:
                // ensure arrays
                if (!Array.isArray(rolesNames)) rolesNames = [rolesNames];
                _iterator4 = _createForOfIteratorHelperLoose(rolesNames);
              case 2:
                if ((_step4 = _iterator4()).done) {
                  _context7.next = 8;
                  break;
                }
                roleName = _step4.value;
                _context7.next = 6;
                return _regeneratorRuntime.awrap(Roles._removeRoleFromParentAsync(roleName, parentName));
              case 6:
                _context7.next = 2;
                break;
              case 8:
              case "end":
                return _context7.stop();
            }
          }
          return _callee7$;
        }(), null, null, null, Promise);
      }
      return _callee7;
    }(),
    /**
     * @method _removeRoleFromParentAsync
     * @param {String} roleName Name of role.
     * @param {String} parentName Name of parent role.
     * @returns {Promise}
     * @private
     * @static
     */
    _removeRoleFromParentAsync: function () {
      function _callee8(roleName, parentName) {
        var role, count, roles, _iterator5, _step5, r, inheritedRoles;
        return _regeneratorRuntime.async(function () {
          function _callee8$(_context8) {
            while (1) switch (_context8.prev = _context8.next) {
              case 0:
                Roles._checkRoleName(roleName);
                Roles._checkRoleName(parentName);

                // check for role existence
                // this would not really be needed, but we are trying to match addRolesToParent
                _context8.next = 4;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: roleName
                }, {
                  fields: {
                    _id: 1
                  }
                }));
              case 4:
                role = _context8.sent;
                if (role) {
                  _context8.next = 7;
                  break;
                }
                throw new Error("Role '" + roleName + "' does not exist.");
              case 7:
                _context8.next = 9;
                return _regeneratorRuntime.awrap(Meteor.roles.updateAsync({
                  _id: parentName
                }, {
                  $pull: {
                    children: {
                      _id: role._id
                    }
                  }
                }));
              case 9:
                count = _context8.sent;
                if (count) {
                  _context8.next = 12;
                  break;
                }
                return _context8.abrupt("return");
              case 12:
                _context8.t0 = [];
                _context8.t1 = _toConsumableArray;
                _context8.t2 = _regeneratorRuntime;
                _context8.t3 = Roles;
                _context8.next = 18;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: parentName
                }));
              case 18:
                _context8.t4 = _context8.sent;
                _context8.t5 = _context8.t3._getParentRoleNamesAsync.call(_context8.t3, _context8.t4);
                _context8.next = 22;
                return _context8.t2.awrap.call(_context8.t2, _context8.t5);
              case 22:
                _context8.t6 = _context8.sent;
                _context8.t7 = (0, _context8.t1)(_context8.t6);
                _context8.t8 = [parentName];
                roles = _context8.t0.concat.call(_context8.t0, _context8.t7, _context8.t8);
                _context8.t9 = _createForOfIteratorHelperLoose;
                _context8.next = 29;
                return _regeneratorRuntime.awrap(Meteor.roles.find({
                  _id: {
                    $in: roles
                  }
                }).fetchAsync());
              case 29:
                _context8.t10 = _context8.sent;
                _iterator5 = (0, _context8.t9)(_context8.t10);
              case 31:
                if ((_step5 = _iterator5()).done) {
                  _context8.next = 46;
                  break;
                }
                r = _step5.value;
                _context8.t11 = _regeneratorRuntime;
                _context8.t12 = Roles;
                _context8.next = 37;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: r._id
                }));
              case 37:
                _context8.t13 = _context8.sent;
                _context8.t14 = _context8.t12._getInheritedRoleNamesAsync.call(_context8.t12, _context8.t13);
                _context8.next = 41;
                return _context8.t11.awrap.call(_context8.t11, _context8.t14);
              case 41:
                inheritedRoles = _context8.sent;
                _context8.next = 44;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.updateAsync({
                  'role._id': r._id,
                  'inheritedRoles._id': role._id
                }, {
                  $set: {
                    inheritedRoles: [r._id].concat(_toConsumableArray(inheritedRoles)).map(function (r2) {
                      return {
                        _id: r2
                      };
                    })
                  }
                }, {
                  multi: true
                }));
              case 44:
                _context8.next = 31;
                break;
              case 46:
              case "end":
                return _context8.stop();
            }
          }
          return _callee8$;
        }(), null, null, null, Promise);
      }
      return _callee8;
    }(),
    /**
     * Add users to roles.
     *
     * Adds roles to existing roles for each user.
     *
     * @example
     *     Roles.addUsersToRolesAsync(userId, 'admin')
     *     Roles.addUsersToRolesAsync(userId, ['view-secrets'], 'example.com')
     *     Roles.addUsersToRolesAsync([user1, user2], ['user','editor'])
     *     Roles.addUsersToRolesAsync([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *
     * @method addUsersToRolesAsync
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to add users to. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     * @returns {Promise}
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    addUsersToRolesAsync: function () {
      function _callee9(users, roles, options) {
        var id, _iterator6, _step6, user, _iterator7, _step7, role;
        return _regeneratorRuntime.async(function () {
          function _callee9$(_context9) {
            while (1) switch (_context9.prev = _context9.next) {
              case 0:
                if (users) {
                  _context9.next = 2;
                  break;
                }
                throw new Error("Missing 'users' param.");
              case 2:
                if (roles) {
                  _context9.next = 4;
                  break;
                }
                throw new Error("Missing 'roles' param.");
              case 4:
                options = Roles._normalizeOptions(options);

                // ensure arrays
                if (!Array.isArray(users)) users = [users];
                if (!Array.isArray(roles)) roles = [roles];
                Roles._checkScopeName(options.scope);
                options = Object.assign({
                  ifExists: false
                }, options);
                _iterator6 = _createForOfIteratorHelperLoose(users);
              case 10:
                if ((_step6 = _iterator6()).done) {
                  _context9.next = 22;
                  break;
                }
                user = _step6.value;
                if (_typeof(user) === 'object') {
                  id = user._id;
                } else {
                  id = user;
                }
                _iterator7 = _createForOfIteratorHelperLoose(roles);
              case 14:
                if ((_step7 = _iterator7()).done) {
                  _context9.next = 20;
                  break;
                }
                role = _step7.value;
                _context9.next = 18;
                return _regeneratorRuntime.awrap(Roles._addUserToRoleAsync(id, role, options));
              case 18:
                _context9.next = 14;
                break;
              case 20:
                _context9.next = 10;
                break;
              case 22:
              case "end":
                return _context9.stop();
            }
          }
          return _callee9$;
        }(), null, null, null, Promise);
      }
      return _callee9;
    }(),
    /**
     * Set users' roles.
     *
     * Replaces all existing roles with a new set of roles.
     *
     * @example
     *     await Roles.setUserRolesAsync(userId, 'admin')
     *     await Roles.setUserRolesAsync(userId, ['view-secrets'], 'example.com')
     *     await Roles.setUserRolesAsync([user1, user2], ['user','editor'])
     *     await Roles.setUserRolesAsync([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *
     * @method setUserRolesAsync
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to add users to. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if `true`, remove all roles the user has, of any scope, if `false`, only the one in the same scope
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     * @returns {Promise}
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    setUserRolesAsync: function () {
      function _callee10(users, roles, options) {
        var id, _iterator8, _step8, user, selector, _iterator9, _step9, role;
        return _regeneratorRuntime.async(function () {
          function _callee10$(_context10) {
            while (1) switch (_context10.prev = _context10.next) {
              case 0:
                if (users) {
                  _context10.next = 2;
                  break;
                }
                throw new Error("Missing 'users' param.");
              case 2:
                if (roles) {
                  _context10.next = 4;
                  break;
                }
                throw new Error("Missing 'roles' param.");
              case 4:
                options = Roles._normalizeOptions(options);

                // ensure arrays
                if (!Array.isArray(users)) users = [users];
                if (!Array.isArray(roles)) roles = [roles];
                Roles._checkScopeName(options.scope);
                options = Object.assign({
                  ifExists: false,
                  anyScope: false
                }, options);
                _iterator8 = _createForOfIteratorHelperLoose(users);
              case 10:
                if ((_step8 = _iterator8()).done) {
                  _context10.next = 26;
                  break;
                }
                user = _step8.value;
                if (_typeof(user) === 'object') {
                  id = user._id;
                } else {
                  id = user;
                }
                // we first clear all roles for the user
                selector = {
                  'user._id': id
                };
                if (!options.anyScope) {
                  selector.scope = options.scope;
                }
                _context10.next = 17;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.removeAsync(selector));
              case 17:
                _iterator9 = _createForOfIteratorHelperLoose(roles);
              case 18:
                if ((_step9 = _iterator9()).done) {
                  _context10.next = 24;
                  break;
                }
                role = _step9.value;
                _context10.next = 22;
                return _regeneratorRuntime.awrap(Roles._addUserToRole(id, role, options));
              case 22:
                _context10.next = 18;
                break;
              case 24:
                _context10.next = 10;
                break;
              case 26:
              case "end":
                return _context10.stop();
            }
          }
          return _callee10$;
        }(), null, null, null, Promise);
      }
      return _callee10;
    }(),
    /**
     * Add one user to one role.
     *
     * @method _addUserToRole
     * @param {String} userId The user ID.
     * @param {String} roleName Name of the role to add the user to. The role have to exist.
     * @param {Object} options Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     * @returns {Promise}
     * @private
     * @static
     */
    _addUserToRoleAsync: function () {
      function _callee11(userId, roleName, options) {
        var role, existingAssignment, insertedId, res;
        return _regeneratorRuntime.async(function () {
          function _callee11$(_context11) {
            while (1) switch (_context11.prev = _context11.next) {
              case 0:
                Roles._checkRoleName(roleName);
                Roles._checkScopeName(options.scope);
                if (userId) {
                  _context11.next = 4;
                  break;
                }
                return _context11.abrupt("return");
              case 4:
                _context11.next = 6;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: roleName
                }, {
                  fields: {
                    children: 1
                  }
                }));
              case 6:
                role = _context11.sent;
                if (role) {
                  _context11.next = 13;
                  break;
                }
                if (!options.ifExists) {
                  _context11.next = 12;
                  break;
                }
                return _context11.abrupt("return", []);
              case 12:
                throw new Error("Role '" + roleName + "' does not exist.");
              case 13:
                _context11.next = 15;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.findOneAsync({
                  'user._id': userId,
                  'role._id': roleName,
                  scope: options.scope
                }));
              case 15:
                existingAssignment = _context11.sent;
                if (!existingAssignment) {
                  _context11.next = 24;
                  break;
                }
                _context11.next = 19;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.updateAsync(existingAssignment._id, {
                  $set: {
                    user: {
                      _id: userId
                    },
                    role: {
                      _id: roleName
                    },
                    scope: options.scope
                  }
                }));
              case 19:
                _context11.next = 21;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.findOneAsync(existingAssignment._id));
              case 21:
                res = _context11.sent;
                _context11.next = 27;
                break;
              case 24:
                _context11.next = 26;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.insertAsync({
                  user: {
                    _id: userId
                  },
                  role: {
                    _id: roleName
                  },
                  scope: options.scope
                }));
              case 26:
                insertedId = _context11.sent;
              case 27:
                if (!insertedId) {
                  _context11.next = 46;
                  break;
                }
                _context11.t0 = _regeneratorRuntime;
                _context11.t1 = Meteor.roleAssignment;
                _context11.t2 = {
                  _id: insertedId
                };
                _context11.t3 = [roleName];
                _context11.t4 = _toConsumableArray;
                _context11.next = 35;
                return _regeneratorRuntime.awrap(Roles._getInheritedRoleNamesAsync(role));
              case 35:
                _context11.t5 = _context11.sent;
                _context11.t6 = (0, _context11.t4)(_context11.t5);
                _context11.t7 = _context11.t3.concat.call(_context11.t3, _context11.t6).map(function (r) {
                  return {
                    _id: r
                  };
                });
                _context11.t8 = {
                  inheritedRoles: _context11.t7
                };
                _context11.t9 = {
                  $set: _context11.t8
                };
                _context11.t10 = _context11.t1.updateAsync.call(_context11.t1, _context11.t2, _context11.t9);
                _context11.next = 43;
                return _context11.t0.awrap.call(_context11.t0, _context11.t10);
              case 43:
                _context11.next = 45;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.findOneAsync({
                  _id: insertedId
                }));
              case 45:
                res = _context11.sent;
              case 46:
                res.insertedId = insertedId; // For backward compatibility
                return _context11.abrupt("return", res);
              case 48:
              case "end":
                return _context11.stop();
            }
          }
          return _callee11$;
        }(), null, null, null, Promise);
      }
      return _callee11;
    }(),
    /**
     * Returns an array of role names the given role name is a child of.
     *
     * @example
     *     Roles._getParentRoleNames({ _id: 'admin', children; [] })
     *
     * @method _getParentRoleNames
     * @param {object} role The role object
     * @returns {Promise}
     * @private
     * @static
     */
    _getParentRoleNamesAsync: function () {
      function _callee12(role) {
        var parentRoles, _iterator10, _step10, roleName, _iterator11, _step11, parentRole;
        return _regeneratorRuntime.async(function () {
          function _callee12$(_context12) {
            while (1) switch (_context12.prev = _context12.next) {
              case 0:
                if (role) {
                  _context12.next = 2;
                  break;
                }
                return _context12.abrupt("return", []);
              case 2:
                parentRoles = new Set([role._id]);
                _iterator10 = _createForOfIteratorHelperLoose(parentRoles);
              case 4:
                if ((_step10 = _iterator10()).done) {
                  _context12.next = 18;
                  break;
                }
                roleName = _step10.value;
                _context12.t0 = _createForOfIteratorHelperLoose;
                _context12.next = 9;
                return _regeneratorRuntime.awrap(Meteor.roles.find({
                  'children._id': roleName
                }).fetchAsync());
              case 9:
                _context12.t1 = _context12.sent;
                _iterator11 = (0, _context12.t0)(_context12.t1);
              case 11:
                if ((_step11 = _iterator11()).done) {
                  _context12.next = 16;
                  break;
                }
                parentRole = _step11.value;
                parentRoles.add(parentRole._id);
              case 14:
                _context12.next = 11;
                break;
              case 16:
                _context12.next = 4;
                break;
              case 18:
                parentRoles.delete(role._id);
                return _context12.abrupt("return", _toConsumableArray(parentRoles));
              case 20:
              case "end":
                return _context12.stop();
            }
          }
          return _callee12$;
        }(), null, null, null, Promise);
      }
      return _callee12;
    }(),
    /**
     * Returns an array of role names the given role name is a parent of.
     *
     * @example
     *     Roles._getInheritedRoleNames({ _id: 'admin', children; [] })
     *
     * @method _getInheritedRoleNames
     * @param {object} role The role object
     * @returns {Promise}
     * @private
     * @static
     */
    _getInheritedRoleNamesAsync: function () {
      function _callee13(role) {
        var inheritedRoles, nestedRoles, _iterator12, _step12, r, roles, _iterator13, _step13, r2;
        return _regeneratorRuntime.async(function () {
          function _callee13$(_context13) {
            while (1) switch (_context13.prev = _context13.next) {
              case 0:
                inheritedRoles = new Set();
                nestedRoles = new Set([role]);
                _iterator12 = _createForOfIteratorHelperLoose(nestedRoles);
              case 3:
                if ((_step12 = _iterator12()).done) {
                  _context13.next = 11;
                  break;
                }
                r = _step12.value;
                _context13.next = 7;
                return _regeneratorRuntime.awrap(Meteor.roles.find({
                  _id: {
                    $in: r.children.map(function (r) {
                      return r._id;
                    })
                  }
                }, {
                  fields: {
                    children: 1
                  }
                }).fetchAsync());
              case 7:
                roles = _context13.sent;
                for (_iterator13 = _createForOfIteratorHelperLoose(roles); !(_step13 = _iterator13()).done;) {
                  r2 = _step13.value;
                  inheritedRoles.add(r2._id);
                  nestedRoles.add(r2);
                }
              case 9:
                _context13.next = 3;
                break;
              case 11:
                return _context13.abrupt("return", _toConsumableArray(inheritedRoles));
              case 12:
              case "end":
                return _context13.stop();
            }
          }
          return _callee13$;
        }(), null, null, null, Promise);
      }
      return _callee13;
    }(),
    /**
     * Remove users from assigned roles.
     *
     * @example
     *     await Roles.removeUsersFromRolesAsync(userId, 'admin')
     *     await Roles.removeUsersFromRolesAsync([userId, user2], ['editor'])
     *     await Roles.removeUsersFromRolesAsync(userId, ['user'], 'group1')
     *
     * @method removeUsersFromRolesAsync
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to remove users from. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     * @returns {Promise}
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    removeUsersFromRolesAsync: function () {
      function _callee14(users, roles, options) {
        var _iterator14, _step14, user, _iterator15, _step15, role, id;
        return _regeneratorRuntime.async(function () {
          function _callee14$(_context14) {
            while (1) switch (_context14.prev = _context14.next) {
              case 0:
                if (users) {
                  _context14.next = 2;
                  break;
                }
                throw new Error("Missing 'users' param.");
              case 2:
                if (roles) {
                  _context14.next = 4;
                  break;
                }
                throw new Error("Missing 'roles' param.");
              case 4:
                options = Roles._normalizeOptions(options);

                // ensure arrays
                if (!Array.isArray(users)) users = [users];
                if (!Array.isArray(roles)) roles = [roles];
                Roles._checkScopeName(options.scope);
                _iterator14 = _createForOfIteratorHelperLoose(users);
              case 9:
                if ((_step14 = _iterator14()).done) {
                  _context14.next = 24;
                  break;
                }
                user = _step14.value;
                if (user) {
                  _context14.next = 13;
                  break;
                }
                return _context14.abrupt("return");
              case 13:
                _iterator15 = _createForOfIteratorHelperLoose(roles);
              case 14:
                if ((_step15 = _iterator15()).done) {
                  _context14.next = 22;
                  break;
                }
                role = _step15.value;
                id = void 0;
                if (_typeof(user) === 'object') {
                  id = user._id;
                } else {
                  id = user;
                }
                _context14.next = 20;
                return _regeneratorRuntime.awrap(Roles._removeUserFromRoleAsync(id, role, options));
              case 20:
                _context14.next = 14;
                break;
              case 22:
                _context14.next = 9;
                break;
              case 24:
              case "end":
                return _context14.stop();
            }
          }
          return _callee14$;
        }(), null, null, null, Promise);
      }
      return _callee14;
    }(),
    /**
     * Remove one user from one role.
     *
     * @method _removeUserFromRole
     * @param {String} userId The user ID.
     * @param {String} roleName Name of the role to add the user to. The role have to exist.
     * @param {Object} options Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     * @returns {Promise}
     * @private
     * @static
     */
    _removeUserFromRoleAsync: function () {
      function _callee15(userId, roleName, options) {
        var selector;
        return _regeneratorRuntime.async(function () {
          function _callee15$(_context15) {
            while (1) switch (_context15.prev = _context15.next) {
              case 0:
                Roles._checkRoleName(roleName);
                Roles._checkScopeName(options.scope);
                if (userId) {
                  _context15.next = 4;
                  break;
                }
                return _context15.abrupt("return");
              case 4:
                selector = {
                  'user._id': userId,
                  'role._id': roleName
                };
                if (!options.anyScope) {
                  selector.scope = options.scope;
                }
                _context15.next = 8;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.removeAsync(selector));
              case 8:
              case "end":
                return _context15.stop();
            }
          }
          return _callee15$;
        }(), null, null, null, Promise);
      }
      return _callee15;
    }(),
    /**
     * Check if user has specified roles.
     *
     * @example
     *     // global roles
     *     await Roles.userIsInRoleAsync(user, 'admin')
     *     await Roles.userIsInRoleAsync(user, ['admin','editor'])
     *     await Roles.userIsInRoleAsync(userId, 'admin')
     *     await Roles.userIsInRoleAsync(userId, ['admin','editor'])
     *
     *     // scope roles (global roles are still checked)
     *     await Roles.userIsInRoleAsync(user, 'admin', 'group1')
     *     await Roles.userIsInRoleAsync(userId, ['admin','editor'], 'group1')
     *     await Roles.userIsInRoleAsync(userId, ['admin','editor'], {scope: 'group1'})
     *
     * @method userIsInRoleAsync
     * @param {String|Object} user User ID or an actual user object.
     * @param {Array|String} roles Name of role or an array of roles to check against. If array,
     *                             will return `true` if user is in _any_ role.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope; if supplied, limits check to just that scope
     *     the user's global roles will always be checked whether scope is specified or not
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @return {Promise<Boolean>} `true` if user is in _any_ of the target roles
     * @static
     */
    userIsInRoleAsync: function () {
      function _callee17(user, roles, options) {
        var id, selector, res;
        return _regeneratorRuntime.async(function () {
          function _callee17$(_context17) {
            while (1) switch (_context17.prev = _context17.next) {
              case 0:
                options = Roles._normalizeOptions(options);

                // ensure array to simplify code
                if (!Array.isArray(roles)) roles = [roles];
                roles = roles.filter(function (r) {
                  return r != null;
                });
                if (roles.length) {
                  _context17.next = 5;
                  break;
                }
                return _context17.abrupt("return", false);
              case 5:
                Roles._checkScopeName(options.scope);
                options = Object.assign({
                  anyScope: false
                }, options);
                if (user && _typeof(user) === 'object') {
                  id = user._id;
                } else {
                  id = user;
                }
                if (id) {
                  _context17.next = 10;
                  break;
                }
                return _context17.abrupt("return", false);
              case 10:
                if (!(typeof id !== 'string')) {
                  _context17.next = 12;
                  break;
                }
                return _context17.abrupt("return", false);
              case 12:
                selector = {
                  'user._id': id
                };
                if (!options.anyScope) {
                  selector.scope = {
                    $in: [options.scope, null]
                  };
                }
                _context17.next = 16;
                return _regeneratorRuntime.awrap(asyncSome(roles, function () {
                  function _callee16(roleName) {
                    var out;
                    return _regeneratorRuntime.async(function () {
                      function _callee16$(_context16) {
                        while (1) switch (_context16.prev = _context16.next) {
                          case 0:
                            selector['inheritedRoles._id'] = roleName;
                            _context16.next = 3;
                            return _regeneratorRuntime.awrap(Meteor.roleAssignment.find(selector, {
                              limit: 1
                            }).countAsync());
                          case 3:
                            _context16.t0 = _context16.sent;
                            out = _context16.t0 > 0;
                            return _context16.abrupt("return", out);
                          case 6:
                          case "end":
                            return _context16.stop();
                        }
                      }
                      return _callee16$;
                    }(), null, null, null, Promise);
                  }
                  return _callee16;
                }()));
              case 16:
                res = _context17.sent;
                return _context17.abrupt("return", res);
              case 18:
              case "end":
                return _context17.stop();
            }
          }
          return _callee17$;
        }(), null, null, null, Promise);
      }
      return _callee17;
    }(),
    /**
     * Retrieve user's roles.
     *
     * @method getRolesForUserAsync
     * @param {String|Object} user User ID or an actual user object.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of scope to provide roles for; if not specified, global roles are returned
     *   - `anyScope`: if set, role can be in any scope (`scope` and `onlyAssigned` options are ignored)
     *   - `onlyScoped`: if set, only roles in the specified scope are returned
     *   - `onlyAssigned`: return only assigned roles and not automatically inferred (like subroles)
     *   - `fullObjects`: return full roles objects (`true`) or just names (`false`) (`onlyAssigned` option is ignored) (default `false`)
     *     If you have a use-case for this option, please file a feature-request. You shouldn't need to use it as it's
     *     result strongly dependent on the internal data structure of this plugin.
     *
     * Alternatively, it can be a scope name string.
     * @return {Promise<Array>} Array of user's roles, unsorted.
     * @static
     */
    getRolesForUserAsync: function () {
      function _callee18(user, options) {
        var id, selector, filter, roles;
        return _regeneratorRuntime.async(function () {
          function _callee18$(_context18) {
            while (1) switch (_context18.prev = _context18.next) {
              case 0:
                options = Roles._normalizeOptions(options);
                Roles._checkScopeName(options.scope);
                options = Object.assign({
                  fullObjects: false,
                  onlyAssigned: false,
                  anyScope: false,
                  onlyScoped: false
                }, options);
                if (user && _typeof(user) === 'object') {
                  id = user._id;
                } else {
                  id = user;
                }
                if (id) {
                  _context18.next = 6;
                  break;
                }
                return _context18.abrupt("return", []);
              case 6:
                selector = {
                  'user._id': id
                };
                filter = {
                  fields: {
                    'inheritedRoles._id': 1
                  }
                };
                if (!options.anyScope) {
                  selector.scope = {
                    $in: [options.scope]
                  };
                  if (!options.onlyScoped) {
                    selector.scope.$in.push(null);
                  }
                }
                if (options.onlyAssigned) {
                  delete filter.fields['inheritedRoles._id'];
                  filter.fields['role._id'] = 1;
                }
                if (options.fullObjects) {
                  delete filter.fields;
                }
                _context18.next = 13;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.find(selector, filter).fetchAsync());
              case 13:
                roles = _context18.sent;
                if (!options.fullObjects) {
                  _context18.next = 16;
                  break;
                }
                return _context18.abrupt("return", roles);
              case 16:
                return _context18.abrupt("return", _toConsumableArray(new Set(roles.reduce(function (rev, current) {
                  if (current.inheritedRoles) {
                    return rev.concat(current.inheritedRoles.map(function (r) {
                      return r._id;
                    }));
                  } else if (current.role) {
                    rev.push(current.role._id);
                  }
                  return rev;
                }, []))));
              case 17:
              case "end":
                return _context18.stop();
            }
          }
          return _callee18$;
        }(), null, null, null, Promise);
      }
      return _callee18;
    }(),
    /**
     * Retrieve cursor of all existing roles.
     *
     * @method getAllRoles
     * @param {Object} [queryOptions] Options which are passed directly
     *                                through to `Meteor.roles.find(query, options)`.
     * @return {Cursor} Cursor of existing roles.
     * @static
     */
    getAllRoles: function (queryOptions) {
      queryOptions = queryOptions || {
        sort: {
          _id: 1
        }
      };
      return Meteor.roles.find({}, queryOptions);
    },
    /**
     * Retrieve all users who are in target role.
     *
     * Options:
     *
     * @method getUsersInRoleAsync
     * @param {Array|String} roles Name of role or an array of roles. If array, users
     *                             returned will have at least one of the roles
     *                             specified but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *   - `onlyScoped`: if set, only roles in the specified scope are returned
     *   - `queryOptions`: options which are passed directly
     *     through to `Meteor.users.find(query, options)`
     *
     * Alternatively, it can be a scope name string.
     * @param {Object} [queryOptions] Options which are passed directly
     *                                through to `Meteor.users.find(query, options)`
     * @return {Promise<Cursor>} Cursor of users in roles.
     * @static
     */
    getUsersInRoleAsync: function () {
      function _callee19(roles, options, queryOptions) {
        var ids;
        return _regeneratorRuntime.async(function () {
          function _callee19$(_context19) {
            while (1) switch (_context19.prev = _context19.next) {
              case 0:
                _context19.next = 2;
                return _regeneratorRuntime.awrap(Roles.getUserAssignmentsForRole(roles, options).fetchAsync());
              case 2:
                ids = _context19.sent.map(function (a) {
                  return a.user._id;
                });
                return _context19.abrupt("return", Meteor.users.find({
                  _id: {
                    $in: ids
                  }
                }, options && options.queryOptions || queryOptions || {}));
              case 4:
              case "end":
                return _context19.stop();
            }
          }
          return _callee19$;
        }(), null, null, null, Promise);
      }
      return _callee19;
    }(),
    /**
     * Retrieve all assignments of a user which are for the target role.
     *
     * Options:
     *
     * @method getUserAssignmentsForRole
     * @param {Array|String} roles Name of role or an array of roles. If array, users
     *                             returned will have at least one of the roles
     *                             specified but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *   - `queryOptions`: options which are passed directly
     *     through to `Meteor.roleAssignment.find(query, options)`
      * Alternatively, it can be a scope name string.
     * @return {Cursor} Cursor of user assignments for roles.
     * @static
     */
    getUserAssignmentsForRole: function (roles, options) {
      options = Roles._normalizeOptions(options);
      options = Object.assign({
        anyScope: false,
        queryOptions: {}
      }, options);
      return Roles._getUsersInRoleCursor(roles, options, options.queryOptions);
    },
    /**
     * @method _getUsersInRoleCursor
     * @param {Array|String} roles Name of role or an array of roles. If array, ids of users are
     *                             returned which have at least one of the roles
     *                             assigned but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @param {Object} [filter] Options which are passed directly
     *                                through to `Meteor.roleAssignment.find(query, options)`
     * @return {Object} Cursor to the assignment documents
     * @private
     * @static
     */
    _getUsersInRoleCursor: function (roles, options, filter) {
      options = Roles._normalizeOptions(options);
      options = Object.assign({
        anyScope: false,
        onlyScoped: false
      }, options);

      // ensure array to simplify code
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      filter = Object.assign({
        fields: {
          'user._id': 1
        }
      }, filter);
      var selector = {
        'inheritedRoles._id': {
          $in: roles
        }
      };
      if (!options.anyScope) {
        selector.scope = {
          $in: [options.scope]
        };
        if (!options.onlyScoped) {
          selector.scope.$in.push(null);
        }
      }
      return Meteor.roleAssignment.find(selector, filter);
    },
    /**
     * Deprecated. Use `getScopesForUser` instead.
     *
     * @method getGroupsForUserAsync
     * @returns {Promise<Array>}
     * @static
     * @deprecated
     */
    getGroupsForUserAsync: function () {
      function _callee20() {
        var _Roles;
        var _args20 = arguments;
        return _regeneratorRuntime.async(function () {
          function _callee20$(_context20) {
            while (1) switch (_context20.prev = _context20.next) {
              case 0:
                if (!getGroupsForUserDeprecationWarning) {
                  getGroupsForUserDeprecationWarning = true;
                  console && console.warn('getGroupsForUser has been deprecated. Use getScopesForUser instead.');
                }
                _context20.next = 3;
                return _regeneratorRuntime.awrap((_Roles = Roles).getScopesForUser.apply(_Roles, _args20));
              case 3:
                return _context20.abrupt("return", _context20.sent);
              case 4:
              case "end":
                return _context20.stop();
            }
          }
          return _callee20$;
        }(), null, null, null, Promise);
      }
      return _callee20;
    }(),
    /**
     * Retrieve users scopes, if any.
     *
     * @method getScopesForUserAsync
     * @param {String|Object} user User ID or an actual user object.
     * @param {Array|String} [roles] Name of roles to restrict scopes to.
     *
     * @return {Promise<Array>} Array of user's scopes, unsorted.
     * @static
     */
    getScopesForUserAsync: function () {
      function _callee21(user, roles) {
        var id, selector, scopes;
        return _regeneratorRuntime.async(function () {
          function _callee21$(_context21) {
            while (1) switch (_context21.prev = _context21.next) {
              case 0:
                if (roles && !Array.isArray(roles)) roles = [roles];
                if (user && _typeof(user) === 'object') {
                  id = user._id;
                } else {
                  id = user;
                }
                if (id) {
                  _context21.next = 4;
                  break;
                }
                return _context21.abrupt("return", []);
              case 4:
                selector = {
                  'user._id': id,
                  scope: {
                    $ne: null
                  }
                };
                if (roles) {
                  selector['inheritedRoles._id'] = {
                    $in: roles
                  };
                }
                _context21.next = 8;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.find(selector, {
                  fields: {
                    scope: 1
                  }
                }).fetchAsync());
              case 8:
                scopes = _context21.sent.map(function (obi) {
                  return obi.scope;
                });
                return _context21.abrupt("return", _toConsumableArray(new Set(scopes)));
              case 10:
              case "end":
                return _context21.stop();
            }
          }
          return _callee21$;
        }(), null, null, null, Promise);
      }
      return _callee21;
    }(),
    /**
     * Rename a scope.
     *
     * Roles assigned with a given scope are changed to be under the new scope.
     *
     * @method renameScopeAsync
     * @param {String} oldName Old name of a scope.
     * @param {String} newName New name of a scope.
     * @returns {Promise}
     * @static
     */
    renameScopeAsync: function () {
      function _callee22(oldName, newName) {
        var count;
        return _regeneratorRuntime.async(function () {
          function _callee22$(_context22) {
            while (1) switch (_context22.prev = _context22.next) {
              case 0:
                Roles._checkScopeName(oldName);
                Roles._checkScopeName(newName);
                if (!(oldName === newName)) {
                  _context22.next = 4;
                  break;
                }
                return _context22.abrupt("return");
              case 4:
                _context22.next = 6;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.updateAsync({
                  scope: oldName
                }, {
                  $set: {
                    scope: newName
                  }
                }, {
                  multi: true
                }));
              case 6:
                count = _context22.sent;
              case 7:
                if (count > 0) {
                  _context22.next = 4;
                  break;
                }
              case 8:
              case "end":
                return _context22.stop();
            }
          }
          return _callee22$;
        }(), null, null, null, Promise);
      }
      return _callee22;
    }(),
    /**
     * Remove a scope.
     *
     * Roles assigned with a given scope are removed.
     *
     * @method removeScopeAsync
     * @param {String} name The name of a scope.
     * @returns {Promise}
     * @static
     */
    removeScopeAsync: function () {
      function _callee23(name) {
        return _regeneratorRuntime.async(function () {
          function _callee23$(_context23) {
            while (1) switch (_context23.prev = _context23.next) {
              case 0:
                Roles._checkScopeName(name);
                _context23.next = 3;
                return _regeneratorRuntime.awrap(Meteor.roleAssignment.removeAsync({
                  scope: name
                }));
              case 3:
              case "end":
                return _context23.stop();
            }
          }
          return _callee23$;
        }(), null, null, null, Promise);
      }
      return _callee23;
    }(),
    /**
     * Throw an exception if `roleName` is an invalid role name.
     *
     * @method _checkRoleName
     * @param {String} roleName A role name to match against.
     * @private
     * @static
     */
    _checkRoleName: function (roleName) {
      if (!roleName || typeof roleName !== 'string' || roleName.trim() !== roleName) {
        throw new Error("Invalid role name '" + roleName + "'.");
      }
    },
    /**
     * Find out if a role is an ancestor of another role.
     *
     * WARNING: If you check this on the client, please make sure all roles are published.
     *
     * @method isParentOfAsync
     * @param {String} parentRoleName The role you want to research.
     * @param {String} childRoleName The role you expect to be among the children of parentRoleName.
     * @returns {Promise}
     * @static
     */
    isParentOfAsync: function () {
      function _callee24(parentRoleName, childRoleName) {
        var rolesToCheck, roleName, role;
        return _regeneratorRuntime.async(function () {
          function _callee24$(_context24) {
            while (1) switch (_context24.prev = _context24.next) {
              case 0:
                if (!(parentRoleName === childRoleName)) {
                  _context24.next = 2;
                  break;
                }
                return _context24.abrupt("return", true);
              case 2:
                if (!(parentRoleName == null || childRoleName == null)) {
                  _context24.next = 4;
                  break;
                }
                return _context24.abrupt("return", false);
              case 4:
                Roles._checkRoleName(parentRoleName);
                Roles._checkRoleName(childRoleName);
                rolesToCheck = [parentRoleName];
              case 7:
                if (!(rolesToCheck.length !== 0)) {
                  _context24.next = 19;
                  break;
                }
                roleName = rolesToCheck.pop();
                if (!(roleName === childRoleName)) {
                  _context24.next = 11;
                  break;
                }
                return _context24.abrupt("return", true);
              case 11:
                _context24.next = 13;
                return _regeneratorRuntime.awrap(Meteor.roles.findOneAsync({
                  _id: roleName
                }));
              case 13:
                role = _context24.sent;
                if (role) {
                  _context24.next = 16;
                  break;
                }
                return _context24.abrupt("continue", 7);
              case 16:
                rolesToCheck = rolesToCheck.concat(role.children.map(function (r) {
                  return r._id;
                }));
                _context24.next = 7;
                break;
              case 19:
                return _context24.abrupt("return", false);
              case 20:
              case "end":
                return _context24.stop();
            }
          }
          return _callee24$;
        }(), null, null, null, Promise);
      }
      return _callee24;
    }(),
    /**
     * Normalize options.
     *
     * @method _normalizeOptions
     * @param {Object} options Options to normalize.
     * @return {Object} Normalized options.
     * @private
     * @static
     */
    _normalizeOptions: function (options) {
      options = options === undefined ? {} : options;
      if (options === null || typeof options === 'string') {
        options = {
          scope: options
        };
      }
      options.scope = Roles._normalizeScopeName(options.scope);
      return options;
    },
    /**
     * Normalize scope name.
     *
     * @method _normalizeScopeName
     * @param {String} scopeName A scope name to normalize.
     * @return {String} Normalized scope name.
     * @private
     * @static
     */
    _normalizeScopeName: function (scopeName) {
      // map undefined and null to null
      if (scopeName == null) {
        return null;
      } else {
        return scopeName;
      }
    },
    /**
     * Throw an exception if `scopeName` is an invalid scope name.
     *
     * @method _checkRoleName
     * @param {String} scopeName A scope name to match against.
     * @private
     * @static
     */
    _checkScopeName: function (scopeName) {
      if (scopeName === null) return;
      if (!scopeName || typeof scopeName !== 'string' || scopeName.trim() !== scopeName) {
        throw new Error("Invalid scope name '" + scopeName + "'.");
      }
    }
  });
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"client":{"debug.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/alanning_roles/roles/client/debug.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global Roles, localStorage */

// //////////////////////////////////////////////////////////
// Debugging helpers
//
// Run this in your browser console to turn on debugging
// for this package:
//
//   localstorage.setItem('Roles.debug', true)
//

Roles.debug = false;
try {
  if (localStorage) {
    var temp = localStorage.getItem('Roles.debug');
    if (typeof temp !== 'undefined') {
      Roles.debug = !!temp;
    }
  }
} catch (ex) {
  // ignore: accessing localStorage when its disabled throws
  // https://github.com/meteor/meteor/issues/5759
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"uiHelpers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/alanning_roles/roles/client/uiHelpers.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  var _slicedToArray;
  module1.link("@babel/runtime/helpers/slicedToArray", {
    default: function (v) {
      _slicedToArray = v;
    }
  }, 0);
  /* global Meteor, Roles, Match, Package */

  /**
   * Convenience functions for use on client.
   *
   * NOTE: You must restrict user actions on the server-side; any
   * client-side checks are strictly for convenience and must not be
   * trusted.
   *
   * @module UIHelpers
   */

  // //////////////////////////////////////////////////////////
  // UI helpers
  //
  // Use a semi-private variable rather than declaring UI
  // helpers directly so that we can unit test the helpers.
  // XXX For some reason, the UI helpers are not registered
  // before the tests run.
  //
  Roles._uiHelpers = {
    /**
     * UI helper to check if current user is in at least one
     * of the target roles.  For use in client-side templates.
     *
     * @example
     *     {{#if isInRole 'admin'}}
     *     {{/if}}
     *
     *     {{#if isInRole 'editor,user'}}
     *     {{/if}}
     *
     *     {{#if isInRole 'editor,user' 'scope1'}}
     *     {{/if}}
     *
     * @method isInRole
     * @param {String} role Name of role or comma-seperated list of roles.
     * @param {String} [scope] Optional, name of scope to check.
     * @return {Boolean} `true` if current user is in at least one of the target roles.
     * @static
     * @for UIHelpers
     */
    isInRole: function (role, scope) {
      var user = Meteor.user();
      var comma = (role || '').indexOf(',');
      var roles;
      if (!user) return false;
      if (!Match.test(role, String)) return false;
      if (comma !== -1) {
        roles = role.split(',').reduce(function (memo, r) {
          if (!r) {
            return memo;
          }
          memo.push(r);
          return memo;
        }, []);
      } else {
        roles = [role];
      }
      if (Match.test(scope, String)) {
        return Roles.userIsInRole(user, roles, scope);
      }
      return Roles.userIsInRole(user, roles);
    }
  };

  // //////////////////////////////////////////////////////////
  // Register UI helpers
  //

  if (Roles.debug && console.log) {
    console.log('[roles] Roles.debug =', Roles.debug);
  }
  if (typeof Package.blaze !== 'undefined' && typeof Package.blaze.Blaze !== 'undefined' && typeof Package.blaze.Blaze.registerHelper === 'function') {
    Object.entries(Roles._uiHelpers).forEach(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
        name = _ref2[0],
        func = _ref2[1];
      if (Roles.debug && console.log) {
        console.log('[roles] registering Blaze helper \'' + name + '\'');
      }
      Package.blaze.Blaze.registerHelper(name, func);
    });
  }
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscriptions.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/alanning_roles/roles/client/subscriptions.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global Meteor, Roles, Tracker */

/**
 * Subscription handle for the collection of all existing roles.
 *
 * @example
 *
 *     Roles.subscription.ready(); // true if roles have been loaded
 *
 * @property subscription
 * @type Object
 * @for Roles
 * @static
 */

Tracker.autorun(function () {
  Roles.subscription = Meteor.subscribe('_roles');
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".d.ts"
  ]
});

require("/node_modules/meteor/alanning:roles/roles/roles_common.js");
require("/node_modules/meteor/alanning:roles/roles/roles_common_async.js");
require("/node_modules/meteor/alanning:roles/roles/client/debug.js");
require("/node_modules/meteor/alanning:roles/roles/client/uiHelpers.js");
require("/node_modules/meteor/alanning:roles/roles/client/subscriptions.js");

/* Exports */
Package._define("alanning:roles", {
  Roles: Roles
});

})();
