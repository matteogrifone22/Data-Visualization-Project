import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyLeft } from "d3-sankey";

export function EventsSankeyDiagram({ isDark = true }) {
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
        country: d.country,
        eventType: d.event_type,
        subEventType: d.sub_event_type,
        events: +d.events
      }));

      setData(parsed);
    };

    load();
  }, []);

  // Render Sankey diagram
  useEffect(() => {
    if (!data || !svgRef.current || !wrapperRef.current) return;

    const wrapper = wrapperRef.current;
    const containerWidth = wrapper.offsetWidth || 1000;
    const containerHeight = 600;
    const margin = { top: 40, right: 200, bottom: 40, left: 200 };
    const width = containerWidth;
    const height = containerHeight;

    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(wrapperRef.current).selectAll(".sankey-tooltip").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Create tooltip
    const tooltip = d3
      .select(wrapperRef.current)
      .append("div")
      .attr("class", "sankey-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)")
      .style("color", isDark ? "#fff" : "#25282A")
      .style("padding", "10px 12px")
      .style("border-radius", "6px")
      .style("border", `1px solid ${isDark ? "#555" : "#ddd"}`)
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)");

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
      getNode(countryId, d.country);
      getNode(eventTypeId, d.eventType);
      getNode(subEventId, d.subEventType);

      // Link: Country -> Event Type
      links.push({
        source: countryId,
        target: eventTypeId,
        value: d.events,
        country: d.country,
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
        links: links.map(d => ({ ...d }))
      });
      
      // Post-process: adjust spacing for left and center columns to match right column height
      const columnNodes = {
        left: [],
        center: [],
        right: []
      };
      
      // Categorize nodes by column position
      graph.nodes.forEach(node => {
        if (node.id === "Israel" || node.id === "Palestine") {
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

    // Theme-aware colors; use CSS vars for live updates and fallbacks for mixing math
    const countryColors = {
      Israel: "var(--color-Israel)",
      Palestine: "var(--color-Palestine)"
    };

    const blendColors = {
      Israel: isDark ? "#99B8FF" : "#0034AD",
      Palestine: isDark ? "#1CD475" : "#074024"
    };

    const getNodeColor = (node) => {
      // Color country nodes by their country
      if (node.id === "Israel" || node.id === "Palestine") {
        return countryColors[node.id];
      }
      
      // For event types and sub-events, use a neutral gradient based on total flow
      // Calculate contribution from each country
      const incomingLinks = graph.links.filter(l => l.target === node);
      let israelFlow = 0;
      let palestineFlow = 0;
      
      incomingLinks.forEach(link => {
        if (link.country === "Israel") {
          israelFlow += link.value;
        } else if (link.country === "Palestine") {
          palestineFlow += link.value;
        }
      });
      
      const totalFlow = israelFlow + palestineFlow;
      if (totalFlow === 0) {
        return isDark ? "#888" : "#666";
      }
      
      // Mix colors based on contribution ratio
      const israelRatio = israelFlow / totalFlow;
      const israelColor = d3.color(blendColors.Israel);
      const palestineColor = d3.color(blendColors.Palestine);
      
      // Interpolate between the two colors
      return d3.interpolateRgb(palestineColor, israelColor)(israelRatio);
    };

    const getLinkColor = (link) => {
      // Color links by the originating country
      const color = countryColors[link.country];
      return color || (isDark ? "#646cff" : "#535bf2");
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
          .style("visibility", "visible")
          .html(`
            <div style="font-weight: 600; margin-bottom: 6px; color: ${countryColors[d.country]};">
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
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.4);
        tooltip.style("visibility", "hidden");
      });

    // Draw nodes
    const nodeGroups = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(graph.nodes)
      .join("g")
      .attr("data-node-type", (d) => {
        if (d.id === "Israel" || d.id === "Palestine") return "country";
        if (d.id.includes("|")) return "subevent";
        return "eventtype";
      });

    nodeGroups
      .append("rect")
      .attr("class", "node-rect")
      .attr("data-node-type", (d) => {
        if (d.id === "Israel" || d.id === "Palestine") return "country";
        if (d.id.includes("|")) return "subevent";
        return "eventtype";
      })
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("fill", (d) => getNodeColor(d))
      .attr("stroke", isDark ? "#fff" : "#000")
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
        
        if (d.id !== "Israel" && d.id !== "Palestine") {
          const incomingLinks = graph.links.filter(l => l.target === d);
          let israelCount = 0;
          let palestineCount = 0;
          
          incomingLinks.forEach(link => {
            if (link.country === "Israel") israelCount += link.value;
            if (link.country === "Palestine") palestineCount += link.value;
          });
          
          if (israelCount > 0 || palestineCount > 0) {
            tooltipContent += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid ${isDark ? '#555' : '#ddd'};">`;
            if (israelCount > 0) {
              const pct = ((israelCount / d.value) * 100).toFixed(1);
              tooltipContent += `<div style="margin-bottom: 3px;"><span style="color: ${countryColors.Israel};">●</span> Israel: ${israelCount.toLocaleString()} (${pct}%)</div>`;
            }
            if (palestineCount > 0) {
              const pct = ((palestineCount / d.value) * 100).toFixed(1);
              tooltipContent += `<div><span style="color: ${countryColors.Palestine};">●</span> Palestine: ${palestineCount.toLocaleString()} (${pct}%)</div>`;
            }
            tooltipContent += `</div>`;
          }
        }
        
        tooltip
          .style("visibility", "visible")
          .html(tooltipContent);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-width", 0.5);
        
        // Reset all links opacity
        svg.selectAll(".sankey-link").attr("opacity", 0.4);
        
        tooltip.style("visibility", "hidden");
      });

    // Add labels without overlap using collision detection
    const labelData = [];
    
    // First pass: collect all labels with their positions
    graph.nodes.forEach(d => {
      const name = d.name || d.id;
      const nodeHeight = d.y1 - d.y0;
      const isLeft = d.x0 < width / 2;
      const fontSize = nodeHeight < 15 ? 9 : 11;
      const maxLength = 35;
      const displayName = name.length > maxLength ? name.substring(0, maxLength - 3) + "..." : name;
      
      labelData.push({
        node: d,
        name: displayName,
        x: isLeft ? d.x1 + 6 : d.x0 - 6,
        y: (d.y1 + d.y0) / 2,
        isLeft: isLeft,
        fontSize: fontSize,
        originalY: (d.y1 + d.y0) / 2
      });
    });
    
    // Second pass: adjust positions to avoid overlaps
    // Group labels by side (left/right)
    const leftLabels = labelData.filter(d => d.isLeft).sort((a, b) => a.originalY - b.originalY);
    const rightLabels = labelData.filter(d => !d.isLeft).sort((a, b) => a.originalY - b.originalY);
    
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
    
    adjustLabels(leftLabels);
    adjustLabels(rightLabels);
    
    // Third pass: render labels with adjusted positions
    nodeGroups.each(function(d) {
      const group = d3.select(this);
      const labelInfo = labelData.find(l => l.node === d);
      if (!labelInfo) return;
      
      // Draw connection line if label was moved significantly
      const displacement = Math.abs(labelInfo.y - labelInfo.originalY);
      if (displacement > 5) {
        group
          .append("line")
          .attr("class", "label-line")
          .attr("data-node-type", d.id === "Israel" || d.id === "Palestine" ? "country" : d.id.includes("|") ? "subevent" : "eventtype")
          .attr("x1", labelInfo.isLeft ? d.x1 : d.x0)
          .attr("y1", labelInfo.originalY)
          .attr("x2", labelInfo.x)
          .attr("y2", labelInfo.y)
          .attr("stroke", isDark ? "#888" : "#666")
          .attr("stroke-width", 0.5)
          .attr("stroke-dasharray", "2,2")
          .style("opacity", animationPlayedRef.current ? 0.5 : 0);
      }
      
      group
        .append("text")
        .attr("class", "node-label")
        .attr("data-node-type", d.id === "Israel" || d.id === "Palestine" ? "country" : d.id.includes("|") ? "subevent" : "eventtype")
        .attr("x", labelInfo.x)
        .attr("y", labelInfo.y)
        .attr("dy", "0.35em")
        .attr("text-anchor", labelInfo.isLeft ? "start" : "end")
        .attr("font-size", labelInfo.fontSize)
        .attr("font-weight", 500)
        .attr("fill", isDark ? "#fff" : "#25282A")
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
      .attr("fill", isDark ? "#fff" : "#25282A")
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .text("Event Types Flow: Country → Event Type → Sub-Event Type");

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

    return () => {
      observer.disconnect();
    };
  }, [data, isDark]);

  return (
    <div ref={wrapperRef} style={{ width: "100%", margin: "0 auto" }}>
      <svg
        ref={svgRef}
        role="img"
        aria-label="Sankey diagram showing flow of events by type"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
}

export default EventsSankeyDiagram;
