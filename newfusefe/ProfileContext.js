import React, { createContext, useContext, useState } from 'react';

export const ProfileContext = createContext();
export const useProfile = () => useContext(ProfileContext);

const createInitialState = () => ({
  phoneNumber: '',
  number: '',
  name: '',
  username: '',
  gender: '',
  reason: '',
  dateOfBirth: '',
  dob: '',
  height: '',
  interests: [],
  values: [],
  prompts: [],
  photos: [],
});

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeProfileState = (input = {}, previous = createInitialState()) => {
  const next = {
    ...previous,
    ...input,
  };

  const resolvedPhoneNumber = next.phoneNumber || next.number || previous.phoneNumber || previous.number || '';
  const resolvedDob = next.dateOfBirth || next.dob || previous.dateOfBirth || previous.dob || '';

  next.phoneNumber = resolvedPhoneNumber;
  next.number = resolvedPhoneNumber;
  next.dateOfBirth = resolvedDob;
  next.dob = resolvedDob;
  next.interests = ensureArray(next.interests);
  next.values = ensureArray(next.values);
  next.prompts = ensureArray(next.prompts);
  next.photos = ensureArray(next.photos);

  return next;
};

const mergeLegacyShape = (patch = {}) => {
  const next = { ...patch };

  if (patch.intro && typeof patch.intro === 'object') {
    if (typeof patch.intro.name !== 'undefined') next.name = patch.intro.name;
    if (typeof patch.intro.dob !== 'undefined') {
      next.dateOfBirth = patch.intro.dob;
      next.dob = patch.intro.dob;
    }
    delete next.intro;
  }

  if (patch.options && typeof patch.options === 'object') {
    if (typeof patch.options.username !== 'undefined') next.username = patch.options.username;
    if (typeof patch.options.gender !== 'undefined') next.gender = patch.options.gender;
    if (typeof patch.options.reason !== 'undefined') next.reason = patch.options.reason;
    delete next.options;
  }

  if (patch.profileDetails && typeof patch.profileDetails === 'object') {
    if (typeof patch.profileDetails.height !== 'undefined') next.height = patch.profileDetails.height;
    if (typeof patch.profileDetails.interests !== 'undefined') next.interests = patch.profileDetails.interests;
    if (typeof patch.profileDetails.values !== 'undefined') next.values = patch.profileDetails.values;
    delete next.profileDetails;
  }

  return next;
};

const createCompatibilityProfile = (state) => ({
  ...state,
  number: state.phoneNumber,
  dob: state.dateOfBirth,
  intro: {
    name: state.name || '',
    dob: state.dateOfBirth || '',
  },
  options: {
    username: state.username || '',
    gender: state.gender || '',
    reason: state.reason || '',
  },
  profileDetails: {
    height: state.height || '',
    interests: ensureArray(state.interests),
    values: ensureArray(state.values),
  },
});

export const ProfileProvider = ({ children }) => {
  const [profileState, setProfileState] = useState(createInitialState);
  const [hasPendingChats, setHasPendingChats] = useState(false);

  const applyProfilePatch = (patch) => {
    setProfileState((prevState) => {
      const mergedPatch = mergeLegacyShape(patch);
      return normalizeProfileState(mergedPatch, prevState);
    });
  };

  const updateProfileData = (key, value) => {
    if (typeof key === 'string') {
      applyProfilePatch({ [key]: value });
      return;
    }

    if (key && typeof key === 'object') {
      applyProfilePatch(key);
    }
  };

  const updateNestedProfileData = (parentKey, childKey, value) => {
    if (parentKey === 'intro') {
      if (childKey === 'name') {
        applyProfilePatch({ name: value });
      } else if (childKey === 'dob') {
        applyProfilePatch({ dateOfBirth: value, dob: value });
      }
      return;
    }

    if (parentKey === 'options') {
      applyProfilePatch({ [childKey]: value });
      return;
    }

    if (parentKey === 'profileDetails') {
      applyProfilePatch({ [childKey]: value });
      return;
    }

    applyProfilePatch({ [parentKey]: { [childKey]: value } });
  };

  const setFullProfile = (fullProfileObj = {}) => {
    setProfileState((prevState) =>
      normalizeProfileState(mergeLegacyShape(fullProfileObj), prevState)
    );
  };

  const resetProfileData = () => {
    setProfileState(createInitialState());
    setHasPendingChats(false);
  };

  const profileData = createCompatibilityProfile(profileState);

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
