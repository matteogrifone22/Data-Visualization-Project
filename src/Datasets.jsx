import { Box, Typography, Link, AppBar, Toolbar, IconButton, Fab } from '@mui/material';
import { DarkMode, LightMode, Visibility, VisibilityOff, KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';
import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import acledLogo from './DatasetIcons/ACLED-Logo-Coloured.webp';
import worldbankLogo from './DatasetIcons/worldbank.png';
import HDX from './DatasetIcons/HDX.png';
import unLogo from './DatasetIcons/UN.png';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import Footer from './Footer';
import { useThemeContext } from './ThemeContext.jsx';

export default function Datasets() {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, []);

    // Prevent scrolling under the footer, but allow the footer to be fully visible
    useEffect(() => {
      const handleScroll = () => {
        const footer = document.querySelector('footer');
        if (!footer) return;
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const footerHeight = footer.offsetHeight;
        // The maximum scroll position so the bottom of the viewport is at the bottom of the page (footer fully visible)
        const maxScroll = docHeight - windowHeight;
        if (window.scrollY > maxScroll) {
          window.scrollTo({ top: maxScroll, behavior: 'auto' });
        }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
  const { isDark, setIsDark, isMonochromacy, setIsMonochromacy } = useThemeContext();

  useLayoutEffect(() => {
    // Sync CSS variable theme classes on :root so var(--...) works
    const root = document.documentElement;
    root.classList.remove('monochromacy-dark-mode', 'monochromacy-light-mode', 'dark-theme', 'light-theme');
    if (isMonochromacy) {
      if (isDark) {
        root.classList.add('monochromacy-light-mode');
      } else {
        root.classList.add('monochromacy-dark-mode');
      }
    } else {
      if (isDark) {
        root.classList.add('dark-theme');
      } else {
        root.classList.add('light-theme');
      }
    }
  }, [isDark, isMonochromacy]);
  // World Bank datasets for slider
  const worldBankDatasets = [
    {
      name: 'GDP per Capita (PPP)',
      description: 'This dataset provides the Gross Domestic Product (GDP) per capita based on purchasing power parity (PPP) for Israel and Palestine (West Bank & Gaza).',
      link: 'https://data360.worldbank.org/en/indicator/FAO_FS_22013?view=datatable&country=ISR%2CPSE&recentYear=false&maxYear=2024',
      methodology: 'Filtered the World Bank dataset to include only Israel and Palestine (West Bank & Gaza). GDP per capita (PPP) values were extracted for the years 2018 to 2024 to align with other datasets used in the project.'
    },
    {
      name: 'People using safely managed sanitation services ',
      description: 'This dataset provides information on the percentage of people using safely managed sanitation services.',
      link: 'https://data360.worldbank.org/en/indicator/WB_WDI_SH_STA_SMSS_ZS?view=datatable&country=ISR%2CPSE&recentYear=true&minYear=2017',
      methodology: 'Filtered the World Bank dataset to include only Israel and Palestine (West Bank & Gaza). Extracted data for the years 2018 to 2024 to align with other datasets used in the project.'
    },
    {
      name: 'People using safely managed drinking water services',
      description: 'This dataset provides information on the percentage of people using safely managed drinking water services.',
      link: 'https://data360.worldbank.org/en/indicator/WB_WDI_SH_H2O_SMDW_ZS?view=map&country=ISR%2CPSE&recentYear=true&minYear=2017',
      methodology: 'Filtered the World Bank dataset to include only Israel and Palestine (West Bank & Gaza). Extracted data for the years 2018 to 2024  to align with other datasets used in the project.'
    },
    {
      name: 'Prevalence of moderate or severe food insecurity in the total population',
      description: 'This dataset provides information on the prevalence of moderate or severe food insecurity in the total population by percentage on a three year avarage.',
      link: 'https://data360.worldbank.org/en/indicator/FAO_FS_210091?view=datatable&recentYear=false&country=ISR%2CPSE',
      methodology: 'Filtered the World Bank dataset to include only Israel and Palestine (West Bank & Gaza). Extracted data for the years 2018 to 2024 due to missing data for earlier years for Palestine.'
    }
  ];
  const HDXDatasets = [
    {
      name: 'UNOSAT Gaza Strip Comprehensive Damage Assessment',
      description: 'This dataset provides detailed information on the extent of damage in the Gaza Strip, collected through satellite imagery analysis by UNOSAT.',
      link: 'https://data.humdata.org/dataset/unosat-gaza-strip-comprehensive-damage-assessment-11-october-2025',
      methodology: 'Converted the GDB file in a geojson format. Aggregated nearest points data in one cluster point to avoid performance issues due to the high number of points.'
    },
    {
      name: 'State of Palestine (PSE): Attacks on Food and Water Systems',
      description: 'This dataset documents attacks on food and water systems in the State of Palestine.',
      link: 'https://data.humdata.org/dataset/opt-violent-and-threatening-incidents-against-healthcare/resource/4058bcd6-0a96-4d66-889b-427b95fac5bb',
      methodology: 'Unrelevant columns were removed to keep only those with useful information for the visualization.'
    },
    {
      name: 'State of Palestine (PSE): Attacks on Health Care',
      description: 'This dataset documents attacks on health care facilities and personnel in the State',
      link: 'https://data.humdata.org/dataset/opt-violent-and-threatening-incidents-against-healthcare/resource/dbe8462e-ea26-43ab-8d04-0b67e90c7654',
      methodology: 'Unrelevant columns were removed to keep only those with useful information for the visualization.'
    }
  ];
  const [wbIndex, setWbIndex] = useState(0);
  const handleWbPrev = () => setWbIndex((i) => (i === 0 ? worldBankDatasets.length - 1 : i - 1));
  const handleWbNext = () => setWbIndex((i) => (i === worldBankDatasets.length - 1 ? 0 : i + 1));

  const [hdxIndex, setHdxIndex] = useState(0);
  const handleHdxPrev = () => setHdxIndex((i) => (i === 0 ? HDXDatasets.length - 1 : i - 1));
  const handleHdxNext = () => setHdxIndex((i) => (i === HDXDatasets.length - 1 ? 0 : i + 1));
  const navbarRef = useRef(null);
  const toolbarRef = useRef(null);
  // Remove local theme state, use context
  const bgColor = 'var(--bg-primary)';
  const textColor = 'var(--text-primary)';
  const linkHoverColor = 'var(--color-link-hover)';
  const borderColor = 'var(--color-details)';
  const navbarTextColor = 'var(--text-navbar)';
  const navbarShadow = 'var(--navbar-shadow)';

  // Custom shadow for dataset boxes, more visible in dark mode
  const datasetBoxShadow = isDark
    ? '0 8px 32px 0 rgba(0,0,0,0.44), 0 2px 8px 0 rgba(0,0,0,0.28)'
    : '0 8px 32px 0 rgba(40,40,80,0.14), 0 2px 8px 0 rgba(40,40,80,0.10)';
  const datasetBoxShadowHover = isDark
    ? '0 16px 48px 0 rgba(0,0,0,0.60), 0 4px 16px 0 rgba(0,0,0,0.36)'
    : '0 16px 48px 0 rgba(40,40,80,0.18), 0 4px 16px 0 rgba(40,40,80,0.13)';

  // Sync theme and accessibility mode with CSS classes on <body> (useLayoutEffect for immediate style update)
  // Theme class sync is now handled globally by ThemeProvider

  const toggleTheme = () => setIsDark((prev) => !prev);
  const toggleMonochromacy = () => setIsMonochromacy((prev) => !prev);

  const [emailCopied, setEmailCopied] = useState(false);
  const handleEmailClick = () => {
    navigator.clipboard.writeText('mfmatteoferrari@gmail.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  // Scroll to Top Button logic
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{
      backgroundColor: bgColor,
      color: textColor,
      width: '100%',
      minHeight: '100vh', // keep minHeight for full-page background, but reduce paddings below
    }}>
      {/* AppBar and Toolbar */}
      <AppBar
        position="fixed"
        ref={navbarRef}
        sx={{
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '95%', md: 'auto' },
          maxWidth: { xs: '95%', md: '90%' },
          minWidth: '700px',
          borderRadius: '50px',
          // Semi-transparent background for glass effect
          backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          // Remove colored border
          border: 'none',
          zIndex: 1300,
          boxShadow: navbarShadow,
          padding: '0 8px',
          transition: 'box-shadow 0.3s ease, background-color 0.3s ease'
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            flexWrap: 'nowrap', // Prevent wrapping
            overflow: 'hidden', // Hide overflowed content
            textOverflow: 'ellipsis', // Show ellipsis if overflow
            whiteSpace: 'nowrap', // Force single line
            rowGap: { xs: 0.75, md: 1 },
            columnGap: { xs: 0.6, md: 1.5 },
            padding: { xs: '8px 10px', md: '8px 24px' },
            justifyContent: 'center',
            minWidth: 0 // Allow shrinking
          }}
          ref={toolbarRef}
        >

          <Box sx={{ display: 'flex', gap: { xs: 0.6, md: 1 }, flexShrink: 0 }}>
            <Link
              href="#/"
              sx={{
                color: navbarTextColor,
                textDecoration: 'none',
                fontSize: { xs: '0.8rem', md: '0.95rem' },
                cursor: 'pointer',
                transition: 'color 0.3s ease',
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                borderRadius: '24px',
                padding: '6px 18px',
                marginRight: 2,
                '&:hover': {
                  color: linkHoverColor,
                  background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)',
                  opacity: 1
                }
              }}
            >
              <strong>Back to Home</strong>
            </Link>
            <IconButton
              onClick={toggleTheme}
              disableRipple
              disableFocusRipple
              disableTouchRipple
              sx={{
                color: navbarTextColor,
                transition: 'transform 0.3s ease, color 0.3s ease',
                outline: 'none !important',
            
                boxShadow: 'none !important',
                '&:before, &:after': { display: 'none' },
                '&:active': { backgroundColor: 'transparent !important' },
                '&:focus': { backgroundColor: 'transparent !important', boxShadow: 'none !important', outline: 'none !important' },
                '&:focusVisible': { backgroundColor: 'transparent !important', boxShadow: 'none !important', outline: 'none !important' },
                '&& .MuiTouchRipple-root': { display: 'none' },
                '&:hover': {
                  color: linkHoverColor,
                  transform: 'rotate(20deg)',
                  backgroundColor: 'transparent !important'
                }
              }}
            >
              {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>
            <IconButton
              onClick={toggleMonochromacy}
              disableRipple
              disableFocusRipple
              disableTouchRipple
              sx={{
                color: navbarTextColor,
                transition: 'transform 0.3s ease, color 0.3s ease',
                outline: 'none !important',
                boxShadow: 'none !important',
                '&:before, &:after': { display: 'none' },
                '&:active': { backgroundColor: 'transparent !important' },
                '&:focus': { backgroundColor: 'transparent !important', boxShadow: 'none !important', outline: 'none !important' },
                '&:focusVisible': { backgroundColor: 'transparent !important', boxShadow: 'none !important', outline: 'none !important' },
                '&& .MuiTouchRipple-root': { display: 'none' },
                '&:hover': {
                  color: linkHoverColor,
                  transform: 'scale(1.15)',
                  backgroundColor: 'transparent !important'
                }
              }}
            >
              {isMonochromacy ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ height: 100 }} /> {/* Reduced spacer for AppBar */}
      <Box sx={{
        width: { xs: '100%', md: '700px' },
        maxWidth: '700px',
        minWidth: { xs: '0', md: '360px' },
        margin: '0 auto',
        paddingTop: '2vh',
        paddingBottom: '2vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontFamily: 'var(--font-serif)', textAlign: 'center' }}>
          Datasets & Sources
        </Typography>

        {/* DATASET SOURCE BOXES */}
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* ACLED */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '20px',
            p: 2.5,
            my: 1.5,
            background: 'linear-gradient(135deg, var(--bg-secondary) 85%, var(--bg-primary) 100%)',
            maxWidth: 720,
            justifyContent: 'flex-start',
            gap: 3,
            boxShadow: datasetBoxShadow,
            '&:hover': { boxShadow: datasetBoxShadowHover }
          }}>
            <Box sx={{ minWidth: 120, minHeight: 120, mr: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <img
                src={acledLogo}
                alt="ACLED logo"
                style={{ width: 110, height: 110, borderRadius: 16, objectFit: 'contain', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" component={Link} href="https://acleddata.com/" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700, mb: 1, color: textColor, textDecoration: 'none', '&:hover': { color: linkHoverColor } }}>
                ACLED (Armed Conflict Location & Event Data)<br />
              </Typography>
              <Link href="https://acleddata.com/aggregated/aggregated-data-middle-east" target="_blank" rel="noopener noreferrer" sx={{ color: linkHoverColor, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: linkHoverColor } }}>
                <span style={{ fontWeight: 700, color: 'var(--color-link-hover)' }}>Aggregated Data On Middle East</span>
              </Link>
              <Typography variant="body2" sx={{ display: 'block', mt: 1, mb: 1 }}>
                This dataset provides a comprehensive aggregation of conflict and event data for the Middle East region.<br />
              </Typography>
              <Typography variant="body2" sx={{ display: 'block', mt: 1 }}>
                <span style={{ fontWeight: 700, color: 'var(--color-link-hover)' }}>Methodology:</span> Data was filtered by country to include only events from Israel and Palestine. For Palesine events, only those occurring in the Gaza Strip were retained. Data were filtered also in date, keeping only events from January 2023 to December 2025, and only relevant column were selected.
              </Typography>
            </Box>
          </Box>

          {/* HDX */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '20px',
            p: 2.5,
            my: 1.5,
            background: 'linear-gradient(135deg, var(--bg-secondary) 85%, var(--bg-primary) 100%)',
            maxWidth: 720,
            justifyContent: 'flex-start',
            gap: 3,
            boxShadow: datasetBoxShadow,
            '&:hover': { boxShadow: datasetBoxShadowHover }
          }}>
            <Box sx={{ minWidth: 120, minHeight: 120, mr: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <img
                src={HDX}
                alt="HDX Logo"
                style={{ width: 110, height: 110, borderRadius: 16, objectFit: 'contain', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              />
            </Box>
            <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                <IconButton onClick={handleHdxPrev} size="small" aria-label="Previous dataset" sx={{ mr: 1, color: 'var(--color-text)' }}>
                  <ArrowBackIos fontSize="small" />
                </IconButton>
                <Typography variant="h5" component={Link} href="https://data.humdata.org/" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700, mb: 1, color: textColor, textDecoration: 'none', '&:hover': { color: linkHoverColor } }}  >
                  HDX (Humanitarian Data Exchange)
                </Typography>
                <IconButton onClick={handleHdxNext} size="small" aria-label="Next dataset" sx={{ ml: 1, color: 'var(--color-text)' }}>
                  <ArrowForwardIos fontSize="small" />
                </IconButton>
              </Box>
              <Link href={HDXDatasets[hdxIndex].link} target="_blank" rel="noopener noreferrer" sx={{ color: linkHoverColor, textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', '&:hover': { textDecoration: 'underline', color: linkHoverColor }, mb: 1, textAlign: 'left', display: 'block' }}>
                {HDXDatasets[hdxIndex].name}
              </Link>
              <Typography variant="body2" sx={{ display: 'block', mt: 1, mb: 0.5, textAlign: 'left' }}>
                {HDXDatasets[hdxIndex].description}
              </Typography>
              <Typography variant="body2" sx={{ display: 'block', mt: 1, textAlign: 'left' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-link-hover)' }}>Methodology:</span> {
                  HDXDatasets[hdxIndex].methodology}
              </Typography>
            </Box>
          </Box>

          {/* UNITED NATIONS (UN) */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '20px',
            p: 2.5,
            my: 1.5,
            background: 'linear-gradient(135deg, var(--bg-secondary) 85%, var(--bg-primary) 100%)',
            maxWidth: 720,
            justifyContent: 'flex-start',
            gap: 3,
            boxShadow: datasetBoxShadow,
            '&:hover': { boxShadow: datasetBoxShadowHover }
          }}>
            <Box sx={{ minWidth: 120, minHeight: 120, mr: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <img
                src={unLogo}
                alt="UN Logo"
                style={{ width: 110, height: 110, borderRadius: 16, objectFit: 'contain', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" component={Link} href="https://population.un.org/wpp/" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700, mb: 1, color: textColor, textDecoration: 'none', '&:hover': { color: linkHoverColor } }}>
                United Nations World Population Prospects<br />
              </Typography>
              <Link href="https://population.un.org/wpp/downloads?folder=Standard%20Projections&group=Mortality" target="_blank" rel="noopener noreferrer" sx={{ color: linkHoverColor, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: linkHoverColor } }}>
                <span style={{ fontWeight: 700, color: 'var(--color-link-hover)' }}>Deaths by Single Age - Both Sexes</span>
              </Link>
              <Typography variant="body2" sx={{ display: 'block', mt: 1, mb: 1 }}>
                This dataset contains the number of deaths by single age.<br />
              </Typography>
              <Typography variant="body2" sx={{ display: 'block', mt: 1 }}>
                <span style={{ fontWeight: 700, color: 'var(--color-link-hover)' }}>Methodology:</span> Data was filtered by country to include only Israel and Palestine. The single ages were then grouped into age brackets of 5 years (0-4, 5-9, 10-14, etc.).
              </Typography>
            </Box>
          </Box>
          {/* Humanitarian Data Exchange (HDX) */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '20px',
            p: 2.5,
            my: 1.5,
            background: 'linear-gradient(135deg, var(--bg-secondary) 85%, var(--bg-primary) 100%)',
            maxWidth: 720,
            justifyContent: 'flex-start',
            gap: 3,
            boxShadow: datasetBoxShadow,
            '&:hover': { boxShadow: datasetBoxShadowHover }
          }}>
            <Box sx={{ minWidth: 120, minHeight: 120, mr: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <img
                src={worldbankLogo}
                alt="World Bank logo"
                style={{ width: 110, height: 110, borderRadius: 16, objectFit: 'contain', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              />
            </Box>
            <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                <IconButton onClick={handleWbPrev} size="small" aria-label="Previous dataset" sx={{ mr: 1, color: 'var(--color-text)' }}>
                  <ArrowBackIos fontSize="small" />
                </IconButton>
                <Typography variant="h5" component={Link} href="https://www.worldbank.org/ext/en/home" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700, mb: 1, color: textColor, textDecoration: 'none', '&:hover': { color: linkHoverColor } }}>
                  World Bank<br />
                </Typography>
                <IconButton onClick={handleWbNext} size="small" aria-label="Next dataset" sx={{ ml: 1, color: 'var(--color-text)' }}>
                  <ArrowForwardIos fontSize="small" />
                </IconButton>
              </Box>
              <Link href={worldBankDatasets[wbIndex].link} target="_blank" rel="noopener noreferrer" sx={{ color: linkHoverColor, textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', '&:hover': { textDecoration: 'underline', color: linkHoverColor }, mb: 1, textAlign: 'left', display: 'block' }}>
                {worldBankDatasets[wbIndex].name}
              </Link>
              <Typography variant="body2" sx={{ display: 'block', mt: 1, mb: 0.5, textAlign: 'left' }}>
                {worldBankDatasets[wbIndex].description}
              </Typography>
              <Typography variant="body2" sx={{ display: 'block', mt: 1, textAlign: 'left' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-link-hover)' }}>Methodology:</span> {worldBankDatasets[wbIndex].methodology}
              </Typography>
            </Box>
          </Box>


        </Box>
        <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Link href="#/" sx={{ color: textColor, textDecoration: 'none', '&:hover': { color: linkHoverColor } }}>
            ← Back to main visualization
          </Link>
        </Box>
        {/* Scroll to Top Button */}
        <Fab
          onClick={scrollToTop}
          disableRipple
          sx={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            backgroundColor: linkHoverColor,
            color: 'var(--bg-primary)',
            opacity: showScrollTop ? 1 : 0,
            visibility: showScrollTop ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease, visibility 0.3s ease, color 0.3s ease, transform 0.3s ease, background-color 0.3s ease',
            transform: showScrollTop ? 'scale(1)' : 'scale(0.8)',
            outline: 'none !important',
            border: 'none !important',
            '&:hover': {
              backgroundColor: 'var(--color-details)',
              transform: 'scale(1.1)',
              boxShadow: '0 8px 24px color-mix(in srgb, var(--color-details) 45%, transparent)'
            },
            '&:focus, &:focusVisible, &:active': {
              outline: 'none !important',
              boxShadow: 'none !important',
              border: 'none !important'
            },
            '& .MuiTouchRipple-root': { display: 'none' },
            zIndex: 1200
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Box>
      {/* Footer - now outside content box for full width */}
      <Footer
        isDark={isDark}
        isMonochromacy={isMonochromacy}
        handleEmailClick={handleEmailClick}
        emailCopied={emailCopied}
      />
    </Box>
  );
}
