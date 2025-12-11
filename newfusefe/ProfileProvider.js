// ProfileProvider.js
import React, { createContext, useState, useContext } from 'react';

// Create the ProfileContext
export const ProfileContext = createContext();

// Custom hook to easily access the context
//export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  console.log("ProfileProvider children:", children); // Debug children
  const [profileData, setProfileData] = useState({
    number: '', // Phone number
    intro: { name: '', dob: '' }, // User's name and date of birth
    options: { username: '', gender: '', reason: '' }, // Optional user info
    profileDetails: { height: '', interests: [], values: [] }, // Detailed profile setup
    prompts: [], // List of selected prompts
    photos: [], // List of uploaded photos
  });

  // Function to update the entire profile or a specific field
  const updateProfileData = (key, value) => {
    if (typeof key === 'string') {
      // Update a single key
      setProfileData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    } else if (typeof key === 'object') {
      // Update multiple keys (if an object is passed)
      setProfileData((prevData) => ({
        ...prevData,
        ...key,
      }));
    }
  };

  // Function to update nested keys (e.g., intro.name)
  const updateNestedProfileData = (parentKey, childKey, value) => {
    setProfileData((prevData) => ({
      ...prevData,
      [parentKey]: {
        ...prevData[parentKey],
        [childKey]: value,
      },
    }));
  };

  // Function to reset the profile to default state
  const resetProfileData = () => {
    setProfileData({
      number: '',
      intro: { name: '', dob: '' },
      options: { username: '', gender: '', reason: '' },
      profileDetails: { height: '', interests: [], values: [] },
      prompts: [],
      photos: [],
    });
  };

  // Provide state and functions to children
  return (
    <ProfileContext.Provider value={{ profileData, updateProfileData, updateNestedProfileData, resetProfileData }}>
      {children || <React.Fragment />}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;
