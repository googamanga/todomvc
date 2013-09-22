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

		renderYoutube: function (vid, videoTitle) {
			var $youtube = $('<div class="youtube-right"></div>');
			$youtube.html('<h3>' + videoTitle + '</h3>' +
				'<iframe width="420" height="315"' +
				'src="http://www.youtube.com/embed/' + vid + '"' +
				'frameborder="0" allowfullscreen></iframe>');
			return $youtube;
		},

		getYoutubeInfo: function (vid) {
			//http://ajaxian.com/archives/using-yql-as-a-proxy-for-cross-domain-ajax
			//https://developer.yahoo.com/yql/console/?q=select%20*%20from%20meetup.events%20where%20key%3D%22...%22%20and%20zip%3D%2210016%22&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys#h=select+*+from+youtube.video+where+id%3D'gmvQ1uA202M'
			//http://net.tutsplus.com/tutorials/javascript-ajax/quick-tip-cross-domain-ajax-request-with-yql-and-jquery/
			var deferred = $.Deferred();

			// Take the provided url, and add it to a YQL query. Make sure you encode it!
			var yql = 'https://query.yahooapis.com/v1/public/yql?q=' +
				encodeURIComponent('select * from youtube.video where id="' + vid + '"') +
				'&format=json' +
				'&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys' +
				'&callback=';

			var that = this;

			$.getJSON(yql)
				.done(function (data) {
					console.log('data', data);
					var videoTitle = data && data.query && data.query.results && data.query.results.video && data.query.results.video.title;
					deferred.resolve(that.renderYoutube(vid, videoTitle));
				})
				.fail(function (err) {
					console.log('err', err);
					deferred.reject(err);
				});

			return deferred.promise();
		},

		getFirstImage: function (url) {
			var deferred = $.Deferred();

			var yql = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22' +
				encodeURIComponent(url) +
				'%22%20and%20xpath%3D%27%2F%2Fimg%27&format=json&callback=?';

			$.getJSON(yql)
				.done(function (data) {
					console.log('data', data);
					if (data && data.query && data.query.results && data.query.results.img && data.query.results.img[0]) {
						console.log('img', data.query.results.img[0]);
						deferred.resolve(data.query.results.img[0]);
					} else {
						deferred.reject(false);	//what should we pass?
					}
				})
				.fail(function (err) {
					console.log('err', err);
					deferred.reject(err);
				});

			return deferred.promise();

		},

		getOtherURLInfo: function (url) {
			var deferred = $.Deferred();

			// http://blog.andrewcantino.com/blog/2010/03/02/get-the-title-of-any-url-with-yql/
			// query: select * from html where url="http://some.url.com" and xpath='//title'
			var yql = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22" +
				encodeURIComponent(url) +
				"%22%20and%0A%20%20%20%20%20%20xpath%3D'%2F%2Ftitle'&format=json&callback=?";

			$.getJSON(yql)
				.done(function (json) {
					if (json && json.query && json.query.results && json.query.results.title) {
						console.log('title', json.query.results.title);
						deferred.resolve(json.query.results.title);
					} else {
						deferred.reject(false);	//what should we pass?
					}
				})
				.fail(function (err) {
					console.log('err', err);
					deferred.reject(err);
				});

			return deferred.promise();
		},

		// GET URL Info
		getURLInfo: function (event) {
			console.log('getURLInfo');

			var $target = $(event.target);
			var $oneTodo = $target.closest('.view');
			var $urlInfo = $oneTodo.find('.url-info');

			var isYoutube, vid, url;
			var youtubeRegex = /http\:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9]+)/;

			if (this.model.get('url') && this.model.get('title')) {

				var title = '' + this.model.get('title');
				var youtubeMatch = title.match(youtubeRegex);

				if (youtubeMatch) {
					console.log('match', youtubeMatch[1]);
					vid = youtubeMatch[1];
					isYoutube = true;
				} else {
					isYoutube = false;
					url = title;
				}
			}

			console.log('isYoutube: ', isYoutube);

			if (isYoutube) {
				this.getYoutubeInfo(vid)
					.then(function (data) {
						// console.log('promise data', data);
						$urlInfo.append(data);
					});
			} else {
				this.getFirstImage(url)
					.then(function (data) {
						$urlInfo.append(data);
					});
			}

		},

		// Re-render the titles of the todo item.
		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass('completed', this.model.get('completed'));
			this.toggleVisible();
			this.$input = this.$('.edit');

			if (this.model.get('url')) {
				this.$el.find('.url-info').trigger('click');
			}

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
