
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
  
});

export const registerUser = (data) =>
  api.post("/auth/register", data);

export const loginUser = (data) =>
  api.post("/auth/login", data);

export const logoutUser = () =>
  api.post("/auth/logout");

export const getMusics = () =>
  api.get("/music");

export const getAlbums = () =>
  api.get("/music/albums");

export const uploadMusic = (title, file) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("music", file);

  return api.post("/music/upload", formData);
};

export const createAlbum = (title, musics) =>
  api.post("/music/album", { title, musics });

export default api;
