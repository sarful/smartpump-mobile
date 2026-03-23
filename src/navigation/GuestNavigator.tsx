import React, { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import { LoginScreen } from "../screens/LoginScreen";
import { GuestRoute } from "./guestRoutes";

export function GuestNavigator() {
  const [route, setRoute] = useState<GuestRoute>("home");

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (route === "home") return false;
      setRoute("home");
      return true;
    });

    return () => subscription.remove();
  }, [route]);

  return <LoginScreen route={route} navigate={setRoute} />;
}
