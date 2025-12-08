import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Link, IconButton, Fab } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MyChart from './components/MyChart';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('Title');

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // Determine active section: pick the one with most occupancy in center square (50% screen, centered)
      const sections = ['Title', 'chart1', 'insights'];
      const navbarHeight = 100;
      const viewportStart = window.scrollY + navbarHeight;
      const viewportEnd = window.scrollY + window.innerHeight;
      const viewportHeight = viewportEnd - viewportStart;
      const screenCenterY = (viewportStart + viewportEnd) / 2;

      // Center square: 50% of viewport height/width, centered on screen
      const boxSize = viewportHeight * 0.5;
      const boxStart = screenCenterY - boxSize / 2;
      const boxEnd = screenCenterY + boxSize / 2;

      let bestSection = sections[0];
      let maxOccupancy = 0;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          const sectionStart = offsetTop;
          const sectionEnd = offsetTop + offsetHeight;

          // Calculate occupancy in center box
          const occupiedStart = Math.max(sectionStart, boxStart);
          const occupiedEnd = Math.min(sectionEnd, boxEnd);
          const occupancy = Math.max(0, occupiedEnd - occupiedStart);

          if (occupancy > maxOccupancy) {
            maxOccupancy = occupancy;
            bestSection = section;
          }
        }
      }

      setActiveSection(bestSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bgColor = isDark ? '#25282A' : '#D9D9D6';
  const textColor = isDark ? '#D9D9D6' : '#25282A';
  const navbarTextColor = isDark ? '#D9D9D6' : '#25282A';
  const linkHoverColor = isDark ? '#F1C400' : '#F4633A';
  const navbarShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
  const navbarBgColor = isDark ? 'rgba(37, 40, 42, 0.85)' : 'rgba(217, 217, 214, 0.85)';

  return (
    <Box sx={{ 
      backgroundColor: bgColor, 
      color: textColor, 
      minHeight: '100vh', 
      width: '100vw',
      position: 'relative',
      left: '50%',
      right: '50%',
      marginLeft: '-50vw',
      marginRight: '-50vw'
    }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '95%', sm: 'auto' },
          maxWidth: { xs: '95%', sm: '90%' },
          borderRadius: '50px',
          backgroundColor: navbarBgColor,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          zIndex: 1300,
          boxShadow: navbarShadow,
          padding: '0 8px',
          transition: 'box-shadow 0.3s ease, background-color 0.3s ease'
        }}
      >
        <Toolbar sx={{ gap: 2, padding: '8px 24px', justifyContent: 'center' }}>
          
          <Link 
            href="#Title" 
            sx={{ 
              color: activeSection === 'Title' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'Title' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            Title
          </Link>
          <Link 
            href="#chart1" 
            sx={{ 
              color: activeSection === 'chart1' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chart1' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            Chart 1
          </Link>
          <Link 
            href="#insights" 
            sx={{ 
              color: activeSection === 'insights' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'insights' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            Insights
          </Link>
          <IconButton
            onClick={toggleTheme}
            disableRipple
            disableFocusRipple
            disableTouchRipple
            sx={{
              color: navbarTextColor,
              ml: 1,
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
        </Toolbar>
      </AppBar>

      <Box sx={{  transition: 'background-color 0.3s ease, color 0.3s ease' }}>
        {/* Title Section */}
        <Box 
          id="Title" 
          sx={{ 
            minHeight: 'auto', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            scrollMarginTop: '8vh',
            padding: '30vh 4vw 20vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: '40%' }}>
            <Typography 
              variant="h2" 
              gutterBottom 
              sx={{ 
                color: 'var(--color-unige-blue)', 
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Title
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontSize: '1.1rem', 
                lineHeight: 1.8, 
                color: textColor,
                fontWeight: 300
              }}
            >
              Welcome to the Data Visualization Project. This page showcases interactive charts and visualizations
              built with React, D3.js, and Material-UI. Navigate through the different sections to explore
              various data visualization techniques and insights.
            </Typography>
          </Box>
        </Box>

        {/* Chart 1 Section */}
        <Box 
          id="chart1" 
          sx={{ 
            minHeight: 'auto', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            scrollMarginTop: '8vh',
            padding: '2vh 4vw 10vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '98%', maxWidth: '100%' }}>
            <Typography 
              variant="h2" 
              gutterBottom 
              sx={{ 
                color: 'var(--color-unige-light-blue)', 
                fontWeight: 700,
                marginBottom: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Chart 1
            </Typography>
            <Box sx={{ width: '100%' }}>
              <MyChart />
            </Box>
          </Box>
        </Box>

        {/* Insights Section */}
        <Box 
          id="insights" 
          sx={{ 
            minHeight: 'auto', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            scrollMarginTop: '8vh',
            padding: '2vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: '40%' }}>
            <Typography 
              variant="h2" 
              gutterBottom 
              sx={{ 
                color: 'var(--color-unige-blue)', 
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Insights
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontSize: '1.1rem', 
                lineHeight: 1.8, 
                color: textColor,
                fontWeight: 300
              }}
            >
              Data visualization is a powerful tool for understanding complex information. By presenting data in visual formats, 
              we can quickly identify patterns, trends, and outliers. This project demonstrates various visualization techniques 
              and best practices for creating engaging and informative charts. Explore the different sections to see how data can 
              be transformed into meaningful insights.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box 
        component="footer"
        sx={{ 
          backgroundColor: 'var(--color-unige-blue)',
          color: navbarTextColor,
          padding: '12vh 5vw 6vh 5vw',
          textAlign: 'center',
          boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.3)',
          transition: 'color 0.3s ease, box-shadow 0.3s ease'
        }}
      >
        <Typography variant="body2" sx={{ fontSize: '0.95rem', mb: 1 }}>
          © 2025 Data Visualization Project - University of Genoa
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', opacity: 0.8 }}>
          Built with React, D3.js, and Material-UI
        </Typography>
      </Box>

      {/* Scroll to Top Button */}
      <Fab
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          backgroundColor: linkHoverColor,
          color: isDark ? '#25282A' : '#ffffff',
          opacity: showScrollTop ? 1 : 0,
          visibility: showScrollTop ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease, color 0.3s ease, transform 0.3s ease, background-color 0.3s ease',
          transform: showScrollTop ? 'scale(1)' : 'scale(0.8)',
          '&:hover': {
            backgroundColor: isDark ? '#F1C400' : '#F4633A',
            transform: 'scale(1.1)',
            boxShadow: isDark ? '0 8px 24px rgba(241, 196, 0, 0.4)' : '0 8px 24px rgba(244, 99, 58, 0.4)'
          },
          zIndex: 1200
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Box>
  );
}
