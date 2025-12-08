import { Container, AppBar, Toolbar, Typography, Paper } from '@mui/material';
import MyChart from './components/MyChart';

export default function App() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Data Visualization Project</Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Grafico D3 integrato con React + MUI
          </Typography>
          <MyChart />
        </Paper>
      </Container>
    </>
  );
}
