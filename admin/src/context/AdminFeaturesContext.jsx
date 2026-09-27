import { createContext, useContext } from "react";

const AdminFeaturesContext = createContext({
  features: {},
  featuresLoading: true,
});

export function AdminFeaturesProvider({ features, featuresLoading, children }) {
  return (
    <AdminFeaturesContext.Provider value={{ features, featuresLoading }}>
      {children}
    </AdminFeaturesContext.Provider>
  );
}

export function useAdminFeatures() {
  return useContext(AdminFeaturesContext);
}

export function isWhatsAppEnabled(features) {
  return features?.whatsapp === true;
}
