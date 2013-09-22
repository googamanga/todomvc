/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// Todo Item View
	// --------------

	// The DOM element for a todo item...
	app.TodoView = Backbone.View.extend({
		//... is a list tag.
		tagName:  'li',

		// Cache the template function for a single item.
		template: _.template($('#item-template').html()),

		// The DOM events specific to an item.
		events: {
			'click .toggle': 'toggleCompleted',
			'dblclick label': 'edit',
			'click .destroy': 'clear',
			'keypress .edit': 'updateOnEnter',
			'blur .edit': 'close',
			'click .url-info': 'getURLInfo'
		},

		// The TodoView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Todo** and a **TodoView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
			this.listenTo(this.model, 'visible', this.toggleVisible);
		},

		renderYoutube: function () {
			var $youtube = $('<div></div>');
			$youtube.html('<iframe width="420" height="315"' +
				'src="http://www.youtube.com/embed/hqiNL4Hn04A"' +
				'frameborder="0" allowfullscreen></iframe>');
			return $youtube;
		},

		getYoutubeInfo: function () {
			//http://ajaxian.com/archives/using-yql-as-a-proxy-for-cross-domain-ajax
			//https://developer.yahoo.com/yql/console/?q=select%20*%20from%20meetup.events%20where%20key%3D%22...%22%20and%20zip%3D%2210016%22&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys#h=select+*+from+youtube.video+where+id%3D'gmvQ1uA202M'
			//http://net.tutsplus.com/tutorials/javascript-ajax/quick-tip-cross-domain-ajax-request-with-yql-and-jquery/
			var vid = 'gmvQ1uA202M';

			// Take the provided url, and add it to a YQL query. Make sure you encode it!
			var yql = 'https://query.yahooapis.com/v1/public/yql?q='
				+ encodeURIComponent('select * from youtube.video where id="' + vid + '"')
				+ "&format=json"
				+ "&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys"
				+ "&callback=";



			$.getJSON(yql)
				.done(function (data) {
					console.log('data', data);
					that.renderYoutube();
				})
				.fail(function (err) {
					console.log('err', err);
				});
		},

		getOtherURLInfo: function () {

			var url = 'http://www.hackreactor.com';
			// query: select * from html where url="http://some.url.com" and xpath='//title'
			var yql_url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22" + encodeURIComponent(url) + "%22%20and%0A%20%20%20%20%20%20xpath%3D'%2F%2Ftitle'&format=json&callback=?";

			$.getJSON(yql_url, function(json) {
			  if (json && json.query && json.query.results && json.query.results.title) {
			    console.log('title', json.query.results.title);
			  }
			});
		},

		// GET URL Info
		getURLInfo: function (event) {
			console.log('getURLInfo');

			var $target = $(event.target);
			var $urlInfo = $target.closest('.url-info');

			var isYoutube = false;

			if (isYoutube) {
				$urlInfo.append('youtube');
			} else {
				$urlInfo.append('not youtube');
			}

		},

		// Re-render the titles of the todo item.
		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass('completed', this.model.get('completed'));
			this.toggleVisible();
			this.$input = this.$('.edit');
			return this;
		},

		toggleVisible: function () {
			this.$el.toggleClass('hidden', this.isHidden());
		},

		isHidden: function () {
			var isCompleted = this.model.get('completed');
			return (// hidden cases only
				(!isCompleted && app.TodoFilter === 'completed') ||
				(isCompleted && app.TodoFilter === 'active')
			);
		},

		// Toggle the `"completed"` state of the model.
		toggleCompleted: function () {
			this.model.toggle();
		},

		// Switch this view into `"editing"` mode, displaying the input field.
		edit: function () {
			this.$el.addClass('editing');
			this.$input.focus();
		},

		// Close the `"editing"` mode, saving changes to the todo.
		close: function () {
			var trimmedValue = this.$input.val().trim();
			this.$input.val(trimmedValue);

			if (trimmedValue) {
				this.model.save({ title: trimmedValue });
			} else {
				this.clear();
			}

			this.$el.removeClass('editing');
		},

		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function (e) {
			if (e.which === ENTER_KEY) {
				this.close();
			}
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		clear: function () {
			this.model.destroy();
		}
	});
})(jQuery);
