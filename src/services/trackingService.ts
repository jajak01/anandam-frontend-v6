import axios from "axios";

// Dedicated API for tracking service
const trackingApi = axios.create({
  baseURL: "https://api.anandamcomputer.com/api/v1/public/tracking",
  timeout: 20000,
});

export const getServiceTracking = async (token: string) => {
  const res = await trackingApi.get(`/${token}`);
  return res.data;
};

export const getTrackingByPhone = async (phone: string) => {
  const res = await trackingApi.get(`/phone`, {
    params: { noTelepon: phone }
  });
  return res.data;
};
