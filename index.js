'use strict';

const eejs = require('ep_etherpad-lite/node/eejs/');

exports.eejsBlock_body = (hookName, args, cb) => {
  args.content += eejs.require('ep_content_title/templates/titleInput.ejs');
  cb();
};

exports.eejsBlock_styles = (hookName, args, cb) => {
  args.content = require('ep_etherpad-lite/node/eejs/').require("ep_content_title/templates/styles.ejs") + args.content;
  cb();
};