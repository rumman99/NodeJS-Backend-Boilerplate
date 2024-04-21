import { deleteFromCloudinary } from "./cloudinary.js";

export const imageDeleteFromCloudinaryServer= async(image_url)=>{
    // Split the URL by '/'
    const urlWIthoutSlash= image_url.split('/');

    // Getting last Part of the url only file name with . extension
    const fileWithExtension= urlWIthoutSlash[urlWIthoutSlash.length-1];

    // Remove the file extension
    const filenameWithoutExtension = fileWithExtension.split('.')[0];

    // Call function for Deleting Image from Cloudinary Server//
    deleteFromCloudinary(filenameWithoutExtension);

}