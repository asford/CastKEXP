jQuery(document).ready(function($){

      // On scroll header stays fixed and shrinks
      var $header = $('header');

      var $hHeight = $header.height();

      var prevTop = $(window).scrollTop();

      // Scroll event
      $(window).on('scroll', function(e) {
        st = $(this).scrollTop(); // Set scroll location
        if (st > prevTop && st > $hHeight) { 
          $header.addClass('header-scrolling');
        } else {
          $header.removeClass('header-scrolling');
        }
        prevTop = st;
      });


      // Top Links Menu Overlay
      $("#top-links-overlay, #top-links-close, #top-links-btn, #search").click(function() {
          $("#top-links").fadeToggle(100);
          $("#top-links-overlay").fadeToggle(100);
          $("#search-wrap").fadeToggle(100);
      });
	  
	  animateLogo();
});


// Code to animate KEXP logo
var isPaused = false;
var timeFactor = 1;
var trackDuration;
var trackSteps;

var animateLogo = function () {
	animateLetter('.k', true);
	animateLetter('.e', false);
	animateLetter('.x', false);
	animateLetter('.p', false);
};
var animateLetter = function (query, trackTime) {
	var head = $('.header-scrolling');
	var alterheight = (head.length) ? 12 : 30;
	var height = Math.floor(Math.random() * alterheight + alterheight);
	var duration = Math.floor((Math.random() * 200 + 350) * timeFactor);
	if (!trackTime) {
		$(query).animate({ height: height }, duration, 'swing', function () {
			if (!isPaused) {
				animateLetter(query, trackTime);
			}
		});
	}
	else {
		trackDuration = duration;
		trackSteps = 0;
		$(query).animate({ height: height }, {
			duration: duration,
			easing: 'swing',
			complete: function () {
				if (!isPaused) {
					timeFactor = Math.max(1, Math.min(4, ((trackDuration / trackSteps) / 25)));
					animateLetter(query, trackTime);
				}
			},
			step: function () {
				trackSteps++;
			}
		});
	}
};	
