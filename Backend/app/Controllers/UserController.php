<?php
require_once __DIR__ . '/../Models/AppUser.php';
require_once __DIR__ . '/BaseController.php';

class UserController extends BaseController {

    public function getProfile($id) {
        $user = new AppUser();
        $userData = $user->getById($id);
        if (!$userData) {
            $this->sendResponse(['success' => false, 'message' => 'User not found.'], 404);
            return;
        }
        $userData['trackCount'] = $user->getTrackCount($id);
        $userData['tracks']     = $user->getTracksByUser($id);
        $this->sendResponse(['success' => true, 'data' => $userData]);
    }

    public function updateProfile($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['firstName']) || empty($data['lastName'])) {
            $this->sendResponse(['success' => false, 'message' => 'firstName and lastName are required.'], 400);
            return;
        }

        $gender = null;
        if (isset($data['gender']) && in_array($data['gender'], ['male', 'female', 'other'])) {
            $gender = $data['gender'];
        }

        $user = new AppUser();
        if (!$user->getById($id)) {
            $this->sendResponse(['success' => false, 'message' => 'User not found.'], 404);
            return;
        }
        if ($user->updateProfile($id, trim($data['firstName']), trim($data['lastName']), $gender)) {
            $updated = $user->getById($id);
            $this->sendResponse(['success' => true, 'message' => 'Profile updated.', 'user' => $updated]);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Failed to update profile.'], 500);
        }
    }

    public function changePassword($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['currentPassword']) || empty($data['newPassword'])) {
            $this->sendResponse(['success' => false, 'message' => 'currentPassword and newPassword are required.'], 400);
            return;
        }
        if (strlen($data['newPassword']) < 6) {
            $this->sendResponse(['success' => false, 'message' => 'New password must be at least 6 characters.'], 400);
            return;
        }
        $user = new AppUser();
        $currentHash = $user->getPasswordHash($id);
        if (!$currentHash) {
            $this->sendResponse(['success' => false, 'message' => 'User not found.'], 404);
            return;
        }
        if (!password_verify($data['currentPassword'], $currentHash)) {
            $this->sendResponse(['success' => false, 'message' => 'Current password is incorrect.'], 401);
            return;
        }
        $newHash = password_hash($data['newPassword'], PASSWORD_DEFAULT);
        if ($user->changePassword($id, $newHash)) {
            $this->sendResponse(['success' => true, 'message' => 'Password changed successfully.']);
        } else {
            $this->sendResponse(['success' => false, 'message' => 'Failed to change password.'], 500);
        }
    }
}
?>
