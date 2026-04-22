import { useEffect, useRef } from "react";
export default function useTrackActivity(user_id) {
  console.log("Hook loaded with user:", user_id) 
  const lastUpdated = useRef(null);

  useEffect(() => {
    if (!user_id) return;
    const updateActivity = async () => {

      // console.log("Activity update triggered");
      // console.log("CLICK ACTIVITY", user_id)

      const now = Date.now();

      // update every 5 minutes
     if (lastUpdated.current && now - lastUpdated.current < 5 * 60 * 1000) {
       return;
     }

      lastUpdated.current = now;

      try {
        const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:8080" : "https://lms-project-production-ba53.up.railway.app";
        await fetch(`${API}/api/users/${user_id}/last-active`, {
          method: "PATCH"
        });
      } catch (err) {
        console.error("Activity update failed", err);
      }

    };

    // update immediately when dashboard loads
    updateActivity();

    // update on user activity
    window.addEventListener("click", updateActivity);

    return () => {
      window.removeEventListener("click", updateActivity);
    };

  }, [user_id]);

}