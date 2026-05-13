<?php
class BaseController {
    protected function sendResponse($data, $statusCode = 200) {
        header("Content-Type: application/json");
        http_response_code($statusCode);
        echo json_encode($data);
    }
}
?>
