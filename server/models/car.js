import mongoose from 'mongoose';

const CarSchema = new mongoose.Schema({
  Unnamed_0: Number,
  Model: String,
  Maker: String,
  Type: String,
  Seats: Number,
  Displacement: Number,
  Length: Number,
  Width: Number,
  Height: Number,
  Wheelbase: Number,
  No_of_Cylinders: Number,
  Fuel: String,
  Engine_Type: String,
  Transmission: String,
  Front_Brake: String,
  Rear_Brake: String,
  Drive: String,
  Turning_Radius: Number,
  Fuel_Tank_Capacity: Number,
  Boot_Space: Number,
  Fuel_Efficiency: String,
  Emission_Type: String,
  Tyre_Size: String,
  Variants: String,
  NCAP_Rating: String,
  model_slug: String,
}, { timestamps: true });

export default mongoose.model('Car', CarSchema);