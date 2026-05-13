<?php
class Router {
    private $routes = [];

    public function add($method, $path, $handler) {
        $this->routes[] = [$method, "#^" . $path . "$" . "#i", $handler];
    }

    public function route() {
        $method = $_SERVER["REQUEST_METHOD"];
        $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
        $path = str_replace('/masar-backend', '', $path);

        foreach ($this->routes as $route) {
            list($routeMethod, $routePath, $handler) = $route;
            if ($method === $routeMethod && preg_match($routePath, $path, $matches)) {
                list($controller, $action) = explode("@", $handler);
                require_once __DIR__ . "/../app/Controllers/{$controller}.php";
                $controllerInstance = new $controller();
                array_shift($matches);
                call_user_func_array([$controllerInstance, $action], $matches);
                return;
            }
        }

        http_response_code(404);
        echo json_encode(["message" => "Not Found"]);
    }
}
?>
