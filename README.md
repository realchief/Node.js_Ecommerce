Wanderset
======

This repo is the Wanderset server.

## Live Sites

The following sites are live:

* [staging.wanderset.com](https://staging.wanderset.com) - staging version of the website. Reflects latest code with each git push. Access credentials are user: **wanderset**, password: **wanderset1234**.
* [design.staging.wanderset.com](https://design.staging.wanderset.com) - all design assets are available from this server.

## Design assets

### Static files

All design assets are first created in the [wanderset-design](https://github.com/tinkerpartners/wanderset-design) repo. Pushing to either the [wanderset-design](https://github.com/tinkerpartners/wanderset-design) or [wanderset-server](https://github.com/tinkerpartners/wanderset-server) repos will update NPM and Bower and restart the servers, making the newest commits live.

[wanderset-server](https://github.com/tinkerpartners/wanderset-server) is running at [staging.wanderset.com](https://staging.wanderset.com) and has a copy of [wanderset-design](https://github.com/tinkerpartners/wanderset-design) at the path `./node_modules/wanderset-design` -- which is installed/updated from any git push.

The path `./dist/assets` in the [wanderset-design](https://github.com/tinkerpartners/wanderset-design) repo is symlinked to the path `./public/assets` in the [wanderset-server](https://github.com/tinkerpartners/wanderset-server) -- making anything in this folder publicly accessible from links like https://staging.wanderset.com/public/assets/images/elements/amex.svg

Therefore, design assets like fonts, CSS, and image assets can be loaded directly from the wanderset-design repo into the wanderset-server repo.

### HTML views

[wanderset-server](https://github.com/tinkerpartners/wanderset-server) uses [EJS](http://www.embeddedjs.com/) and [Viewable](https://github.com/sackio/viewable) to create HTML templates used throughout the web application.

These HTML files can be found at `./lib/views` in the [wanderset-server](https://github.com/tinkerpartners/wanderset-server) repo.

These HTML files will not be automatically updated when [wanderset-design](https://github.com/tinkerpartners/wanderset-design) files are updated -- so changes need to be made directly to [wanderset-server](https://github.com/tinkerpartners/wanderset-server) views after [wanderset-design](https://github.com/tinkerpartners/wanderset-design) HTML has been changed.

This is a list of HTML views in the wanderset-server repo and their purpose:

* `./lib/views/head.html` - the `<head></head>` element used on each page. Update this file to add new CSS assets to each page.
* `./lib/views/javascript.html` - javascript files loaded on each page. Update this file to add new JS assets to each page.
* `./lib/views/header.html` - the header / navbar loaded on each page
* `./lib/views/set.html` - the template for set member / brand pages
* `./lib/views/homepage.html` - the template for the homepage

Anytime you see code like `<%= Render('some-view', {'data': data}) %>` this means that the HTML template is rendering another HTML file from the `./lib/views` path. This is used to loaded a file like `./lib/views/header.html` within the `./lib/views/homepage.html` page -- so use this to identify which files need to be updated when changing the HTML.

### Bower

[wanderset-server](https://github.com/tinkerpartners/wanderset-server) use Bower, so if you need to add Bower packages, edit the `./bower.json` file and perform a push to the repo. This will automatically install/update Bower packages.

All files in the `./bower_components` folder are accessible from paths like https://staging.wanderser.com/bower_components/... -- for example: https://staging.wanderset.com/bower_components/underscore/underscore-min.js

Be sure to update `./lib/views/javascript.html` with any new Bower files to load on pages.
