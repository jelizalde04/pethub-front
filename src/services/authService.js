import axiosClient from "../lib/axiosClient";

export const login = async (email, password) => {
  try {
    const response = await axiosClient.post("/auth/login", {
      email,
      password,
    });

    return response.data; // { token: "..."}
  } catch (error) {
    throw error?.response?.data || { detail: "Error desconocido" };
  }
};
