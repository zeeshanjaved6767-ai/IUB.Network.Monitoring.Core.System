import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Device, 
  CampusId, 
  CampusInfo, 
  DeviceType, 
  DeviceStatus 
} from '../types.ts';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Search, 
  Layers, 
  Server, 
  Router as RouterIcon, 
  Wifi, 
  Phone, 
  Video, 
  Box, 
  Cable, 
  Terminal, 
  Power, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Eye, 
  Filter, 
  X, 
  ExternalLink,
  Zap,
  Activity,
  Radio
} from 'lucide-react';

export interface TopologyNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: DeviceType;
  tier: 'core' | 'distribution' | 'access' | 'edge';
  campus: CampusId;
  building: string;
  roomNo: string;
  ipAddress: string;
  macAddress: string;
  status: DeviceStatus;
  latencyMs: number;
  packetLoss: number;
  cpuUsage: number;
  memoryUsage: number;
  bandwidthInMbps: number;
  bandwidthOutMbps: number;
  switchModel?: string;
  switchPort?: string;
  devicePort?: string;
  rackId: string;
  device: Device;
}

export interface TopologyLink extends d3.SimulationLinkDatum<TopologyNode> {
  id: string;
  source: string | TopologyNode;
  target: string | TopologyNode;
  type: 'core-trunk' | 'distribution' | 'access' | 'edge-link' | 'wan-fiber';
  speed: string;
  status: 'optimal' | 'warning' | 'degraded' | 'offline';
  sourcePort?: string;
  targetPort?: string;
}

interface NetworkTopologyProps {
  devices: Device[];
  campuses: CampusInfo[];
  onOpenDeviceDiagnostics?: (device: Device) => void;
  onToggleDevicePower?: (deviceId: string) => Promise<void>;
  onSelectCampus?: (campusId: CampusId | 'ALL') => void;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  devices,
  campuses,
  onOpenDeviceDiagnostics,
  onToggleDevicePower,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<TopologyNode, TopologyLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Filter & Layout States
  const [selectedCampus, setSelectedCampus] = useState<CampusId | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'core' | 'distribution' | 'access' | 'edge'>('ALL');
  const [layoutMode, setLayoutMode] = useState<'force' | 'hierarchical'>('force');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [isPhysicsRunning, setIsPhysicsRunning] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<TopologyNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Statistics
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const warningCount = devices.filter((d) => d.status === 'warning').length;

