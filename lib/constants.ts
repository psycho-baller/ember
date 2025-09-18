export const env = {
  LOCATION_ID: process.env.NEXT_PUBLIC_LOCATION_ID || process.env.LOCATION_ID || process.env.TWILIO_PHONE_NUMBER === "+18076977967" ? "uw" : "uofc",

};
