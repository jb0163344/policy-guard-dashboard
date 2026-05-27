export const profiles = {
  law: {
    label: "Law Firm",
    threshold: 60,
    weights: {
      failedLogins: 30,
      locationChange: 20,
      deviceUnknown: 25,
      impossibleTravel: 20,
    },
  },

  clinic: {
    label: "Clinic",
    threshold: 50,
    weights: {
      failedLogins: 20,
      locationChange: 15,
      deviceUnknown: 40,
      impossibleTravel: 15,
    },
  },

  government: {
    label: "Government",
    threshold: 40,
    weights: {
      failedLogins: 40,
      locationChange: 30,
      deviceUnknown: 35,
      impossibleTravel: 50,
    },
  },

  business: {
    label: "Business",
    threshold: 70,
    weights: {
      failedLogins: 15,
      locationChange: 10,
      deviceUnknown: 20,
      impossibleTravel: 10,
    },
  },
};
