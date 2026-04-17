import React, { useState } from "react";
import { MapPin, Truck, Package, Clock, Gauge, Fuel, Timer, Play } from "lucide-react";

const initialState = {
  current_location: "Chicago, IL",
  pickup_location: "Indianapolis, IN",
  dropoff_location: "Louisville, KY",
  start_time: new Date().toISOString().slice(0, 16),
  current_cycle_used_hours: 24,
  pre_trip_minutes: 30,
  pickup_stop_minutes: 60,
  dropoff_stop_minutes: 60,
  fuel_interval_miles: 1000,
};

function TripInputForm({ onCalculate, loading }) {
  const [values, setValues] = useState(initialState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === "current_cycle_used_hours" || name === "pre_trip_minutes" || name === "pickup_stop_minutes" || name === "dropoff_stop_minutes" || name === "fuel_interval_miles"
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onCalculate(values);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InputField
          icon={<MapPin className="text-blue-500" />}
          label="Current Location"
          name="current_location"
          value={values.current_location}
          onChange={handleChange}
          placeholder="Enter current location"
        />
        <InputField
          icon={<Package className="text-green-500" />}
          label="Pickup Location"
          name="pickup_location"
          value={values.pickup_location}
          onChange={handleChange}
          placeholder="Enter pickup location"
        />
        <InputField
          icon={<Truck className="text-orange-500" />}
          label="Dropoff Location"
          name="dropoff_location"
          value={values.dropoff_location}
          onChange={handleChange}
          placeholder="Enter dropoff location"
        />
        <InputField
          icon={<Clock className="text-purple-500" />}
          label="Start Time"
          name="start_time"
          type="datetime-local"
          value={values.start_time}
          onChange={handleChange}
        />
        <InputField
          icon={<Gauge className="text-red-500" />}
          label="Current Cycle Used (hrs)"
          name="current_cycle_used_hours"
          type="number"
          value={values.current_cycle_used_hours}
          onChange={handleChange}
          min="0"
        />
        <InputField
          icon={<Fuel className="text-indigo-500" />}
          label="Fuel Interval (miles)"
          name="fuel_interval_miles"
          type="number"
          value={values.fuel_interval_miles}
          onChange={handleChange}
          min="1"
        />
        <InputField
          icon={<Timer className="text-yellow-500" />}
          label="Pre-trip Inspection (min)"
          name="pre_trip_minutes"
          type="number"
          value={values.pre_trip_minutes}
          onChange={handleChange}
          min="0"
        />
        <InputField
          icon={<Package className="text-teal-500" />}
          label="Pickup Stop (min)"
          name="pickup_stop_minutes"
          type="number"
          value={values.pickup_stop_minutes}
          onChange={handleChange}
          min="0"
        />
        <InputField
          icon={<Truck className="text-pink-500" />}
          label="Dropoff Stop (min)"
          name="dropoff_stop_minutes"
          type="number"
          value={values.dropoff_stop_minutes}
          onChange={handleChange}
          min="0"
        />
      </div>
      <div className="mt-8">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {loading ? 'Calculating...' : 'Calculate Trip & Generate Logs'}
        </button>
      </div>
    </div>
  );
}

const InputField = ({ icon, label, name, type = "text", value, onChange, placeholder, min }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {React.cloneElement(icon, { size: 16 })}
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
    />
  </div>
);

export default TripInputForm;
