import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary= async(localFilePath)=>{
    try{
        if(!localFilePath){
            return null;
        }
    // Upload the file on Cloudinary //
        const response= await cloudinary.uploader.upload(localFilePath, {resource_type: 'auto'});
        // console.log("File is Uploaded on Cloudinary", response);
        fs.unlinkSync(localFilePath); //Remove local save temporary file after upload//
        return response;
    }
    catch(err){
        fs.unlinkSync(localFilePath) //Remove local save temporary file as the upload failed//
        return null;
    }
}

// Delete old image from cloudinary after update with new image //
const deleteFromCloudinary= async(public_id)=>{
    try {
        if(!public_id){
            return null;
        }

        const response= await cloudinary.api
            .delete_resources([public_id], { type: 'upload', resource_type: 'image' })

            if (response.deleted && response.deleted[public_id]==='deleted') {
                console.log('Deleted from Cloudinary:', public_id);
            } 
            else {
                console.log('Failed to delete from Cloudinary:', public_id);
            }
    } 
    catch (error) {
        console.log(error, "error when deleting from cloudinary");
    }
}

// Cloudinary upload boilerplate //
// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });


export {uploadOnCloudinary, deleteFromCloudinary};