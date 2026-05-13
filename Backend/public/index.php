<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../routes/api.php';

$router = new Router();

// Auth routes
$router->add('POST', '/auth/register', 'AuthController@register');
$router->add('POST', '/auth/login',    'AuthController@login');

// User routes 

$router->add('GET',    '/users/([0-9]+)/challenges', 'ChallengeController@getUserChallenges');
$router->add('PUT',    '/users/([0-9]+)/password',   'UserController@changePassword');
$router->add('GET',    '/users/([0-9]+)',             'UserController@getProfile');
$router->add('PUT',    '/users/([0-9]+)',             'UserController@updateProfile');

// Track routes
$router->add('GET',  '/tracks',             'TrackController@getAllTracks');
$router->add('GET',  '/tracks/([0-9]+)',    'TrackController@getTrack');
$router->add('POST', '/tracks',             'TrackController@createTrack');
$router->add('POST', '/tracks/add-media',   'TrackController@addMedia');

// Track ratings
$router->add('POST', '/tracks/([0-9]+)/ratings', 'RatingController@submitRating');
$router->add('POST', '/tracks/ratings/([0-9]+)/delete', 'RatingController@deleteRating');

// Amenity routes
$router->add('GET',  '/amenities',                       'AmenityController@getAllAmenities');

// Sport types
$router->add('GET', '/sport-types',     'SportTypeController@getAllSportTypes');
$router->add('GET', '/surface-types',   'SportTypeController@getAllSurfaceTypes');
$router->add('GET', '/lighting-types',  'SportTypeController@getAllLightingTypes');

// Challenge routes
$router->add('POST',   '/challenges/([0-9]+)/join',  'ChallengeController@join');
$router->add('DELETE', '/challenges/([0-9]+)/join',  'ChallengeController@unjoin');
$router->add('GET',    '/challenges',                'ChallengeController@getAll');
$router->add('POST',   '/challenges',                'ChallengeController@create');
$router->add('GET',    '/challenges/([0-9]+)',        'ChallengeController@getById');
$router->add('DELETE', '/challenges/([0-9]+)',        'ChallengeController@delete');

// Favourite routes
$router->add('POST', '/favourites', 'FavouriteController@add');
$router->add('DELETE', '/favourites', 'FavouriteController@remove');
$router->add('GET', '/favourites/check', 'FavouriteController@check');
$router->add('GET', '/users/([0-9]+)/favourites', 'FavouriteController@getUserFavourites');

//  Report Route
$router->add('POST', '/reports', 'ReportController@submitReport');

//  Admin Route
$router->add('GET', '/admin/reports', 'AdminController@getPendingReports');
$router->add('POST', '/admin/moderate', 'AdminController@moderateItem');
$router->add('GET', '/admin/reports/item', 'AdminController@getReportedItem');

$router->add('POST', '/track-edits/submit', 'TrackEditController@submitRequest');
$router->add('GET', '/track-edits/pending', 'TrackEditController@getPending');
$router->add('POST', '/track-edits/review', 'TrackEditController@reviewRequest');
$router->route();
?>
