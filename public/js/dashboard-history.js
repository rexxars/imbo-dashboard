(function(window, undefined){

    var dash = window.Dashboard || {}, $ = window.jQuery, prevState = {};

    // Define change handlers
    var handlers = {
        img: function(id) {
            Dashboard.showImage(id);
        },
        page: function(num) {
            Dashboard.loadImagePage(num);
        }
    };

    $(window).on('hashchange', function() {
        var state = $.bbq.getState();
		for (var key in handlers) {
			if (prevState[key] != state[key]) {
				handlers[key](state[key]);
			}
		}

		prevState = state;
    });

    $(document).on('ready', function() {
        prevState = $.bbq.getState();
    });

})(window);