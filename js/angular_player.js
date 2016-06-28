angular.module('CastKEXPDemo', []);
angular.module('CastKEXPDemo').controller('NowPlayingController', ['$scope', '$http', '$interval', function($scope, $http, $interval) {
  $scope.show_info = "KEXP Cast Demo";
  $scope.playing_img_src = "http://www.kexp.org/Resources/Images/Album.png";
  $scope.playing_artist_name = "KEXP";
  $scope.playing_artist_link = "http://www.kexp.org/";
  $scope.playing_song_name = "Air Break";
  $scope.playing_release_name = "";

  $scope.update = function()
  {
    $http.jsonp("http://cache.kexp.org/cache/latestPlay?callback=JSON_CALLBACK").then(
      function successCallback(response) {
        console.log("success");
        console.log(response);

        if(response.data.AirBreak){
          $scope.playing_img_src = "http://www.kexp.org/Resources/Images/Album.png";
          $scope.playing_artist_name = "KEXP";
          $scope.playing_artist_link = "http://www.kexp.org/";
          $scope.playing_song_name = "Air Break";
          $scope.playing_release_name = "";
        }
        else
        {
          var play = response.data.Plays[0];
          console.log(play);

          $scope.playing_img_src = play.Release.LargeImageUri ? play.Release.LargeImageUri.trim() : "http://www.kexp.org/Resources/Images/Album.png";
          $scope.playing_artist_name = play.Artist ? play.Artist.Name.trim() : "";
          $scope.playing_artist_link = play.Artist ? "http://www.kexp.org/search?q=" + encodeURI($scope.playing_artist_name) : "http://www.kexp.org";
          $scope.playing_song_name = play.Track ? play.Track.Name.trim() : "";
          $scope.playing_release_name = play.Release ? play.Release.Name.trim() : "";
        }
      }, function errorCallback(response) {
        console.log("error");
        console.log(response);
      });
  };

  $scope.update()
  var polling = $interval($scope.update, 10000);
  $scope.$on('$destroy', function() {
    $interval.cancel(polling);
  });

}]);

angular.module('CastKEXPDemo').controller('PlayerController', ['$scope', function($scope) {
  var cast = false;
  $scope.is_cast_available = function() { return true; };
  $scope.is_cast_connected = function() { return cast; };

  $scope.on_cast = function() {
    cast = !cast;
    console.log("on_cast");
  };

  $scope.on_play = function() { console.log("on_play"); };
}]);
