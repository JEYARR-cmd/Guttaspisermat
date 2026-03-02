import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Health check endpoint
app.get("/make-server-fbdf02f2/health", (c) => {
  console.log("Health check called");
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all restaurants
app.get("/make-server-fbdf02f2/restaurants", async (c) => {
  try {
    console.log("Fetching restaurants from database...");
    const restaurants = await kv.get("restaurants");
    console.log("Restaurants fetched:", restaurants ? restaurants.length : 0);
    return c.json({ restaurants: restaurants || [] });
  } catch (error) {
    console.log("Error fetching restaurants:", error);
    return c.json({ error: "Failed to fetch restaurants", details: String(error) }, 500);
  }
});

// Initialize restaurants (create initial data if not exists)
app.post("/make-server-fbdf02f2/restaurants/init", async (c) => {
  try {
    const existingRestaurants = await kv.get("restaurants");
    if (existingRestaurants && existingRestaurants.length > 0) {
      return c.json({ message: "Restaurants already initialized", restaurants: existingRestaurants });
    }

    const body = await c.req.json();
    const { restaurants } = body;
    
    await kv.set("restaurants", restaurants);
    return c.json({ message: "Restaurants initialized", restaurants });
  } catch (error) {
    console.log("Error initializing restaurants:", error);
    return c.json({ error: "Failed to initialize restaurants", details: String(error) }, 500);
  }
});

// Update a restaurant
app.put("/make-server-fbdf02f2/restaurants/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updatedRestaurant = body.restaurant;

    const restaurants = await kv.get("restaurants") || [];
    const index = restaurants.findIndex((r: any) => r.id === id);
    
    if (index === -1) {
      return c.json({ error: "Restaurant not found" }, 404);
    }

    restaurants[index] = updatedRestaurant;
    await kv.set("restaurants", restaurants);

    return c.json({ message: "Restaurant updated", restaurant: updatedRestaurant });
  } catch (error) {
    console.log("Error updating restaurant:", error);
    return c.json({ error: "Failed to update restaurant", details: String(error) }, 500);
  }
});

// Add a new restaurant
app.post("/make-server-fbdf02f2/restaurants", async (c) => {
  try {
    const body = await c.req.json();
    const newRestaurant = body.restaurant;

    const restaurants = await kv.get("restaurants") || [];
    restaurants.push(newRestaurant);
    await kv.set("restaurants", restaurants);

    return c.json({ message: "Restaurant added", restaurant: newRestaurant });
  } catch (error) {
    console.log("Error adding restaurant:", error);
    return c.json({ error: "Failed to add restaurant", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);