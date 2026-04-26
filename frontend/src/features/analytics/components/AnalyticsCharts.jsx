import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export const WorkloadTrend = ({ data }) => (
  <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e0e0' }} elevation={0}>
    <Typography variant="h6" fontWeight={700} gutterBottom>Workload Trend (Last 7 Days)</Typography>
    <Box sx={{ height: 300, mt: 2 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="_id" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#2196f3" strokeWidth={3} dot={{ r: 4, fill: '#2196f3' }} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  </Paper>
);

export const PriorityPie = ({ data }) => (
  <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e0e0' }} elevation={0}>
    <Typography variant="h6" fontWeight={700} gutterBottom>Priority Distribution</Typography>
    <Box sx={{ height: 300, mt: 2 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="_id" innerRadius={60} outerRadius={85} paddingAngle={5}>
            {data?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  </Paper>
);

export const ProjectProgress = ({ data }) => (
  <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e0e0', width: '100%' }} elevation={0}>
    <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
      Project Completion %
    </Typography>
    
    <Box sx={{ width: '100%', height: 450 }}> 
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ left: 10, right: 60, top: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          
          <XAxis type="number" domain={[0, 100]} hide />
          
          <YAxis 
            dataKey="name" 
            type="category" 
            width={180} 
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={false}
            tick={(props) => {
              const { x, y, payload } = props;
              return (
                <text 
                  x={x - 10} 
                  y={y} 
                  textAnchor="end" 
                  fill="#37474f" 
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: 600,
                    fontFamily: 'Roboto, sans-serif'
                  }}
                >
                  {payload.value.length > 25 ? `${payload.value.substring(0, 22)}...` : payload.value}
                </text>
              );
            }}
          />
          
          <Tooltip 
            cursor={{ fill: '#f5f5f5' }}
            formatter={(value) => [`${value}%`, 'Completion']}
          />

          <Bar 
            dataKey="percentage" 
            fill="#4caf50" 
            radius={[0, 6, 6, 0]} 
            barSize={35} 
            label={{ 
              position: 'right', 
              formatter: (val) => `${val}%`, 
              fontSize: 14, 
              fontWeight: 800,
              fill: '#2e7d32',
              dx: 10 
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Paper>
);