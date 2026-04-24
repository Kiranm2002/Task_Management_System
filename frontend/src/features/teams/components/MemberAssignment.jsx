import { Autocomplete, TextField, Avatar, Box, Typography, Chip } from '@mui/material';
import { useAssignUserToTeamMutation } from '../teamsApi';

const MemberAssignment = ({ teamId, availableUsers }) => {
  const [assignUser] = useAssignUserToTeamMutation();

  const handleAssignment = async (event, newValue) => {
    if (newValue) {
      await assignUser({ teamId, userId: newValue.id });
    }
  };

  return (
    <Autocomplete
      options={availableUsers}
      getOptionLabel={(option) => option.name}
      onChange={handleAssignment}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ display: 'flex', gap: 2 }}>
          <Avatar src={option.avatarUrl} sx={{ width: 24, height: 24 }} />
          <Box>
            <Typography variant="body2">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">{option.role}</Typography>
          </Box>
          {option.isRecommended && (
            <Chip label="AI Recommended" size="small" color="secondary" sx={{ ml: 'auto', height: 20, fontSize: '0.6rem' }} />
          )}
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params} label="Add Team Member" variant="outlined" size="small" />
      )}
    />
  );
};

export default MemberAssignment;