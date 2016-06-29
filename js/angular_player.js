angular.module('CastKEXPDemo', ['mediaPlayer'])
.factory('castservice', ['$window', '$rootScope', function($window, $rootScope) {

  /**
   * Utility for method-based callbacks. Binds 'this' in the callback and wraps
   * callback within $rootScope.$apply. This is required if callbacks are
   * called from outside an angular $apply scope, to ensure that $digest is
   * property called to detect any model updates.
   */
  function abind(callback){
    var self = this;
    var args = arguments;

    return function() {
      var args = arguments;
      return $rootScope.$apply(function(){
        callback.apply(self, args);
      });
    };
  };

  /**
   * Provides a media-player interface wrapping a cast session.
   *
   * Intended to provide an interface supporting (limited) compatibility with
   * angular-media-player. 
   */
  var CastPlayer = function(session) {
    this.session = session;
    this.media = null;
    this.volume = 1;

    this.session.addUpdateListener(this.abind(this.on_session_update));
    this.on_session_update();

    if (this.session.media.length != 0) {
      this.on_media(this.session.media[0]);
    } else {
      this.load_stream();
    }
    this.session.addMediaListener(this.abind(this.on_media));
  }

  CastPlayer.prototype.abind = abind;

  /**
   * Callback on session status updates.
   *
   * Sync session properties into player properties.
   */
  CastPlayer.prototype.on_session_update = function(is_alive) {
    console.log("on_session_update", this.session);
    this.volume = this.session.receiver.volume.level;
  }

  /**
   * Callback on media load.
   *
   * Store media reference from session.
   */
  CastPlayer.prototype.on_media = function(media) {
    console.log("on_media", media);

    this.media = media;
    media.addUpdateListener(this.abind(this.on_media_update));
  }

  /**
   * Callback on media status update.
   */
  CastPlayer.prototype.on_media_update = function(media_alive) {
    console.log("on_media_update", media_alive, this.media);
  }
  
  /**
   * Load stream into current session.
   *
   * Manages loading KEXP streaming media into target session, which will then
   * dispatch to on_media after successful load.
   */
  CastPlayer.prototype.load_stream = function() {
    var mediaInfo = new chrome.cast.media.MediaInfo(
        "http://live-aacplus-64.kexp.org/kexp64.aac");
    mediaInfo.contentType = "audio/aac";

    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
    mediaInfo.metadata.title = "KEXP Streaming"
    mediaInfo.metadata.images = [{'url': "http://www.kexp.org/content/images/kexp-official-logo-800.jpg" }]

    var request = new chrome.cast.media.LoadRequest(mediaInfo);

    this.session.loadMedia(
      request,
      this.abind(this.on_media),
      this.abind(function(error){
        console.log("on_media_error:", error);
      }));
  }

  /**
   * Set cast receiver volume.
   */
  CastPlayer.prototype.setVolume = function(volume) {
    console.log("CastPlayer.setVolume", volume);
    // Non-async callbacks, do not abind.
    this.session.setReceiverVolumeLevel(
      Number(volume),
      function(){ console.log("on_set_volume"); },
      function(e){ console.log("on_set_volume_error: ", e); }
    );
  }

  /**
   * Play media if paused or idle, pause media if buffering or playing.
   */
  CastPlayer.prototype.playPause = function() {
    if (!this.media || this.media.playerState == chrome.cast.media.PlayerState.IDLE ) {
      this.load_stream();
    } else if(this.media.playerState == chrome.cast.media.PlayerState.PAUSED) {
      // Non-async callbacks, do not abind.
      this.media.play(
        null,
        function(){ console.log("on_play"); },
        function(e){ console.log("on_play_error: ", e); }
      );
    } else {
      // Non-async callbacks, do not abind.
      this.media.pause(
        null,
        function(){ console.log("on_pause"); },
        function(e){ console.log("on_pause_error: ", e); }
      );
    }
  }

  /**
   * Service handling cast api initialization, receiver, and session managment.
   */
  var CastService = function()
  {
    this.available = false;
    this.session = null;
    this.api_config = null;
  }
  CastService.prototype.abind = abind;

  /**
   * Initialize the cast api for this service.
   *
   * Cast API has three levels of availability:
   *  API - Wheter the chrome.cast APIS are available in the browser. This is
   *  determined via a call to chrome.cast.initialize after the DOM has
   *  finished loading. App will receive an API load success or failure callback.
   *
   *  Receiver - Whether a cast receiver is present for the application. This
   *   is a (potentially) dynamic state. The application is notified of receiver
   *   availability with the on_receiver callback defined within the API config.
   *   Cast-related interface components should only be shown when a receiver
   *   is available.
   *
   *  Session - Whether an active session has been established with a receiver.
   *   This is a (potentially) dynamic state. The application may inherit an
   *   established session initialized on another page.
   */
  CastService.prototype.init_api = function(loaded, errorInfo){
    if(loaded) {
      console.log("CastService.init_api");
      // variable is undefined
      var sessionRequest = new chrome.cast.SessionRequest(
          chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
      this.api_config = new chrome.cast.ApiConfig(
          sessionRequest,
          this.abind(function(session) {
            console.log("CastService.on_session: ", session);
            this.session = session;
          }),
          this.abind(function(receiver) {
            console.log("CastService.on_receiver: ", receiver);
            this.available = (receiver == chrome.cast.ReceiverAvailability.AVAILABLE);
          })
      );

      chrome.cast.initialize(
          this.api_config,
          this.abind(function() {
            console.log("CastService.init_success");
          }),
          this.abind(function(err) {
            console.log("CastService.init_error:", err);
          })
      );
    } else {
      console.log("CastService.init_api error: ", errorInfo);
    }
  };

  /**
   * CastPlayer factory function. Setup cast service 
   */
  CastService.prototype.get_player = function(on_player){
    if (this.session) {
      on_player(new CastPlayer(this.session));
    } else {
      chrome.cast.requestSession(
        this.abind(function(session){
          console.log("on_requestSession");
          this.session = session;
          on_player(new CastPlayer(this.session));
        }),
        this.abind(function(e){
          console.log("on_requestSession error: ", e);
        })
      );
    }
  };

  /**
   * Setup callback to perform api initialization for service when api becomes
   * available. Singleton service instance handles init callback.
   *
   * See https://developers.google.com/cast/docs/chrome_sender#Initialization
   */
  var castservice = new CastService();
  $window['__onGCastApiAvailable'] = castservice.abind(castservice.init_api);
  return castservice;
}])
.controller('NowPlayingController', ['$scope', '$http', '$interval', function($scope, $http, $interval) {
  /**
   * Metadata display controller. Polls cache.kexp.org to retrieve latest play
   * metadata and store in $scope. Sets "Air Break" metadata if no track
   * metadata is found, or there is an error retrieving metadata.
   */
  $scope.show_info = "KEXP Cast Demo";
  $scope.set_air_break = function() {
    $scope.playing_img_src = "http://www.kexp.org/Resources/Images/Album.png";
    $scope.playing_artist_name = "KEXP";
    $scope.playing_artist_link = "http://www.kexp.org/";
    $scope.playing_song_name = "Air Break";
    $scope.playing_release_name = "";
  }
  $scope.set_air_break()

  /**
   * Perform scope update from metadata server. Could be made more
   * cache-friendly via use of recentPlays API or use of CORS headers on
   * metadata server to avoid JSONP.
   */
  $scope.update = function()
  {
    $http.jsonp("http://cache.kexp.org/cache/latestPlay?callback=JSON_CALLBACK").then(
      function successCallback(response) {
        console.log("update: ", response);
        if(response.data == null) {
          console.log("null data");
          return;
        }

        var play = response.data.Plays[0];
        if (play.Track == null ) {
          console.log("null track");
          $scope.set_air_break();
          return;
        }

        console.log(play);
        $scope.playing_img_src = play.Release.LargeImageUri ? play.Release.LargeImageUri.trim() : "http://www.kexp.org/Resources/Images/Album.png";
        $scope.playing_artist_name = play.Artist ? play.Artist.Name.trim() : "";
        $scope.playing_artist_link = play.Artist ? "http://www.kexp.org/search?q=" + encodeURI($scope.playing_artist_name) : "http://www.kexp.org";
        $scope.playing_song_name = play.Track ? play.Track.Name.trim() : "";
        $scope.playing_release_name = play.Release ? play.Release.Name.trim() : "";
      }, function errorCallback(response) {
        console.log("error");
        console.log(response);
      });
  };

  // Trigger an immediate update, then perform polling every 15s.
  $scope.update()
  var polling = $interval($scope.update, 15000);
  $scope.$on('$destroy', function() {
    $interval.cancel(polling);
  });

}])
.controller('PlayerController', ['$scope', "castservice", function($scope, castservice) {
  console.log("scope: ", $scope);
  console.log("castservice: ", castservice);

  $scope.castservice = castservice;

  $scope.current_mode = "local";
  $scope.cast_player = null;

  $scope.on_cast = function() {
    console.log("on_cast");
    if($scope.current_mode != "cast"){
      $scope.castservice.get_player(function(cast_player){
        $scope.current_mode = "cast";
        $scope.cast_player = cast_player;
      });
    }
  };

  $scope.on_play = function() {
    console.log("on_play", $scope);
    $scope.current_player().playPause();
  };

  // Sync $scope.current_volume, linked to volume control component, to
  // current player volume.
  $scope.current_volume = 1.0
  $scope.on_volume_change = function() {
    console.log("on_volume_change: ", $scope.current_volume);
    $scope.current_player().setVolume($scope.current_volume);
  }
  $scope.$watch("current_player().volume", function() {
    $scope.current_volume = $scope.current_player().volume;
  })

  // Return the currently active player component.
  $scope.current_player = function() {
    if($scope.current_mode == "local") {
      return $scope.local_player;
    } else {
      return $scope.cast_player;
    }
  };

}]);