  // Build Topology Graph Nodes and Links from Devices
  const { nodes, links } = useMemo(() => {
    // 1. Filter devices by campus and tier if specified
    const filteredDevs = devices.filter((d) => {
      if (selectedCampus !== 'ALL' && d.campus !== selectedCampus) return false;
      return true;
    });

    // 2. Classify devices into Architectural Tiers
    const nodeList: TopologyNode[] = filteredDevs.map((d) => {
      let tier: 'core' | 'distribution' | 'access' | 'edge' = 'edge';
      const nameUpper = d.name.toUpperCase();
      const modelUpper = (d.model || '').toUpperCase();

      if (
        d.type === 'router' || 
        nameUpper.includes('CORE-ROUTER') || 
        nameUpper.includes('BGP') || 
        modelUpper.includes('ASR')
      ) {
        tier = 'core';
      } else if (
        nameUpper.includes('CORE-SW') || 
        nameUpper.includes('148P') || 
        modelUpper.includes('9600') || 
        modelUpper.includes('9500') ||
        nameUpper.includes('AGG')
      ) {
        tier = 'distribution';
      } else if (d.type === 'switch') {
        tier = 'access';
      } else {
        tier = 'edge';
      }

      // Tier filter check
      return {
        id: d.id,
        name: d.name,
        type: d.type,
        tier,
        campus: d.campus,
        building: d.building,
        roomNo: d.roomNo,
        ipAddress: d.ipAddress,
        macAddress: d.macAddress,
        status: d.status,
        latencyMs: d.latencyMs,
        packetLoss: d.packetLoss,
        cpuUsage: d.cpuUsage,
        memoryUsage: d.memoryUsage,
        bandwidthInMbps: d.bandwidthInMbps,
        bandwidthOutMbps: d.bandwidthOutMbps,
        switchModel: d.switchModel,
        switchPort: d.switchPort,
        devicePort: d.devicePort,
        rackId: d.rackId,
        device: d,
      };
    }).filter((n) => {
      if (selectedTier !== 'ALL' && n.tier !== selectedTier) return false;
      return true;
    });

    const nodeMap = new Map<string, TopologyNode>(nodeList.map((n) => [n.id, n]));

    // 3. Establish Logical & Physical Uplinks
    const linkList: TopologyLink[] = [];
    const linkSet = new Set<string>();

    const addLink = (
      srcId: string, 
      tgtId: string, 
      type: TopologyLink['type'], 
      speed: string, 
      srcPort?: string, 
      tgtPort?: string
    ) => {
      if (!nodeMap.has(srcId) || !nodeMap.has(tgtId) || srcId === tgtId) return;
      const key1 = `${srcId}->${tgtId}`;
      const key2 = `${tgtId}->${srcId}`;
      if (linkSet.has(key1) || linkSet.has(key2)) return;
      linkSet.add(key1);

      const srcNode = nodeMap.get(srcId)!;
      const tgtNode = nodeMap.get(tgtId)!;

      let status: TopologyLink['status'] = 'optimal';
      if (srcNode.status === 'offline' || tgtNode.status === 'offline') {
        status = 'offline';
      } else if (srcNode.status === 'warning' || tgtNode.status === 'warning' || srcNode.packetLoss > 2) {
        status = 'warning';
      }

      linkList.push({
        id: `link-${srcId}-${tgtId}`,
        source: srcId,
        target: tgtId,
        type,
        speed,
        status,
        sourcePort: srcPort || 'Port-1',
        targetPort: tgtPort || 'Uplink-1',
      });
    };

    // Find Core Anchors
    const mainCoreRouter = nodeList.find((n) => n.id.includes('CORE-ROUTER-01')) || 
      nodeList.find((n) => n.tier === 'core') || 
      nodeList[0];
    const mainCoreSwitch = nodeList.find((n) => n.id.includes('148P') || n.name.includes('CORE-SW-148P')) || 
      nodeList.find((n) => n.tier === 'distribution') || 
      nodeList[0];

    // Core Router <-> Main Core Switch (100G Trunk)
    if (mainCoreRouter && mainCoreSwitch && mainCoreRouter.id !== mainCoreSwitch.id) {
      addLink(mainCoreRouter.id, mainCoreSwitch.id, 'core-trunk', '100 Gbps Core Trunk', 'Te1/1/1', 'QSFP28-1');
    }

    // Connect nodes hierarchically
    nodeList.forEach((node) => {
      if (node.id === mainCoreRouter?.id || node.id === mainCoreSwitch?.id) return;

      if (node.tier === 'core') {
        // Inter-campus core routers link to Main BJC Core Router via 40G WAN Fiber
        if (mainCoreRouter && node.id !== mainCoreRouter.id) {
          addLink(mainCoreRouter.id, node.id, 'wan-fiber', '40 Gbps Inter-Campus DWDM', 'WAN-0/1', 'WAN-0/1');
        }
      } else if (node.tier === 'distribution') {
        // Campus Distribution switches link to their campus core router or main core switch
        const campusCoreRouter = nodeList.find((n) => n.campus === node.campus && n.tier === 'core');
        if (campusCoreRouter) {
          addLink(campusCoreRouter.id, node.id, 'core-trunk', '40 Gbps Campus Trunk', 'Te1/0/24', 'Te1/0/1');
        } else if (mainCoreSwitch) {
          addLink(mainCoreSwitch.id, node.id, 'distribution', '10 Gbps Aggregation', 'Gi1/0/48', 'Gi1/0/1');
        }
      } else if (node.tier === 'access') {
        // Building Access switches link to Campus Distribution switch in same campus
        const campusDistSwitch = nodeList.find((n) => n.campus === node.campus && n.tier === 'distribution') || mainCoreSwitch;
        if (campusDistSwitch && campusDistSwitch.id !== node.id) {
          addLink(campusDistSwitch.id, node.id, 'access', '10 Gbps SFP+ Uplink', 'Gi1/0/12', 'Uplink-Gi1');
        }
      } else {
        // Edge devices (AP, Phone, Camera, Rack) link to their upstream switch
        let matchedSwitch: TopologyNode | undefined;

        // Try matching by switchModel in the same campus
        if (node.switchModel) {
          matchedSwitch = nodeList.find((s) => s.campus === node.campus && s.tier !== 'edge' && (
            s.name.toLowerCase().includes(node.switchModel!.toLowerCase()) ||
            s.device.model.toLowerCase().includes(node.switchModel!.toLowerCase())
          ));
        }

        // Fallback: match switch in same building or same campus
        if (!matchedSwitch) {
          matchedSwitch = nodeList.find((s) => s.campus === node.campus && s.building === node.building && s.tier !== 'edge') ||
            nodeList.find((s) => s.campus === node.campus && s.tier === 'access') ||
            nodeList.find((s) => s.campus === node.campus && s.tier === 'distribution') ||
            mainCoreSwitch;
        }

        if (matchedSwitch && matchedSwitch.id !== node.id) {
          addLink(
            matchedSwitch.id, 
            node.id, 
            'edge-link', 
            node.type === 'access_point' ? '2.5 Gbps PoE+' : '1 Gbps FastEthernet',
            node.switchPort || 'Gi0/12', 
            node.devicePort || 'Eth0'
          );
        }
      }
    });

    return { nodes: nodeList, links: linkList };
  }, [devices, selectedCampus, selectedTier]);

