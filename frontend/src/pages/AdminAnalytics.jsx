import { Grid, Box, Typography, Container } from '@mui/material';
import { useGetDeepAnalyticsQuery } from '../features/analytics/analyticsApi';
import { WorkloadTrend, 
  PriorityPie, 
  ProjectProgress 
} from '../features/analytics/components/AnalyticsCharts';

const AdminAnalytics = () => {
  const { data: response, isLoading } = useGetDeepAnalyticsQuery();
  const analytics = response?.data;

  if (isLoading) return <Box p={4}>Intelligence is loading...</Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4} sx={{ position: 'relative', top: '-18px' }}>
        <Typography variant="h4" fontWeight={800} >Enterprise Insights</Typography>
        <Typography color="text.secondary">Real-time data from all teams and projects</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <WorkloadTrend data={analytics?.taskTrends} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <PriorityPie data={analytics?.priorityDist} />
        </Grid>
        <Grid item xs={12}>
          <ProjectProgress data={analytics?.projectStats} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminAnalytics;