import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Link, IconButton, Fab, Tooltip, Backdrop } from '@mui/material';
import { DarkMode, LightMode, Visibility, VisibilityOff, HelpOutline } from '@mui/icons-material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TerritoryMap from './components/TerritoryMap';
import LineChart from './components/LineChart';
import RidgeChart from './components/RidgePlot';
import ViolinBoxPlot from './components/ViolinBoxPlot';
import EventsSankeyDiagram from './components/SankeyDiagram';
import SmallMultipleChart from './components/SmallMultiples';
import DonutChart from './components/DonutChart';
import GeoChart from './components/GeoMap';
import Footer from './Footer.jsx';
import { useThemeContext } from './ThemeContext.jsx';
import { rgb } from 'd3';

export default function App() {
  const [guideActive, setGuideActive] = useState(false);
  const { isDark, setIsDark, isMonochromacy, setIsMonochromacy } = useThemeContext();
    // Guide overlay content for each plot
    
      
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [emailCopied, setEmailCopied] = useState(false);
  const [isMobileBlocked, setIsMobileBlocked] = useState(false);
  const [useShortLabels, setUseShortLabels] = useState(false);
  const navbarRef = useRef(null);
  const toolbarRef = useRef(null);
  const mobileBlockedRef = useRef(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleMonochromacy = () => {
    setIsMonochromacy(!isMonochromacy);
  };

  useLayoutEffect(() => {
    // Sync CSS variable theme classes on :root so var(--...) works
    const root = document.documentElement;

    // Clear all theme-related classes first to avoid overlaps
    root.classList.remove('monochromacy-dark-mode', 'monochromacy-light-mode', 'dark-theme', 'light-theme');

    if (isMonochromacy) {
      // Apply monochromacy theme based on isDark state
      if (isDark) {
        // Dark UI should use the black-on-white monochrome palette
        root.classList.add('monochromacy-light-mode');
      } else {
        // Light UI should use the white-on-black monochrome palette
        root.classList.add('monochromacy-dark-mode');
      }
    } else {
      // Apply regular theme
      if (isDark) {
        root.classList.add('dark-theme');
      } else {
        root.classList.add('light-theme');
      }
    }
  }, [isDark, isMonochromacy]);

  useEffect(() => {
    const WIDTH_ON = 830;
    const WIDTH_OFF = 870;

    const update = () => {
      const w = window.innerWidth || document.documentElement.clientWidth;
      const currentlyBlocked = mobileBlockedRef.current;
      const shouldBlock = currentlyBlocked ? w < WIDTH_OFF : w < WIDTH_ON;
      if (shouldBlock !== mobileBlockedRef.current) {
        mobileBlockedRef.current = shouldBlock;
        setIsMobileBlocked(shouldBlock);
      }
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const updateLabels = () => {
      const w = window.innerWidth || document.documentElement.clientWidth;
      setUseShortLabels(w < 1195);
    };

    updateLabels();
    window.addEventListener('resize', updateLabels);

    return () => {
      window.removeEventListener('resize', updateLabels);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // Calculate scroll progress (0 to 1)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(progress);

      // Determine active section based on which section is most visible
      const sections = ['introduction', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      let currentSection = sections[0];

      // Check from bottom to top which section we've scrolled past
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          currentSection = sections[i];
          break;
        }
      }

      // If at very top of page, always show first section
      if (window.scrollY < 100) {
        currentSection = sections[0];
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (event, sectionId) => {
    event.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) return;

    const navbarHeight = navbarRef.current?.getBoundingClientRect().height || 0;
    const extraGap = 16; // breathing room so content is not hidden under the navbar
    const offset = navbarHeight + extraGap;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
  };

  const handleEmailClick = () => {
    navigator.clipboard.writeText('mfmatteoferrari@gmail.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const bgColor = 'var(--bg-primary)';
  const textColor = 'var(--text-primary)';
  const navbarTextColor = 'var(--text-navbar)';
  const linkHoverColor = 'var(--color-link-hover)';
  const borderColor = 'var(--color-details)';
  const navbarShadow = 'var(--navbar-shadow)';
  const navbarBgColor = 'var(--bg-primary)';


  if (isMobileBlocked) {
    return (
      <Box sx={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px', textAlign: 'center' }}>
        <Box sx={{ maxWidth: 520, margin: '32px auto', border: '1px solid var(--color-details)', borderRadius: '12px', padding: '24px 20px', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', backgroundColor: 'var(--bg-secondary)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, marginBottom: '10px' }}>
            Desktop Experience Required
          </Typography>
          <Typography sx={{ fontSize: '15px', lineHeight: 1.5 }}>
            This data visualization is optimized for larger screens. Please visit from a desktop or widen your window to explore the content.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      backgroundColor: bgColor,
      color: textColor,
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      margin: 0,
      padding: 0,
      overflowX: 'hidden',
      position: 'relative'
    }}>
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

          <Link
            href="#introduction"
            onClick={(e) => scrollToSection(e, 'introduction')}
            sx={{
              color: activeSection === 'introduction' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'introduction' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            War or Genocide?
          </Link>
          <Link
            href="#chapter1"
            onClick={(e) => scrollToSection(e, 'chapter1')}
            sx={{
              color: activeSection === 'chapter1' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter1' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Life' : 'Life'}
          </Link>
          <Link
            href="#chapter2"
            onClick={(e) => scrollToSection(e, 'chapter2')}
            sx={{
              color: activeSection === 'chapter2' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter2' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Mortality' : 'Mortality'}
          </Link>
          <Link
            href="#chapter3"
            onClick={(e) => scrollToSection(e, 'chapter3')}
            sx={{
              color: activeSection === 'chapter3' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter3' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Events' : 'Events'}
          </Link>
          <Link
            href="#chapter4"
            onClick={(e) => scrollToSection(e, 'chapter4')}
            sx={{
              color: activeSection === 'chapter4' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter4' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Timeline' : 'Timeline'}
          </Link>
          <Link
            href="#chapter5"
            onClick={(e) => scrollToSection(e, 'chapter5')}
            sx={{
              color: activeSection === 'chapter5' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter5' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Fatalities' : 'Fatalities'}
          </Link>
          <Link
            href="#chapter6"
            onClick={(e) => scrollToSection(e, 'chapter6')}
            sx={{
              color: activeSection === 'chapter6' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter6' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Map' : 'Map'}
          </Link>
          <Box sx={{ display: 'flex', gap: { xs: 0.6, md: 1 }, flexShrink: 0 }}>
            <Tooltip title="Show Guide" arrow>
              <IconButton
                onClick={() => setGuideActive(true)}
                disableRipple
                disableFocusRipple
                disableTouchRipple
                sx={{
                  color: navbarTextColor,
                  transition: 'color 0.3s ease',
                  outline: 'none !important',
                  boxShadow: 'none !important',
                  '&:hover': {
                    color: linkHoverColor,
                    backgroundColor: 'transparent !important'
                  }
                }}
                aria-label="Show Guide"
              >
                <HelpOutline />
              </IconButton>
            </Tooltip>
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
            <Link
            href="#/datasets"
            rel="noopener noreferrer"
            sx={{
              color: navbarTextColor,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.3s ease',
              '&:hover': { color: linkHoverColor }
            }}
            aria-label="Datasets and Sources"
          >
            
            <strong>Data</strong>
          </Link>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Guide Overlay - only show on non-chart sections */}
      {guideActive && (
        <Backdrop
          open={guideActive}
          onClick={() => setGuideActive(false)}
          sx={{
            zIndex: 20000,
            color: 'var(--text-primary)',
            backgroundColor: 'rgba(0,0,0,0.7)',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            p: 0,
            m: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Box
            onClick={e => e.stopPropagation()}
            sx={{
              position: 'absolute',
              top: '10%',
              left: '50%',
              transform: 'translate(-50%, 0)',
              background: 'var(--bg-secondary, #222)',
              color: 'var(--text-primary, #fff)',
              borderRadius: 2,
              boxShadow: 3,
              border: '2px solid var(--color-details, #90caf9)',
              px: 4,
              py: 3,
              minWidth: 120,
              minHeight: 60,
              zIndex: 24000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.15rem',
              fontWeight: 600,
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            <span style={{ color: 'var(--color-details, #90caf9)' }}>Guide</span>
            {activeSection === 'introduction' && (
              <div style={{ fontSize: '0.95rem', fontWeight: 400, marginTop: 6, color: 'var(--text-primary, #fff)' }}>
                View the chart to learn how to interact with it
              </div>
            )}
            <div style={{ fontSize: '0.95rem', fontWeight: 400, marginTop: 6, color: 'var(--color-details, #90caf9)' }}>
              Click anywhere to close
            </div>
          </Box>
        </Backdrop>
      )}

      <Box sx={{ transition: 'background-color 0.3s ease, color 0.3s ease' }}>
        {/* Title Section */}
        <Box
          id="introduction"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            scrollMarginTop: '8vh',
            padding: '20vh 4vw 2vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))' }}>

            {/* Main Title */}
            <Typography
              variant="h1"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              War or Genocide?
            </Typography>

            {/* Intro Paragraph */}
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 3
              }}
            >
              This data visualization project examines the ongoing conflict between Israel and Palestine
              through a strictly data-driven approach. Rather than presenting opinions or predefined
              narratives, the analysis relies exclusively on quantitative data.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 4
              }}
            >
              The purpose is not to provide a definitive answer, but to leave the interpretation to the user.
              By exploring patterns, trends and measurable evidence, each viewer is invited to reflect on
              whether the observed events align more closely with the concept of <i>war</i> or <i>genocide</i>.
            </Typography>

            {/* Definitions */}
            <Typography
              variant="body2"
              sx={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: textColor,
                fontWeight: 300,
                marginBottom: 2
              }}
            >
              To ensure clarity, the following definitions are provided by the{' '}
              <Link
                href="https://dictionary.cambridge.org/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: textColor,
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': { color: linkHoverColor }
                }}
              >
                Cambridge Dictionary
              </Link>.
            </Typography>

            <Typography
              variant="body2"
              sx={{ fontSize: '1.05rem', color: textColor, marginBottom: 1 }}
            >
              <b>War</b>: <i>armed fighting between two or more countries or groups.</i>
            </Typography>

            <Typography
              variant="body2"
              sx={{ fontSize: '1.05rem', color: textColor }}
            >
              <b>Genocide</b>: <i>the crime of intentionally destroying part or all of a national, ethnic,
                racial, or religious group, by killing people or by other methods.</i>
            </Typography>

            {/* Territories Section + Map */}
            <Box sx={{ marginTop: 4, marginBottom: 2 }}>
              <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    color: textColor,
                    fontWeight: 600,
                    marginBottom: 2,
                    fontSize: { xs: '1.25rem', md: '1.6rem' }
                  }}
                >
                  Understanding the territories
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.05rem',
                    lineHeight: 1.8,
                    color: textColor,
                    fontWeight: 300,
                    marginBottom: 2
                  }}
                >
                  The map below shows the territories of the{" "}
                  <Box component="span" sx={{ color: 'var(--color-Israel)', fontWeight: 600 }}>State of Israel</Box>
                  {" "}and the {" "}
                  <Box component="span" sx={{ color: 'var(--color-Palestine)', fontWeight: 600 }}>State of Palestine</Box>.
                  {" "}<br />The Palestinian territory is composed of two main areas:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.05rem',
                    lineHeight: 1.8,
                    color: textColor,
                    fontWeight: 300,
                    marginBottom: 1
                  }}
                >
                  <Box component="span" sx={{ color: 'var(--color-Palestine)', fontWeight: 700 }}>West Bank</Box>
                  {" "}- A land area largely under Israeli control, but claimed by the State of Palestine.

                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.05rem',
                    lineHeight: 1.8,
                    color: textColor,
                    fontWeight: 300,
                    marginBottom: 0
                  }}
                >

                  <Box component="span" sx={{ color: 'var(--color-Palestine)', fontWeight: 700 }}>Gaza Strip</Box>
                  {" "}- A coastal enclave that is central to recent developments in the conflict.
                </Typography>

                <Box sx={{ width: '100%', minWidth: '100%' }}>
                  <TerritoryMap isDark={isDark} isMonochromacy={isMonochromacy} />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.05rem',
                    lineHeight: 1.8,
                    color: textColor,
                    fontWeight: 300,
                    marginBottom: 2
                  }}
                >
                  In the first part of the visualizations, the focus is placed on the State of Palestine as a whole. This choice, together with the limited availability of 2025 data, may smooth or underrepresent the extent of the impact of the recent events in the Gaza Strip.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.05rem',
                    lineHeight: 1.8,
                    color: textColor,
                    fontWeight: 300,
                    marginBottom: 0
                  }}
                >
                  In the final visualizations, thanks to
                  <Link
                    href="#/datasets"
                    rel="noopener noreferrer"
                    sx={{
                      color: textColor,
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': { color: linkHoverColor }
                    }}
                  >
                    {" "}ACLED data
                  </Link>
                  , it becomes possible to distinguish between the West Bank and the Gaza Strip, allowing for a more specific analysis focused on Gaza.
                </Typography>
              </Box>


            </Box>
          </Box>
        </Box>

        {/* Chapter 1 Section - Small Multiples */}
        <Box
          id="chapter1"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '3vh 4vw 10vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2rem', md: '2.8rem' }
              }}
            >
              Quality of life indicators
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 1
              }}
            >
              This section compares selected indicators related to quality of life in Israel and Palestine.
              Rather than focusing only on violent events, these metrics help describe the broader living conditions in the two territories.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 1
              }}
            >
              The visualizations below include: GDP per capita (PPP), percentage of access to safely managed drinking water, percentage of access to safely managed sanitation services, and the percentage of moderate or severe food insecurity. Together, they provide an overview of economic well-being, basic infrastructure, and access to essential resources.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 1
              }}
            >
              These indicators do not explain the causes of the differences, but they highlight structural inequalities that exist between the two populations.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              The data used for these charts refer to the years from 2018 to 2024. The time window reflects the most recent years for which comparable indicators are available for both Israel and Palestine.

            </Typography>

          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <SmallMultipleChart isDark={isDark} guideActive={guideActive} />
          </Box>
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 0, marginTop: 6 }}>

            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              The contrast shown across indicators is consistent: Israel reports significantly higher economic output per person and wider access to water and sanitation services, while Palestine shows substantially higher levels of food insecurity. These gaps form the background against which the later event-based visualizations are interpreted.
            </Typography>
          </Box>
        </Box>

        {/* Chapter 2 Section - Violin & Box Plot */}
        <Box
          id="chapter2"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '3vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2rem', md: '2.8rem' }
              }}
            >
              Mortality by age group
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              This section examines mortality in Israel and Palestine, focusing on the years from 2018 to 2023. By looking at the ages at which deaths occur, it is possible to understand the demographic impact of living conditions and conflict.              </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <ViolinBoxPlot isDark={isDark} guideActive={guideActive} />
          </Box>
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 0, marginTop: 6 }}>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 1
              }}
            >
              The visualization reveals a marked contrast between the two populations. In Palestine, a substantial proportion of deaths occurs at younger ages, especially among children, whereas in Israel mortality is predominantly concentrated among older individuals. In 2023, which includes the first three months of the Gaza Strip conflict, the chart exhibits a sharp decline in statistical values. This should be interpreted as a meaningful signal.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              These patterns do not provide information on specific causes of death, but they highlight demographic differences and the broader human impact of structural inequalities, complementing other indicators of living conditions presented earlier.
            </Typography>
          </Box>
        </Box>

        {/* Chapter 3 Section - Sankey Diagram */}
        <Box
          id="chapter3"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '3vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2rem', md: '2.8rem' }
              }}
            >
              Distribution of Events
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 1
              }}
            >
              After introducing differences in quality of life between Israel and Palestine to provide a basis for comparison, the focus now shifts to the Gaza Strip to analyze recent developments in the conflict, which began on October 7, 2023 and is still ongoing.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              This visualization presents the number and types of events that occurred in both territories from 2023 to 2025. The events are categorized in event types and subevent types which are all displayed in the diagram below.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <EventsSankeyDiagram isDark={isDark} isMonochromacy={isMonochromacy} guideActive={guideActive} />
          </Box>
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 1
              }}
            >
              The visualization clearly shows that the Gaza Strip has experienced a greater number of events than Israel, particularly those classified as the most violent and dangerous. Israel records many peaceful protests and incidents of explosions/remote violence, but when looking specifically at explosions, only about 17% of the total occur in Israel, while the remaining majority takes place in Gaza.
            </Typography>
          </Box>
        </Box>

        {/* Chapter 4 Section - Ridge Plot */}
        <Box
          id="chapter4"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '3vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2rem', md: '2.8rem' }
              }}
            >
              Temporal Distribution of Events
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              This visualization shows how events are distributed over time, with the possibility to choose which types of events to display.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <RidgeChart isDark={isDark} guideActive={guideActive} />
          </Box>
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              The chart shows that October 7, 2023, the day of the Hamas attack on Israel (
              <Link
                href="https://dictionary.cambridge.org/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: textColor,
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': { color: linkHoverColor }
                }}
              >
                October 7 attacks, Wikipedia
              </Link>
              ), represents a key point in the timeline of events. Before this date, there is a peak in violence in the Gaza Strip around May 6, 2023, while most of the remaining period appears relatively quieter. After October 7, however, the chart displays a strong increase in violent events in both territories, particularly in the Gaza Strip, where Israeli airstrikes are concentrated. These episodes of violence continued, with the exception of a calmer period between January and March 2025, until October, when they began to decrease again.
            </Typography>
          </Box>
        </Box>

        {/* Chapter 5 Section - Line Chart */}
        <Box
          id="chapter5"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '3vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2rem', md: '2.8rem' }
              }}
            >
              Fatalities over time
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              This visualization presents the evolution of fatalities resulting from the previously analyzed events. In the ACLED dataset, no distinction is made between civilian and military deaths, all fatalities are counted in the same category.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <LineChart isDark={isDark} guideActive={guideActive} />
          </Box>
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 1
              }}
            >
              The chart shows a clear peak in fatalities in Israel in October 2023, associated with the Hamas attack, while the values in the remaining period remain close to zero, with few exceptions.

            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              In contrast, the line for Gaza displays a sustained and markedly higher number of fatalities after October 2023. The increase continues over time, indicating that most deaths in this period occurred in the Gaza Strip.
            </Typography>

          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <DonutChart isDark={isDark} />
          </Box>
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>

            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              This view provides a clearer and more striking perspective on the distribution of fatalities in both countries.
            </Typography>

          </Box>
        </Box>

        {/* Chapter 6 Section - Geochart */}
        <Box
          id="chapter6"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '3vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2rem', md: '2.8rem' }
              }}
            >
              Interactive Map
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
              }}
            >
              This interactive map allows the exploration of two different datasets related to the Gaza Strip. The first one shows incidents related to the health-care and the food system.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
              }}
            >
              The second one displays the locations of the damaged buildings.
              Due to the large number of recorded observations, points on the map have been clustered by spatial proximity. This results in a reduction of geographical precision, but significantly improves of performance and readability.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <GeoChart isDark={isDark} isMonochromacy={isMonochromacy} guideActive={guideActive} />
          </Box>
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>

            <Typography
              variant="body1"
              sx={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 4
              }}
            >
              This project has presented a series of data-driven visualizations in order to explore the current conflict in the Gaza Strip, providing the context necessary to let you reflect on the following question: what is it really about?
            </Typography>
            <Typography
              variant="h1"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginTop: 10,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              War or Genocide?
            </Typography>

          </Box>
        </Box>
      </Box>

      <Footer isDark={isDark} isMonochromacy={isMonochromacy} />

      

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
    </Box >
  );
}
