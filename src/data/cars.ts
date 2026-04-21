import type { Car } from "./types";
import carsJson from "./json/cars.json";

export const cars = carsJson as Car[];
