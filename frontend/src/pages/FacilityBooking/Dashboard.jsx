import { useEffect, useState } from "react";
import { getFacilities } from "../../api/facilityBookingApi";
import { useDispatch } from "react-redux";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch()
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getFacilities(setLoading, dispatch);
        // dispatch(login(res.data));
        setFacilities(res.data);
      } catch (error) {
        setLoading(false);
        dispatch(
          showNotificationWithTimeout({
            show: true,
            type: "error",
            message: handleAxiosError(error),
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className="p-4">
        <h1 className="text-2xl">Campus Facilities</h1>
        <ul>
          {facilities.map((facility) => (
            <li key={facility._id} className="p-2 border rounded my-2">
              <h3 className="text-lg font-bold">{facility.name}</h3>
              <p>{facility.description}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  export default Dashboard;