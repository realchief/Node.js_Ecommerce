define({ "api": [
  {
    "type": "post",
    "url": "/cart/create.json",
    "title": "Create Cart",
    "name": "CreateCart",
    "group": "Cart",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "post",
    "url": "/cart/:_id/product/create.json",
    "title": "Add Product to Cart",
    "name": "CreateCartProduct",
    "group": "Cart",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "post",
    "url": "/cart/product/create.json",
    "title": "Add Product to Current Session's Cart",
    "name": "CreateCurrentCartProduct",
    "group": "Cart",
    "permission": [
      {
        "name": "current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "delete",
    "url": "/cart/:_id/delete.json",
    "title": "Delete Cart",
    "name": "DeleteCart",
    "group": "Cart",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "delete",
    "url": "/cart/:_id/product/:_id/delete.json",
    "title": "Delete Product in Cart",
    "name": "DeleteCartProduct",
    "group": "Cart",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "delete",
    "url": "/cart/delete.json",
    "title": "Delete Current Session's Cart",
    "name": "DeleteCurrentCart",
    "group": "Cart",
    "permission": [
      {
        "name": "current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "delete",
    "url": "/cart/product/:_id/delete.json",
    "title": "Delete Product in Current Session's Cart",
    "name": "DeleteCurrentCartProduct",
    "group": "Cart",
    "permission": [
      {
        "name": "current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "get",
    "url": "/cart/list.json",
    "title": "List Carts",
    "name": "ListCart",
    "group": "Cart",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "get",
    "url": "/cart/:_id/read.json",
    "title": "Read Cart",
    "name": "ReadCart",
    "group": "Cart",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "get",
    "url": "/cart/read.json",
    "title": "Read Current Session's Cart",
    "name": "ReadCurrentCart",
    "group": "Cart",
    "permission": [
      {
        "name": "current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "put",
    "url": "/cart/:_id/update.json",
    "title": "Update Cart",
    "name": "UpdateCart",
    "group": "Cart",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "put",
    "url": "/cart/:_id/product/:_id/update.json",
    "title": "Update Product in Cart",
    "name": "UpdateCartProduct",
    "group": "Cart",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "put",
    "url": "/cart/update.json",
    "title": "Update Current Session's Cart",
    "name": "UpdateCurrentCart",
    "group": "Cart",
    "permission": [
      {
        "name": "current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "put",
    "url": "/cart/product/:_id/update.json",
    "title": "Update Product in Current Session's Cart",
    "name": "UpdateCurrentCartProduct",
    "group": "Cart",
    "permission": [
      {
        "name": "current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/cart.js",
    "groupTitle": "Cart"
  },
  {
    "type": "post",
    "url": "/category/create.json",
    "title": "Create Category",
    "name": "Create_Category",
    "group": "Category",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>name of category</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of category</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of category in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "parent_category",
            "description": "<p>unique _id of parent category for category</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of category</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of category</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of category</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of category in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "parent_category",
            "description": "<p>parent category of category (if applicable)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "created_at",
            "description": "<p>epoch timestamp of when user was created</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "updated_at",
            "description": "<p>epoch timestamp of when user account was last updated</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Polos\"\n  , \"label\": {\n      \"us\": \"Polos\"\n    }\n  , \"parent_category\": {\n      \"_id\": \"24fjm49m\"\n    , \"name\": \"Shirts\"\n    , \"label\": {\n        \"us\": \"Shirts\"\n      }\n    }\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/category.js",
    "groupTitle": "Category"
  },
  {
    "type": "delete",
    "url": "/category/:_id/delete.json",
    "title": "Delete Category",
    "name": "DeleteCategory",
    "group": "Category",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of category</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/category.js",
    "groupTitle": "Category"
  },
  {
    "type": "get",
    "url": "/category/list.json",
    "title": "List Categories",
    "name": "ListCategory",
    "group": "Category",
    "permission": [
      {
        "name": "public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "query",
            "description": "<p>query criteria of setmembers</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "skip",
            "description": "<p>skip to this record number</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "limit",
            "description": "<p>limit to this number of records returned</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "sort",
            "description": "<p>sort criteria of setmembers</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/category.js",
    "groupTitle": "Category"
  },
  {
    "type": "get",
    "url": "/category/:_id/read.json",
    "title": "Read Category",
    "name": "ReadCategory",
    "group": "Category",
    "permission": [
      {
        "name": "public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of category</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/category.js",
    "groupTitle": "Category"
  },
  {
    "type": "put",
    "url": "/category/:_id/update.json",
    "title": "Update Category",
    "name": "UpdateCategory",
    "group": "Category",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of category</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of category</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of category</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of category in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "parent_category",
            "description": "<p>parent category of category (if applicable)</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/category.js",
    "groupTitle": "Category"
  },
  {
    "type": "post",
    "url": "/locality/create.json",
    "title": "Create Locality",
    "name": "Create_Locality",
    "group": "Locality",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>name of locality</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "long_name",
            "description": "<p>full name of locality</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "language",
            "description": "<p>ISO code for language in locality</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of category</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>name of locality</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "long_name",
            "description": "<p>full name of locality</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "language",
            "description": "<p>ISO code for language in locality</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "created_at",
            "description": "<p>epoch timestamp of when user was created</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "updated_at",
            "description": "<p>epoch timestamp of when user account was last updated</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"us\"\n  , \"long_name\": \"United States\"\n  , \"language\": \"en\"\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/locality.js",
    "groupTitle": "Locality"
  },
  {
    "type": "delete",
    "url": "/locality/:_id/delete.json",
    "title": "Delete Locality",
    "name": "DeleteLocality",
    "group": "Locality",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of category</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/locality.js",
    "groupTitle": "Locality"
  },
  {
    "type": "get",
    "url": "/locality/list.json",
    "title": "List Localities",
    "name": "ListLocality",
    "group": "Locality",
    "permission": [
      {
        "name": "public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "query",
            "description": "<p>query criteria of vendors</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "skip",
            "description": "<p>skip to this record number</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "limit",
            "description": "<p>limit to this number of records returned</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "sort",
            "description": "<p>sort criteria of vendors</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/locality.js",
    "groupTitle": "Locality"
  },
  {
    "type": "get",
    "url": "/locality/:_id/read.json",
    "title": "Read Locality",
    "name": "ReadLocality",
    "group": "Locality",
    "permission": [
      {
        "name": "public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of category</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/locality.js",
    "groupTitle": "Locality"
  },
  {
    "type": "put",
    "url": "/locality/:_id/update.json",
    "title": "Update Locality",
    "name": "UpdateLocality",
    "group": "Locality",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of category</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>name of locality</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "long_name",
            "description": "<p>full name of locality</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "language",
            "description": "<p>ISO code for language in locality</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/locality.js",
    "groupTitle": "Locality"
  },
  {
    "type": "get",
    "url": "/media/count.json",
    "title": "Count Media",
    "name": "CountMedia",
    "group": "Media",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/media.js",
    "groupTitle": "Media"
  },
  {
    "type": "post",
    "url": "/media/create.json",
    "title": "Create Media",
    "name": "Create_Media",
    "group": "Media",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "defaultValue": "multipart/form-data",
            "description": "<p>content type of request</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/media.js",
    "groupTitle": "Media"
  },
  {
    "type": "delete",
    "url": "/media/:_id/delete.json",
    "title": "Delete Media",
    "name": "DeleteMedia",
    "group": "Media",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/media.js",
    "groupTitle": "Media"
  },
  {
    "type": "get",
    "url": "/media/list.json",
    "title": "List Media",
    "name": "ListMedia",
    "group": "Media",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/media.js",
    "groupTitle": "Media"
  },
  {
    "type": "get",
    "url": "/media/:_id/read.json",
    "title": "Read Media",
    "name": "ReadMedia",
    "group": "Media",
    "permission": [
      {
        "name": "public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/media.js",
    "groupTitle": "Media"
  },
  {
    "type": "put",
    "url": "/media/:_id/update.json",
    "title": "Update Media",
    "name": "UpdateMedia",
    "group": "Media",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/media.js",
    "groupTitle": "Media"
  },
  {
    "type": "post",
    "url": "/order/:_id/cancel.json",
    "title": "Cancel and Refund Order",
    "name": "CancelOrder",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "delete",
    "url": "/order/:_id/transaction/:transaction/cancel.json",
    "title": "Cancel / Refund Transaction from Order",
    "name": "CancelOrderTransaction",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "post",
    "url": "/order/create.json",
    "title": "Create Order",
    "name": "CreateOrder",
    "group": "Order",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "post",
    "url": "/order/:_id/line_item/create.json",
    "title": "Add Line Item to Order",
    "name": "CreateOrderLineItem",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "post",
    "url": "/order/:_id/message/create.json",
    "title": "Add Message to Order",
    "name": "CreateOrderMessage",
    "group": "Order",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "post",
    "url": "/order/:_id/product/create.json",
    "title": "Add Product to Order",
    "name": "CreateOrderProduct",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "post",
    "url": "/order/:_id/shipment/create.json",
    "title": "Add Shipment to Order",
    "name": "CreateOrderShipment",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "post",
    "url": "/order/:_id/transaction/create.json",
    "title": "Create Transaction for Order",
    "name": "CreateOrderTransaction",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "delete",
    "url": "/order/:_id/delete.json",
    "title": "Delete Order",
    "name": "DeleteOrder",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "delete",
    "url": "/order/:_id/line_item/:line_item/delete.json",
    "title": "Delete Line Item from Order",
    "name": "DeleteOrderLineItem",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "delete",
    "url": "/order/:_id/message/:message/delete.json",
    "title": "Delete Message from Order",
    "name": "DeleteOrderMessage",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "delete",
    "url": "/order/:_id/product/:product/delete.json",
    "title": "Delete Product from Order",
    "name": "DeleteOrderProduct",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "delete",
    "url": "/order/:_id/shipment/:shipment/delete.json",
    "title": "Delete Shipment from Order",
    "name": "DeleteOrderShipment",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "get",
    "url": "/order/list.json",
    "title": "List Orders",
    "name": "ListOrder",
    "group": "Order",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "get",
    "url": "/order/:_id/read.json",
    "title": "Read Order",
    "name": "ReadOrder",
    "group": "Order",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "put",
    "url": "/order/:_id/update.json",
    "title": "Update Order",
    "name": "UpdateOrder",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "put",
    "url": "/order/:_id/line_item/:line_item/update.json",
    "title": "Update Line Item in Order",
    "name": "UpdateOrderLineItem",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "put",
    "url": "/order/:_id/message/:message/update.json",
    "title": "Update Message in Order",
    "name": "UpdateOrderMessage",
    "group": "Order",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "put",
    "url": "/order/:_id/product/:product/update.json",
    "title": "Update Product in Order",
    "name": "UpdateOrderProduct",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "put",
    "url": "/order/:_id/shipment/:shipment/update.json",
    "title": "Update Shipment in Order",
    "name": "UpdateOrderShipment",
    "group": "Order",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/order.js",
    "groupTitle": "Order"
  },
  {
    "type": "get",
    "url": "/product/count.json",
    "title": "Count Products",
    "name": "CountProduct",
    "group": "Product",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "post",
    "url": "/product/:_id/media/create.json",
    "title": "Create Product Media",
    "name": "CreateProductMedia",
    "group": "Product",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "post",
    "url": "/product/create.json",
    "title": "Create Product",
    "name": "Create_Product",
    "group": "Product",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "post",
    "url": "/product/:_id/stock/create.json",
    "title": "Create Product Stock",
    "name": "Create_Product_Stock",
    "group": "Product",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "delete",
    "url": "/product/:_id/delete.json",
    "title": "Delete Product",
    "name": "DeleteProduct",
    "group": "Product",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "delete",
    "url": "/product/:_id/media/:media/delete.json",
    "title": "Delete Product Media",
    "name": "DeleteProductMedia",
    "group": "Product",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "delete",
    "url": "/product/:_id/stock/:stock/delete.json",
    "title": "Delete Product Stock",
    "name": "DeleteProductStock",
    "group": "Product",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "get",
    "url": "/product/availability/read.json",
    "title": "Get Product Availability for Options",
    "name": "GetProductAvailability",
    "group": "Product",
    "permission": [
      {
        "name": "public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "get",
    "url": "/product/list.json",
    "title": "List Products",
    "name": "ListProduct",
    "group": "Product",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "get",
    "url": "/product/:_id/read.json",
    "title": "Read Product",
    "name": "ReadProduct",
    "group": "Product",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "put",
    "url": "/product/:_id/update.json",
    "title": "Update Product",
    "name": "UpdateProduct",
    "group": "Product",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "put",
    "url": "/product/:_id/media/:media/update.json",
    "title": "Update Product Media",
    "name": "UpdateProductMedia",
    "group": "Product",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "put",
    "url": "/product/:_id/stock/:stock/update.json",
    "title": "Update Product Stock",
    "name": "UpdateProductStock",
    "group": "Product",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/product.js",
    "groupTitle": "Product"
  },
  {
    "type": "get",
    "url": "/set/count.json",
    "title": "Count Set",
    "name": "CountSet",
    "group": "Set",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/set.js",
    "groupTitle": "Set"
  },
  {
    "type": "post",
    "url": "/set/create.json",
    "title": "Create Set",
    "name": "CreateSet",
    "group": "Set",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/set.js",
    "groupTitle": "Set"
  },
  {
    "type": "delete",
    "url": "/set/:_id/delete.json",
    "title": "Delete Set",
    "name": "DeleteSet",
    "group": "Set",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/set.js",
    "groupTitle": "Set"
  },
  {
    "type": "get",
    "url": "/set/list.json",
    "title": "List Sets",
    "name": "ListSet",
    "group": "Set",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/set.js",
    "groupTitle": "Set"
  },
  {
    "type": "get",
    "url": "/set/:_id/read.json",
    "title": "Read Set",
    "name": "ReadSet",
    "group": "Set",
    "permission": [
      {
        "name": "public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/set.js",
    "groupTitle": "Set"
  },
  {
    "type": "put",
    "url": "/set/:_id/update.json",
    "title": "Update Set",
    "name": "UpdateSet",
    "group": "Set",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/set.js",
    "groupTitle": "Set"
  },
  {
    "type": "post",
    "url": "/setmember/:_id/user/create.json",
    "title": "Create Setmember User",
    "name": "CreateSetmemberUser",
    "group": "Setmember",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>unique _id of user</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/setmember.js",
    "groupTitle": "Setmember"
  },
  {
    "type": "post",
    "url": "/setmember/create.json",
    "title": "Create Setmember",
    "name": "Create_Setmember",
    "group": "Setmember",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of setmember in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "description",
            "description": "<p>localized description of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "description.us",
            "description": "<p>description of setmember in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "identities",
            "description": "<p>social media accounts for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.facebook",
            "description": "<p>Facebook account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.twitter",
            "description": "<p>Twitter account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.instagram",
            "description": "<p>Instagram account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.youtube",
            "description": "<p>Youtube account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.snapchat",
            "description": "<p>Snapchat account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.pinterest",
            "description": "<p>Pinterest account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "users",
            "description": "<p>unique _ids of user accounts for setmember</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of setmember in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "description",
            "description": "<p>localized description of setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "description.us",
            "description": "<p>description of setmember in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "identities",
            "description": "<p>social media accounts for setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "identities.facebook",
            "description": "<p>Facebook account for setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "identities.twitter",
            "description": "<p>Twitter account for setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "identities.instagram",
            "description": "<p>Instagram account for setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "identities.youtube",
            "description": "<p>Youtube account for setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "identities.snapchat",
            "description": "<p>Snapchat account for setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "identities.pinterest",
            "description": "<p>Pinterest account for setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "users",
            "description": "<p>unique _ids of user accounts for setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "created_at",
            "description": "<p>epoch timestamp of when setmember was created</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "updated_at",
            "description": "<p>epoch timestamp of when setmember account was last updated</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Krusty the Clown\"\n  , \"label\": {\n      \"us\": \"Krusty the Clown\"\n    }\n  , \"description\": {\n      \"us\": \"Krusty is one of the world's leading influencers, thinkers, and cultural icons\"\n    }\n  , \"identities\": {\n      \"facebook\": \"krusty\"\n    , \"twitter\": \"krustyclown\"\n    , \"instagram\": \"krusty\"\n    , \"youtube\": \"krustyTV\"\n    , \"snapchat\": \"krusty\"\n    , \"pinterest\": \"krustylu\"\n    }\n  , \"users\": [\n      \"aFd234bCad\"\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/setmember.js",
    "groupTitle": "Setmember"
  },
  {
    "type": "delete",
    "url": "/setmember/:_id/delete.json",
    "title": "Delete Setmember",
    "name": "DeleteSetmember",
    "group": "Setmember",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of setmember</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/setmember.js",
    "groupTitle": "Setmember"
  },
  {
    "type": "delete",
    "url": "/setmember/:_id/user/:user/delete.json",
    "title": "Delete Setmember User",
    "name": "DeleteSetmemberUser",
    "group": "Setmember",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>unique _id of user</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/setmember.js",
    "groupTitle": "Setmember"
  },
  {
    "type": "get",
    "url": "/setmember/list.json",
    "title": "List Setmembers",
    "name": "ListSetmember",
    "group": "Setmember",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "query",
            "description": "<p>query criteria of setmembers</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "skip",
            "description": "<p>skip to this record number</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "limit",
            "description": "<p>limit to this number of records returned</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "sort",
            "description": "<p>sort criteria of setmembers</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/setmember.js",
    "groupTitle": "Setmember"
  },
  {
    "type": "get",
    "url": "/setmember/:_id/read.json",
    "title": "Read Setmember",
    "name": "ReadSetmember",
    "group": "Setmember",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of setmember</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/setmember.js",
    "groupTitle": "Setmember"
  },
  {
    "type": "put",
    "url": "/setmember/:_id/update.json",
    "title": "Update Setmember",
    "name": "UpdateSetmember",
    "group": "Setmember",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of setmember in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "description",
            "description": "<p>localized description of setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "description.us",
            "description": "<p>description of setmember in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "identities",
            "description": "<p>social media accounts for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.facebook",
            "description": "<p>Facebook account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.twitter",
            "description": "<p>Twitter account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.instagram",
            "description": "<p>Instagram account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.youtube",
            "description": "<p>Youtube account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.snapchat",
            "description": "<p>Snapchat account for setmember</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "identities.pinterest",
            "description": "<p>Pinterest account for setmember</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/setmember.js",
    "groupTitle": "Setmember"
  },
  {
    "type": "post",
    "url": "/user/authenticate.json",
    "title": "Authenticate As User / Login",
    "name": "AuthenticateUser",
    "group": "User",
    "permission": [
      {
        "name": "public"
      }
    ],
    "description": "<p>Once authenticated, user's session cookie is used to authenticate the user. API clients must use cookie-based storage for authentication.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>User's email</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>User's password</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique _id of user</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>User not permitted to authenticate (for any reason).</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/create.json",
    "title": "Create User",
    "name": "CreateUser",
    "group": "User",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>password of user (optional)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "locality_name",
            "description": "<p>locality name of user (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user (requires admin permissions)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer (requires admin permissions)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember (requires admin permissions)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin (requires admin permissions)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "payment_method_tokens",
            "description": "<p>credit/debit card tokens for this account</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses._id",
            "description": "<p>unique _id of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "payment_methods",
            "description": "<p>credit/debit cards linked to this account</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.id",
            "description": "<p>id of payment method</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.brand",
            "description": "<p>brand of payment method (e.g &quot;Visa&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_month",
            "description": "<p>expiration month of payment method (e.g 1)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_year",
            "description": "<p>expiration year of payment method (e.g 2017)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.last4",
            "description": "<p>last four digits of payment method (e.g &quot;1234&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "created_at",
            "description": "<p>epoch timestamp of when user was created</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "updated_at",
            "description": "<p>epoch timestamp of when user account was last updated</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/:_id/address/create.json",
    "title": "Add address for user",
    "name": "CreateUserAddress",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "phone",
            "description": "<p>phone number of address</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "payment_methods",
            "description": "<p>credit/debit cards linked to this account</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.id",
            "description": "<p>id of payment method</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.brand",
            "description": "<p>brand of payment method (e.g &quot;Visa&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_month",
            "description": "<p>expiration month of payment method (e.g 1)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_year",
            "description": "<p>expiration year of payment method (e.g 2017)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.last4",
            "description": "<p>last four digits of payment method (e.g &quot;1234&quot;)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/:_id/payment_method/create.json",
    "title": "Add payment method for user",
    "name": "CreateUserPaymentMethod",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "payment_token",
            "description": "<p>Token identifying payment method</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses._id",
            "description": "<p>unique _id of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "payment_methods",
            "description": "<p>credit/debit cards linked to this account</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.id",
            "description": "<p>id of payment method</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.brand",
            "description": "<p>brand of payment method (e.g &quot;Visa&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_month",
            "description": "<p>expiration month of payment method (e.g 1)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_year",
            "description": "<p>expiration year of payment method (e.g 2017)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.last4",
            "description": "<p>last four digits of payment method (e.g &quot;1234&quot;)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/deauthenticate.json",
    "title": "Deauthenticate User / Logout",
    "name": "DeauthenticateUser",
    "group": "User",
    "permission": [
      {
        "name": "current user"
      }
    ],
    "description": "<p>Once deauthenticated, user's session is destroyed</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"status\": \"OK\"\n  }\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "delete",
    "url": "/user/:_id/delete.json",
    "title": "Delete User",
    "name": "DeleteUser",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>User not permitted to perform operation.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "delete",
    "url": "/user/:_id/address/:address_id/delete.json",
    "title": "Delete address for user",
    "name": "DeleteUserAddress",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "address_id",
            "description": "<p>unique identifier of address</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "payment_methods",
            "description": "<p>credit/debit cards linked to this account</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.id",
            "description": "<p>id of payment method</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.brand",
            "description": "<p>brand of payment method (e.g &quot;Visa&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_month",
            "description": "<p>expiration month of payment method (e.g 1)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_year",
            "description": "<p>expiration year of payment method (e.g 2017)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.last4",
            "description": "<p>last four digits of payment method (e.g &quot;1234&quot;)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "delete",
    "url": "/user/:_id/address/:address_id/delete.json",
    "title": "Delete address for user",
    "name": "DeleteUserAddress",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "address_id",
            "description": "<p>unique identifier of address</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "payment_methods",
            "description": "<p>credit/debit cards linked to this account</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.id",
            "description": "<p>id of payment method</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.brand",
            "description": "<p>brand of payment method (e.g &quot;Visa&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_month",
            "description": "<p>expiration month of payment method (e.g 1)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_year",
            "description": "<p>expiration year of payment method (e.g 2017)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.last4",
            "description": "<p>last four digits of payment method (e.g &quot;1234&quot;)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "delete",
    "url": "/user/:_id/payment_method/:payment_method_id/delete.json",
    "title": "Delete payment method for user",
    "name": "DeleteUserPaymentMethod",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "payment_method_id",
            "description": "<p>unique identifier of payment method</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses._id",
            "description": "<p>unique _id of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "payment_methods",
            "description": "<p>credit/debit cards linked to this account</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.id",
            "description": "<p>id of payment method</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.brand",
            "description": "<p>brand of payment method (e.g &quot;Visa&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_month",
            "description": "<p>expiration month of payment method (e.g 1)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_year",
            "description": "<p>expiration year of payment method (e.g 2017)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.last4",
            "description": "<p>last four digits of payment method (e.g &quot;1234&quot;)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/list.json",
    "title": "List Users",
    "name": "ListUser",
    "group": "User",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "query",
            "description": "<p>Mongodb-style search criteria</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "skip",
            "description": "<p>Skip this many records</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit records returned to this</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "sort",
            "description": "<p>Mongodb-style sort criteria</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "users",
            "description": "<p>User records returned from search</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "users.locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "users.addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses._id",
            "description": "<p>unique _id of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "users.roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "users.roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "users.roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "users.roles.admin",
            "description": "<p>user is an admin</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":\n    \"users\": [\n      {\n        \"_id\": \"1234bCad\"\n      , \"name\": \"Homer Simpson\"\n      , \"email\": \"homer@simpsons.org\"\n      , \"locality\": {\n          \"name\": \"us\"\n        , \"long_name\": \"United States\"\n        , \"language\": \"en\"\n        }\n      , \"addresses\": [\n          {\n            \"_id\": \"1234bCaf67\"\n          , \"name\": \"Home\"\n          , \"contact\": \"Simpson Family\"\n          , \"street\": \"742 Evergreen Terrace\"\n          , \"locality\": \"Springfield\"\n          , \"region\": \"KY\"\n          , \"country\": \"US\"\n          , \"postal_code\": \"55512\"\n          , \"phone\": \"555-123-5433\"\n          }\n        , {\n            \"_id\": \"1234bCaf68\"\n          , \"name\": \"Work\"\n          , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n          , \"street\": \"100 Industrial Way\"\n          , \"street_b\": \"Sector 7G\"\n          , \"locality\": \"Springfield\"\n          , \"region\": \"KY\"\n          , \"country\": \"US\"\n          , \"postal_code\": \"55512\"\n          , \"phone\": \"555-124-9192\"\n          }\n        ]\n      , \"roles\": {\n          \"customer\": true\n        , \"setmember\": false\n        , \"admin\": false\n        }\n      }\n    , {\n        \"_id\": \"1234bCad\"\n      , \"name\": \"Homer Simpson\"\n      , \"email\": \"homer@simpsons.org\"\n      , \"locality\": {\n          \"name\": \"us\"\n        , \"long_name\": \"United States\"\n        , \"language\": \"en\"\n        }\n      , \"addresses\": [\n          {\n            \"_id\": \"1234bCaf67\"\n          , \"name\": \"Home\"\n          , \"contact\": \"Simpson Family\"\n          , \"street\": \"742 Evergreen Terrace\"\n          , \"locality\": \"Springfield\"\n          , \"region\": \"KY\"\n          , \"country\": \"US\"\n          , \"postal_code\": \"55512\"\n          , \"phone\": \"555-123-5433\"\n          }\n        , {\n            \"_id\": \"1234bCaf68\"\n          , \"name\": \"Work\"\n          , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n          , \"street\": \"100 Industrial Way\"\n          , \"street_b\": \"Sector 7G\"\n          , \"locality\": \"Springfield\"\n          , \"region\": \"KY\"\n          , \"country\": \"US\"\n          , \"postal_code\": \"55512\"\n          , \"phone\": \"555-124-9192\"\n          }\n        ]\n      , \"roles\": {\n          \"customer\": true\n        , \"setmember\": false\n        , \"admin\": false\n        }\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/:_id/read.json",
    "title": "Read User information",
    "name": "ReadUser",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses._id",
            "description": "<p>unique _id of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "payment_methods",
            "description": "<p>credit/debit cards linked to this account</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.id",
            "description": "<p>id of payment method</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.brand",
            "description": "<p>brand of payment method (e.g &quot;Visa&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_month",
            "description": "<p>expiration month of payment method (e.g 1)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_year",
            "description": "<p>expiration year of payment method (e.g 2017)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.last4",
            "description": "<p>last four digits of payment method (e.g &quot;1234&quot;)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/:_id/orders/read.json",
    "title": "Get orders for user",
    "name": "ReadUserOrders",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/:_id/email/update/request.json",
    "title": "Send email update request to user",
    "name": "RequestUserEmailUpdate",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"status\": \"OK\"\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/:_id/password/update/request.json",
    "title": "Send password update request to user",
    "name": "RequestUserPasswordUpdate",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"status\": \"OK\"\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "put",
    "url": "/user/:_id/update.json",
    "title": "Update User",
    "name": "UpdateUser",
    "group": "User",
    "permission": [
      {
        "name": "admin, current user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "locality_name",
            "description": "<p>locality name of user (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user (requires admin permissions)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer (requires admin permissions)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember (requires admin permissions)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin (requires admin permissions)</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>full name of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>email of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "locality",
            "description": "<p>locality of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.name",
            "description": "<p>name of locality (e.g. &quot;us&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.long_name",
            "description": "<p>full name of locality (e.g. &quot;United States&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "locality.language",
            "description": "<p>ISO code language of locality (e.g. &quot;en&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "addresses",
            "description": "<p>List of addresses of user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses._id",
            "description": "<p>unique _id of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.name",
            "description": "<p>name of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.contact",
            "description": "<p>name of contact at address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street",
            "description": "<p>street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.street_b",
            "description": "<p>second line of street address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.locality",
            "description": "<p>city/locality of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.region",
            "description": "<p>municipal region code (i.e. state abbreviation) of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.country",
            "description": "<p>country code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.postal_code",
            "description": "<p>postal code of address</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "addresses.phone",
            "description": "<p>phone number of address</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roles",
            "description": "<p>roles of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.customer",
            "description": "<p>user is a customer</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.setmember",
            "description": "<p>user is a setmember</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "roles.admin",
            "description": "<p>user is an admin</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "payment_methods",
            "description": "<p>credit/debit cards linked to this account</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.id",
            "description": "<p>id of payment method</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.brand",
            "description": "<p>brand of payment method (e.g &quot;Visa&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_month",
            "description": "<p>expiration month of payment method (e.g 1)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "payment_methods.exp_year",
            "description": "<p>expiration year of payment method (e.g 2017)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "payment_methods.last4",
            "description": "<p>last four digits of payment method (e.g &quot;1234&quot;)</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "created_at",
            "description": "<p>epoch timestamp of when user was created</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "updated_at",
            "description": "<p>epoch timestamp of when user account was last updated</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Homer Simpson\"\n  , \"email\": \"homer@simpsons.org\"\n  , \"locality\": {\n      \"name\": \"us\"\n    , \"long_name\": \"United States\"\n    , \"language\": \"en\"\n    }\n  , \"addresses\": [\n      {\n        \"_id\": \"1234bCaf67\"\n      , \"name\": \"Home\"\n      , \"contact\": \"Simpson Family\"\n      , \"street\": \"742 Evergreen Terrace\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-123-5433\"\n      }\n    , {\n        \"_id\": \"1234bCaf68\"\n      , \"name\": \"Work\"\n      , \"contact\": \"Springfield Nuclear Plant c/o Mr. Burns\"\n      , \"street\": \"100 Industrial Way\"\n      , \"street_b\": \"Sector 7G\"\n      , \"locality\": \"Springfield\"\n      , \"region\": \"KY\"\n      , \"country\": \"US\"\n      , \"postal_code\": \"55512\"\n      , \"phone\": \"555-124-9192\"\n      }\n    ]\n  , \"roles\": {\n      \"customer\": true\n    , \"setmember\": false\n    , \"admin\": false\n    }\n  , \"payment_methods\": [\n      {\n        \"id\": \"card_19fv2Q2eZvKYlo2CXOnFdTJO\"\n      , \"brand\": \"Visa\"\n      , \"exp_month\": 2\n      , \"exp_year\": 2022\n      , \"last4\": \"9645\"\n      }\n    , {\n        \"id\": \"card_234sdfk4a7fsx6642478\"\n      , \"brand\": \"Amex\"\n      , \"exp_month\": 1\n      , \"exp_year\": 2029\n      , \"last4\": \"1111\"\n      }\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>User not permitted to perform operation.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/:_id/email/update.json",
    "title": "Update user email",
    "name": "UserEmailUpdate",
    "group": "User",
    "permission": [
      {
        "name": "public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>New email address for user</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "secret",
            "description": "<p>Secret token used to validate update (token is received when update request is sent)</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"status\": \"OK\"\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation (or other validation issues)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/:_id/password/update.json",
    "title": "Update user password",
    "name": "UserPasswordUpdate",
    "group": "User",
    "permission": [
      {
        "name": "public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>New password for user</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "secret",
            "description": "<p>Secret token used to validate update (token is received when update request is sent)</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"status\": \"OK\"\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation (or other validation issues)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/vendor/create.json",
    "title": "Create Vendor",
    "name": "CreateVendor",
    "group": "Vendor",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of vendor in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "description",
            "description": "<p>localized description of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "description.us",
            "description": "<p>description of vendor in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "shipping_description",
            "description": "<p>localized description of vendor's shipping policies</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "shipping_description.us",
            "description": "<p>description of vendor's shipping policies in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "returns_description",
            "description": "<p>localized description of vendor's returns policies</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "returns_description.us",
            "description": "<p>description of vendor's returns policies in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "setmembers",
            "description": "<p>unique _ids of setmembers connected to this brand</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of vendor in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "description",
            "description": "<p>localized description of vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "description.us",
            "description": "<p>description of vendor in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "shipping_description",
            "description": "<p>localized description of vendor's shipping policies</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "shipping_description.us",
            "description": "<p>description of vendor's shipping policies in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "returns_description",
            "description": "<p>localized description of vendor's returns policies</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "setmembers",
            "description": "<p>setmembers connected to this brand</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "created_at",
            "description": "<p>epoch timestamp of when user was created</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "updated_at",
            "description": "<p>epoch timestamp of when user account was last updated</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Acme\"\n  , \"label\": {\n      \"us\": \"Acme Products\"\n    }\n  , \"description\": {\n      \"us\": \"Creators of fine and non-generic products\"\n    }\n  , \"shipping_description\": {\n      \"us\": \"Free two-day shipping\"\n    }\n  , \"returns_description\": {\n      \"us\": \"Return for any reason with 30-days\"\n    }\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NotPermitted",
            "description": "<p>Current user not permitted to perform operation</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotPermitted:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"NotPermitted\"\n}",
          "type": "json"
        },
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  },
  {
    "type": "post",
    "url": "/vendor/:_id/setmember/create.json",
    "title": "Create Vendor Setmember",
    "name": "CreateVendorSetmember",
    "group": "Vendor",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "setmember",
            "description": "<p>unique _id of setmember</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  },
  {
    "type": "delete",
    "url": "/vendor/:_id/delete.json",
    "title": "Delete Vendor",
    "name": "DeleteVendor",
    "group": "Vendor",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of vendor</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  },
  {
    "type": "delete",
    "url": "/vendor/:_id/setmember/:setmember/delete.json",
    "title": "Delete Vendor Setmember",
    "name": "DeleteVendorSetmember",
    "group": "Vendor",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "setmember",
            "description": "<p>unique _id of setmember</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  },
  {
    "type": "get",
    "url": "/vendor/list.json",
    "title": "List Vendors",
    "name": "ListVendors",
    "group": "Vendor",
    "permission": [
      {
        "name": "public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "query",
            "description": "<p>query criteria of vendors</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "skip",
            "description": "<p>skip to this record number</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "limit",
            "description": "<p>limit to this number of records returned</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "sort",
            "description": "<p>sort criteria of vendors</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  },
  {
    "type": "get",
    "url": "/vendor/:_id/read.json",
    "title": "Read Vendor",
    "name": "ReadVendor",
    "group": "Vendor",
    "permission": [
      {
        "name": "public"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of vendor</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of vendor in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "description",
            "description": "<p>localized description of vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "description.us",
            "description": "<p>description of vendor in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "shipping_description",
            "description": "<p>localized description of vendor's shipping policies</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "shipping_description.us",
            "description": "<p>description of vendor's shipping policies in US locality</p>"
          },
          {
            "group": "Success 200",
            "type": "LocalizationObject",
            "optional": false,
            "field": "returns_description",
            "description": "<p>localized description of vendor's returns policies</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "setmembers",
            "description": "<p>setmembers connected to this vendor</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "created_at",
            "description": "<p>epoch timestamp of when user was created</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "updated_at",
            "description": "<p>epoch timestamp of when user account was last updated</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"data\":   {\n    \"_id\": \"1234bCad\"\n  , \"name\": \"Acme\"\n  , \"label\": {\n      \"us\": \"Acme Products\"\n    }\n  , \"description\": {\n      \"us\": \"Creators of fine and non-generic products\"\n    }\n  , \"shipping_description\": {\n      \"us\": \"Free two-day shipping\"\n    }\n  , \"returns_description\": {\n      \"us\": \"Return for any reason with 30-days\"\n    }\n  , \"setmembers\": [\n    ]\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Error",
            "description": "<p>Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "ExampleError:",
          "content": "HTTP/1.1 200 OK\n{\n  \"error\": \"ExampleError\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  },
  {
    "type": "put",
    "url": "/vendor/:_id/update.json",
    "title": "Update Vendor",
    "name": "UpdateVendor",
    "group": "Vendor",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of vendor in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "description",
            "description": "<p>localized description of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "description.us",
            "description": "<p>description of vendor in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "shipping_description",
            "description": "<p>localized description of vendor's shipping policies</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "shipping_description.us",
            "description": "<p>description of vendor's shipping policies in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "returns_description",
            "description": "<p>localized description of vendor's returns policies</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "returns_description.us",
            "description": "<p>description of vendor's returns policies in US locality</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  },
  {
    "type": "put",
    "url": "/vendor/:_id/update.json",
    "title": "Update Vendor",
    "name": "UpdateVendor",
    "group": "Vendor",
    "permission": [
      {
        "name": "admin, current setmember user"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>unique identifier of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>unique name of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "label",
            "description": "<p>localized label (e.g. name) of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "label.us",
            "description": "<p>label (e.g. name) of vendor in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "description",
            "description": "<p>localized description of vendor</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "description.us",
            "description": "<p>description of vendor in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "shipping_description",
            "description": "<p>localized description of vendor's shipping policies</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "shipping_description.us",
            "description": "<p>description of vendor's shipping policies in US locality</p>"
          },
          {
            "group": "Parameter",
            "type": "LocalizationObject",
            "optional": false,
            "field": "returns_description",
            "description": "<p>localized description of vendor's returns policies</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "returns_description.us",
            "description": "<p>description of vendor's returns policies in US locality</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  }
] });