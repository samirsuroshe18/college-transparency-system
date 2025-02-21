import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI Button

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
    <div className="flex flex-col justify-center items-center p-4 h-screen">
      <h1 className="text-4xl font-semibold mb-12">Select Your Role</h1>

      <div className="flex flex-col w-full max-w-md">
        <Button
          variant="primary"
          className="mb-4 flex items-center justify-center"
          onClick={() => handleSelectRole('Student')}
        >
          Student
        </Button>

        <Button
          variant="secondary"
          className="flex items-center justify-center"
          onClick={() => handleSelectRole('Faculty')}
        >
          Faculty
        </Button>
      </div>
    </div>
  );
};

export default SelectRoleScreen;
