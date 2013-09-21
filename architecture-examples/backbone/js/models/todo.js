/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Model
	// ----------

	// Our basic **Todo** model has `title`, `order`, and `completed` attributes.
	app.Todo = Backbone.Model.extend({
		// Default attributes for the todo
		// and ensure that each todo created has `title` and `completed` keys.
		defaults: {
			title: '',
			url: false,
			completed: false
		},

		// Toggle the `completed` state of this todo item.
		toggle: function () {
			this.save({
				completed: !this.get('completed')
			});
		},

		// Check for whether the input is an URL
		_isURL: function (input) {
			// dummy version for now
			// todo
			// make this more resilient
			if (input.indexOf('http://') === 0) {
				return true;
			} else {
				return false;
			}
		},

		// Validate the URL field
		validate: function (attrs) {
			if (this._isURL(attrs.title)) {
				this.url = true;
			}
		}

	});
})();
