import { Box, Typography, Link } from '@mui/material';

export default function Datasets() {
  const bgColor = 'var(--bg-primary)';
  const textColor = 'var(--text-primary)';
  const linkHoverColor = 'var(--color-link-hover)';
  const borderColor = 'var(--color-details)';

  return (
    <Box sx={{
      backgroundColor: bgColor,
      color: textColor,
      minHeight: '100vh',
      width: '100%',
      padding: '8vh 5vw',
    }}>
      <Box sx={{ maxWidth: 'min(95vw, var(--content-width))', margin: '0 auto' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontFamily: 'var(--font-serif)' }}>
          Datasets & Sources
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: 1.7, mb: 4 }}>
          This page lists the datasets used across the visualizations, with brief explanations and links to original sources.
        </Typography>

        <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: '12px', p: 3, mb: 3, backgroundColor: 'var(--bg-secondary)' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            ACLED – Middle East Incidents
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Aggregated conflict and event data for the Middle East used to derive food system and health care incidents.
          </Typography>
          <Link href="https://acleddata.com/" target="_blank" rel="noopener noreferrer" sx={{ color: textColor, '&:hover': { color: linkHoverColor } }}>
            https://acleddata.com/
          </Link>
        </Box>

        <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: '12px', p: 3, mb: 3, backgroundColor: 'var(--bg-secondary)' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            UNOSAT – Gaza Damage Assessment
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Satellite-based damage sites used for spatial visualizations and overlays.
          </Typography>
          <Link href="https://unosat.org/" target="_blank" rel="noopener noreferrer" sx={{ color: textColor, '&:hover': { color: linkHoverColor } }}>
            https://unosat.org/
          </Link>
        </Box>

        <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: '12px', p: 3, mb: 3, backgroundColor: 'var(--bg-secondary)' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            World Population Prospects (UN)
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Population, mortality rate and related indicators used for demographic charts.
          </Typography>
          <Link href="https://population.un.org/wpp/" target="_blank" rel="noopener noreferrer" sx={{ color: textColor, '&:hover': { color: linkHoverColor } }}>
            https://population.un.org/wpp/
          </Link>
        </Box>

        <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: '12px', p: 3, mb: 3, backgroundColor: 'var(--bg-secondary)' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Processed Local CSVs
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Derived datasets used in the app are stored under src/Dataset/ and src/Dataset/processed/.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Examples: Combined_Incidents_GeoChart.csv, FoodInsecurity_processed.csv, GDP_processed.csv.
          </Typography>
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Link href="#/" sx={{ color: textColor, textDecoration: 'none', '&:hover': { color: linkHoverColor } }}>
            ← Back to main visualization
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
