import axios from "axios";

/**
 * Axios client for Next.js API routes (which proxy to the Spring backend).
 * Credentials (httpOnly cookies) are sent automatically with every request.
 */
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Dodajemy globalny mechanizm przechwytywania odpowiedzi (Interceptor)
api.interceptors.response.use(
  (response) => {
    // Jeśli status to 2xx (sukces), po prostu puszczamy odpowiedź dalej
    return response;
  },
  async (error) => {
    // Jeśli serwer zwrócił błąd 401 (Unauthorized / wygasła sesja)
    if (error.response && error.response.status === 401) {
      // Zabezpieczenie przed wywołaniem po stronie serwera (Next.js SSR)
      if (typeof window !== "undefined") {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
          // Ignorujemy ew. błędy przy czyszczeniu sesji
        }

        window.location.href = "/auth?expired=true";
      }
    }

    // Odrzucamy obietnicę, aby komponent wywołujący (np. blok try/catch w formularzu) 
    // również wiedział, że wystąpił błąd (żeby np. zdjąć stan "loading")
    return Promise.reject(error);
  }
);

export default api;