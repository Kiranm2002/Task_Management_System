import { useState } from 'react';
import { Box, Typography, Button, LinearProgress, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { CloudUpload, InsertDriveFile, Close, CheckCircle } from '@mui/icons-material';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import { useAddAttachmentMutation } from '../attachmentApi';

const FileUploader = ({ taskId }) => {
  const [uploading, setUploading] = useState(false);
  const [addAttachment] = useAddAttachmentMutation();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await uploadToCloudinary(file);
      
      await addAttachment({
        taskId,
        fileData: {
          url: data.secure_url,
          fileName: file.name,
          fileType: file.type,
          publicId: data.public_id
        }
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        component="label"
        sx={{
          border: '2px dashed #e0e0e0',
          borderRadius: 2,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          transition: '0.3s',
          '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' }
        }}
      >
        <input type="file" hidden onChange={handleFileChange} disabled={uploading} />
        <CloudUpload color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="body2" fontWeight={600}>
          {uploading ? "Uploading..." : "Click or drag to upload files"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          PDF, PNG, JPG, or DOC (Max 10MB)
        </Typography>
      </Box>

      {uploading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default FileUploader;