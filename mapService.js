app.service('maps', function($timeout) {

    this.showHouse = function($scope, houseId) {
        var house = angular.copy($scope.houses[houseId]);
        $scope.map.center = house.geolocation;
        $scope.map.zoom = 14;
        // for (var i=0; i<$scope.markers.length; i++) {
        //     $scope.markers[i].options.icon = 'imgs/greenPin.png';
        // }
        $timeout(function() {
            $scope.markers[houseId].options.icon = 'imgs/purplePin.png';
        }, 500);
    }


    this.buildMarkerList = function ($scope) {
        var houseList = [];
        for (var i=0; i < $scope.houses.length; i++) {
            houseList.push(buildMarker($scope, i));
        }
        return houseList;
    }

    this.convertLatLng = function(coords)  {
        return {
            lat: coords.latitude,
            lng: coords.longitude
        }
    }

    function buildMarkerLabel ($scope, id) {
        var house = $scope.houses[id];

        var price = house.price.split(',');
        return {
            color: 'white',
            text: price[0]
        }
    }


    function buildMarker($scope, index) {
        var location = $scope.houses[index].geolocation;
        return {
            id: index,
            coords: location,
            options: { 
                position: {lat: location.latitude, lng: location.longitude },
                draggable: false, 
                visible: true, 
                label: buildMarkerLabel($scope, index),
                icon: 'imgs/greenPin.png',
                animation: 'DROP',
            },
            events: {
                click: function (marker, eventName, args) {
                    
                    //var house = angular.copy($scope.houses[index]);

                    // clicking an already selected house
                    if ($scope.houses[index].selected) {
                        deselectHouse($scope, index);
                    }
                    // otherwise select a new hosue
                    else {
                        for (var i=0; i<$scope.houses.length; i++) {
                            if (i != index) {
                                deselectHouse($scope, i);
                            }
                        }
                        selectHouse($scope, index);

                        var position = $('#house-' + index).offset().top - 105;
                        var scrollTop =  $('#housePanel').scrollTop();
                        var scrollPosition = position - scrollTop

                        console.log('position:', position, 'scrollTop', scrollTop);
                        console.log('mathTest:', scrollPosition);
                        if (position != 0) {
                           //$('#housePanel').animate({ scrollTop:  scrollPosition}, 350);
                            
                        }

                    }
                },
                mouseover: function (marker, eventName, args) {
                    // console.log('hovering! on...', marker);
                }
            }
        }
    }

    function selectHouse($scope, id) {
        $scope.houses[id].selected = true;
        $scope.markers[id].options.icon = 'imgs/purplePin.png';
    }
    function deselectHouse($scope, id) {
        $scope.houses[id].selected = false;
        $scope.markers[id].options.icon = 'imgs/greenPin.png';
    }


});