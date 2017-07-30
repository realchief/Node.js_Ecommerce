define({ "api": [
  {
    "type": "post",
    "url": "/cart/session/product/create.json",
    "title": "Add Product to Session's Cart",
    "name": "CreateCartSessionProduct",
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
    "url": "/cart/session/product/:product/delete.json",
    "title": "Delete Product from Session Cart",
    "name": "DeleteCartSessionProduct",
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
    "url": "/cart/session/read.json",
    "title": "Read Session Cart",
    "name": "ReadCartSession",
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
    "url": "/cart/session/product/:product/quantity/:quantity/update.json",
    "title": "Update Product Quantity from Session Cart",
    "name": "UpdateCartSessionProductQuantity",
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
    "url": "/product/export.csv",
    "title": "Export Products CSV",
    "name": "ExportProduct",
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
    "url": "/product/:_id/availability.json",
    "title": "Get Product Availability",
    "name": "ProductAvailability",
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
    "type": "post",
    "url": "/product/old/:old_product/new/:new_product/replace.json",
    "title": "Replace Product",
    "name": "ProductReplace",
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
    "type": "get",
    "url": "/vendor/count.json",
    "title": "Count Vendor",
    "name": "CountVendor",
    "group": "Vendor",
    "permission": [
      {
        "name": "admin, public"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
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
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  },
  {
    "type": "get",
    "url": "/vendor/list.json",
    "title": "List Vendors",
    "name": "ListVendor",
    "group": "Vendor",
    "permission": [
      {
        "name": "admin"
      }
    ],
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
        "name": "admin"
      }
    ],
    "version": "0.0.0",
    "filename": "lib/controllers/vendor.js",
    "groupTitle": "Vendor"
  }
] });
