var googleMapsKey = '';

var rmlsURL = 'http://www.rmlsweb.com/v2/public/report.asp?type=AE&CRPT2=';
var rmlsID = '';


var app = angular.module('HomeSearch', ['ngMaterial', 'LocalStorageModule', 'uiGmapgoogle-maps']);

app.config(function (localStorageServiceProvider, uiGmapGoogleMapApiProvider) {
    localStorageServiceProvider.setPrefix('HomeSearch');

    uiGmapGoogleMapApiProvider.configure({
        key: googleMapsKey,
        v: '3.29', //defaults to latest 3.X anyhow
        libraries: 'geometry,visualization'
    });
});

app.directive('houseContent', function () {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment         
        scope: {
            //@ reads the attribute value, = provides two-way binding, & works with functions
            house: '@'         },
        templateUrl: 'templates/houseContent.html',

         //Embed a custom controller in the directive
        controller: function($scope, $mdDialog, $timeout, dialogFactory) {
            $scope.clickImage = function(ev, house) {
                dialogFactory.setSelected(house);
                console.log('clicked image');
                $mdDialog.show({
                  templateUrl: 'templates/imageDialog.html',
                  parent: angular.element(document.body),
                  targetEvent: ev,
                  clickOutsideToClose:true,
                  controller: DialogController 
                });
            }
                function DialogController($scope, $mdDialog) {
                    $scope.house = dialogFactory.getSelected();
                    $scope.selectedIndex = 0;

                    console.log('init dialog controller');
                    console.log('house', $scope.house);

                    $scope.closeDialog = function() {
                        $timeout(function () {
                            $mdDialog.hide();
                        }, 200);
                    };

                    $scope.cancel = function() {
                    $mdDialog.cancel();
                    };

                    $scope.answer = function(answer) {
                    $mdDialog.hide(answer);
                    };

                    $(document).keydown(function(e) {
                        switch(e.which) {
                            case 37: // left
                                $scope.$apply(function () {
                                $scope.previousPhoto();
                                });
                                break;
                            case 39: // right
                                $scope.$apply(function () {
                                    $scope.nextPhoto();
                                });
                                break;
                            default: 
                                return; // exit this handler for other keys
                        }
                        e.preventDefault(); // prevent the default action (scroll / move caret)
                    });

                    $scope.nextPhoto = function() {
                        if ($scope.selectedIndex < $scope.house.photos.length - 1) {
                            $scope.selectedIndex++;
                        }
                    }
                    $scope.previousPhoto = function() {
                        if ($scope.selectedIndex > 0) {
                            $scope.selectedIndex--;
                        }
                    }
                    $scope.selectPhoto = function(index) {
                        $scope.selectedIndex = index;
                    }
                };

        },
        link: function ($scope, element, attrs) { 
            $scope.current = JSON.parse($scope.house);
        } //DOM manipulation

    }
});
    

app.factory('dialogFactory', function () {
    var selectedHouse = null;  // quote, contact, or tile
    var tile = null;
    var service = {};
    service.getSelected = function() { return selectedHouse; };
    service.setSelected = function(input) { selectedHouse = input; };
    return service;
});


