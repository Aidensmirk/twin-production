import axios from "axios";

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "https://twin-api.onrender.com";
const BASE_URL = `${configuredBaseUrl.replace(/\/$/, "")}/api`;

export const client = axios.create({ baseURL: BASE_URL });

function getTokens() {
  return {
    access: localStorage.getItem("twin_access"),
    refresh: localStorage.getItem("twin_refresh"),
  };
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("twin_access", access);
  if (refresh) localStorage.setItem("twin_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("twin_access");
  localStorage.removeItem("twin_refresh");
}

client.interceptors.request.use((config) => {
  const { access } = getTokens();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let refreshing = null;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const { refresh } = getTokens();

    if (error.response?.status === 401 && refresh && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${BASE_URL}/auth/refresh/`, { refresh })
            .then((res) => {
              setTokens({ access: res.data.access });
              return res.data.access;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const newAccess = await refreshing;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return client(original);
      } catch (refreshErr) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  register: (data) => client.post("/auth/register/", data),
  login: (data) => client.post("/auth/login/", data),
  me: () => client.get("/auth/me/"),

  onboardingQuestions: () => client.get("/questions/onboarding/"),
  nextQuestion: () => client.get("/questions/next/"),
  generateQuestion: (category) => client.post("/questions/generate/", category ? { category } : {}),
  answerOnboarding: (question_id, text) =>
    client.post("/answers/onboarding/", { question_id, text }),

  startRound: (question_id) => client.post("/rounds/start/", { question_id }),
  submitRoundAnswer: (predictionId, text) =>
    client.post(`/rounds/${predictionId}/answer/`, { text }),

  dashboard: () => client.get("/dashboard/"),
  insights: () => client.get("/insights/"),
  history: () => client.get("/history/"),

  exportData: () => client.get("/privacy/export/"),
  deleteData: () => client.delete("/privacy/delete/"),
};
