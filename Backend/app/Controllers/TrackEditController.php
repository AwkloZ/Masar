<?php
require_once __DIR__ . '/../Models/TrackEditRequest.php';
require_once __DIR__ . '/../Models/Track.php';
require_once __DIR__ . '/BaseController.php';

class TrackEditController extends BaseController {

    
    public function submitRequest() {
        try {
            $data = json_decode(file_get_contents("php://input"), true);

            if (empty($data['trackId']) || empty($data['userId']) || empty($data['changes'])) {
                $this->sendResponse(['success' => false, 'message' => 'Missing data.'], 400);
                return;
            }

            $db = new Database();
            $conn = $db->connect();
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
            
            $stmt = $conn->prepare("SELECT * FROM Track WHERE TrackID = :trackId LIMIT 1");
            $stmt->bindParam(':trackId', $data['trackId']);
            $stmt->execute();
            $track = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$track) {
                $this->sendResponse(['success' => false, 'message' => 'Track not found.'], 404);
                return;
            }

            $trackOwnerId = $track['UserID'] ?? $track['userID'] ?? $track['CreatorID'] ?? null;

            if ($trackOwnerId == $data['userId']) {
                $updateFields = [];
                
                foreach ($data['changes'] as $key => $value) {
                    if ($key !== 'sportTypes' && $key !== 'amenity_ids') {
                        $updateFields[] = "$key = :val_$key";
                    }
                }
                
                if (!empty($updateFields)) {
                    $sql = "UPDATE Track SET " . implode(', ', $updateFields) . " WHERE TrackID = :trackId";
                    $updateStmt = $conn->prepare($sql);
                    $updateStmt->bindValue(':trackId', $data['trackId']);
                    
                    foreach ($data['changes'] as $key => $value) {
                        if ($key !== 'sportTypes' && $key !== 'amenity_ids') {
                            $updateStmt->bindValue(":val_$key", $value);
                        }
                    }
                    $updateStmt->execute();
                }

                if (isset($data['changes']['sportTypes'])) {
                    $delSport = $conn->prepare("DELETE FROM TrackSport WHERE TrackID = :trackId");
                    $delSport->bindValue(':trackId', $data['trackId']);
                    $delSport->execute();

                    if (!empty($data['changes']['sportTypes'])) {
                        $insSport = $conn->prepare("INSERT INTO TrackSport (TrackID, SportTypeID) VALUES (:trackId, :sportId)");
                        foreach ($data['changes']['sportTypes'] as $sportId) {
                            $insSport->bindValue(':trackId', $data['trackId']);
                            $insSport->bindValue(':sportId', $sportId);
                            $insSport->execute();
                        }
                    }
                }

                if (isset($data['changes']['amenity_ids'])) {
                    $delAmenity = $conn->prepare("DELETE FROM TrackAmenity WHERE TrackID = :trackId");
                    $delAmenity->bindValue(':trackId', $data['trackId']);
                    $delAmenity->execute();

                    if (!empty($data['changes']['amenity_ids'])) {
                        $insAmenity = $conn->prepare("INSERT INTO TrackAmenity (TrackID, AmenityID) VALUES (:trackId, :amenityId)");
                        foreach ($data['changes']['amenity_ids'] as $amenityId) {
                            $insAmenity->bindValue(':trackId', $data['trackId']);
                            $insAmenity->bindValue(':amenityId', $amenityId);
                            $insAmenity->execute();
                        }
                    }
                }

                $this->sendResponse(['success' => true, 'message' => 'Track and categories updated instantly! (Owner Bypass)']);
                return; 
            }

         
            $editModel = new TrackEditRequest();
            $changesJson = json_encode($data['changes']); 

            if ($editModel->createRequest($data['trackId'], $data['userId'], $changesJson)) {
                $this->sendResponse(['success' => true, 'message' => 'Edit request submitted for admin review']);
            } else {
                $this->sendResponse(['success' => false, 'message' => 'Failed to save to TrackEditRequest table.']);
            }
            
        } catch (PDOException $e) {
            $this->sendResponse(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()], 500);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }
    public function getPending() {
        try {
            $db = new Database();
            $conn = $db->connect();
            
            $sql = "SELECT r.*, t.TrackName, u.FirstName, u.LastName 
                    FROM TrackEditRequest r
                    JOIN Track t ON r.TrackID = t.TrackID
                    JOIN AppUser u ON r.UserID = u.UserID
                    WHERE r.Status = 'Pending'
                    ORDER BY r.DateRequested ASC";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($requests as &$req) {
                $req['ProposedChanges'] = json_decode($req['ProposedChanges'], true);
                
                $trackStmt = $conn->prepare("SELECT * FROM Track WHERE TrackID = :tid");
                $trackStmt->execute(['tid' => $req['TrackID']]);
                $originalTrack = $trackStmt->fetch(PDO::FETCH_ASSOC);
                $sportStmt = $conn->prepare("SELECT SportTypeID FROM TrackSport WHERE TrackID = :tid");
                $sportStmt->execute(['tid' => $req['TrackID']]);
                $originalTrack['sportTypes'] = $sportStmt->fetchAll(PDO::FETCH_COLUMN);

                $amenityStmt = $conn->prepare("SELECT AmenityID FROM TrackAmenity WHERE TrackID = :tid");
                $amenityStmt->execute(['tid' => $req['TrackID']]);
                $originalTrack['amenity_ids'] = $amenityStmt->fetchAll(PDO::FETCH_COLUMN);

                $req['OriginalTrack'] = $originalTrack;
            }

            $this->sendResponse(['success' => true, 'data' => $requests]);
            
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function reviewRequest() {
        try {
            $data = json_decode(file_get_contents("php://input"), true);

            if (empty($data['requestId']) || empty($data['action'])) {
                $this->sendResponse(['success' => false, 'message' => 'Missing data.'], 400);
                return;
            }

            $db = new Database();
            $conn = $db->connect();
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $conn->prepare("SELECT * FROM TrackEditRequest WHERE RequestID = :reqId LIMIT 1");
            $stmt->bindParam(':reqId', $data['requestId']);
            $stmt->execute();
            $request = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$request || $request['Status'] !== 'Pending') {
                $this->sendResponse(['success' => false, 'message' => 'Invalid or already processed request.'], 400);
                return;
            }

            if ($data['action'] === 'reject') {
                $rejStmt = $conn->prepare("UPDATE TrackEditRequest SET Status = 'Rejected' WHERE RequestID = :reqId");
                $rejStmt->bindParam(':reqId', $data['requestId']);
                $rejStmt->execute();
                $this->sendResponse(['success' => true, 'message' => 'Request rejected.']);
                return;
            }

            if ($data['action'] === 'approve') {
                $changes = json_decode($request['ProposedChanges'], true);
                $trackId = $request['TrackID'];

                $updateFields = [];
                
                foreach ($changes as $key => $value) {
                    if ($key !== 'sportTypes' && $key !== 'amenity_ids') {
                        $updateFields[] = "$key = :val_$key";
                    }
                }
                
                if (!empty($updateFields)) {
                    $sql = "UPDATE Track SET " . implode(', ', $updateFields) . " WHERE TrackID = :trackId";
                    $updateStmt = $conn->prepare($sql);
                    $updateStmt->bindValue(':trackId', $trackId);
                    foreach ($changes as $key => $value) {
                        if ($key !== 'sportTypes' && $key !== 'amenity_ids') {
                            $updateStmt->bindValue(":val_$key", $value);
                        }
                    }
                    $updateStmt->execute();
                }

                if (isset($changes['sportTypes'])) {
                    $conn->prepare("DELETE FROM TrackSport WHERE TrackID = $trackId")->execute();
                    if (!empty($changes['sportTypes'])) {
                        $insSport = $conn->prepare("INSERT INTO TrackSport (TrackID, SportTypeID) VALUES (:trackId, :sportId)");
                        foreach ($changes['sportTypes'] as $sportId) {
                            $insSport->bindValue(':trackId', $trackId);
                            $insSport->bindValue(':sportId', $sportId);
                            $insSport->execute();
                        }
                    }
                }

                if (isset($changes['amenity_ids'])) {
                    $conn->prepare("DELETE FROM TrackAmenity WHERE TrackID = $trackId")->execute();
                    if (!empty($changes['amenity_ids'])) {
                        $insAmenity = $conn->prepare("INSERT INTO TrackAmenity (TrackID, AmenityID) VALUES (:trackId, :amenityId)");
                        foreach ($changes['amenity_ids'] as $amenityId) {
                            $insAmenity->bindValue(':trackId', $trackId);
                            $insAmenity->bindValue(':amenityId', $amenityId);
                            $insAmenity->execute();
                        }
                    }
                }

                $appStmt = $conn->prepare("UPDATE TrackEditRequest SET Status = 'Approved' WHERE RequestID = :reqId");
                $appStmt->bindParam(':reqId', $data['requestId']);
                $appStmt->execute();

                $this->sendResponse(['success' => true, 'message' => 'Request approved and applied to the map!']);
            }
            
        } catch (PDOException $e) {
            $this->sendResponse(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()], 500);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }
}
?>