app.controller('appController', function($scope, $http, $q, $timeout, $interval, localStorageService, $mdDialog, dialogFactory, uiGmapGoogleMapApi, maps) {

    $scope.markers = [];
    $scope.settings = {
        doClustor: true,
    };
    var clusterOptions = {
        minimumClusterSize : 10,
        zoomOnClick: true,
        styles: [{
            url: "icons/m4-fab.png",
            width:60,
            height:60,
            textColor: 'white',
            textSize: 14,
            fontFamily: 'Open Sans'
        }],
        averageCenter: true,
        clusterClass: 'cluster-icon'
    }


    function gmapEncode(address) {
        var flatten = address.line + ' ' + address.city + ' ' + address.zip; 
        return flatten.replace(/ /g,"+");
    }


    var mapsHost = 'https://maps.googleapis.com/maps/api/geocode/json';
    var addressCounter = 0;

    $scope.mapSelection = null;
    $scope.inSelectionMode = false;

    var MAP_CENTER = { 
        latitude: 45.45, 
        longitude: -122.7 
    }
    var MAP_DEFAULT = { 
        center: angular.copy(MAP_CENTER),
        zoom: 10,
        control: {},
        options: {
            cluster: {
                minimumClusterSize : 4,
                zoomOnClick: true,
                styles: [{
                    url: "imgs/cluster.png",
                    width:50,
                    height:50,
                    textColor: 'white',
                    textSize: 16,
                }],
                averageCenter: true,
                clusterClass: 'cluster-icon'
            }

        }
    };
    $scope.map = angular.copy(MAP_DEFAULT);



    // uiGmapGoogleMapApi is a promise.
    // The "then" callback function provides the google.maps object.
    uiGmapGoogleMapApi.then(function(map) {
        setMapWidth();
        console.log('map loaded', map);
        console.log('$scope map loaded', $scope.map);
        // wait for the map to load completely
        $timeout(function() { //TODO replace this hack

            $interval(function() {
                var gMap = $scope.map.control.getGMap();
                for (var i=0; i<$scope.markers.length; i++ ) {
                    $scope.houses[i].visible = gMap.getBounds().contains(maps.convertLatLng($scope.markers[i].coords));
                }

                if ($('.angular-google-map-container').width() != $(window).width() - 600) {
                    setMapWidth();
                    console.log('width change detected!')
                }   

            }, 1000);
            
        }, 1000);

    }); 

    function setMapWidth() {
        var mapWidth = $(window).width() - 600;
        $('.angular-google-map-container').css('width', mapWidth);

    }

    $scope.getTestCoords = function() {
        return { latitude: 45.45, longitude: -122.7 };
    }

    $scope.scrollToTop = function() {
        $('#housePanel').animate({ scrollTop: 0 }, 500);
    }

    $scope.getFullBaths = function(string) {
        return string.charAt(0);
    }

    $scope.getHalfBaths = function(string) {
        return string.charAt(string.length - 1);
    }

    $scope.showOnMap = function(houseId) {
        maps.showHouse($scope, houseId);
    }

    $scope.cancelSelection = function(index) {
        $scope.houses[index].visible = true;
        $scope.markers[index].options.icon = 'imgs/greenPin.png';

        // lets check to see if there are houses set to visible.
        var found = false;
        for (var i=0; i < $scope.houses.length; i++) {
            if ($scope.houses[i].visible) {
                found = true;
                break;
            }
        }
        if (!found) {
            $scope.inSelectionMode = false;
        }

    }

    $scope.clearSelection = function () {
        // $scope.inSelectionMode = false;
        for (var i=0; i < $scope.houses.length; i++) {
            $scope.houses[i].visible = true;
            $scope.houses[i].selected = false;
            $scope.markers[i].options.icon = 'imgs/greenPin.png';
        }

        $scope.map.zoom = 10;
        $scope.map.center = angular.copy(MAP_CENTER);
    }

    $scope.refreshData = function () {
        var loadingScreen = pleaseWait({
            backgroundColor: '#88bf88',
            loadingHtml:
                "Retrieving Housing Data...                             \
                <div class=\"spinner\">                                 \
                    <div class=\"double-bounce double-bounce1\"></div>  \
                    <div class=\"double-bounce double-bounce2\"></div>  \
                </div>"
        });
        getData().then(function(response) {
            // parse out the response into the house list
            parseData(response, function (houseList) {
                $scope.houses = houseList;
                console.log('$scope.houses: (httpRequest)', $scope.houses);


                var promiseArray = [];
                for (var i=0; i < $scope.houses.length; i++) {
                    promiseArray.push( getCoords( $scope.houses[i].address ) );
                }
                $q.all(promiseArray).then(function (coords) {
                    for (var i=0; i < coords.length; i++) {
                        $scope.houses[i].geolocation = coords[i];
                    } 
                    localStorageService.set('houses', $scope.houses);
                    $scope.markers = maps.buildMarkerList($scope);
                    loadingScreen.finish(); 
                });
            });
        });
    }


    var loadingScreen = pleaseWait({
        backgroundColor: '#88bf88',
        loadingHtml:
            "Retrieving Housing Data...                             \
            <div class=\"spinner\">                                 \
                <div class=\"double-bounce double-bounce1\"></div>  \
                <div class=\"double-bounce double-bounce2\"></div>  \
            </div>"
    });


    $scope.selectedHouse = null;

    var data = null;
    var HOST = 'http://www.rmlsweb.com';

    var localStorage = localStorageService.get('houses');
    $scope.houses = localStorage != undefined ? localStorage : [];

    $scope.saveState = function() {
        console.log('saving state:', $scope.houses);
        localStorageService.set('houses', $scope.houses);
    }

    
    if (localStorage != undefined) {
        $scope.markers = maps.buildMarkerList($scope);
        console.log('$scope.houses: (localStorage)', $scope.houses);
        loadingScreen.finish();
    }
    else {
        getData().then(function(response) {
            // parse out the response into the house list
            parseData(response, function (houseList) {
                $scope.houses = houseList;
                console.log('$scope.houses: (httpRequest)', $scope.houses);


                var promiseArray = [];
                for (var i=0; i < $scope.houses.length; i++) {
                    promiseArray.push( getCoords( $scope.houses[i].address ) );
                }
                $q.all(promiseArray).then(function (coords) {
                    for (var i=0; i < coords.length; i++) {
                        $scope.houses[i].geolocation = coords[i];
                    } 
                    localStorageService.set('houses', $scope.houses);
                    $scope.markers = maps.buildMarkerList($scope);
                    loadingScreen.finish(); 
                });
            });
        });
    }

    function getEmptyObject () {
        var house = {
            // hosing data
            price       : null,
            bedrooms    : null,
            bathrooms   : null,
            photos      : [],
            address     : {line: null, unit: null, city: null, zip: null},
            county      : null,
            year        : null,
            sqft        : {total: null, upper: null, main: null, lower: null},
            lotSize     : null,
            acers       : null,
            hoa         : {contains: null, dues: null, otherDues: null, includes: null},
            parking     : null,
            garage      : null,
            basment     : null,
            description : null,
            tax         : null,
            geolocation : {latitude: null, longitude: null},

            // app params
            visible     : true,
            selected    : false,

        }
        return house;
    }
    




    function getData() {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: rmlsURL + rmlsID,
        }).then(function successCallback(response) {
            // console.log('succes:', response);

            // status: OK
            if (response.status == 200) {
                // console.log(data)
                data = response.data;
                deferred.resolve(data);
            }

        }, function errorCallback(response) {
            // console.log('error:', response);
            deferred.reject();
        });

        return deferred.promise;
    }
    function parseData(data, callback) {

        var houseList = [];

        var html = $.parseHTML(data);
        var houses = $(html).find('.REPORT_STDBOX');

        for (var i=0; i<houses.length; i++) {

            // lets init an empty house object
            var house = getEmptyObject();
            var rows = $(houses[i]).find('td');

            // grab the photos
            var photos = $(houses[i]).find('.PHOTO_NAV').find('a');
            if (photos.length > 0) {
                var image = $(houses[i]).find('img').attr('src');
                // only proceed if we found a image source
                if (image != undefined) {
                    var imageStrings = image.split('.jpg');
                    imageStrings[0] = imageStrings[0].substring(0, imageStrings[0].length - 3);
                    //console.log('imageStrings:', imageStrings);
                    var imageList = [];
                    for (var image=1; image < photos.length - 2; image++) {
                        imageList.push(HOST + imageStrings[0] + image + '.jpg' + imageStrings[1]);
                    }
                    house.photos = imageList;
                }
            }
            // no photos available, grab the thumbnail instead
            else {
                var image = $(houses[i]).find('img').attr('src');
                house.photos = [HOST + image];
            }

            //console.log('rows:', rows);
            for (var j=0;j< rows.length; j++) {
                var current = rows[j].innerText;
                if (current == undefined) { continue; }
                // console.log(current);

                if (current.toLowerCase() == 'list price:') { 
                    house.price = rows[j+1].innerText;
                }

                else if (current.toLowerCase() == '#bdrms:') {
                    house.bedrooms = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == '#bath:') {
                    house.bathrooms = rows[j+1].innerText;
                }
                   

                // grab the address
                // {addr: null, unit: null, city: null, zip: null}
                else if (current.toLowerCase() == 'addr:') {
                    house.address.line = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == 'unit:') {
                    house.address.unit = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == 'city:') {
                    house.address.city = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == 'zip:') {
                    house.address.zip = rows[j+1].innerText;
                }

                else if (current.toLowerCase() == 'county:') {
                    house.county = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == 'year built:') {
                    house.year = rows[j+1].innerText + ' ' + rows[j+2].innerText;
                }


                // grab the square footage dimentions
                // {total: null, upper: null, main: null, lower: null}
                else if (current.toLowerCase() == 'main sqft:') {
                    house.sqft.main = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == 'upper sqft:') {
                    house.sqft.upper = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == 'lower sqft:') {
                    house.sqft.lower = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == 'ttl sqft:') { 
                    house.sqft.total = rows[j+1].innerText;
                }


                else if (current.toLowerCase() == 'lot size:') { 
                    house.lotSize = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == '# acres:') { 
                    house.acers = rows[j+1].innerText;
                }

                // get the hoa info
                // {contains: null, dues: null, otherDues: null, includes: null}
                else if (current.toLowerCase() == 'hoa:') { 
                    // we looking at hoa?
                    if (rows[j+1].innerText.toLowerCase() == 'y' ) {
                        house.hoa.contains = true;
                        house.hoa.dues = rows[j+3].innerText + rows[j+4].innerText;
                        house.hoa.otherDues = rows[j+6].innerText + rows[j+7].innerText;
                        house.hoa.includes = rows[j+9].innerText;

                        // lets clean up white space strings
                        if (house.hoa.otherDues  == ' ') {
                            house.hoa.otherDues = 'N/A';
                        }


                    }
                    // woo, no hoa here
                    else {
                        house.hoa.contains = false;
                        house.hoa.dues = 0;
                        house.hoa.otherDues = 0;
                        house.hoa.includes = 'N/A';
                    }

                    house.lotSize = rows[j+1].innerText;
                }

                else if (current.toLowerCase() == 'parking:') { 
                    house.parking = rows[j+1].innerText;
                }

                else if (current.toLowerCase() == '#gar:') { 
                    house.garage = rows[j+1].innerText;
                }

                else if (current.toLowerCase() == 'bsmt/fnd:') { 
                    house.basement = rows[j+1].innerText;
                }

                else if (current.toLowerCase() == 'public:') { 
                    house.description = rows[j+1].innerText;
                }
                else if (current.toLowerCase() == 'ptax/yr:') { 
                    house.tax = rows[j+1].innerText;
                }

            }

            if (house.price != null) {
                houseList.push(house);
            }

        } 
        return callback(houseList);
    }

    function getCoords(address) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: mapsHost + '?address=' + gmapEncode(address) + '&key=' + googleMapsKey
        }).then(function successCallback(response) {
            var coords = response.data.results[0].geometry.location;
            return deferred.resolve({
                latitude: coords.lat,
                longitude: coords.lng
            });

        }, function errorCallback(response) {
            return deferred.reject(null);
        });
        return deferred.promise;
    }



    function toString(string) {
        return string + '';
    }


});