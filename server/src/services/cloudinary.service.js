import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary and clean up the temp file.
 * @param {string} localFilePath 
 * @returns {Promise<any>}
 */
export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    if (process.env.NODE_ENV === 'test') {
      return {
        url: 'https://res.cloudinary.com/demo/image/upload/sample.png',
        public_id: 'sample_public_id_test',
        secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.png',
      };
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: 'artisans_corner',
    });

    // Remove the locally saved temporary file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    console.error('Cloudinary upload failed:', error.message);
    // Clean up local file even if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

/**
 * Delete a resource from Cloudinary.
 * @param {string} publicUrlOrId 
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicUrlOrId) => {
  try {
    if (!publicUrlOrId) return null;

    if (process.env.NODE_ENV === 'test') {
      return { result: 'ok' };
    }

    // Extract public ID if URL is provided
    let publicId = publicUrlOrId;
    if (publicUrlOrId.startsWith('http')) {
      const parts = publicUrlOrId.split('/');
      const fileName = parts[parts.length - 1];
      publicId = `artisans_corner/${fileName.split('.')[0]}`;
    }

    if (publicId.includes('placeholder') || publicId.includes('demo')) {
      return { result: 'skipped' };
    }

    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error('Cloudinary deletion failed:', error.message);
    return null;
  }
};
