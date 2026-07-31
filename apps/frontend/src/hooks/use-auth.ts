import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  profile?: any;
  settings?: any;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("conrad_token"));

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data as User;
    },
    // Do not call the protected endpoint for visitors. Calling it without a
    // token triggers the 401 handler and used to reload the login page forever.
    enabled: hasToken,
    retry: false,
  });

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post("/auth/login", credentials);
      if (typeof window !== "undefined") {
        localStorage.setItem("conrad_token", data.token);
      }
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push(user.profile?.onboardingCompleted ? "/dashboard" : "/onboarding");
    },
  });

  const signup = useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      const { data: res } = await api.post("/auth/signup", data);
      if (typeof window !== "undefined") {
        localStorage.setItem("conrad_token", res.token);
      }
      return res.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/onboarding");
    },
  });

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("conrad_token");
    }
    queryClient.clear();
    router.push("/");
  };

  return { user, isLoading, login, signup, logout, isAuthenticated: !!user };
}
