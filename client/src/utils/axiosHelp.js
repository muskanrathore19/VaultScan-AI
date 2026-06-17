// // utils/axios.js
// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
//   withCredentials: true, // for cookies
// });

// // attach token
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   console.log(token)
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // handle refresh automatically
// api.interceptors.response.use(
//   (res) => res,
//   async (err) => {
//     const originalRequest = err.config;

//     if (err.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const res = await axios.post(
//           "http://localhost:5000/api/auth/refresh",
//           {},
//           { withCredentials: true }
//         );

//         localStorage.setItem("token", res.data.accessToken);

//         originalRequest.headers.Authorization =
//           "Bearer " + res.data.accessToken;

//         return api(originalRequest);
//       } catch (e) {
//         console.log(e)
//         window.location.href = "/login";
//       }
//     }

//     return Promise.reject(err);
//   }
// );

// export default api;

// utils/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log("========== REQUEST ==========");
    console.log("URL:", config.url);
    console.log("METHOD:", config.method);
    console.log("TOKEN EXISTS:", !!token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "AUTH HEADER:",
        `Bearer ${token.substring(0, 20)}...`
      );
    }

    return config;
  },
  (error) => {
    console.log("REQUEST ERROR:", error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    console.log("========== RESPONSE ==========");
    console.log("URL:", response.config.url);
    console.log("STATUS:", response.status);

    return response;
  },

  async (err) => {
    console.log("========== RESPONSE ERROR ==========");
    console.log("URL:", err.config?.url);
    console.log("STATUS:", err.response?.status);
    console.log("DATA:", err.response?.data);

    const originalRequest = err.config;

    if (
      err.response?.status === 401 &&
      !originalRequest._retry
    ) {
      console.log("401 DETECTED");
      console.log("ATTEMPTING TOKEN REFRESH...");

      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          {
            withCredentials: true,
          }
        );

        console.log("REFRESH SUCCESS");
        console.log(
          "NEW TOKEN:",
          refreshResponse.data.accessToken?.substring(0, 20) + "..."
        );

        localStorage.setItem(
          "token",
          refreshResponse.data.accessToken
        );

        originalRequest.headers.Authorization =
          `Bearer ${refreshResponse.data.accessToken}`;

        console.log("RETRYING ORIGINAL REQUEST:", originalRequest.url);

        return api(originalRequest);
      } catch (refreshError) {
        console.log("========== REFRESH FAILED ==========");
        console.log("STATUS:", refreshError.response?.status);
        console.log("DATA:", refreshError.response?.data);
        console.log("FULL ERROR:", refreshError);

        localStorage.removeItem("token");

        // window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;