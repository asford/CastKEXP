angular.module('CastKEXPDemo', []);
angular.module('CastKEXPDemo').controller('NowPlayingController', function($scope) {
  $scope.show_info = "The Afternoon Show with Kevin Cole";

  $scope.playing_img_src = "https://images-na.ssl-images-amazon.com/images/I/515KFMFYjtL.jpg";
  $scope.playing_artist_name = "Belle and Sebastian";
  $scope.playing_song_name = "The Stars of Track and Field";
  $scope.playing_album_name = "If You're Feeling Sinister";

});
