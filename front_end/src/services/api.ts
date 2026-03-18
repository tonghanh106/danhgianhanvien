const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3000");

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Tự động gửi cookie session_id kèm theo mỗi request
  });

  if (response.status === 401 && endpoint !== "/api/login") {
    let errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      console.warn("Could not parse 401 error message", e);
    }

    console.warn("Session expired or invalid. Clearing local state.");
    alert(errorMessage);
    sessionStorage.removeItem("user");
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
