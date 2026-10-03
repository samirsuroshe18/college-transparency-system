import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Loader2, Search, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFacility, listFacilities, updateFacility } from "../../api/bookingApi";
import { errorMessage } from "../../api/client";
import useToast from "../../utils/useToast";

const emptyFacility = () => ({ name: "", description: "", location: "" });
const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

// The facilities of the college. Students and faculty book from here; an admin
// adds facilities and takes them out of use.
const Dashboard = () => {
  const user = useSelector((state) => state.auth.userData);
  const toast = useToast();
  const isAdmin = user.role === "admin";
  const canBook = user.role === "student" || user.role === "faculty";

  const [facilities, setFacilities] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(emptyFacility);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setFacilities(await listFacilities());
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.description.trim() || !form.location.trim()) {
      setFormError("Name, description and location are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await createFacility(form);
      toast.success(res.message);
      setForm(emptyFacility());
      await load();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (facility) => {
    setBusyId(facility._id);
    try {
      await updateFacility(facility._id, { available: !facility.available });
      await load();
    } catch (error) {
      toast.error(error);
    } finally {
      setBusyId(null);
    }
  };

  if (facilities === null && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading facilities...</p>
        </div>
      </div>
    );
  }

  const filteredFacilities = (facilities || []).filter((facility) =>
    `${facility.name} ${facility.location}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto bg-gray-50 text-gray-900 min-h-screen">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Campus Facilities
          </h1>
          <p className="text-gray-600">
            Browse and book available facilities across campus
          </p>
        </div>
        <Link to="/facility-bookings" className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100">
          {isAdmin ? "Booking requests" : "All bookings"}
        </Link>
      </div>

      {loadError && <p role="alert" className="mb-6 text-red-600">{loadError}</p>}

      {isAdmin && (
        <form onSubmit={handleCreate} className="mb-8 p-4 md:p-6 bg-white rounded-lg border border-gray-200 shadow-sm" noValidate>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add a facility</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="facility-name" className="block text-sm text-gray-600 mb-1">Name</label>
              <input id="facility-name" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="facility-location" className="block text-sm text-gray-600 mb-1">Location</label>
              <input id="facility-location" maxLength={120} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="facility-description" className="block text-sm text-gray-600 mb-1">Description</label>
              <input id="facility-description" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={fieldClass} />
            </div>
          </div>
          {formError && <p role="alert" className="mt-3 text-sm text-red-600">{formError}</p>}
          <button type="submit" disabled={saving} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Adding…" : "Add facility"}
          </button>
        </form>
      )}

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          aria-label="Search facilities"
          placeholder="Search facilities..."
          className={`${fieldClass} pl-10`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {facilities !== null && filteredFacilities.length === 0 && (
        <p className="text-gray-500">{facilities.length === 0 ? "No facilities have been added yet." : "No facility matches your search."}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <Card key={facility._id} className="overflow-hidden hover:shadow-lg transition-shadow bg-white border-gray-200">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-semibold text-gray-900">
                {facility.name}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm px-2 py-1 rounded-full ${facility.available ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}`}>
                  {facility.available ? "Available" : "Not available"}
                </span>
                <span className="text-sm text-gray-500 inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {facility.location}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{facility.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                {canBook && facility.available && (
                  <Link to={`/facility-booking?facility=${facility._id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Book Now
                  </Link>
                )}
                {isAdmin && (
                  <button
                    onClick={() => toggleAvailable(facility)}
                    disabled={busyId === facility._id}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {facility.available ? "Mark not available" : "Mark available"}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
