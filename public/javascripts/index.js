/// <reference path="../../typings/angularjs/angular.d.ts"/>
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 

var app = angular.module('drapp', []);
app.controller('MainCtrl', function ($scope, $http) {
    $http.post('/data', { limitnum: 10 }).success(function (data, status, headers, config) {
        // _.each(data, function (item, index, list) {
        //     var obj = {};
        //     obj.title = item.title;
        //     obj.content = item.content;
        //     contentarr.push(contentarr);
        // });
        $scope.data = data;
    }).error(function (data, status, headers, config) {

    });
});

app.filter('trustHtml', function($sce) {
    return function(input) {
        return $sce.trustAsHtml(input);
    };
});