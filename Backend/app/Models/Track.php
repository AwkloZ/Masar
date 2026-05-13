<?php
require_once __DIR__ . '/BaseModel.php';

class Track extends BaseModel {
    protected $table = 'Track';

    public function getAll() {
        $query = "SELECT t.*, l.Latitude, l.Longitude, l.City, l.Address, l.Country,
                  s.SurfaceName, lt.LightingName,
                  u.FirstName, u.LastName
                  FROM Track t
                  LEFT JOIN Location l ON t.LocationID = l.LocationID
                  LEFT JOIN SurfaceType s ON t.SurfaceTypeID = s.SurfaceTypeID
                  LEFT JOIN LightingType lt ON t.LightingTypeID = lt.LightingTypeID
                  LEFT JOIN AppUser u ON t.UserID = u.UserID
                  ORDER BY t.DateSubmitted DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

   public function getById($id) {
        $query = "SELECT t.*, l.Latitude, l.Longitude, l.City, l.Address, l.Country,
                  s.SurfaceName, lt.LightingName,
                  u.FirstName, u.LastName
                  FROM Track t
                  LEFT JOIN Location l ON t.LocationID = l.LocationID
                  LEFT JOIN SurfaceType s ON t.SurfaceTypeID = s.SurfaceTypeID
                  LEFT JOIN LightingType lt ON t.LightingTypeID = lt.LightingTypeID
                  LEFT JOIN AppUser u ON t.UserID = u.UserID
                  WHERE t.TrackID = :id";
                  
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt;
    }

  
        
    public function create($data, $sportTypes = [], $amenityIds = []) {
        $locationId = $this->createLocation($data);

        $query = "INSERT INTO Track
                  (UserID, TrackName, Description, Length_km, SurfaceTypeID, LightingTypeID, Difficulty, LocationID, DateSubmitted, RoutePoints)
                  VALUES (:userID, :trackName, :description, :length, :surface, :lighting, :difficulty, :location, NOW(), :routePoints)";
        $stmt = $this->conn->prepare($query);

        $surface     = !empty($data['surface'])     ? $data['surface']     : null;
        $lighting    = !empty($data['lighting'])    ? $data['lighting']    : null;
        $diff        = !empty($data['difficulty'])  ? $data['difficulty']  : null;
        $length      = !empty($data['length'])      ? $data['length']      : null;
        $routePoints = !empty($data['routePoints']) ? $data['routePoints'] : null; 

        $stmt->bindParam(':userID',      $data['userID']);
        $stmt->bindParam(':trackName',   $data['trackName']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':length',      $length);
        $stmt->bindParam(':surface',     $surface);
        $stmt->bindParam(':lighting',    $lighting);
        $stmt->bindParam(':difficulty',  $diff);
        $stmt->bindParam(':location',    $locationId);
        $stmt->bindParam(':routePoints', $routePoints); 

        if ($stmt->execute()) {
            $trackId = $this->conn->lastInsertId();

            if (!empty($sportTypes)) {
                $this->addSportTypes($trackId, $sportTypes);
            }
            if (!empty($amenityIds)) {
                $this->addAmenities($trackId, $amenityIds);
            }

            return $trackId;
        }
        return false;
    }

    private function createLocation($data) {
        if (!empty($data['location']) && is_numeric($data['location'])) {
            return (int)$data['location'];
        }

        $lat     = !empty($data['latitude'])  ? $data['latitude']  : 24.7136;
        $lng     = !empty($data['longitude']) ? $data['longitude'] : 46.6753;
        $city    = !empty($data['city'])      ? $data['city']      : 'Riyadh';
        $country = !empty($data['country'])   ? $data['country']   : 'Saudi Arabia';
        $address = !empty($data['address'])   ? $data['address']   : '';

        $query = "INSERT INTO Location (Address, City, Country, Latitude, Longitude)
                  VALUES (:address, :city, :country, :lat, :lng)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':address', $address);
        $stmt->bindParam(':city',    $city);
        $stmt->bindParam(':country', $country);
        $stmt->bindParam(':lat',     $lat);
        $stmt->bindParam(':lng',     $lng);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }

    private function addSportTypes($trackId, $sportTypes) {
        $query = "INSERT INTO TrackSport (TrackID, SportTypeID) VALUES (:trackId, :sportTypeId)";
        $stmt = $this->conn->prepare($query);
        foreach ($sportTypes as $sportTypeId) {
            $stmt->bindParam(':trackId',     $trackId);
            $stmt->bindParam(':sportTypeId', $sportTypeId);
            $stmt->execute();
        }
    }

    private function addAmenities($trackId, $amenityIds) {
        $query = "INSERT INTO TrackAmenity (TrackID, AmenityID) VALUES (:trackId, :amenityId)";
        $stmt = $this->conn->prepare($query);
        foreach ($amenityIds as $amenityId) {
            $stmt->bindParam(':trackId',   $trackId);
            $stmt->bindParam(':amenityId', $amenityId);
            $stmt->execute();
        }
    }

    public function getSportTypesByTrackId($trackId) {
        $query = "SELECT st.SportTypeID, st.SportName
                  FROM TrackSport ts
                  JOIN SportType st ON ts.SportTypeID = st.SportTypeID
                  WHERE ts.TrackID = :trackId";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':trackId', $trackId);
        $stmt->execute();
        return $stmt;
    }

    public function getAmenitiesByTrackId($trackId) {
        $query = "SELECT a.AmenityID, a.AmenityKey, a.AmenityName, a.AmenityIcon, a.Category
                  FROM TrackAmenity ta
                  JOIN Amenity a ON ta.AmenityID = a.AmenityID
                  WHERE ta.TrackID = :trackId
                  ORDER BY a.Category, a.AmenityName";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':trackId', $trackId);
        $stmt->execute();
        return $stmt;
    }

    public function getRatingsByTrackId($trackId) {
        $query = "SELECT r.RatingID,r.UserID, r.RatingValue, r.ReviewText, r.DatePosted,
                         u.FirstName, u.LastName
                  FROM TrackRating r
                  JOIN AppUser u ON r.UserID = u.UserID
                  WHERE r.TrackID = :trackId
                  ORDER BY r.DatePosted DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':trackId', $trackId);
        $stmt->execute();
        return $stmt;
    }

   
    public function getMediaByTrackId($trackId) {
        $query = "SELECT * FROM Media WHERE TrackID = :trackId";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':trackId', $trackId);
        $stmt->execute();
        return $stmt;
    }
    
}
?>
