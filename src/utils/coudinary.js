import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.COULDINARY_API_NAME,
    api_key: process.env.COULDINARY_API_KEY,
    api_secret: process.env.COULDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //uploading file to cloudinary from local storage
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        //upload successfully
        //console.log("File uploaded to cloudinary successfully", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove locally saved file
        return null;
    }
};

export {uploadOnCloudinary}