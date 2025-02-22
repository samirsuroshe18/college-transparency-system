import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Search, Building2, Users, Calendar, Info } from "lucide-react";
import { getFacilities } from "../../api/facilityBookingApi";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getFacilities(setLoading, dispatch);
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
      }
    };
    fetchData();
  }, []);

  const categories = [
    { id: "all", label: "All Facilities", icon: Building2 },
    { id: "classroom", label: "Classrooms", icon: Users },
    { id: "lab", label: "Laboratories", icon: Info },
    { id: "hall", label: "Halls", icon: Calendar },
  ];

  const filteredFacilities = facilities.filter(
    (facility) =>
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === "all" || facility.category === selectedCategory)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Campus Facilities
        </h1>
        <p className="text-gray-600">
          Browse and book available facilities across campus
        </p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search facilities..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <Card key={facility._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-semibold">
                {facility.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {facility.category || "General"}
                </span>
                <span className="text-sm text-gray-500">
                  {facility.capacity ? `Capacity: ${facility.capacity}` : ""}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{facility.description}</p>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Book Now
                </button>
                <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;