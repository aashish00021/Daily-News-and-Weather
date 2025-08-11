import { useSettings } from "@/hooks/SettingsContext";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Weather = {
  temperature: number;
  description: string;
  icon: string;
  cityName: string;
};

type Forecast = {
  date: string;
  min: number;
  max: number;
  icon: string;
};

type Article = {
  title: string;
  description: string;
  url: string;
};

export default function HomeScreen() {
  const { unit, categories } = useSettings();
  
  // Location state
  const [city, setCity] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("US");
  
  // Weather state
  const [currentWeather, setCurrentWeather] = useState<Weather | null>(null);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // News state
  const [articles, setArticles] = useState<Article[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(false);
  
  // Error state
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [newsError, setNewsError] = useState<string>("");

  // Get API keys from environment
  const weatherApiKey = process.env.EXPO_PUBLIC_WEATHER_API || "";
  const newsApiKey = process.env.EXPO_PUBLIC_NEWS_API || "";

  // Temperature unit label
  const unitLabel = unit === "imperial" ? "°F" : "°C";

  useEffect(() => {
    getCurrentLocation();
  }, []);

  async function getCurrentLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Permission to access location was denied");
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      if (coords) {
        const { latitude, longitude } = coords;
        
        // Get city name
        let response = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        if (response && response.length > 0) {
          const place = response[0];
          setCity(place.city || place.region || "");
          setCountryCode(place.isoCountryCode || "US");
          
          // Fetch news first (unfiltered)
          fetchNews(place.isoCountryCode || "US", null);
        }
        
        // Fetch weather
        fetchWeather(latitude, longitude);
      }
    } catch (error) {
      setErrorMessage("Failed to get location");
    }
  }

  async function fetchWeather(lat: number, lon: number) {
    if (!weatherApiKey) {
      setErrorMessage("Missing weather API key");
      return;
    }
    
    try {
      setIsLoading(true);
      const units = unit;
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=${units}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=${units}`;

      const [currentRes, forecastRes] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);

      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();

      // Set current weather
      if (currentData && currentData.main && currentData.weather?.length) {
        setCurrentWeather({
          temperature: currentData.main.temp,
          description: currentData.weather[0].main,
          icon: currentData.weather[0].icon,
          cityName: currentData.name,
        });
        
        // Filter news based on temperature
        const tempC = unit === "imperial" 
          ? ((currentData.main.temp - 32) * 5) / 9 
          : currentData.main.temp;
        
        const weatherCategory = getWeatherCategory(tempC);
        fetchNews(countryCode, weatherCategory);
      }

      // Set forecast
      if (forecastData && Array.isArray(forecastData.list)) {
        const dailyData: { [key: string]: Forecast } = {};
        
        for (const item of forecastData.list) {
          const date = new Date(item.dt * 1000);
          const dateKey = date.toISOString().slice(0, 10);
          
          if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
              date: dateKey,
              min: item.main.temp_min,
              max: item.main.temp_max,
              icon: item.weather[0].icon,
            };
          } else {
            dailyData[dateKey].min = Math.min(dailyData[dateKey].min, item.main.temp_min);
            dailyData[dateKey].max = Math.max(dailyData[dateKey].max, item.main.temp_max);
          }
        }
        
        const days = Object.values(dailyData).slice(0, 5);
        setForecast(days);
      }
    } catch (error) {
      setErrorMessage("Failed to fetch weather");
    } finally {
      setIsLoading(false);
    }
  }

  function getWeatherCategory(tempCelsius: number): string {
    if (tempCelsius < 10) return "cold";
    if (tempCelsius > 25) return "hot";
    return "cool";
  }

  async function fetchNews(country: string, weatherCategory: string | null) {
    if (!newsApiKey) {
      setNewsError("Missing news API key");
      return;
    }
    
    try {
      setNewsLoading(true);
      
      // Add category if selected in settings
      const categoryParam = categories.length > 0 ? `&category=${categories[0]}` : "";
      const url = `https://newsapi.org/v2/top-headlines?country=${country.toLowerCase()}${categoryParam}&pageSize=50&apiKey=${newsApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data?.status === "ok" && Array.isArray(data.articles)) {
        let newsArticles: Article[] = data.articles
          .filter((article: any) => article.title && article.url)
          .map((article: any) => ({
            title: article.title,
            description: article.description || "",
            url: article.url,
          }));

        // Filter by weather if category exists
        if (weatherCategory) {
          const keywords = getKeywordsForWeather(weatherCategory);
          const filtered = newsArticles.filter((article: Article) => {
            const text = `${article.title} ${article.description}`.toLowerCase();
            return keywords.some((keyword: string) => text.includes(keyword));
          });
          
          // Use filtered results if any found, otherwise use all
          newsArticles = filtered.length > 0 ? filtered : newsArticles;
        }
        
        setArticles(newsArticles.slice(0, 5));
      } else {
        setNewsError("Failed to fetch news");
      }
    } catch (error) {
      setNewsError("Failed to fetch news");
    } finally {
      setNewsLoading(false);
    }
  }

  function getKeywordsForWeather(category: string): string[] {
    const keywords: { [key: string]: string[] } = {
      cold: ["death", "tragedy", "loss", "disaster", "crisis"],
      hot: ["fear", "terror", "panic", "threat"],
      cool: ["win", "victory", "success", "happy", "celebration"],
    };
    return keywords[category] || [];
  }

  function renderNewsItem({ item }: { item: Article }) {
    return (
      <TouchableOpacity
        onPress={() => Linking.openURL(item.url)}
        style={styles.newsItem}
      >
        <Text style={styles.headline}>{item.title}</Text>
        {item.description && (
          <Text style={styles.headlineDesc}>{item.description}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Home</Text>
        
        {/* Weather Card */}
        <View style={styles.card}>
          <Text style={styles.cityText}>{city || (currentWeather?.cityName) || ""}</Text>

          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="large" />
            </View>
          )}

          {currentWeather && !isLoading && (
            <>
              <View style={styles.currentRow}>
                <Text style={styles.currentTemp}>
                  {Math.round(currentWeather.temperature)}{unitLabel}
                </Text>
                {currentWeather.icon && (
                  <Image
                    source={{
                      uri: `https://openweathermap.org/img/wn/${currentWeather.icon}@2x.png`,
                    }}
                    style={styles.currentIcon}
                  />
                )}
              </View>
              <Text style={styles.conditionText}>{currentWeather.description}</Text>
            </>
          )}

          {forecast.length > 0 && (
            <View style={styles.forecastRow}>
              {forecast.map((day) => {
                const dayName = new Date(day.date).toLocaleDateString(undefined, {
                  weekday: "short",
                });
                return (
                  <View key={day.date} style={styles.dayCol}>
                    <Text style={styles.dayLabel}>{dayName}</Text>
                    <Image
                      source={{
                        uri: `https://openweathermap.org/img/wn/${day.icon}.png`,
                      }}
                      style={styles.smallIcon}
                    />
                    <Text style={styles.minMax}>
                      {Math.round(day.max)}{unitLabel}/{Math.round(day.min)}{unitLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>
        
        {/* News Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.newsTitle}>Top News</Text>
          
          {newsLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={articles}
              keyExtractor={(item) => item.url}
              scrollEnabled={false}
              renderItem={renderNewsItem}
              ListEmptyComponent={
                !newsLoading ? (
                  <Text style={{ color: '#555', paddingVertical: 8 }}>
                    No headlines available.
                  </Text>
                ) : null
              }
            />
          )}
          
          {newsError && <Text style={styles.errorText}>{newsError}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  scrollContent: {
    padding: 16,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  cityText: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  currentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currentTemp: {
    fontSize: 64,
    fontWeight: "800",
  },
  currentIcon: {
    height: 60,
    width: 60,
  },
  conditionText: {
    fontSize: 18,
    color: "#555",
    marginTop: 4,
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  dayCol: {
    alignItems: "center",
    width: `${100 / 5}%`,
  },
  dayLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  smallIcon: {
    height: 28,
    width: 28,
    marginBottom: 6,
  },
  minMax: {
    fontSize: 12,
    color: "#666",
  },
  loadingRow: {
    paddingVertical: 20,
  },
  errorText: {
    marginTop: 12,
    color: "#B00020",
  },
  newsItem: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  headline: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  headlineDesc: {
    fontSize: 14,
    color: "#555",
  },
});