  // Render D3 Network Diagram
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = Math.max(580, containerRef.current.clientHeight || 650);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    svg.attr('width', width).attr('height', height);

    // SVG Defs (glow filters, markers, patterns)
    const defs = svg.append('defs');

    // Glow Filter for Online
    const filterOnline = defs.append('filter').attr('id', 'glow-online').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filterOnline.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMergeOnline = filterOnline.append('feMerge');
    feMergeOnline.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeOnline.append('feMergeNode').attr('in', 'SourceGraphic');

    // Glow Filter for Offline
    const filterOffline = defs.append('filter').attr('id', 'glow-offline').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filterOffline.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'coloredBlur');
    const feMergeOffline = filterOffline.append('feMerge');
    feMergeOffline.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeOffline.append('feMergeNode').attr('in', 'SourceGraphic');

    // Glow Filter for Core Trunks
    const filterTrunk = defs.append('filter').attr('id', 'glow-trunk').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filterTrunk.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMergeTrunk = filterTrunk.append('feMerge');
    feMergeTrunk.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeTrunk.append('feMergeNode').attr('in', 'SourceGraphic');

    // Background Grid Pattern
    const pattern = defs.append('pattern')
      .attr('id', 'topo-grid')
      .attr('width', 30)
      .attr('height', 30)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('circle')
      .attr('cx', 15)
      .attr('cy', 15)
      .attr('r', 0.8)
      .attr('fill', '#2D3139');

    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#0A0B0E');

    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#topo-grid)');

    // Root Group for Zooming
    const g = svg.append('g').attr('class', 'topology-content');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Clone data for simulation
    const simNodes: TopologyNode[] = nodes.map((d) => ({ ...d }));
    const nodeById = new Map<string, TopologyNode>(simNodes.map((d) => [d.id, d]));

    const simLinks: TopologyLink[] = links
      .filter((l) => {
        const sId = typeof l.source === 'string' ? l.source : l.source.id;
        const tId = typeof l.target === 'string' ? l.target : l.target.id;
        return nodeById.has(sId) && nodeById.has(tId);
      })
      .map((l) => {
        const sId = typeof l.source === 'string' ? l.source : l.source.id;
        const tId = typeof l.target === 'string' ? l.target : l.target.id;
        return {
          ...l,
          source: nodeById.get(sId)!,
          target: nodeById.get(tId)!,
        };
      });

    // Compute positions based on Layout Mode
    if (layoutMode === 'hierarchical') {
      const tierY: Record<string, number> = {
        core: height * 0.16,
        distribution: height * 0.38,
        access: height * 0.62,
        edge: height * 0.86,
      };

      // Group nodes by tier and distribute horizontally
      ['core', 'distribution', 'access', 'edge'].forEach((tierKey) => {
        const tierNodes = simNodes.filter((n) => n.tier === tierKey);
        const count = tierNodes.length;
        tierNodes.forEach((node, idx) => {
          const spacing = width / (count + 1);
          node.x = spacing * (idx + 1) + (Math.random() - 0.5) * 20;
          node.y = tierY[tierKey] + (Math.random() - 0.5) * 20;
        });
      });
    }

    // Links Container
    const linkGroup = g.append('g').attr('class', 'links');
    // Nodes Container
    const nodeGroup = g.append('g').attr('class', 'nodes');

    // Link Elements
    const linkElements = linkGroup.selectAll<SVGLineElement, TopologyLink>('line')
      .data(simLinks, (d) => d.id)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (d.status === 'offline') return '#EF4444';
        if (d.status === 'warning') return '#F59E0B';
        if (d.type === 'core-trunk' || d.type === 'wan-fiber') return '#38BDF8';
        if (d.type === 'distribution') return '#818CF8';
        if (d.type === 'access') return '#34D399';
        return '#4B5563';
      })
      .attr('stroke-width', (d) => {
        if (d.type === 'core-trunk' || d.type === 'wan-fiber') return 3.2;
        if (d.type === 'distribution') return 2.2;
        if (d.type === 'access') return 1.8;
        return 1.2;
      })
      .attr('stroke-dasharray', (d) => {
        if (d.status === 'offline') return '6,4';
        if (d.type === 'core-trunk' || d.type === 'wan-fiber') return '8,3';
        return 'none';
      })
      .attr('stroke-opacity', (d) => (d.status === 'offline' ? 0.9 : 0.75))
      .attr('filter', (d) => (d.type === 'core-trunk' ? 'url(#glow-trunk)' : null));

    // Node Groups
    const nodeElements = nodeGroup.selectAll<SVGGElement, TopologyNode>('g')
      .data(simNodes, (d) => d.id)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, TopologyNode>()
          .on('start', (event, d) => {
            if (!event.active && isPhysicsRunning && layoutMode === 'force') {
              simulationRef.current?.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active && isPhysicsRunning && layoutMode === 'force') {
              simulationRef.current?.alphaTarget(0);
            }
            if (layoutMode === 'force') {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Node Radius helper
    const getNodeRadius = (tier: string, type: string) => {
      if (tier === 'core') return 24;
      if (tier === 'distribution') return 19;
      if (tier === 'access') return 15;
      return 12;
    };

    // Outer Glow / Halo for Status
    nodeElements.append('circle')
      .attr('class', 'node-halo')
      .attr('r', (d) => getNodeRadius(d.tier, d.type) + 4)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (d.status === 'offline') return '#EF4444';
        if (d.status === 'warning') return '#F59E0B';
        return '#10B981';
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .attr('filter', (d) => (d.status === 'offline' ? 'url(#glow-offline)' : 'url(#glow-online)'));

    // Base Node Background Circle
    nodeElements.append('circle')
      .attr('class', 'node-body')
      .attr('r', (d) => getNodeRadius(d.tier, d.type))
      .attr('fill', (d) => {
        if (d.status === 'offline') return '#2A0B0E';
        if (d.tier === 'core') return '#0C2340';
        if (d.tier === 'distribution') return '#1E1B4B';
        if (d.tier === 'access') return '#062C24';
        return '#16181D';
      })
      .attr('stroke', (d) => {
        if (d.status === 'offline') return '#EF4444';
        if (d.tier === 'core') return '#38BDF8';
        if (d.tier === 'distribution') return '#818CF8';
        if (d.tier === 'access') return '#34D399';
        return '#6B7280';
      })
      .attr('stroke-width', 2);

    // Node Center Icon / Letter
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#FFFFFF')
      .attr('font-size', (d) => (d.tier === 'core' ? '12px' : d.tier === 'distribution' ? '10px' : '9px'))
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d) => {
        if (d.type === 'router') return 'R';
        if (d.type === 'switch') return 'SW';
        if (d.type === 'access_point') return 'AP';
        if (d.type === 'ip_phone') return 'IP';
        if (d.type === 'camera') return 'CAM';
        if (d.type === 'rack') return '42U';
        return 'DEV';
      });

    // Node Primary Name Label
    nodeElements.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => getNodeRadius(d.tier, d.type) + 14)
      .attr('fill', '#F3F4F6')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text((d) => (d.name.length > 18 ? `${d.name.substring(0, 16)}…` : d.name));

    // Node IP Address Sub-label
    nodeElements.append('text')
      .attr('class', 'node-ip')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => getNodeRadius(d.tier, d.type) + 25)
      .attr('fill', '#60A5FA')
      .attr('font-family', 'monospace')
      .attr('font-size', '8.5px')
      .attr('pointer-events', 'none')
      .text((d) => d.ipAddress);

    // Node Hover & Click Handlers
    nodeElements
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setHoverPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }

        // Highlight connected links
        linkElements
          .attr('stroke-opacity', (l: any) => (l.source.id === d.id || l.target.id === d.id ? 1 : 0.15))
          .attr('stroke-width', (l: any) => (l.source.id === d.id || l.target.id === d.id ? 3.5 : 1));

        nodeElements.attr('opacity', (n: any) => {
          if (n.id === d.id) return 1;
          const isNeighbor = simLinks.some((l: any) => 
            (l.source.id === d.id && l.target.id === n.id) ||
            (l.target.id === d.id && l.source.id === n.id)
          );
          return isNeighbor ? 1 : 0.25;
        });
      })
      .on('mousemove', (event) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setHoverPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        setHoverPos(null);
        linkElements.attr('stroke-opacity', (d) => (d.status === 'offline' ? 0.9 : 0.75))
          .attr('stroke-width', (d) => {
            if (d.type === 'core-trunk' || d.type === 'wan-fiber') return 3.2;
            if (d.type === 'distribution') return 2.2;
            if (d.type === 'access') return 1.8;
            return 1.2;
          });
        nodeElements.attr('opacity', 1);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    svg.on('click', () => {
      setSelectedNode(null);
    });

    // D3 Force Simulation Setup
    if (layoutMode === 'force') {
      const simulation = d3.forceSimulation<TopologyNode, TopologyLink>(simNodes)
        .force('link', d3.forceLink<TopologyNode, TopologyLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            if (d.type === 'core-trunk') return 150;
            if (d.type === 'wan-fiber') return 180;
            if (d.type === 'distribution') return 100;
            return 75;
          })
          .strength(0.65)
        )
        .force('charge', d3.forceManyBody().strength((d: any) => {
          if (d.tier === 'core') return -550;
          if (d.tier === 'distribution') return -380;
          return -220;
        }))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide<TopologyNode>().radius((d) => getNodeRadius(d.tier, d.type) + 26))
        .on('tick', () => {
          linkElements
            .attr('x1', (d: any) => d.source.x)
            .attr('y1', (d: any) => d.source.y)
            .attr('x2', (d: any) => d.target.x)
            .attr('y2', (d: any) => d.target.y);

          nodeElements.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        });

      simulationRef.current = simulation;
    } else {
      // Static Hierarchical View
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    }

    // Initial Fit to Screen
    const initialTransform = d3.zoomIdentity.translate(20, 10).scale(0.92);
    svg.call(zoom.transform, initialTransform);

    return () => {
      simulationRef.current?.stop();
    };
  }, [nodes, links, layoutMode, isPhysicsRunning]);

  // Zoom Controls
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(280).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(280).call(zoomBehaviorRef.current.scaleBy, 0.75);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current && containerRef.current) {
      const initialTransform = d3.zoomIdentity.translate(20, 10).scale(0.92);
      d3.select(svgRef.current).transition().duration(350).call(zoomBehaviorRef.current.transform, initialTransform);
    }
  };

  // Search & Spotlight Node
  const handleSearchSelect = (deviceId: string) => {
    const target = nodes.find((n) => n.id === deviceId);
    if (target && svgRef.current && zoomBehaviorRef.current && containerRef.current) {
      setSelectedNode(target);
      const width = containerRef.current.clientWidth || 900;
      const height = containerRef.current.clientHeight || 650;
      const scale = 1.6;
      const transform = d3.zoomIdentity
        .translate(width / 2 - (target.x || 0) * scale, height / 2 - (target.y || 0) * scale)
        .scale(scale);
      d3.select(svgRef.current).transition().duration(600).call(zoomBehaviorRef.current.transform, transform);
    }
  };

  // Export Topology as SVG
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IUB_Network_Topology_${selectedCampus}_${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Campus Filter Bar */}
      <div className="card-elegant p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 border border-[#2D3139]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Interactive Network Topology (D3.js)</span>
              <span className="px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-mono border border-blue-500/30">
                MULTI-TIER CAMPUS CORE
              </span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> Live Telemetry
              </span>
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Hierarchical mapping of core BGP routers, 148-port modular switches, distribution aggregation, and edge Wi-Fi 6 / VoIP equipment.
            </p>
          </div>
        </div>

        {/* Global Topology Telemetry Counters */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#0A0B0E] border border-[#2D3139] flex items-center space-x-2">
            <span className="text-gray-400">Total Nodes:</span>
            <span className="font-mono font-bold text-white">{nodes.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#0A0B0E] border border-[#2D3139] flex items-center space-x-2">
            <span className="text-gray-400">Links:</span>
            <span className="font-mono font-bold text-blue-400">{links.length}</span>
          </div>
          {offlineCount > 0 ? (
            <div className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/50 flex items-center space-x-2 text-red-400 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold">{offlineCount} Outages</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All Systems Green</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Diagram Area with Left Controls and Right Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Side: Controls & Filters Panel */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Controls Box */}
          <div className="card-elegant p-4 space-y-4 border border-[#2D3139]">
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#2D3139]">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              <span>Topology Controls & Filters</span>
            </h3>

            {/* Campus Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400">Campus Domain:</label>
              <select
                id="topo-campus-select"
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="ALL">All Campuses (Enterprise Overview)</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.shortName}
                  </option>
                ))}
              </select>
            </div>

            {/* Architectural Tier Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400">Architectural Tier:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'ALL', label: 'All Tiers' },
                  { id: 'core', label: 'Tier 1: Core' },
                  { id: 'distribution', label: 'Tier 2: Dist' },
                  { id: 'access', label: 'Tier 3: Access' },
                  { id: 'edge', label: 'Tier 4: Edge' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id as any)}
                    className={`px-2 py-1.5 rounded text-[10px] font-semibold transition cursor-pointer text-center ${
                      selectedTier === tier.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#0A0B0E] text-gray-400 hover:text-white border border-[#2D3139]'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Mode Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400">Layout Algorithm:</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setLayoutMode('force')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    layoutMode === 'force'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#0A0B0E] text-gray-400 border border-[#2D3139]'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>Force Physics</span>
                </button>
                <button
                  onClick={() => setLayoutMode('hierarchical')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    layoutMode === 'hierarchical'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#0A0B0E] text-gray-400 border border-[#2D3139]'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Structured Tier</span>
                </button>
              </div>
            </div>

            {/* Spotlight / Node Search Bar */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400">Spotlight Equipment:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0A0B0E] border border-[#2D3139] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {searchQuery && (
                <div className="max-h-36 overflow-y-auto space-y-1 mt-1 bg-[#0A0B0E] p-1.5 rounded border border-[#2D3139] text-xs">
                  {nodes
                    .filter((n) => 
                      n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      n.ipAddress.includes(searchQuery)
                    )
                    .slice(0, 6)
                    .map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          handleSearchSelect(n.id);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-[#1E2229] rounded flex items-center justify-between text-[11px] cursor-pointer"
                      >
                        <span className="font-semibold text-white truncate max-w-[130px]">{n.name}</span>
                        <span className="text-blue-400 font-mono text-[10px]">{n.ipAddress}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Canvas Actions */}
            <div className="pt-2 border-t border-[#2D3139] flex flex-wrap items-center justify-between gap-1.5">
              <button
                onClick={handleExportSVG}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#0A0B0E] hover:bg-[#1E2229] border border-[#2D3139] text-gray-300 text-xs rounded transition cursor-pointer"
                title="Download SVG vector diagram"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export SVG</span>
              </button>

              <button
                onClick={() => setIsPhysicsRunning(!isPhysicsRunning)}
                className={`px-2.5 py-1.5 border border-[#2D3139] text-xs rounded transition cursor-pointer ${
                  isPhysicsRunning ? 'bg-[#0A0B0E] text-emerald-400' : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                }`}
                title="Toggle physics simulation"
              >
                {isPhysicsRunning ? 'Physics: Live' : 'Physics: Paused'}
              </button>
            </div>

          </div>

          {/* Color Legend */}
          <div className="card-elegant p-4 space-y-3 border border-[#2D3139] text-xs">
            <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Diagram Legend</span>
            </h4>

            {/* Nodes */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0C2340] border-2 border-[#38BDF8] inline-block"></span>
                <span className="text-gray-300 font-medium">Core BGP Routers (100G)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#1E1B4B] border-2 border-[#818CF8] inline-block"></span>
                <span className="text-gray-300 font-medium">Distribution Switches (40G)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#062C24] border-2 border-[#34D399] inline-block"></span>
                <span className="text-gray-300 font-medium">Building Access Switches (10G)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16181D] border-2 border-[#6B7280] inline-block"></span>
                <span className="text-gray-300 font-medium">Edge APs / Phones / Cameras</span>
              </div>
            </div>

            {/* Links */}
            <div className="pt-2 border-t border-[#2D3139] space-y-1 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-1 bg-[#38BDF8] rounded inline-block"></span>
                <span className="text-gray-300">100G/40G Core DWDM Trunk</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-0.5 bg-[#818CF8] rounded inline-block"></span>
                <span className="text-gray-300">10G Aggregation Uplink</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-0.5 border-t border-dashed border-red-500 inline-block"></span>
                <span className="text-red-400 font-semibold">Fault / Offline Link</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Visual SVG Canvas & Floating Details */}
        <div className="lg:col-span-3 card-elegant relative overflow-hidden border border-[#2D3139] min-h-[620px] flex flex-col">
          
          {/* Canvas Floating Top Controls */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-[#0A0B0E]/90 backdrop-blur p-1.5 rounded-lg border border-[#2D3139] shadow-lg">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-[#1E2229] rounded text-gray-300 hover:text-white transition cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-[#1E2229] rounded text-gray-300 hover:text-white transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-[#1E2229] rounded text-gray-300 hover:text-white transition cursor-pointer"
              title="Reset view to fit"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-[#2D3139]"></div>
            <span className="text-[11px] text-gray-400 px-1 font-mono">
              Mode: <strong className="text-blue-400 uppercase">{layoutMode}</strong>
            </span>
          </div>

          {/* Quick Help Hint */}
          <div className="absolute top-4 right-4 z-20 text-[11px] text-gray-400 bg-[#0A0B0E]/90 backdrop-blur px-3 py-1.5 rounded-lg border border-[#2D3139] shadow-md hidden sm:block">
            <span>💡 <strong>Click node</strong> to inspect • <strong>Drag</strong> to rearrange • <strong>Scroll</strong> to zoom</span>
          </div>

          {/* D3 Canvas Container */}
          <div ref={containerRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing">
            <svg ref={svgRef} className="w-full h-full block select-none"></svg>

            {/* Hover Tooltip */}
            {hoveredNode && hoverPos && (
              <div 
                className="absolute z-30 pointer-events-none p-3 bg-[#11141A]/95 backdrop-blur border border-[#2D3139] rounded-lg shadow-2xl text-xs space-y-1 transition-transform max-w-xs"
                style={{
                  left: Math.min(hoverPos.x + 15, (containerRef.current?.clientWidth || 700) - 260),
                  top: Math.max(hoverPos.y - 40, 10),
                }}
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#2D3139] pb-1">
                  <span className="font-bold text-white truncate">{hoveredNode.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                    hoveredNode.status === 'offline' ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {hoveredNode.status.toUpperCase()}
                  </span>
                </div>
                <div className="font-mono text-blue-400 text-[11px]">{hoveredNode.ipAddress}</div>
                <div className="text-gray-400 text-[10px]">
                  Campus {hoveredNode.campus} &bull; {hoveredNode.building}, Room {hoveredNode.roomNo}
                </div>
                {hoveredNode.switchModel && (
                  <div className="text-gray-400 text-[10px]">
                    Switch: <strong className="text-gray-200">{hoveredNode.switchModel}</strong> (Port: {hoveredNode.switchPort || 'N/A'})
                  </div>
                )}
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-gray-300">
                  <span>Ping: <strong className="text-white">{hoveredNode.latencyMs}ms</strong></span>
                  <span>Loss: <strong className="text-white">{hoveredNode.packetLoss}%</strong></span>
                  <span>CPU: <strong className="text-white">{hoveredNode.cpuUsage}%</strong></span>
                </div>
              </div>
            )}

            {/* Slide-out Inspector for Selected Node */}
            {selectedNode && (
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0E1015]/95 backdrop-blur-md border-l border-[#2D3139] z-40 p-5 overflow-y-auto space-y-4 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded bg-[#16181D] border border-blue-500/30 flex items-center justify-center text-blue-400">
                      {selectedNode.type === 'router' && <RouterIcon className="w-4 h-4" />}
                      {selectedNode.type === 'switch' && <Server className="w-4 h-4" />}
                      {selectedNode.type === 'access_point' && <Wifi className="w-4 h-4" />}
                      {selectedNode.type === 'ip_phone' && <Phone className="w-4 h-4" />}
                      {selectedNode.type === 'camera' && <Video className="w-4 h-4" />}
                      {selectedNode.type === 'rack' && <Box className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{selectedNode.name}</h4>
                      <span className="text-[10px] text-gray-400 font-mono uppercase">{selectedNode.tier} Tier</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded hover:bg-[#1E2229] text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Card */}
                <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  selectedNode.status === 'offline'
                    ? 'bg-red-950/40 border-red-500/50 text-red-300'
                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    {selectedNode.status === 'offline' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="font-bold uppercase tracking-wider">{selectedNode.status}</span>
                  </div>
                  <span className="font-mono text-[11px]">{selectedNode.latencyMs}ms Latency</span>
                </div>

                {/* Hardware & Location Specs */}
                <div className="space-y-2 text-xs">
                  <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Device Specifications</div>
                  
                  <div className="bg-[#16181D] p-3 rounded-lg border border-[#2D3139] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP Address:</span>
                      <span className="font-mono text-blue-400 font-semibold">{selectedNode.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">MAC Address:</span>
                      <span className="font-mono text-gray-300 text-[11px]">{selectedNode.macAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Model:</span>
                      <span className="text-gray-200 text-right truncate max-w-[150px]">{selectedNode.device.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rack / Location:</span>
                      <span className="text-gray-300">{selectedNode.rackId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Campus & Room:</span>
                      <span className="text-gray-200">{selectedNode.campus} &bull; Rm {selectedNode.roomNo}</span>
                    </div>
                  </div>
                </div>

                {/* Uplink Switch Information */}
                {selectedNode.switchModel && (
                  <div className="space-y-1.5 text-xs">
                    <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Upstream Network Link</div>
                    <div className="bg-[#16181D] p-3 rounded-lg border border-[#2D3139] space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Connected Switch:</span>
                        <span className="font-semibold text-white">{selectedNode.switchModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Switch Port:</span>
                        <span className="font-mono text-emerald-400">{selectedNode.switchPort || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Device Port:</span>
                        <span className="font-mono text-cyan-400">{selectedNode.devicePort || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#2D3139] space-y-2">
                  {onOpenDeviceDiagnostics && (
                    <button
                      onClick={() => onOpenDeviceDiagnostics(selectedNode.device)}
                      className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md shadow-blue-950/40"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Run Live Ping Diagnostics &rarr;</span>
                    </button>
                  )}

                  {onToggleDevicePower && (
                    <button
                      onClick={() => onToggleDevicePower(selectedNode.id)}
                      className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        selectedNode.status === 'offline'
                          ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300'
                          : 'bg-red-950/80 hover:bg-red-900 border-red-500/50 text-red-300'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{selectedNode.status === 'offline' ? 'Power ON Equipment' : 'Simulate Power Cut (Offline)'}</span>
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
