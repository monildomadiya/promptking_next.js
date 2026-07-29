
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config(true); // Loads CLOUDINARY_URL from process.env

export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export default cloudinary;
