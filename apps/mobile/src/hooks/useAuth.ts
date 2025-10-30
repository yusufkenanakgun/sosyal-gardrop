import { useContext } from "react";
import { AuthContext } from "@/src/providers/auth-provider";

export const useAuth = () => useContext(AuthContext);
