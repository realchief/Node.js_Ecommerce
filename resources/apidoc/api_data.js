define({ "api": [
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
            "type": "Number",
            "optional": false,
            "field": "_id",
            "description": "<p>User's unique identifier.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Number",
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
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"firstname\": \"John\",\n  \"lastname\": \"Doe\"\n}",
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
            "field": "UserNotFound",
            "description": "<p>The id of the User was not found.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"error\": \"UserNotFound\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "lib/controllers/user.js",
    "groupTitle": "User"
  }
] });
