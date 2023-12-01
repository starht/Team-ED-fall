import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RatingCard from "../components/Card/RatingCard";
import VisibleCard from "../components/Card/VisibleCard";
import Modal from "../components/Modal";
import markerImg from "../assets/marker.png";
import Pagination from "@mui/material/Pagination";
import "../styles/pages/Rating.css";
import "../styles/components/Modal.css";

function Rating() {
  const [cardData, setCardData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [visibleLocations, setVisibleLocations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;
  const mapContainerRef = useRef(null);
  const {
    name,
    hasBooking,
  } = cardData;

  useEffect(() => {
    fetchHighestRatedPracticeRooms();
    fetchAllPracticeLocations();
    getUserLocation();

    return () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.removeEventListener(
          "moveend",
          handleMapMoveEnd
        );
      }
    };
  }, []);

  const fetchHighestRatedPracticeRooms = async () => {
    try {
      const response = await fetch(
        "http://43.200.181.187:8080/practice-rooms/sorted-by-rating?page=0&size=4"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch highest-rated practice rooms");
      }
      const data = await response.json();
      setCardData(data.content || []);
    } catch (error) {
      console.error("Error fetching highest-rated practice rooms:", error);
    }
  };

  const fetchAllPracticeLocations = async () => {
    try {
      const response = await fetch(
        "http://43.200.181.187:8080/practice-rooms/sorted-by-name?page=0&size=1000"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch practice room locations");
      }
      const data = await response.json();
      setLocationData(data.content || []);
    } catch (error) {
      console.error("Error fetching practice room locations:", error);
    }
  };

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        //console.log("User location set:", { lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting user location:", error);
      }
    );
  };

  const handleMarkerHover = (location) => {
    setHoveredLocation(location);
  };

  const handleMarkerHoverOut = () => {
    setHoveredLocation(null);
  };

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  const handleModalClose = () => {
    setSelectedLocation(null);
  };

  const renderMapMarkers = () => {
    return locationData.map((location, index) => (
      <Marker
        key={index}
        position={[parseFloat(location.y), parseFloat(location.x)]}
        icon={L.icon({
          iconUrl: markerImg,
          iconSize: [25, 30],
        })}
        eventHandlers={{
          click: () => handleMarkerClick(location),
          mouseover: () => handleMarkerHover(location),
          mouseout: () => handleMarkerHoverOut(),
        }}
      >
        <Tooltip
          className="custom_tooltip"
          permanent={true}
          direction="top"
          offset={[0, -10]}
        >
          {hoveredLocation === location && (
            <div>
              <h5>{location.name}</h5>
            </div>
          )}
        </Tooltip>
      </Marker>
    ));
  };

  const handleMapMoveEnd = (event) => {
    const bounds = event.target.getBounds();

    const visibleLocations = locationData.filter((location) => {
      const latLng = L.latLng(parseFloat(location.y), parseFloat(location.x));
      return bounds.contains(latLng);
    });

    setVisibleLocations(visibleLocations);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.addEventListener("moveend", handleMapMoveEnd);
  
      return () => {
        if (mapContainerRef.current) {
          mapContainerRef.current.removeEventListener(
            "moveend",
            handleMapMoveEnd
          );
        }
      };
    }
  }, [mapContainerRef.current, locationData]);

  const renderCards = () => {
    return cardData.map((card, index) => (
      <RatingCard
        key={index}
        title={card.name}
        cost={card.cost}
        locate={card.fullAddress}
        content={<img src={card.imageUrl} alt="사진이 없습니다." />}
        rating={card.visitorReviewScore}
      />
    ));
  };

  const renderVisibleCards = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const visibleLocationsSlice = visibleLocations.slice(startIndex, endIndex);

    return visibleLocationsSlice.map((location, index) => (
      <VisibleCard
        key={index}
        title={location.name}
        cost={location.cost}
        locate={location.fullAddress}
        content={<img src={location.imageUrl} alt="사진이 없습니다." />}
        rating={location.visitorReviewScore}
      />
    ));
  };

  const totalPages = Math.ceil(visibleLocations.length / pageSize);

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : null;
  //console.log('User location:', userLocation);

  useEffect(() => {
    //console.log('Map Center Updated:', mapCenter);
  }, [mapCenter]);

  return (
    <div>
      <Header />
      {mapCenter && (
        <MapContainer
          center={mapCenter}
          zoom={16}
          style={{ height: "400px", paddingTop: "10px", zIndex: "1" }}
          ref={mapContainerRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {renderMapMarkers()}
        </MapContainer>
      )}

      <div>
      <div className="title_wrap">
        <div className="rating_title">
          평점 높은 합주실을 찾아보세요
        </div>
        </div>
        <div className="rating_card_pack">{renderCards()}</div>
      </div>
      <div>
        <div className="title_wrap">
        <div className="rating_title">
          주변 합주실을 찾아보세요
        </div>
        </div>
        <div className="visible_card_pack">{renderVisibleCards()}</div>
        <div className="pagination">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, page) => setCurrentPage(page)}
          />
        </div>
      </div>

      <Modal isOpen={!!selectedLocation} onClose={handleModalClose}>
        {selectedLocation && (
          <div className="modal-content">
            <h2 className="modal-title">{selectedLocation.name}</h2>
            <div className="modal-img-box">
              <img
                className="modal-image"
                src={selectedLocation.imageUrl}
                alt={name}
              />
            </div>

            <div className="modal-details">
              <p>
                <strong>주소:</strong> {selectedLocation.fullAddress}
              </p>
              <p>
                <strong>연락처:</strong>{" "}
                {selectedLocation.phone || selectedLocation.virtualPhone}
              </p>
              <p>
                <strong>방문자 평점:</strong>{" "}
                {selectedLocation.visitorReviewScore
                  ? selectedLocation.visitorReviewScore
                  : "-"}
              </p>
              <button
                onClick={() =>
                  window.open(selectedLocation.bookingUrl, "_blank")
                }
                disabled={hasBooking !== "True"}
              >
                예약 페이지로 이동
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Footer />
    </div>
  );
}

export default Rating;
