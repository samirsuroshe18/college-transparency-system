import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Clock, Search, Building2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cancelBooking, listBookings, listFacilities, requestBooking } from "../../api/bookingApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";

const plainFieldClass = "w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const fieldClass = "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const STATUS_STYLES = { pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-200 text-gray-600" };

const today = () => new Date().toISOString().split("T")[0];

// Request a facility for a day and a time, and follow your own requests
const BookingPage = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [facilities, setFacilities] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(searchParams.get("facility") || "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const [allFacilities, mine] = await Promise.all([listFacilities(), listBookings({ mine: true })]);
      setFacilities(allFacilities.filter((facility) => facility.available));
      setMyBookings(mine);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setFormError("");
    setBookingSuccess("");

    if (endTime <= startTime) {
      setFormError("The end time must be after the start time");
      return;
    }

    setLoading(true);
    try {
      const res = await requestBooking({ facility: selectedFacility, date, startTime, endTime, purpose });
      setBookingSuccess(res.message);
      setDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");
      await load();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (booking) => {
    try {
      const res = await cancelBooking(booking._id);
      toast.success(res.message);
      await load();
    } catch (error) {
      toast.error(error);
    }
  };

  const filteredFacilities = (facilities || []).filter((facility) =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const incomplete = !selectedFacility || !date || !startTime || !endTime || !purpose.trim();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-gray-50 text-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Facility Booking</h1>
        <p className="text-gray-600 mt-2">
          Book campus facilities for your events and activities.{" "}
          <Link to="/facility" className="text-blue-600 hover:underline">See all facilities</Link>
        </p>
      </div>

      {bookingSuccess && (
        <div role="status" className="mb-6 flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-green-700">
          <AlertCircle className="h-4 w-4" /> {bookingSuccess}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="order-2 md:order-1 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Available Facilities</CardTitle>
            <CardDescription className="text-gray-600">Select a facility to book</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="text" aria-label="Search facilities" placeholder="Search facilities..." className={fieldClass} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {facilities === null && <p className="text-gray-500">Loading facilities…</p>}
            {facilities !== null && filteredFacilities.length === 0 && <p className="text-gray-500">No facility is available.</p>}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredFacilities.map((facility) => (
                <button
                  type="button"
                  key={facility._id}
                  aria-pressed={selectedFacility === facility._id}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedFacility === facility._id
                      ? "bg-blue-50 border-2 border-blue-500"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                  onClick={() => setSelectedFacility(facility._id)}
                >
                  <span className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                    <span>
                      <span className="block font-medium text-gray-900">{facility.name}</span>
                      <span className="block text-sm text-gray-600">{facility.description}</span>
                      <span className="block text-xs text-gray-500">{facility.location}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 md:order-2 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Booking Details</CardTitle>
            <CardDescription className="text-gray-600">Select your preferred date and time</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBooking} className="space-y-4" noValidate>
              <div>
                <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input id="booking-date" type="date" className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} min={today()} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input id="start-time" type="time" className={fieldClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input id="end-time" type="time" className={fieldClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input id="purpose" type="text" maxLength={500} className={plainFieldClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What is the booking for?" />
              </div>

              {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={incomplete || loading}
                className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                  incomplete || loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Processing..." : "Request Booking"}
              </button>
              <p className="text-xs text-gray-500">An admin approves or rejects the request. You get a notice when it is decided.</p>
            </form>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mt-10 mb-4">Your requests</h2>
      {myBookings.length === 0 ? (
        <p className="text-gray-500">You have not requested a facility yet.</p>
      ) : (
        <ul className="space-y-2">
          {myBookings.map((booking) => (
            <li key={booking._id} className="p-4 bg-white border border-gray-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {booking.facility?.name}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[booking.status]}`}>{booking.status}</span>
                </p>
                <p className="text-sm text-gray-600">{booking.date}, {booking.startTime} to {booking.endTime} · {booking.purpose}</p>
                {booking.reason && <p className="text-sm text-red-600">Reason: {booking.reason}</p>}
              </div>
              {booking.status === "pending" && (
                <button onClick={() => handleCancel(booking)} className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm">
                  Cancel request
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookingPage;
