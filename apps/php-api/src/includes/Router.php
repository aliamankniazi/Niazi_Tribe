<?php

class Router {
    private $routes = [];

    public function addRoute($method, $path, $handler) {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    public function handleRequest($method, $path) {
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $path, $matches)) {
                return $route['handler']($matches);
            }
        }
        
        // Return 404 if no route matches
        http_response_code(404);
        return [
            'status' => 'error',
            'message' => 'Endpoint not found'
        ];
    }

    public static function json($data, $status = 200) {
        http_response_code($status);
        return json_encode($data);
    }
} 