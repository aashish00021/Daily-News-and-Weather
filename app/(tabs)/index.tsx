import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

export default function HomeScreen() {
  const [errorMessage, setErrorMessage] = useState("");
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Permission to access location was denied");
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      if (coords) {
        const { latitude, longitude } = coords;
        console.log("lat and lon is", latitude, longitude);
        setLongitude(longitude);
        setLatitude(latitude);
        let response = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        console.log("user location", response);
      }
      return { longitude, latitude, errorMessage };
    }

    getCurrentLocation();
  }, []);
  return (
    <SafeAreaView>
      <View>
        <Text>Hi this si my firet line. how are you </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
