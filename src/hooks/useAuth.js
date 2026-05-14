import { useAuth as contextAuth } from "../contexts/AuthContext";

export const useAuth = () => {
  return contextAuth();
};