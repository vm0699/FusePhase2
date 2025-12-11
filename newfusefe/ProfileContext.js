import React, { createContext, useState, useContext } from 'react';

// Create the ProfileContext
export const ProfileContext = createContext();

// Custom hook to access the ProfileContext more easily
export const useProfile = () => useContext(ProfileContext);

// ProfileProvider component to wrap your app or specific parts of it
export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    number: '', // Phone number
    intro: { name: '', dob: '' }, // User's name and date of birth
    options: { username: '', gender: '', reason: '' }, // Optional user info
    profileDetails: { height: '', interests: [], values: [] }, // Detailed profile setup
    prompts: [], // List of selected prompts
    photos: [], // List of uploaded photos
  });

  const [hasPendingChats, setHasPendingChats] = useState(false); // ✅ red dot tracker

  // Update a specific key in the profile data
  const updateProfileData = (key, value) => {
    if (typeof key === 'string') {
      // For single key-value update
      setProfileData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    } else if (typeof key === 'object') {
      // For batch updates if an object is passed
      setProfileData((prevData) => ({
        ...prevData,
        ...key,
      }));
    }
  };

  // Update nested fields (e.g., intro.name)
  const updateNestedProfileData = (parentKey, childKey, value) => {
    setProfileData((prevData) => ({
      ...prevData,
      [parentKey]: {
        ...prevData[parentKey],
        [childKey]: value,
      },
    }));
  };

  // ✅ Set full profile from backend response
  const setFullProfile = (fullProfileObj) => {
    setProfileData({
      number: fullProfileObj.phoneNumber || '',
      intro: {
        name: fullProfileObj.name || '',
        dob: fullProfileObj.dateOfBirth || '',
      },
      options: {
        username: fullProfileObj.username || '',
        gender: fullProfileObj.gender || '',
        reason: fullProfileObj.reason || '',
      },
      profileDetails: {
        height: fullProfileObj.height || '',
        interests: fullProfileObj.interests || [],
        values: fullProfileObj.values || [],
      },
      prompts: fullProfileObj.prompts || [],
      photos: fullProfileObj.photos || [],
    });
  };

  // Reset the profile to default state
  const resetProfileData = () => {
    setProfileData({
      number: '',
      intro: { name: '', dob: '' },
      options: { username: '', gender: '', reason: '' },
      profileDetails: { height: '', interests: [], values: [] },
      prompts: [],
      photos: [],
    });
    setHasPendingChats(false);
  };

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        updateProfileData,
        updateNestedProfileData,
        resetProfileData,
        setFullProfile,
        hasPendingChats,
        setHasPendingChats,
      }}
    >
      {children || <React.Fragment />}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;
