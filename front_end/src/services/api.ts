const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3000");

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401 && endpoint !== "/api/login") {
    let errorMessage = "Tài khoản của bạn đã được đăng nhập trên một thiết bị khác hoặc phiên đã hết hạn.";
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      console.warn("Could not parse 401 error message", e);
    }
    
    console.warn("Session expired or invalid token. Clearing session.");
    alert(errorMessage);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    // Use a small delay before reload to ensure storage is cleared
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
    throw new Error(errorMessage);
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Có lỗi xảy ra");
  }
  return response.json();
};
