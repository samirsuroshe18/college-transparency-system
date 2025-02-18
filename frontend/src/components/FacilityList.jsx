import { useEffect, useState } from "react";
import { getFacilities } from "../api";

const FacilityList = ({ onSelect }) => {
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    getFacilities().then(setFacilities);
  }, []);

  return (
    <div>
      <h2>Campus Facilities</h2>
      {facilities.map((facility) => (
        <div key={facility._id}>
          <h3>{facility.name}</h3>
          <p>{facility.description}</p>
          <button onClick={() => onSelect(facility)}>Book Now</button>
        </div>
      ))}
    </div>
  );
};

export default FacilityList;
