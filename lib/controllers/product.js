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
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  /**
   * @api {post} /product/create.json Create Product
   * @apiName Create Product
   * @apiGroup Product
   * @apiPermission admin, current setmember user
   *
   * @apiParam {String} name name of product
   * @apiParam {LocalizationObject} label localized label (e.g. name) of product
   * @apiParam {String} label.us label (e.g. name) of product in US locality
   * @apiParam {LocalizationObject} description localized description of product
   * @apiParam {String} description.us description of product in US locality
   * @apiParam {Object} options configuration options of product (e.g. size, color)
   * @apiParam {LocalizationObject[]} options.value array of localization objects for each configuration option value (e.g. options["size"] = [{"us": "large"}, {"us": "small"}])
   * @apiParam {Object} option_labels labels for configuration options of product (e.g. localized names of size, color)
   * @apiParam {LocalizationObject} option_labels.value localization object for each configuration option value (e.g. option_labels["size"] = {"us": "size", "fr": "taille"})
   * @apiParam {String[]} categories unique _ids of categories of product
   * @apiParam {String[]} brands brands of product
   * @apiParam {String[]} vendors unique _ids of vendors of product
   *
   * @apiSuccess {String} _id unique identifier of category
   * @apiSuccess {String} name name of product
   * @apiSuccess {LocalizationObject} label localized label (e.g. name) of product
   * @apiSuccess {String} label.us label (e.g. name) of product in US locality
   * @apiSuccess {LocalizationObject} description localized description of product
   * @apiSuccess {String} description.us description of product in US locality
   * @apiSuccess {Object} options configuration options of product (e.g. size, color)
   * @apiSuccess {LocalizationObject[]} options.value array of localization objects for each configuration option value (e.g. options["size"] = [{"us": "large"}, {"us": "small"}])
   * @apiSuccess {Object} option_labels labels for configuration options of product (e.g. localized names of size, color)
   * @apiSuccess {LocalizationObject} option_labels.value localization object for each configuration option value (e.g. option_labels["size"] = {"us": "size", "fr": "taille"})
   * @apiSuccess {String[]} categories categories of product
   * @apiSuccess {String[]} brands brands of product
   * @apiSuccess {String[]} vendors vendors of product
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {

   *       }
   *     }
   *
   * @apiError NotPermitted Current user not permitted to perform operation
   *
   * @apiErrorExample NotPermitted:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "NotPermitted"
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
   * @api {post} /product/:_id/stock/create.json Create Product Stock
   * @apiName Create Product Stock
   * @apiGroup Product
   * @apiPermission admin, current setmember user
   *
   * @apiParam {String} _id unique identifier of product
   * @apiParam {String} vendor unique _id of vendor
   * @apiParam {Object} options configuration options of product (e.g. size, color)
   * @apiParam {String} options.value specific configuration option value for this stock (i.e. color = red)
   * @apiParam {Object} option_aliases vendor-specific names for options (i.e. color = shade, size = waist, etc.)
   * @apiParam {String} option_aliases.value vendor-specific alias for option (i.e. color = shade)
   * @apiParam {Number} price unit price for stock
   * @apiParam {Number} available_quantity quantity of stock units available for sale
   * @apiParam {Number} reserve_quantity quantity of stock units needed to cover pending orders
   *
   * @apiSuccess {String} _id unique identifier of stock
   * @apiParam {Object} product product of stock
   * @apiParam {Object} vendor vendor of stock
   * @apiParam {Object} options configuration options of product (e.g. size, color)
   * @apiParam {String} options.value specific configuration option value for this stock (i.e. color = red)
   * @apiParam {Object} option_aliases vendor-specific names for options (i.e. color = shade, size = waist, etc.)
   * @apiParam {String} option_aliases.value vendor-specific alias for option (i.e. color = shade)
   * @apiParam {Number} price unit price for stock
   * @apiParam {Number} available_quantity quantity of stock units available for sale
   * @apiParam {Number} reserve_quantity quantity of stock units needed to cover pending orders
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {

   *       }
   *     }
   *
   * @apiError NotPermitted Current user not permitted to perform operation
   *
   * @apiErrorExample NotPermitted:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "NotPermitted"
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
   * @api {get} /product/:_id/read.json Read Product
   * @apiName ReadProduct
   * @apiGroup Product
   * @apiPermission admin, public
   *
   */

  /**
   * @api {put} /product/:_id/update.json Update Product
   * @apiName UpdateProduct
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /product/:_id/delete.json Delete Product
   * @apiName DeleteProduct
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {get} /product/list.json List Products
   * @apiName ListProduct
   * @apiGroup Product
   * @apiPermission admin, public
   *
   */

  /**
   * @api {post} /product/:_id/media/create.json Create Product Media
   * @apiName CreateProductMedia
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {put} /product/:_id/media/:media/update.json Update Product Media
   * @apiName UpdateProductMedia
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /product/:_id/media/:media/delete.json Delete Product Media
   * @apiName DeleteProductMedia
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {post} /product/:_id/category/create.json Create Product Category
   * @apiName CreateProductCategory
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {put} /product/:_id/category/:category/update.json Update Product Category
   * @apiName UpdateProductCategory
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /product/:_id/category/:category/delete.json Delete Product Category
   * @apiName DeleteProductCategory
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {post} /product/:_id/brand/create.json Create Product Brand
   * @apiName CreateProductBrand
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {put} /product/:_id/brand/:brand/update.json Update Product Brand
   * @apiName UpdateProductBrand
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /product/:_id/brand/:brand/delete.json Delete Product Brand
   * @apiName DeleteProductBrand
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {post} /product/:_id/vendor/create.json Create Product Vendor
   * @apiName CreateProductVendor
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {put} /product/:_id/vendor/:vendor/update.json Update Product Vendor
   * @apiName UpdateProductVendor
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /product/:_id/vendor/:vendor/delete.json Delete Product Vendor
   * @apiName DeleteProductVendor
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {put} /product/:_id/stock/:stock/update.json Update Product Stock
   * @apiName UpdateProductStock
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /product/:_id/stock/:stock/delete.json Delete Product Stock
   * @apiName DeleteProductStock
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {get} /product/availability/read.json Get Product Availability for Options
   * @apiName GetProductAvailability
   * @apiGroup Product
   * @apiPermission public
   *
   */

  /**
   * @api {post} /product/:_id/option/:option/create.json Create Product Option Value
   * @apiName CreateProductOptionValue
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /product/:_id/option/:option/value/:value/delete.json Delete Product Option Value
   * @apiName DeleteProductOptionValue
   * @apiGroup Product
   * @apiPermission admin
   *
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
