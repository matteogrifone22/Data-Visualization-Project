import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyLeft } from "d3-sankey";
import NearMeIcon from '@mui/icons-material/NearMe';

export function EventsSankeyDiagram({ isDark = true, isMonochromacy = false, guideActive = false }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const animationPlayedRef = useRef(false);
  const [data, setData] = useState(null);

  // Load dataset
  useEffect(() => {
    animationPlayedRef.current = false;
    const load = async () => {
      const url = new URL("../Dataset/events_sankey.csv", import.meta.url).href;
      const rows = await d3.csv(url);
      if (!rows || rows.length === 0) return;

      // Parse data
      const parsed = rows.map((d) => ({
        country: d.country === "Palestine" ? "Gaza" : d.country,
        eventType: d.event_type,
        subEventType: d.sub_event_type,
        events: +d.events
      }));

      setData(parsed);
    };

    load();
  }, []);

  // Aggregate links to avoid duplicate flows
  function aggregateLinks(links) {
    const map = new Map();
    links.forEach(link => {
      const key = `${link.source}|${link.target}|${link.country}|${link.side}`;
      if (!map.has(key)) {
        map.set(key, { ...link });
      } else {
        map.get(key).value += link.value;
      }
    });
    return Array.from(map.values());
  }

  // Render Sankey diagram
  useEffect(() => {
    if (!data || !svgRef.current || !wrapperRef.current) return;

    const wrapper = wrapperRef.current;
    const containerWidth = wrapper.offsetWidth || 1000;
    const containerHeight = 600;
    const margin = { top: 40, right: 200, bottom: 60, left: 200 };
    const width = containerWidth;
    const height = containerHeight;

    d3.select(svgRef.current).selectAll("*").remove();
    d3.select('body').selectAll('.chart-tooltip').remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Create tooltip (universal style, appended to body)
    const tooltip = d3.select('body')
      .selectAll('.chart-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'chart-tooltip')
      .attr('role', 'tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('z-index', 10)
      .style('opacity', 0)
      .style('visibility', 'hidden')
      .style('transition', 'opacity 120ms ease, visibility 120ms ease');

    // Build nodes and links for Sankey
    // Structure: Country (left) -> Event Type (middle) -> Sub-Event Type (right)
    const nodesMap = new Map();
    const links = [];

    // Helper to get or create node
    const getNode = (id, name) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, name });
      }
      return nodesMap.get(id);
    };

    // Create nodes and links from data
    data.forEach((d) => {
      const countryId = d.country;
      const eventTypeId = d.eventType;
      const subEventId = `${d.eventType}|${d.subEventType}`;

      // Ensure nodes exist
      getNode(countryId === "Palestine" ? "Gaza" : countryId, d.country === "Palestine" ? "Gaza" : d.country);
      getNode(eventTypeId, d.eventType);
      getNode(subEventId, d.subEventType);

      // Link: Country -> Event Type
      links.push({
        source: (countryId === "Palestine" ? "Gaza" : countryId),
        target: eventTypeId,
        value: d.events,
        country: d.country === "Palestine" ? "Gaza" : d.country,
        side: "left"
      });

      // Link: Event Type -> Sub-event Type
      links.push({
        source: eventTypeId,
        target: subEventId,
        value: d.events,
        country: d.country,
        side: "right"
      });
    });
    // Aggregate links to merge duplicates
    const aggregatedLinks = aggregateLinks(links);
    const nodes = Array.from(nodesMap.values());

    console.log('Nodes:', nodes);
    console.log('Links:', links);

    // Custom sort function to group sub-events with their parent events
    const nodeSort = (a, b) => {
      
      
      // Get parent event type for sub-events
      const getParent = (node) => {
        if (node.id.includes("|")) {
          return node.id.split("|")[0];
        }
        return node.id;
      };
      
      const parentA = getParent(a);
      const parentB = getParent(b);
      
      // If different parent events, sort by parent
      if (parentA !== parentB) {
        return parentA.localeCompare(parentB);
      }
      
      // Same parent, sort alphabetically
      return a.id.localeCompare(b.id);
    };

    // Create Sankey layout with default padding
    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom]
      ])
      .nodeId(d => d.id)
      .nodeAlign(sankeyLeft)
      .nodeSort(nodeSort);

    let graph;
    try {
      graph = sankeyGenerator({
        nodes: nodes.map(d => ({ ...d })),
        links: aggregatedLinks.map(d => ({ ...d }))
      });
      
      // Post-process: adjust spacing for left and center columns to match right column height
      const columnNodes = {
        left: [],
        center: [],
        right: []
      };
      
      // Categorize nodes by column position
      graph.nodes.forEach(node => {
        if (node.id === "Israel" || node.id === "Gaza") {
          columnNodes.left.push(node);
        } else if (node.id.includes("|")) {
          columnNodes.right.push(node);
        } else {
          columnNodes.center.push(node);
        }
      });
      
      // Calculate total heights for each column
      const getColumnHeight = (nodes) => {
        if (nodes.length === 0) return 0;
        const sorted = nodes.sort((a, b) => a.y0 - b.y0);
        return sorted[sorted.length - 1].y1 - sorted[0].y0;
      };
      
      const rightHeight = getColumnHeight(columnNodes.right);
      const leftHeight = getColumnHeight(columnNodes.left);
      const centerHeight = getColumnHeight(columnNodes.center);
      
      // Adjust left column spacing
      if (columnNodes.left.length === 2 && rightHeight > leftHeight) {
        const leftSorted = columnNodes.left.sort((a, b) => a.y0 - b.y0);
        const topNode = leftSorted[0];
        const bottomNode = leftSorted[1];
        const nodeHeight = topNode.y1 - topNode.y0;
        const bottomNodeHeight = bottomNode.y1 - bottomNode.y0;
        
        // Keep top node at current position
        // Move bottom node to create equal total height
        const newBottomY0 = topNode.y0 + rightHeight - bottomNodeHeight;
        
        bottomNode.y0 = newBottomY0;
        bottomNode.y1 = newBottomY0 + bottomNodeHeight;
      }
      
      // Adjust center column spacing
      if (columnNodes.center.length > 0 && rightHeight > centerHeight) {
        const centerSorted = columnNodes.center.sort((a, b) => a.y0 - b.y0);
        const totalNodeHeight = centerSorted.reduce((sum, n) => sum + (n.y1 - n.y0), 0);
        const availableSpace = rightHeight - totalNodeHeight;
        const spacing = availableSpace / (centerSorted.length - 1 || 1);
        
        let currentY = centerSorted[0].y0;
        centerSorted.forEach(node => {
          const nodeHeight = node.y1 - node.y0;
          node.y0 = currentY;
          node.y1 = currentY + nodeHeight;
          currentY = node.y1 + spacing;
        });
      }
      
      // Recalculate link positions after node adjustments
      graph.links.forEach(link => {
        // Recalculate source and target y positions based on node positions
        const sourceLinks = graph.links.filter(l => l.source === link.source);
        const targetLinks = graph.links.filter(l => l.target === link.target);
        
        // Calculate y position for source
        const sourceOutgoingLinks = sourceLinks.filter(l => l.source === link.source);
        const sourceIndex = sourceOutgoingLinks.indexOf(link);
        const sourceTotalValue = sourceOutgoingLinks.reduce((sum, l) => sum + l.value, 0);
        
        let sourceY = link.source.y0;
        for (let i = 0; i < sourceIndex; i++) {
          sourceY += (sourceOutgoingLinks[i].value / sourceTotalValue) * (link.source.y1 - link.source.y0);
        }
        link.y0 = sourceY + (link.value / sourceTotalValue) * (link.source.y1 - link.source.y0) / 2;
        
        // Calculate y position for target
        const targetIncomingLinks = targetLinks.filter(l => l.target === link.target);
        const targetIndex = targetIncomingLinks.indexOf(link);
        const targetTotalValue = targetIncomingLinks.reduce((sum, l) => sum + l.value, 0);
        
        let targetY = link.target.y0;
        for (let i = 0; i < targetIndex; i++) {
          targetY += (targetIncomingLinks[i].value / targetTotalValue) * (link.target.y1 - link.target.y0);
        }
        link.y1 = targetY + (link.value / targetTotalValue) * (link.target.y1 - link.target.y0) / 2;
      });
      
    } catch (error) {
      console.error('Sankey generation error:', error);
      console.error('Nodes:', nodes);
      console.error('Links:', links);
      return;
    }

    const readCssColor = (variable, fallback) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
      return value ? value.trim() : fallback;
    };

    // Theme-aware colors; pull from CSS vars so monochromacy/regular themes stay in sync
    const countryColors = {
      Israel: readCssColor("--color-Israel", "var(--color-Israel)"),
      Palestine: readCssColor("--color-Palestine", "var(--color-Palestine)")
    };

    // Use the same base colors for blending; if you want lighter/darker variants, adjust CSS vars instead
    const blendColors = {
      Israel: countryColors.Israel,
      Gaza: countryColors.Palestine
    };

    const getNodeColor = (node) => {
      // Color country nodes by their country
      const id = node.id === "Gaza" ? "Palestine" : node.id;
      if (id === "Israel" || id === "Palestine") {
        return countryColors[id];
      }

      // For event types and sub-events, color by dominant incoming country
      const incomingLinks = graph.links.filter(l => l.target === node);
      let israelFlow = 0;
      let palestineFlow = 0;

      incomingLinks.forEach(link => {
        if (link.country === "Israel") israelFlow += link.value;
        if (link.country === "Gaza") palestineFlow += link.value;
      });

      if (israelFlow === 0 && palestineFlow === 0) return "var(--color-details)";
      if (israelFlow > palestineFlow) return countryColors.Israel;
      if (palestineFlow > israelFlow) return countryColors.Palestine;
      // Tie: use neutral accent
      return "var(--color-details)";
    };

    const getLinkColor = (link) => {
      // Color links by the originating country
      const color = countryColors[link.country === "Gaza" ? "Palestine" : link.country];
      return color || "var(--color-details)";
    };

    // Draw links
    const linksGroup = svg
      .append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d) => getLinkColor(d))
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("opacity", 0.4)
      .attr("class", "sankey-link")
      .attr("data-side", (d) => d.side)
      .style("stroke-dasharray", function() {
        return animationPlayedRef.current ? 0 : this.getTotalLength();
      })
      .style("stroke-dashoffset", function() {
        return animationPlayedRef.current ? 0 : this.getTotalLength();
      })
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 0.7);
        const sourceName = d.source.name || d.source.id;
        const targetName = d.target.name || d.target.id;
        tooltip
          .style('opacity', 1)
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: 600; margin-bottom: 6px; color: ${countryColors[d.country === 'Gaza' ? 'Palestine' : d.country]};">
              ${d.country}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>${sourceName}</strong> → <strong>${targetName}</strong>
            </div>
            <div style="font-size: 14px; font-weight: 600;">
              ${d.value.toLocaleString()} events
            </div>
          `);
      })
      .on("mousemove", function (event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.4);
        tooltip.style('opacity', 0).style('visibility', 'hidden');
      });

    // Draw nodes
    const nodeGroups = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(graph.nodes)
      .join("g")
      .attr("data-node-type", (d) => {
        if (d.id === "Israel" || d.id === "Gaza") return "country";
        if (d.id.includes("|")) return "subevent";
        return "eventtype";
      });

    nodeGroups
      .append("rect")
      .attr("class", "node-rect")
      .attr("data-node-type", (d) => {
        if (d.id === "Israel" || d.id === "Gaza") return "country";
        if (d.id.includes("|")) return "subevent";
        return "eventtype";
      })
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("fill", (d) => getNodeColor(d))
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", 0.5)
      .style("opacity", animationPlayedRef.current ? 1 : 0)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("stroke-width", 2);
        
        // Highlight connected links
        const connectedLinks = graph.links.filter(l => l.source === d || l.target === d);
        svg.selectAll(".sankey-link")
          .attr("opacity", link => connectedLinks.includes(link) ? 0.8 : 0.1);
        
        // Calculate country contributions for non-country nodes
        let tooltipContent = `<div style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">${d.name || d.id}</div>`;
        tooltipContent += `<div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">${d.value.toLocaleString()} total events</div>`;
        
        if (d.id !== "Israel" && d.id !== "Gaza") {
          const incomingLinks = graph.links.filter(l => l.target === d);
          let israelCount = 0;
          let gazaCount = 0;
          
          incomingLinks.forEach(link => {
            if (link.country === "Israel") israelCount += link.value;
            if (link.country === "Gaza") gazaCount += link.value;
          });
          
          if (israelCount > 0 || gazaCount > 0) {
            tooltipContent += `<div class="tooltip-country-breakdown">`;
            if (israelCount > 0) {
              const pct = ((israelCount / d.value) * 100).toFixed(1);
              tooltipContent += `<div style="margin-bottom: 3px;"><span style="color: ${countryColors.Israel};">●</span> Israel: ${israelCount.toLocaleString()} (${pct}%)</div>`;
            }
            if (gazaCount > 0) {
              const pct = ((gazaCount / d.value) * 100).toFixed(1);
              tooltipContent += `<div><span style="color: ${countryColors.Palestine};">●</span> Gaza: ${gazaCount.toLocaleString()} (${pct}%)</div>`;
            }
            tooltipContent += `</div>`;
          }
        }
        
        tooltip
          .style('opacity', 1)
          .style('visibility', 'visible')
          .html(tooltipContent);
      })
      .on("mousemove", function (event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-width", 0.5);
        svg.selectAll(".sankey-link").attr("opacity", 0.4);
        tooltip.style('opacity', 0).style('visibility', 'hidden');
      });

    // Add labels without overlap using collision detection
    const labelData = [];
    
    // First pass: collect all labels with their positions
    graph.nodes.forEach(d => {
      const name = d.name || d.id;
      const nodeHeight = d.y1 - d.y0;
      
      // Determine position: countries (left col) → right side, event types (center col) → left side, sub-events (right col) → left side
      const isCountry = d.id === "Israel" || d.id === "Gaza";
      const isSubEvent = d.id.includes("|");
      const isEventType = !isCountry && !isSubEvent;
      
      let labelX, textAnchor;
      if (isCountry) {
        // Countries: label on the right of the rectangle
        labelX = d.x1 + 6;
        textAnchor = "start";
      } else {
        // Event types and sub-events: label on the left of the rectangle
        labelX = d.x0 - 6;
        textAnchor = "end";
      }
      
      const fontSize = nodeHeight < 15 ? 9 : 11;
      const maxLength = 35;
      const displayName = name.length > maxLength ? name.substring(0, maxLength - 3) + "..." : name;
      
      labelData.push({
        node: d,
        name: displayName,
        x: labelX,
        y: (d.y1 + d.y0) / 2,
        textAnchor: textAnchor,
        fontSize: fontSize,
        originalY: (d.y1 + d.y0) / 2
      });
    });
    
    // Second pass: adjust positions to avoid overlaps
    // Group labels by their text-anchor direction (right-aligned vs left-aligned)
    const rightAnchoredLabels = labelData.filter(d => d.textAnchor === "end").sort((a, b) => a.originalY - b.originalY);
    const leftAnchoredLabels = labelData.filter(d => d.textAnchor === "start").sort((a, b) => a.originalY - b.originalY);
    
    const adjustLabels = (labels) => {
      const minSpacing = 14; // Minimum vertical spacing between labels
      
      for (let i = 1; i < labels.length; i++) {
        const current = labels[i];
        const previous = labels[i - 1];
        const overlap = (previous.y + minSpacing) - current.y;
        
        if (overlap > 0) {
          current.y = previous.y + minSpacing;
        }
      }
      
      // Second pass: push down from top if needed
      for (let i = labels.length - 2; i >= 0; i--) {
        const current = labels[i];
        const next = labels[i + 1];
        const overlap = (current.y + minSpacing) - next.y;
        
        if (overlap > 0) {
          current.y = next.y - minSpacing;
        }
      }
    };
    
    adjustLabels(rightAnchoredLabels);
    adjustLabels(leftAnchoredLabels);
    
    // Third pass: render labels with adjusted positions
    nodeGroups.each(function(d) {
      const group = d3.select(this);
      const labelInfo = labelData.find(l => l.node === d);
      if (!labelInfo) return;
      
      // Removed label connection lines
      
      group
        .append("text")
        .attr("class", "node-label")
        .attr("data-node-type", d.id === "Israel" || d.id === "Gaza" ? "country" : d.id.includes("|") ? "subevent" : "eventtype")
        .attr("x", labelInfo.x)
        .attr("y", (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", labelInfo.textAnchor)
        .attr("font-size", labelInfo.fontSize)
        .attr("font-weight", 500)
        .attr("fill", "var(--text-primary)")
        .style("text-shadow", isDark 
          ? "0 0 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)" 
          : "0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.6)")
        .style("opacity", animationPlayedRef.current ? 1 : 0)
        .text(labelInfo.name);
    });

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-primary)")
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .text("Events Categories (2023-2025)");

    // Add scroll-triggered animation (100% visible)
    const observerOptions = {
      threshold: 1.0 // Trigger only when 100% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animationPlayedRef.current) {
          animationPlayedRef.current = true;

          // STEP 1: Country rectangles appear
          d3.select(svgRef.current)
            .selectAll(".node-rect[data-node-type='country']")
            .transition()
            .duration(400)
            .ease(d3.easeQuadInOut)
            .style("opacity", 1);

          // STEP 1b: Country labels appear
          d3.select(svgRef.current)
            .selectAll(".node-label[data-node-type='country']")
            .transition()
            .duration(400)
            .ease(d3.easeQuadInOut)
            .style("opacity", 1);

          // STEP 2: Country -> Event Type flow draws
          d3.select(svgRef.current)
            .selectAll(".sankey-link[data-side='left']")
            .transition()
            .delay(400)
            .duration(800)
            .ease(d3.easeLinear)
            .style("stroke-dashoffset", 0);

          // STEP 3: Event Type rectangles appear (when left flow completes)
          d3.select(svgRef.current)
            .selectAll(".node-rect[data-node-type='eventtype']")
            .transition()
            .delay(1200)
            .duration(400)
            .ease(d3.easeQuadInOut)
            .style("opacity", 1);

          // STEP 3b: Event Type labels appear
          d3.select(svgRef.current)
            .selectAll(".node-label[data-node-type='eventtype']")
            .transition()
            .delay(1200)
            .duration(400)
            .ease(d3.easeQuadInOut)
            .style("opacity", 1);

          // STEP 4: Event Type -> Sub-Event Type flow draws (delayed for event type to spawn easily)
          d3.select(svgRef.current)
            .selectAll(".sankey-link[data-side='right']")
            .transition()
            .delay(1800)
            .duration(1000)
            .ease(d3.easeLinear)
            .style("stroke-dashoffset", 0);

          // STEP 5: Sub-Event rectangles appear (when right flow completes)
          d3.select(svgRef.current)
            .selectAll(".node-rect[data-node-type='subevent']")
            .transition()
            .delay(2800)
            .duration(400)
            .ease(d3.easeQuadInOut)
            .style("opacity", 1);

          // STEP 5b: Sub-Event labels appear
          d3.select(svgRef.current)
            .selectAll(".node-label[data-node-type='subevent']")
            .transition()
            .delay(2800)
            .duration(400)
            .ease(d3.easeQuadInOut)
            .style("opacity", 1);

          // Animate label connection lines
          d3.select(svgRef.current)
            .selectAll(".label-line")
            .transition()
            .delay(2800)
            .duration(400)
            .ease(d3.easeQuadInOut)
            .style("opacity", 0.5);
        }
      });
    }, observerOptions);

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    // Add resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (data && svgRef.current && wrapperRef.current) {
        // Re-trigger render
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    });
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [data, isDark, isMonochromacy]);

  return (
    <div ref={wrapperRef} style={{ width: "100%", margin: "0 auto", position: 'relative', minHeight: 600 }}>
      {/* Guide banner for onhover tooltip*/}
      {guideActive && (
        <div
          style={{
            position: 'absolute',
            left: '18%',
            top: '22%',
            zIndex: 21000,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary, #23272f)',
            color: 'var(--color-details, #90caf9)',
            borderRadius: 10,
            padding: '8px 18px',
            fontSize: '1.08rem',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
          }}
        >
          <NearMeIcon style={{ fontSize: 22, marginRight: 8, transform: 'scalex(-1)' }} />
          Hover tooltip
        </div>
      )}
      <svg
        ref={svgRef}
        role="img"
        aria-label="Sankey diagram showing flow of events by type"
        style={{ width: "100%", height: "auto" }}
      />
      <div style={{
                position: 'absolute',
                right: 12,
                bottom: -30,
                fontSize: '0.95rem',
                color: isDark ? 'var(--text-secondary)' : 'var(--text-secondary)',
                opacity: 0.5,
                padding: '2px 10px',
                borderRadius: '12px',
                fontFamily: 'var(--font-serif)',
                zIndex: 2
            }}>
                Data source: <strong>ACLED</strong>
            </div>
    </div>
  );
}

export default EventsSankeyDiagram;
