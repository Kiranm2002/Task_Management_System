import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Paper, Typography } from '@mui/material';

const TaskTrendChart = ({ data }) => (
  <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }} elevation={0} variant="outlined">
    <Typography variant="h6" fontWeight={700} gutterBottom>Workload Trend</Typography>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#2196f3" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  </Paper>
);

export default TaskTrendChart;