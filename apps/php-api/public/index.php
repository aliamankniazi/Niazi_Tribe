<?php
// Initialize session
session_start();

// Load required files
require_once __DIR__ . '/../src/includes/Database.php';
require_once __DIR__ . '/../src/includes/Router.php';
require_once __DIR__ . '/../src/includes/Auth.php';
require_once __DIR__ . '/../src/includes/Security.php';
require_once __DIR__ . '/../src/controllers/FamilyTreeController.php';
require_once __DIR__ . '/../src/controllers/PersonController.php';
require_once __DIR__ . '/../src/controllers/AuthController.php';
require_once __DIR__ . '/../src/controllers/AdminController.php';
require_once __DIR__ . '/../src/middleware/RequestLogger.php';

// Set JSON response type
header('Content-Type: application/json');

// Set up security headers
Security::setupHeaders();

// Initialize request logger
$requestLogger = new RequestLogger();
$requestLogger->handle();

// Create router instance
$router = new Router();
$treeController = new FamilyTreeController();
$personController = new PersonController();

// Basic routes
$router->addRoute('GET', '#^/$#', function() {
    return [
        'status' => 'success',
        'message' => 'Welcome to the Niazi-Tribe API',
        'version' => '1.0'
    ];
});

// Auth routes
$router->post('/auth/login', [AuthController::class, 'login']);
$router->post('/auth/register', [AuthController::class, 'register']);
$router->post('/auth/logout', [AuthController::class, 'logout']);
$router->get('/auth/me', [AuthController::class, 'getCurrentUser']);
$router->post('/auth/reset-password', [AuthController::class, 'resetPassword']);
$router->post('/auth/change-password', [AuthController::class, 'changePassword']);

// Family Tree routes
$router->get('/trees', [FamilyTreeController::class, 'list']);
$router->post('/trees', [FamilyTreeController::class, 'create']);
$router->get('/trees/:id', [FamilyTreeController::class, 'get']);
$router->put('/trees/:id', [FamilyTreeController::class, 'update']);
$router->delete('/trees/:id', [FamilyTreeController::class, 'delete']);
$router->post('/trees/:id/share', [FamilyTreeController::class, 'share']);
$router->get('/trees/:id/stats', [FamilyTreeController::class, 'getTreeStatistics']);
$router->get('/trees/:id/export/:format', [FamilyTreeController::class, 'exportTreeData']);
$router->get('/trees/:id/duplicates', [FamilyTreeController::class, 'findPossibleDuplicates']);
$router->post('/trees/:id/merge', [FamilyTreeController::class, 'mergeDuplicates']);

// Person routes
$router->get('/trees/:treeId/persons', [PersonController::class, 'list']);
$router->post('/trees/:treeId/persons', [PersonController::class, 'create']);
$router->get('/trees/:treeId/persons/:id', [PersonController::class, 'get']);
$router->put('/trees/:treeId/persons/:id', [PersonController::class, 'update']);
$router->delete('/trees/:treeId/persons/:id', [PersonController::class, 'delete']);
$router->post('/trees/:treeId/persons/:id/relationships', [PersonController::class, 'addRelationship']);
$router->delete('/trees/:treeId/persons/:id/relationships/:relationshipId', [PersonController::class, 'removeRelationship']);

// Admin routes
$router->get('/admin/stats', [AdminController::class, 'getSystemStats']);
$router->get('/admin/health', [AdminController::class, 'getSystemHealth']);
$router->get('/admin/performance', [AdminController::class, 'getPerformanceReport']);
$router->post('/admin/logs/cleanup', [AdminController::class, 'cleanupLogs']);
$router->get('/admin/users/:id/activity', [AdminController::class, 'getUserActivity']);
$router->get('/admin/errors', [AdminController::class, 'getErrorReport']);

// Handle the request
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Parse the URI to extract the path
$uri_parts = parse_url($request_uri);
$path = $uri_parts['path'];

// Output the response
echo $router->handleRequest($request_method, $path); 