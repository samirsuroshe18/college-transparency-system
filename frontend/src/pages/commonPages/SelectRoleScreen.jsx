import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { GraduationCap, Users } from 'lucide-react';

const SelectRoleScreen = () => {
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    if (role === 'Student') {
      navigate('/student-profile');
    } else if (role === 'Faculty') {
      navigate('/faculty-profile');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Welcome to College Portal</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Select your role to access personalized features and resources
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto px-4">
          {/* Student Card */}
          <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500">
            <button
              onClick={() => handleSelectRole('Student')}
              className="w-full h-full p-6 md:p-8 text-left"
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                </div>
                <div className="text-sm text-gray-500">Student Portal →</div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 md:mb-4">Student Access</h2>
              <p className="text-sm md:text-base text-gray-600 mb-16 md:mb-20 line-clamp-2 md:line-clamp-none">
                Vote in elections, raise complaints, book facilities and file applications
              </p>
              
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                <span className="w-full bg-blue-600 hover:bg-blue-700 text-white block text-center rounded-md px-4 py-2 text-sm font-medium">
                  Continue as Student
                </span>
              </div>
            </button>
          </Card>

          {/* Faculty Card */}
          <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-500">
            <button
              onClick={() => handleSelectRole('Faculty')}
              className="w-full h-full p-6 md:p-8 text-left"
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="p-2 md:p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                </div>
                <div className="text-sm text-gray-500">Faculty Portal →</div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 md:mb-4">Faculty Access</h2>
              <p className="text-sm md:text-base text-gray-600 mb-16 md:mb-20 line-clamp-2 md:line-clamp-none">
                Review applications, record integrity cases and book facilities
              </p>
              
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                <span className="w-full bg-indigo-600 hover:bg-indigo-700 text-white block text-center rounded-md px-4 py-2 text-sm font-medium">
                  Continue as Faculty
                </span>
              </div>
            </button>
          </Card>
        </div>

        {/* Footer Section */}
        <div className="text-center mt-8 md:mt-12 text-gray-500">
          <p className="text-sm md:text-base">An admin reviews your profile before you can use the system.</p>
        </div>
      </div>
    </div>
  );
};

export default SelectRoleScreen;