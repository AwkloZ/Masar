<?php
require_once __DIR__ . '/../Models/AppUser.php';
require_once __DIR__ . '/BaseController.php';

class AuthController extends BaseController {

    public function register() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['firstName']) || empty($data['lastName']) ||
            empty($data['email']) || empty($data['password']) || empty($data['gender'])) {
            $this->sendResponse(['success' => false, 'message' => 'All fields are required'], 400);
            return;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $this->sendResponse(['success' => false, 'message' => 'Invalid email format'], 400);
            return;
        }

        if (strlen($data['password']) < 6) {
            $this->sendResponse(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
            return;
        }
        
        $gender = strtolower($data['gender']);
        if (!in_array($gender, ['male', 'female'])) {
            $this->sendResponse(['success' => false, 'message' => 'Invalid gender selection'], 400);
            return;
        }

        $user = new AppUser();

        if ($user->emailExists($data['email'])) {
            $this->sendResponse(['success' => false, 'message' => 'Email already registered'], 409);
            return;
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        $userId = $user->create([
            'firstName' => $data['firstName'],
            'lastName'  => $data['lastName'],
            'email'     => $data['email'],
            'password'  => $hashedPassword,
            'gender'    => $gender 
        ]);

        if ($userId) {
            $this->sendResponse(['success' => true, 'message' => 'Registration successful', 'userId' => $userId], 201);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Registration failed'], 500);
        }
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['email']) || empty($data['password'])) {
            $this->sendResponse(['success' => false, 'message' => 'Email and password are required'], 400);
            return;
        }

        $user = new AppUser();
        $userData = $user->getByEmail($data['email']);

        if (!$userData) {
            $this->sendResponse(['success' => false, 'message' => 'Invalid email or password'], 401);
            return;
        }

        if (password_verify($data['password'], $userData['PasswordHash'])) {
            unset($userData['PasswordHash']);
            $this->sendResponse(['success' => true, 'message' => 'Login successful', 'user' => $userData]);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Invalid email or password'], 401);
        }
    }
}
?>
