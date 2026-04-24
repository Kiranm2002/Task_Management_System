const AttachmentGallery = ({ attachments, onRemove }) => {
  return (
    <List>
      {attachments?.map((file) => (
        <ListItem
          key={file.id}
          sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 1 }}
          secondaryAction={
            <IconButton edge="end" onClick={() => onRemove(file.id)}>
              <Close fontSize="small" />
            </IconButton>
          }
        >
          <ListItemIcon>
            <InsertDriveFile color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={file.fileName}
            primaryTypographyProps={{ variant: 'body2', noWrap: true, fontWeight: 600 }}
            secondary={
              <Typography component="a" href={file.url} target="_blank" variant="caption" color="primary">
                View File
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default AttachmentGallery