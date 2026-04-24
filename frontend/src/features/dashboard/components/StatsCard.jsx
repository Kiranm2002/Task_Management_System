import { Paper, Box, Typography, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatsCard = ({ title, value, icon, trend, color }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e0e0', transition: '0.3s', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.05)' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
              {trend > 0 ? <TrendingUp color="success" fontSize="small" /> : <TrendingDown color="error" fontSize="small" />}
              <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'} fontWeight={700}>
                {Math.abs(trend)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs last month
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 56, height: 56, borderRadius: 3 }}>
          {icon}
        </Avatar>
      </Box>
    </Paper>
  );
};

export default StatsCard;