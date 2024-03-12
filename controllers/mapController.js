const { createClient } = require("@google/maps");
const { promisify } = require("util");
const asyncHandler = require("express-async-handler");
// const Address = require("../models/addressModel");
const Cart = require("../models/CartModel");
require("dotenv").config();
const User = require('../models/userModel');

// Create a Google Maps client with the API key
const Map = createClient({
  key: process.env.MAP_API_KEY,
});
// Promisify the DistanceMatrixService method
const getDistanceMatrixPromise = promisify(Map.distanceMatrix);

// get Distance
const getDistance = asyncHandler(async (req, res) => {
  try {
    const{address}=req.body
    const UserData=await User.findOne({email:req.session.user})
    const DeliveryAddress = await User.findOne({ _id: UserData._id, 'address._id': address }, { 'address.$': 1 })
    console.log("address  pincode",DeliveryAddress.address[0].pincode);

  
    const distanceText= await calculateDistance(DeliveryAddress.address[0].pincode);
    console.log("distarce",distanceText);
    const numericalDistance = parseInt(distanceText.split(" ")[0]);
    console.log("numeric distance",numericalDistance);
     
   

    res.status(200).json({ success:true});
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Invalid pincode" });
  }
});

// Calculate delivery Distance
const calculateDistance= async(destinationPincode)=>{
 // Define the origin and destination
 const origin = "678572";
 const destination = destinationPincode;
// Build the request object for Distance Matrix API
const request = {
    origins: [origin],
    destinations: [destination],
  };
      // Make the Distance Matrix API request using the promisified function
      const response = await getDistanceMatrixPromise(request);
      // Get the distance from the response
      const distanceText = response.json.rows[0].elements[0].distance.text;
      const distanceValue = response.json.rows[0].elements[0].distance.value;

  return distanceText
}
module.exports = { getDistance,calculateDistance };