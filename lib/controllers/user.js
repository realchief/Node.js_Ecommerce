#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Winston = require('winston')
  , Events = require('events')
  , Moment = require('moment')
  , Str = require('underscore.string')
  , Request = require('request')
  , CRUD = require('../../node_modules/basecmd/lib/controllers/helpers/crud.js')
  , Validate = require('../../node_modules/basecmd/lib/controllers/helpers/validate.js')
;

module.exports = function(S){
  S = Validate(S);
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });

  /**
   * @api {post} /user/create.json Create User
   * @apiName CreateUser
   * @apiGroup User
   * @apiPermission admin, public
   *
   * @apiParam {String} name full name of user
   * @apiParam {String} email email of user
   * @apiParam {String} password password of user (optional)
   * @apiParam {Object} locality_name locality name of user (e.g. "us")
   * @apiParam {Object[]} addresses List of addresses of user.
   * @apiParam {String} addresses.name name of address
   * @apiParam {String} addresses.contact name of contact at address
   * @apiParam {String} addresses.street street address
   * @apiParam {String} addresses.street_b second line of street address
   * @apiParam {String} addresses.locality city/locality of address
   * @apiParam {String} addresses.region municipal region code (i.e. state abbreviation) of address
   * @apiParam {String} addresses.country country code of address
   * @apiParam {String} addresses.postal_code postal code of address
   * @apiParam {String} addresses.phone phone number of address
   * @apiParam {Object} roles roles of user (requires admin permissions)
   * @apiParam {Boolean} roles.customer user is a customer (requires admin permissions)
   * @apiParam {Boolean} roles.setmember user is a setmember (requires admin permissions)
   * @apiParam {Boolean} roles.admin user is an admin (requires admin permissions)
   * @apiParam {String[]} payment_method_tokens credit/debit card tokens for this account
   *
   * @apiSuccess {String} _id unique identifier of user
   * @apiSuccess {String} name full name of user
   * @apiSuccess {String} email email of user
   * @apiSuccess {Object} locality locality of user
   * @apiSuccess {String} locality.name name of locality (e.g. "us")
   * @apiSuccess {String} locality.long_name full name of locality (e.g. "United States")
   * @apiSuccess {String} locality.language ISO code language of locality (e.g. "en")
   * @apiSuccess {Object[]} addresses List of addresses of user.
   * @apiSuccess {String} addresses._id unique _id of address
   * @apiSuccess {String} addresses.name name of address
   * @apiSuccess {String} addresses.contact name of contact at address
   * @apiSuccess {String} addresses.street street address
   * @apiSuccess {String} addresses.street_b second line of street address
   * @apiSuccess {String} addresses.locality city/locality of address
   * @apiSuccess {String} addresses.region municipal region code (i.e. state abbreviation) of address
   * @apiSuccess {String} addresses.country country code of address
   * @apiSuccess {String} addresses.postal_code postal code of address
   * @apiSuccess {String} addresses.phone phone number of address
   * @apiSuccess {Object} roles roles of user
   * @apiSuccess {Boolean} roles.customer user is a customer
   * @apiSuccess {Boolean} roles.setmember user is a setmember
   * @apiSuccess {Boolean} roles.admin user is an admin
   * @apiSuccess {Object[]} payment_methods credit/debit cards linked to this account
   * @apiSuccess {String} payment_methods.id id of payment method
   * @apiSuccess {String} payment_methods.brand brand of payment method (e.g "Visa")
   * @apiSuccess {Number} payment_methods.exp_month expiration month of payment method (e.g 1)
   * @apiSuccess {Number} payment_methods.exp_year expiration year of payment method (e.g 2017)
   * @apiSuccess {String} payment_methods.last4 last four digits of payment method (e.g "1234")
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "_id": "1234bCad"
   *       , "name": "Homer Simpson"
   *       , "email": "homer@simpsons.org"
   *       , "locality": {
   *           "name": "us"
   *         , "long_name": "United States"
   *         , "language": "en"
   *         }
   *       , "addresses": [
   *           {
   *             "_id": "1234bCaf67"
   *           , "name": "Home"
   *           , "contact": "Simpson Family"
   *           , "street": "742 Evergreen Terrace"
   *           , "locality": "Springfield"
   *           , "region": "KY"
   *           , "country": "US"
   *           , "postal_code": "55512"
   *           , "phone": "555-123-5433"
   *           }
   *         , {
   *             "_id": "1234bCaf68"
   *           , "name": "Work"
   *           , "contact": "Springfield Nuclear Plant c/o Mr. Burns"
   *           , "street": "100 Industrial Way"
   *           , "street_b": "Sector 7G"
   *           , "locality": "Springfield"
   *           , "region": "KY"
   *           , "country": "US"
   *           , "postal_code": "55512"
   *           , "phone": "555-124-9192"
   *           }
   *         ]
   *       , "roles": {
   *           "customer": true
   *         , "setmember": false
   *         , "admin": false
   *         }
   *       , "payment_methods": [
   *           {
   *             "id": "card_19fv2Q2eZvKYlo2CXOnFdTJO"
   *           , "brand": "Visa"
   *           , "exp_month": 2
   *           , "exp_year": 2022
   *           , "last4": "9645"
   *           }
   *         , {
   *             "id": "card_234sdfk4a7fsx6642478"
   *           , "brand": "Amex"
   *           , "exp_month": 1
   *           , "exp_year": 2029
   *           , "last4": "1111"
   *           }
   *         ]
   *       }
   *     }
   *
   * @apiError Error Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues
   *
   * @apiErrorExample ExampleError:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "ExampleError"
   *     }
   */

  /**
   * @api {get} /user/:_id/read.json Read User information
   * @apiName ReadUser
   * @apiGroup User
   * @apiPermission admin, current user
   *
   * @apiParam {Number} _id User's unique identifier
   *
   * @apiSuccess {String} _id unique identifier of user
   * @apiSuccess {String} name full name of user
   * @apiSuccess {String} email email of user
   * @apiSuccess {Object} locality locality of user
   * @apiSuccess {String} locality.name name of locality (e.g. "us")
   * @apiSuccess {String} locality.long_name full name of locality (e.g. "United States")
   * @apiSuccess {String} locality.language ISO code language of locality (e.g. "en")
   * @apiSuccess {Object[]} addresses List of addresses of user.
   * @apiSuccess {String} addresses.name name of address
   * @apiSuccess {String} addresses.contact name of contact at address
   * @apiSuccess {String} addresses.street street address
   * @apiSuccess {String} addresses.street_b second line of street address
   * @apiSuccess {String} addresses.locality city/locality of address
   * @apiSuccess {String} addresses.region municipal region code (i.e. state abbreviation) of address
   * @apiSuccess {String} addresses.country country code of address
   * @apiSuccess {String} addresses.postal_code postal code of address
   * @apiSuccess {String} addresses.phone phone number of address
   * @apiSuccess {Object} roles roles of user
   * @apiSuccess {Boolean} roles.customer user is a customer
   * @apiSuccess {Boolean} roles.setmember user is a setmember
   * @apiSuccess {Boolean} roles.admin user is an admin
   * @apiSuccess {Object[]} payment_methods credit/debit cards linked to this account
   * @apiSuccess {String} payment_methods.id id of payment method
   * @apiSuccess {String} payment_methods.brand brand of payment method (e.g "Visa")
   * @apiSuccess {Number} payment_methods.exp_month expiration month of payment method (e.g 1)
   * @apiSuccess {Number} payment_methods.exp_year expiration year of payment method (e.g 2017)
   * @apiSuccess {String} payment_methods.last4 last four digits of payment method (e.g "1234")
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "_id": "1234bCad"
   *       , "name": "Homer Simpson"
   *       , "email": "homer@simpsons.org"
   *       , "locality": {
   *           "name": "us"
   *         , "long_name": "United States"
   *         , "language": "en"
   *         }
   *       , "addresses": [
   *           {
   *             "_id": "1234bCaf67"
   *           , "name": "Home"
   *           , "contact": "Simpson Family"
   *           , "street": "742 Evergreen Terrace"
   *           , "locality": "Springfield"
   *           , "region": "KY"
   *           , "country": "US"
   *           , "postal_code": "55512"
   *           , "phone": "555-123-5433"
   *           }
   *         , {
   *             "_id": "1234bCaf68"
   *           , "name": "Work"
   *           , "contact": "Springfield Nuclear Plant c/o Mr. Burns"
   *           , "street": "100 Industrial Way"
   *           , "street_b": "Sector 7G"
   *           , "locality": "Springfield"
   *           , "region": "KY"
   *           , "country": "US"
   *           , "postal_code": "55512"
   *           , "phone": "555-124-9192"
   *           }
   *         ]
   *       , "roles": {
   *           "customer": true
   *         , "setmember": false
   *         , "admin": false
   *         }
   *       , "payment_methods": [
   *           {
   *             "id": "card_19fv2Q2eZvKYlo2CXOnFdTJO"
   *           , "brand": "Visa"
   *           , "exp_month": 2
   *           , "exp_year": 2022
   *           , "last4": "9645"
   *           }
   *         , {
   *             "id": "card_234sdfk4a7fsx6642478"
   *           , "brand": "Amex"
   *           , "exp_month": 1
   *           , "exp_year": 2029
   *           , "last4": "1111"
   *           }
   *         ]
   *       }
   *     }
   *
   * @apiError NotPermitted Current user not permitted to perform operation
   *
   * @apiErrorExample NotPermitted:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "UserNotPermitted"
   *     }
   *
   * @apiError UserNotFound User was not found
   *
   * @apiErrorExample UserNotFound:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "UserNotFound"
   *     }
   *
   */

  /**
   * @api {put} /user/:_id/update.json Update User
   * @apiName UpdateUser
   * @apiGroup User
   * @apiPermission admin, current user
   *
   * @apiParam {String} name full name of user
   * @apiParam {Object} locality_name locality name of user (e.g. "us")
   * @apiParam {Object} roles roles of user (requires admin permissions)
   * @apiParam {Boolean} roles.customer user is a customer (requires admin permissions)
   * @apiParam {Boolean} roles.setmember user is a setmember (requires admin permissions)
   * @apiParam {Boolean} roles.admin user is an admin (requires admin permissions)
   *
   * @apiSuccess {String} _id unique identifier of user
   * @apiSuccess {String} name full name of user
   * @apiSuccess {String} email email of user
   * @apiSuccess {Object} locality locality of user
   * @apiSuccess {String} locality.name name of locality (e.g. "us")
   * @apiSuccess {String} locality.long_name full name of locality (e.g. "United States")
   * @apiSuccess {String} locality.language ISO code language of locality (e.g. "en")
   * @apiSuccess {Object[]} addresses List of addresses of user.
   * @apiSuccess {String} addresses._id unique _id of address
   * @apiSuccess {String} addresses.name name of address
   * @apiSuccess {String} addresses.contact name of contact at address
   * @apiSuccess {String} addresses.street street address
   * @apiSuccess {String} addresses.street_b second line of street address
   * @apiSuccess {String} addresses.locality city/locality of address
   * @apiSuccess {String} addresses.region municipal region code (i.e. state abbreviation) of address
   * @apiSuccess {String} addresses.country country code of address
   * @apiSuccess {String} addresses.postal_code postal code of address
   * @apiSuccess {String} addresses.phone phone number of address
   * @apiSuccess {Object} roles roles of user
   * @apiSuccess {Boolean} roles.customer user is a customer
   * @apiSuccess {Boolean} roles.setmember user is a setmember
   * @apiSuccess {Boolean} roles.admin user is an admin
   * @apiSuccess {Object[]} payment_methods credit/debit cards linked to this account
   * @apiSuccess {String} payment_methods.id id of payment method
   * @apiSuccess {String} payment_methods.brand brand of payment method (e.g "Visa")
   * @apiSuccess {Number} payment_methods.exp_month expiration month of payment method (e.g 1)
   * @apiSuccess {Number} payment_methods.exp_year expiration year of payment method (e.g 2017)
   * @apiSuccess {String} payment_methods.last4 last four digits of payment method (e.g "1234")
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "_id": "1234bCad"
   *       , "name": "Homer Simpson"
   *       , "email": "homer@simpsons.org"
   *       , "locality": {
   *           "name": "us"
   *         , "long_name": "United States"
   *         , "language": "en"
   *         }
   *       , "addresses": [
   *           {
   *             "_id": "1234bCaf67"
   *           , "name": "Home"
   *           , "contact": "Simpson Family"
   *           , "street": "742 Evergreen Terrace"
   *           , "locality": "Springfield"
   *           , "region": "KY"
   *           , "country": "US"
   *           , "postal_code": "55512"
   *           , "phone": "555-123-5433"
   *           }
   *         , {
   *             "_id": "1234bCaf68"
   *           , "name": "Work"
   *           , "contact": "Springfield Nuclear Plant c/o Mr. Burns"
   *           , "street": "100 Industrial Way"
   *           , "street_b": "Sector 7G"
   *           , "locality": "Springfield"
   *           , "region": "KY"
   *           , "country": "US"
   *           , "postal_code": "55512"
   *           , "phone": "555-124-9192"
   *           }
   *         ]
   *       , "roles": {
   *           "customer": true
   *         , "setmember": false
   *         , "admin": false
   *         }
   *       , "payment_methods": [
   *           {
   *             "id": "card_19fv2Q2eZvKYlo2CXOnFdTJO"
   *           , "brand": "Visa"
   *           , "exp_month": 2
   *           , "exp_year": 2022
   *           , "last4": "9645"
   *           }
   *         , {
   *             "id": "card_234sdfk4a7fsx6642478"
   *           , "brand": "Amex"
   *           , "exp_month": 1
   *           , "exp_year": 2029
   *           , "last4": "1111"
   *           }
   *         ]
   *       }
   *     }
   *
   * @apiError NotPermitted User not permitted to perform operation.
   *
   * @apiErrorExample UserNotPermitted:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "UserNotPermitted"
   *     }
   *
   * @apiError UserNotFound User was not found.
   *
   * @apiErrorExample UserNotFound:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "UserNotFound"
   *     }
   */

  /**
   * @api {post} /user/authenticate.json Authenticate As User / Login
   * @apiName AuthenticateUser
   * @apiGroup User
   * @apiPermission public
   * @apiDescription Once authenticated, user's session cookie is used to authenticate the user. API clients must use cookie-based storage for authentication.
   *
   * @apiParam {String} email User's email
   * @apiParam {String} password User's password
   *
   * @apiSuccess {String} _id unique _id of user
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "_id": "1234bCad"
   *       }
   *     }
   *
   * @apiError UserNotPermitted User not permitted to authenticate (for any reason).
   *
   * @apiErrorExample UserNotPermitted:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "UserNotPermitted"
   *     }
   *
   */

  /**
   * @api {post} /user/deauthenticate.json Deauthenticate User / Logout
   * @apiName DeauthenticateUser
   * @apiGroup User
   * @apiPermission current user
   * @apiDescription Once deauthenticated, user's session is destroyed
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "status": "OK"
   *       }
   *     }
   *
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
